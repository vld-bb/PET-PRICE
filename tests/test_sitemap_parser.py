"""Unit tests for the refactored XML sitemap parser."""

import pytest
from scraper.sitemap_parser import SitemapParser


def test_filter_child_sitemaps_prioritize_product_maps():
    parser = SitemapParser()

    # Case 1: Fera style sitemapindex
    fera_sitemaps = [
        "https://fera.ee/export/google-xml/map-category.xml",
        "https://fera.ee/export/google-xml/map-products.xml",
        "https://fera.ee/export/google-xml/map-blog.xml",
    ]
    filtered_fera = parser.filter_child_sitemaps(fera_sitemaps)
    assert len(filtered_fera) == 1
    assert filtered_fera[0] == "https://fera.ee/export/google-xml/map-products.xml"

    # Case 2: Shopify / Kika style sitemapindex
    kika_sitemaps = [
        "https://www.kika.ee/sitemap_pages_1.xml",
        "https://www.kika.ee/sitemap_products_1.xml",
        "https://www.kika.ee/sitemap_products_2.xml",
        "https://www.kika.ee/sitemap_blogs_1.xml",
    ]
    filtered_kika = parser.filter_child_sitemaps(kika_sitemaps)
    assert len(filtered_kika) == 2
    assert "https://www.kika.ee/sitemap_products_1.xml" in filtered_kika
    assert "https://www.kika.ee/sitemap_products_2.xml" in filtered_kika


def test_filter_child_sitemaps_generic_without_product_word():
    parser = SitemapParser()

    # Case 3: Zoomaailm style generic parts (no "product" in URL, but should exclude category)
    generic_sitemaps = [
        "https://zoomaailm.ee/sitemap_ee-2-1.xml",
        "https://zoomaailm.ee/sitemap_ee-2-2.xml",
        "https://zoomaailm.ee/sitemap_ee-category.xml",
        "https://zoomaailm.ee/sitemap_ee-brand.xml",
        "https://zoomaailm.ee/sitemap_ee-blog.xml",
    ]
    filtered = parser.filter_child_sitemaps(generic_sitemaps)
    assert len(filtered) == 2
    assert "https://zoomaailm.ee/sitemap_ee-2-1.xml" in filtered
    assert "https://zoomaailm.ee/sitemap_ee-2-2.xml" in filtered
    assert not any("category" in s for s in filtered)
    assert not any("brand" in s for s in filtered)


def test_is_candidate_product_url_no_food_keywords_needed():
    parser = SitemapParser()

    # URLs with NO food keywords should be accepted as candidates (verified later by Schema.org)
    assert parser.is_candidate_product_url("https://zoomaailm.ee/ee/edgard-cooper-salmon-7kg") is True
    assert parser.is_candidate_product_url("https://www.petcity.ee/harjad-ja-kammid-12345") is True
    assert parser.is_candidate_product_url("https://www.kika.ee/products/vitamins-omega-3") is True
    assert parser.is_candidate_product_url("https://fera.ee/acana-heritage-17kg.html") is True

    # Static / administrative / category URLs should be rejected
    assert parser.is_candidate_product_url("https://example.ee/") is False
    assert parser.is_candidate_product_url("https://www.petcity.ee/tooted") is False
    assert parser.is_candidate_product_url("https://www.petcity.ee/tooted/koerad") is False
    assert parser.is_candidate_product_url("https://example.ee/kontakt") is False
    assert parser.is_candidate_product_url("https://example.ee/privaatsus") is False
    assert parser.is_candidate_product_url("https://example.ee/blog/kuidas-toita-koera") is False
    assert parser.is_candidate_product_url("https://example.ee/category/koerad") is False
    assert parser.is_candidate_product_url("https://example.ee/cart") is False
    assert parser.is_candidate_product_url("https://example.ee/checkout") is False


def test_filter_child_sitemaps_petcity_prioritizes_product_maps():
    """For petcity.ee, sub-sitemaps containing 'product' or 'products' must be selected

    over generic sitemap_pc_ee.xml.
    """
    parser = SitemapParser()

    # Case A: sitemap_pc_ee_products_*.xml vs sitemap_pc_ee.xml
    petcity_sitemaps = [
        "https://www.petcity.ee/sitemap_pc_ee.xml",
        "https://www.petcity.ee/sitemap_pc_ee_products_1.xml",
        "https://www.petcity.ee/sitemap_pc_ee_products_2.xml",
        "https://www.petcity.ee/sitemap_pc_ee_categories.xml",
        "https://www.petcity.ee/sitemap_pc_ee_pages.xml",
    ]
    filtered = parser.filter_child_sitemaps(petcity_sitemaps, domain="petcity.ee")
    assert len(filtered) == 2
    assert "https://www.petcity.ee/sitemap_pc_ee_products_1.xml" in filtered
    assert "https://www.petcity.ee/sitemap_pc_ee_products_2.xml" in filtered
    assert "https://www.petcity.ee/sitemap_pc_ee.xml" not in filtered
    assert "https://www.petcity.ee/sitemap_pc_ee_categories.xml" not in filtered

    # Case B: sitemap_products_*.xml vs sitemap_pc_ee.xml
    petcity_sitemaps_b = [
        "https://www.petcity.ee/sitemap_pc_ee.xml",
        "https://www.petcity.ee/sitemap_products_1.xml",
    ]
    filtered_b = parser.filter_child_sitemaps(petcity_sitemaps_b, domain="petcity.ee")
    assert len(filtered_b) == 1
    assert filtered_b[0] == "https://www.petcity.ee/sitemap_products_1.xml"


def test_filter_child_sitemaps_petcity_fallback_when_no_product_word():
    """If no product-specific map exists, generic sitemap_pc_ee.xml is retained as fallback."""
    parser = SitemapParser()
    petcity_sitemaps = [
        "https://www.petcity.ee/sitemap_pc_ee.xml",
        "https://www.petcity.ee/sitemap_pc_ee_categories.xml",
    ]
    filtered = parser.filter_child_sitemaps(petcity_sitemaps, domain="petcity.ee")
    assert len(filtered) == 1
    assert filtered[0] == "https://www.petcity.ee/sitemap_pc_ee.xml"


def test_extract_product_urls_advances_when_sub_sitemap_has_only_category_urls():
    """If a sub-sitemap only contains category URLs, the parser automatically advances

    to subsequent child sitemaps until valid product URLs are found.
    """
    import asyncio
    from unittest.mock import AsyncMock

    mock_client = AsyncMock()

    # Root sitemap index containing two sub-sitemaps
    root_index = """<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>https://www.petcity.ee/sitemap_categories.xml</loc>
      </sitemap>
      <sitemap>
        <loc>https://www.petcity.ee/sitemap_products_1.xml</loc>
      </sitemap>
    </sitemapindex>"""

    # Sub-sitemap 1: only category navigation URLs
    category_sitemap = """<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://www.petcity.ee/tooted</loc></url>
      <url><loc>https://www.petcity.ee/tooted/koerad</loc></url>
      <url><loc>https://www.petcity.ee/catalog/category/view/id/123</loc></url>
    </urlset>"""

    # Sub-sitemap 2: valid product URLs
    product_sitemap = """<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://www.petcity.ee/diafarm-cat-malt-50g-123559</loc></url>
      <url><loc>https://www.petcity.ee/orijen-original-cat-1-8kg-215069</loc></url>
    </urlset>"""

    async def mock_fetch(url, *args, **kwargs):
        if "sitemap.xml" in url or "sitemapindex" in url:
            return root_index
        elif "sitemap_categories" in url:
            return category_sitemap
        elif "sitemap_products" in url:
            return product_sitemap
        raise ValueError(f"Unexpected url: {url}")

    mock_client.fetch = mock_fetch

    async def run_test():
        parser = SitemapParser(http_client=mock_client)
        return await parser.extract_product_urls("https://www.petcity.ee/sitemap.xml", max_products=5)

    urls = asyncio.run(run_test())

    assert len(urls) == 2
    assert "https://www.petcity.ee/diafarm-cat-malt-50g-123559" in urls
    assert "https://www.petcity.ee/orijen-original-cat-1-8kg-215069" in urls


def test_discover_sitemaps_from_robots():
    """Verifies discovering sitemap declaration from robots.txt content."""
    import asyncio
    from unittest.mock import AsyncMock

    mock_client = AsyncMock()
    mock_client.fetch.return_value = """User-agent: *
Disallow: /admin/

Sitemap: https://www.petcity.ee/sitemap_pc_ee.xml
"""

    async def run_test():
        parser = SitemapParser(http_client=mock_client)
        return await parser.discover_sitemaps_from_robots("https://www.petcity.ee/robots.txt")

    sitemaps = asyncio.run(run_test())
    assert sitemaps == ["https://www.petcity.ee/sitemap_pc_ee.xml"]

