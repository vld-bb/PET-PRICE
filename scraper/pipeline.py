"""Main ingestion orchestrator for PetPrice scrapers.

Features:
- Parallel execution across all stores (asyncio.gather).
- Parallel execution across products per store with polite per-domain concurrency limits (default: 2).
- Anti-blocking measures: randomized jitter, desktop browser headers, automatic retry with exponential backoff on 429/503.
- TLS browser fingerprint impersonation (curl_cffi) fallback on 403 or for Cloudflare sites (koerland.ee).
- Thread-safe SQLite transactional locking with asyncio.Lock.
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import argparse
import asyncio
import logging
from typing import Dict, List, Optional, Set
from urllib.parse import urlparse

from db.database import init_db, get_db_session
from db.models import Store, StoreOffer
from scraper.stores import STORES_CONFIG
from scraper.rate_limiter import PoliteHttpClient
from scraper.sitemap_parser import SitemapParser
from scraper.jsonld_extractor import JsonLdExtractor
from scraper.db_sync import DatabaseSync

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("scraper.pipeline")


class ScraperPipeline:
    """Orchestrates parallel, polite multi-store and multi-product scraping with anti-blocking strategy."""

    def __init__(
        self,
        min_jitter: float = 1.5,
        max_jitter: float = 3.5,
        max_concurrent_per_domain: int = 2,
    ):
        self.max_concurrent_per_domain = max_concurrent_per_domain
        self.http_client = PoliteHttpClient(
            min_jitter=min_jitter,
            max_jitter=max_jitter,
            max_concurrent_per_domain=max_concurrent_per_domain,
        )
        self.sitemap_parser = SitemapParser(self.http_client)
        self.extractor = JsonLdExtractor()
        self._db_lock = asyncio.Lock()

    def get_existing_db_urls(self, domain: str, limit: int = 50) -> List[str]:
        """Fetches existing product offer URLs from the database for a store domain."""
        try:
            with get_db_session() as session:
                store = session.query(Store).filter(Store.domain == domain).first()
                if not store:
                    return []
                offers = (
                    session.query(StoreOffer.url)
                    .filter(StoreOffer.store_id == store.id)
                    .limit(limit)
                    .all()
                )
                return [o[0] for o in offers if o[0]]
        except Exception as e:
            logger.warning("Could not fetch existing DB URLs for %s: %s", domain, e)
            return []

    async def crawl_store(
        self,
        domain: str,
        max_products: int = 10,
        category_filter: Optional[str] = None,
        refresh_existing: bool = True,
    ) -> Dict[str, int]:
        """Crawls a single store concurrently, respecting per-domain politeness and anti-blocking constraints."""
        config = STORES_CONFIG.get(domain)
        if not config:
            logger.error("Unknown store domain: %s", domain)
            return {"scraped": 0, "matched_ean": 0, "matched_trigram": 0, "created_products": 0, "price_changed": 0, "skipped_non_product": 0, "errors": 0}

        logger.info(">>> [%s] Starting parallel ingestion for %s (concurrency limit: %d)", domain, config["name"], self.max_concurrent_per_domain)
        use_impersonate = config.get("use_impersonate", False)

        candidate_urls: Set[str] = set()

        is_unlimited = (max_products is None or max_products <= 0)

        # 1. Optionally load existing URLs from database offers to refresh active pricing
        if refresh_existing:
            db_urls = self.get_existing_db_urls(domain, limit=None if is_unlimited else max_products)
            for u in db_urls:
                candidate_urls.add(u)
            logger.info("[%s] Loaded %d existing product URLs from database for price refresh", domain, len(candidate_urls))

        # 2. Discover candidate product URLs from sitemaps
        needed_from_sitemaps = None if is_unlimited else max(0, max_products - len(candidate_urls))
        if is_unlimited or (needed_from_sitemaps and needed_from_sitemaps > 0):
            for sitemap_url in config.get("sitemaps", []):
                try:
                    urls = await self.sitemap_parser.extract_product_urls(
                        sitemap_url=sitemap_url,
                        max_sub_sitemaps=100,
                        max_products=needed_from_sitemaps,
                        use_impersonate=use_impersonate,
                    )
                    for u in urls:
                        candidate_urls.add(u)
                        if not is_unlimited and len(candidate_urls) >= max_products:
                            break
                    if not is_unlimited and len(candidate_urls) >= max_products:
                        break
                except Exception as e:
                    logger.warning("[%s] Error fetching sitemap %s: %s", domain, sitemap_url, e)

        product_urls = list(candidate_urls) if is_unlimited else list(candidate_urls)[:max_products]
        logger.info("[%s] Total candidate product URLs queued for scraping: %d", domain, len(product_urls))

        stats = {
            "scraped": 0,
            "matched_ean": 0,
            "matched_trigram": 0,
            "created_products": 0,
            "price_changed": 0,
            "skipped_non_product": 0,
            "errors": 0,
        }

        # Concurrency semaphore dedicated to this store's worker pool
        store_worker_sem = asyncio.Semaphore(self.max_concurrent_per_domain)

        async def process_product(url: str):
            async with store_worker_sem:
                try:
                    html = await self.http_client.fetch(url, use_impersonate=use_impersonate)

                    offer = self.extractor.parse(html, url)
                    if not offer or offer.price <= 0:
                        logger.debug("[%s] No valid Schema.org Product found at %s", domain, url)
                        stats["skipped_non_product"] += 1
                        return

                    # Category filtering (if requested)
                    if category_filter and category_filter != "all":
                        cat_str = f"{offer.category or ''} {offer.title}".lower()
                        if category_filter == "dog" and not any(w in cat_str for w in ["koer", "dog", "puppy"]):
                            return
                        if category_filter == "cat" and not any(w in cat_str for w in ["kass", "cat", "kitten"]):
                            return

                    stats["scraped"] += 1

                    # Transactional database write synchronized with async lock
                    async with self._db_lock:
                        with get_db_session() as session:
                            db_sync = DatabaseSync(session)
                            result = db_sync.sync_offer(offer, domain)

                            if result["product_created"]:
                                stats["created_products"] += 1
                            elif result["match_strategy"] == "ean":
                                stats["matched_ean"] += 1
                            elif result["match_strategy"] == "fuzzy_trigram":
                                stats["matched_trigram"] += 1

                            if result["price_changed"]:
                                stats["price_changed"] += 1

                            logger.info(
                                "[%s] ✓ %s | EUR %.2f (%s) -> Match: %s",
                                domain,
                                result["product_title"][:38],
                                result["price"],
                                "In Stock" if offer.in_stock else "Out of Stock",
                                result["match_strategy"],
                            )

                except Exception as e:
                    stats["errors"] += 1
                    logger.warning("[%s] Error processing %s: %s", domain, url, e)

        # Execute product scrapers concurrently for this store
        await asyncio.gather(*[process_product(url) for url in product_urls], return_exceptions=True)

        logger.info(
            "[%s] Completed store crawl: %d scraped, %d prices updated, %d created, %d errors",
            domain,
            stats["scraped"],
            stats["price_changed"],
            stats["created_products"],
            stats["errors"],
        )
        return stats

    async def run(
        self,
        target_stores: Optional[List[str]] = None,
        max_products_per_store: int = 10,
        category: Optional[str] = None,
        refresh_existing: bool = True,
    ):
        """Runs crawlers across ALL stores in parallel while respecting anti-blocking policies."""
        init_db()
        stores = target_stores or list(STORES_CONFIG.keys())

        logger.info(
            "=== Starting PetPrice Parallel Scraper Pipeline across %d stores (%d products/store, %d workers/domain) ===",
            len(stores),
            max_products_per_store,
            self.max_concurrent_per_domain,
        )

        total_stats = {
            "scraped": 0,
            "matched_ean": 0,
            "matched_trigram": 0,
            "created_products": 0,
            "price_changed": 0,
            "skipped_non_product": 0,
            "errors": 0,
        }

        # Run all stores simultaneously in parallel
        store_tasks = [
            self.crawl_store(
                domain=store,
                max_products=max_products_per_store,
                category_filter=category,
                refresh_existing=refresh_existing,
            )
            for store in stores
        ]

        store_results = await asyncio.gather(*store_tasks, return_exceptions=True)

        for res in store_results:
            if isinstance(res, dict):
                for k, v in res.items():
                    total_stats[k] = total_stats.get(k, 0) + v
            elif isinstance(res, Exception):
                logger.error("Store crawler raised exception: %s", res)
                total_stats["errors"] += 1

        await self.http_client.close()

        logger.info("=================================================================")
        logger.info("=== PetPrice Parallel Ingestion Pipeline Summary ===")
        logger.info("=================================================================")
        logger.info("Total Stores Crawled Concurrently: %d", len(stores))
        logger.info("Total Products Successfully Scraped: %d", total_stats["scraped"])
        logger.info("Matched by EAN: %d", total_stats["matched_ean"])
        logger.info("Matched by Trigram (>0.85): %d", total_stats["matched_trigram"])
        logger.info("New Products Created: %d", total_stats["created_products"])
        logger.info("Price Changes / Updates Tracked: %d", total_stats["price_changed"])
        logger.info("Skipped (Non-Product / No Price): %d", total_stats["skipped_non_product"])
        logger.info("Errors Encountered: %d", total_stats["errors"])
        logger.info("=================================================================")


def main():
    parser = argparse.ArgumentParser(description="PetPrice Parallel Ingestion Pipeline")
    parser.add_argument(
        "--store",
        type=str,
        help="Target store domain (e.g. petcity.ee, zoomaailm.ee, kika.ee, fera.ee, koerland.ee, zooplus.ee). Default: all stores in parallel",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Maximum products to scrape per store (default: 0 = unlimited, crawls all products from sitemaps)",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=2,
        help="Maximum concurrent requests per store domain (default: 2, polite anti-blocking)",
    )
    parser.add_argument(
        "--category",
        type=str,
        default="all",
        choices=["all", "dog", "cat"],
        help="Filter products post-extraction (default: all)",
    )
    parser.add_argument(
        "--no-refresh",
        action="store_true",
        help="Disable price refreshing of existing database offers",
    )
    args = parser.parse_args()

    stores = [args.store] if args.store else None
    pipeline = ScraperPipeline(max_concurrent_per_domain=args.concurrency)
    asyncio.run(pipeline.run(
        target_stores=stores,
        max_products_per_store=args.limit,
        category=args.category,
        refresh_existing=not args.no_refresh,
    ))


if __name__ == "__main__":
    main()
