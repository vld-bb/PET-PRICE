"""XML Sitemap discovery and leaf product URL parser."""

import logging
import re
import xml.etree.ElementTree as ET
from typing import List, Set, Optional
from urllib.parse import urlparse

from scraper.rate_limiter import PoliteHttpClient

logger = logging.getLogger(__name__)

# Excluded child sitemap keywords in sitemap index files
EXCLUDE_SITEMAP_KEYWORDS = [
    "category",
    "categories",
    "kataloog",
    "kategooriad",
    "page",
    "pages",
    "post",
    "posts",
    "author",
    "authors",
    "tag",
    "tags",
    "blog",
    "blogi",
    "brand",
    "brandi",
    "uudis",
    "uudised",
]

# Excluded category navigation and static page patterns on leaf URL level
EXCLUDE_URL_PATTERNS = [
    "/tooted",              # navigation category root & subcategories (e.g. /tooted, /tooted/koerad)
    "/tooted/",
    "/catalog/category",    # internal category ID view
    "/catalog/product_compare",
    "/brandilehed",         # brand directory pages
    "/brandilehed/",
    "/sooduspakkumised",    # promotion landing pages
    "/sooduspakkumised/",
    "/teenused",            # service landing pages
    "/teenused/",
    "/kliinik",
    "/kliinikud",
    "/category/",
    "/categories/",
    "/kategooria/",
    "/kategooriad/",
    "/blog/",
    "/blogi/",
    "/uudised/",
    "/kontakt",
    "/contact",
    "/tingimused",
    "/terms",
    "/privaatsus",
    "/privacy",
    "/tarne",
    "/shipping",
    "/klienditeenindus",
    "/author/",
    "/tag/",
    "/account",
    "/konto",
    "/cart",
    "/ostukorv",
    "/kassa",
    "/checkout",
    "/login",
    "/logi-sisse",
    "/register",
    "/ettevottest",
    "/kliendikaart",
]


class SitemapParser:
    """Discovers and parses XML sitemaps to locate candidate product URLs.

    Filters child sitemaps in sitemap index files by prioritizing product-specific
    maps and excluding category/page/post maps. Automatically advances to subsequent
    child sitemaps if a sitemap yields only category URLs.
    """

    def __init__(self, http_client: Optional[PoliteHttpClient] = None):
        self.http_client = http_client or PoliteHttpClient(min_jitter=0.5, max_jitter=1.5)

    def is_candidate_product_url(self, url: str) -> bool:
        """Determines if a URL is a valid candidate product URL.

        Excludes known static, category, and administrative paths.
        Does NOT filter by language or food keywords.
        """
        if not url:
            return False

        parsed = urlparse(url)
        path = parsed.path.rstrip("/")
        path_lower = parsed.path.lower()
        domain = parsed.netloc.lower()

        # Reject domain root (e.g. "https://domain.ee/" or empty path)
        if not path:
            return False

        # Reject if path matches or starts with any excluded category/static pattern
        for pattern in EXCLUDE_URL_PATTERNS:
            p_clean = pattern.lower().rstrip("/")
            if path_lower == p_clean or path_lower.startswith(p_clean + "/") or pattern in path_lower:
                return False

        # Specific rule for petcity.ee:
        # On petcity.ee, all 3,995+ products end with SKU digits (e.g. -215412, -006232, -12345),
        # while navigation categories (/tooted) and CMS landing pages do not.
        if "petcity.ee" in domain:
            if not re.search(r"-\d{3,}$", path):
                return False

        # Specific rule for zooplus.com / zooplus.ee:
        # Zooplus product URLs usually have an ID at the end of the URL (e.g. /123456)
        # Category URLs like /shop/cats/cat_treats_catnip/pastes do not end with digits.
        if "zooplus.com" in domain or "zooplus.ee" in domain:
            if not re.search(r"/\d+$", path):
                return False

        return True

    def filter_child_sitemaps(self, child_locs: List[str], domain: Optional[str] = None) -> List[str]:
        """Filters child sitemap URLs from a sitemapindex.

        Prioritizes product-specific maps (containing 'product' or 'products',
        e.g. sitemap_pc_ee_products_*.xml or sitemap_products_*.xml) and strictly excludes
        maps containing category, page, post, author, tag, blog.

        For petcity.ee:
        If child sitemaps containing 'product' or 'products' are present, selects
        those sub-sitemaps rather than the generic sitemap_pc_ee.xml.
        """
        # Step 1: Exclude non-product sitemaps (categories, blogs, pages, authors, etc.)
        valid_locs = []
        for loc in child_locs:
            loc_lower = loc.lower()
            if any(exc in loc_lower for exc in EXCLUDE_SITEMAP_KEYWORDS):
                continue
            valid_locs.append(loc)

        # Step 2: Check for explicit product sub-sitemaps (e.g. products, product, sitemap_pc_ee_products_*.xml)
        product_maps = [
            loc for loc in valid_locs
            if "product" in loc.lower() or "products" in loc.lower()
        ]

        # Step 3: Handle petcity.ee specifically
        is_petcity = (domain and "petcity.ee" in domain) or any("petcity.ee" in loc.lower() for loc in child_locs)
        if is_petcity:
            if product_maps:
                # Select product sub-sitemaps and strictly drop the generic sitemap_pc_ee.xml
                return [loc for loc in product_maps if not loc.lower().rstrip("/").endswith("/sitemap_pc_ee.xml")]
            # If no product-specific sub-sitemaps are listed in the index, fall back to valid sub-sitemaps
            return valid_locs

        if product_maps:
            return product_maps

        # Otherwise return all valid non-excluded sub-sitemaps
        return valid_locs

    async def discover_sitemaps_from_robots(
        self,
        domain_or_url: str,
        use_impersonate: bool = False,
    ) -> List[str]:
        """Discovers sitemap URLs declared in robots.txt of a domain or URL."""
        if not domain_or_url.startswith("http"):
            robots_url = f"https://{domain_or_url}/robots.txt"
        elif not domain_or_url.endswith("robots.txt"):
            parsed = urlparse(domain_or_url)
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        else:
            robots_url = domain_or_url

        try:
            content = await self.http_client.fetch(robots_url, use_impersonate=use_impersonate)
            sitemaps = []
            for line in content.splitlines():
                line = line.strip()
                if line.lower().startswith("sitemap:"):
                    parts = line.split(":", 1)
                    if len(parts) == 2:
                        sm = parts[1].strip()
                        if sm.startswith("http"):
                            sitemaps.append(sm)
            return sitemaps
        except Exception as e:
            logger.warning("Could not discover sitemaps from %s: %s", robots_url, e)
            return []

    async def extract_product_urls(
        self,
        sitemap_url: str,
        max_sub_sitemaps: int = 20,
        max_products: Optional[int] = None,
        use_impersonate: bool = False,
    ) -> List[str]:
        """Recursively parses a sitemap or sitemap index and extracts candidate product URLs.

        If a sub-sitemap only contains category URLs, it automatically continues
        to the next child sitemap until candidate product URLs are found.
        If a root sitemap URL (e.g. sitemap.xml) is not found, it automatically checks
        robots.txt to discover the root sitemaps.
        """
        product_urls: Set[str] = set()
        sitemaps_to_visit = [sitemap_url]
        visited_sitemaps: Set[str] = set()
        tried_robots_fallback = False

        while sitemaps_to_visit and (max_products is None or len(product_urls) < max_products):
            if len(visited_sitemaps) >= max_sub_sitemaps:
                break

            current_sitemap = sitemaps_to_visit.pop(0)
            if current_sitemap in visited_sitemaps:
                continue
            visited_sitemaps.add(current_sitemap)

            try:
                content = await self.http_client.fetch(current_sitemap, use_impersonate=use_impersonate)
                root = ET.fromstring(content.encode("utf-8"))
            except Exception as e:
                logger.warning("Failed to fetch or parse sitemap %s: %s", current_sitemap, e)
                # If root sitemap failed (e.g. 404 on sitemap.xml) and no pending sitemaps, attempt robots.txt fallback
                if not tried_robots_fallback and not sitemaps_to_visit:
                    tried_robots_fallback = True
                    parsed = urlparse(current_sitemap)
                    discovered = await self.discover_sitemaps_from_robots(parsed.netloc, use_impersonate=use_impersonate)
                    filtered = self.filter_child_sitemaps(discovered, domain=parsed.netloc)
                    for sm in filtered:
                        if sm not in visited_sitemaps and sm not in sitemaps_to_visit:
                            sitemaps_to_visit.append(sm)
                continue

            # Strip namespace for robust tag matching
            tag_name = root.tag.split("}")[-1] if "}" in root.tag else root.tag

            if tag_name == "sitemapindex":
                # Collect child loc URLs
                raw_child_locs = []
                for sitemap_elem in root:
                    for child in sitemap_elem:
                        child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                        if child_tag == "loc" and child.text:
                            raw_child_locs.append(child.text.strip())

                # Filter child sitemaps (prioritize product maps, exclude categories/posts/pages)
                parsed_cur = urlparse(current_sitemap)
                filtered_locs = self.filter_child_sitemaps(raw_child_locs, domain=parsed_cur.netloc)
                for loc in filtered_locs:
                    if loc not in visited_sitemaps and loc not in sitemaps_to_visit:
                        sitemaps_to_visit.append(loc)

            elif tag_name == "urlset":
                # Extract candidate URLs from this sitemap
                sub_sitemap_candidates = []
                for url_elem in root:
                    for child in url_elem:
                        child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag
                        if child_tag == "loc" and child.text:
                            loc = child.text.strip()
                            if self.is_candidate_product_url(loc):
                                sub_sitemap_candidates.append(loc)

                if sub_sitemap_candidates:
                    for loc in sub_sitemap_candidates:
                        product_urls.add(loc)
                        if max_products and len(product_urls) >= max_products:
                            return list(product_urls)
                else:
                    # If this sub-sitemap only contained category or non-product URLs,
                    # automatically move to the next child sitemap in sitemaps_to_visit
                    logger.info(
                        "Sub-sitemap %s contained only category/static URLs. Advancing to next sitemap...",
                        current_sitemap,
                    )

        return list(product_urls)
