"""LemmikuHind Scraper Suite."""

from scraper.rate_limiter import PoliteHttpClient, user_agent_rotator
from scraper.sitemap_parser import SitemapParser
from scraper.jsonld_extractor import JsonLdExtractor, ScrapedProductOffer
from scraper.normalizer import parse_weight_kg, calculate_price_per_kg, slugify, infer_category
from scraper.matcher import ProductMatcher, trigram_similarity
from scraper.db_sync import DatabaseSync
from scraper.pipeline import ScraperPipeline

__all__ = [
    "PoliteHttpClient",
    "user_agent_rotator",
    "SitemapParser",
    "JsonLdExtractor",
    "ScrapedProductOffer",
    "parse_weight_kg",
    "calculate_price_per_kg",
    "slugify",
    "infer_category",
    "ProductMatcher",
    "trigram_similarity",
    "DatabaseSync",
    "ScraperPipeline",
]
