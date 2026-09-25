"""Estonian Pet Retailer Configurations and Metadata."""

from typing import Dict, Any

STORES_CONFIG: Dict[str, Dict[str, Any]] = {
    "petcity.ee": {
        "name": "PetCity",
        "domain": "petcity.ee",
        "base_url": "https://www.petcity.ee",
        "sitemaps": [
            "https://www.petcity.ee/sitemap_pc_ee.xml",
            "https://www.petcity.ee/sitemap_products_1.xml",
            "https://www.petcity.ee/sitemap.xml",
        ],
        "logo_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=128&q=80",
    },
    "kika.ee": {
        "name": "Kika",
        "domain": "kika.ee",
        "base_url": "https://www.kika.ee",
        "sitemaps": [
            "https://www.kika.ee/sitemap.xml",
        ],
        "logo_url": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=128&q=80",
    },
    "zoomaailm.ee": {
        "name": "Zoomaailm",
        "domain": "zoomaailm.ee",
        "base_url": "https://zoomaailm.ee",
        "sitemaps": [
            "https://zoomaailm.ee/sitemap_ee.xml",
        ],
        "logo_url": "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=128&q=80",
    },
    "fera.ee": {
        "name": "Fera",
        "domain": "fera.ee",
        "base_url": "https://fera.ee",
        "sitemaps": [
            "https://fera.ee/sitemap-fera.xml",
        ],
        "logo_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=128&q=80",
    },
    "koerland.ee": {
        "name": "Koerland",
        "domain": "koerland.ee",
        "base_url": "https://www.koerland.ee",
        "sitemaps": [
            "https://www.koerland.ee/sitemap.xml",
        ],
        "use_impersonate": True,  # koerland.ee uses Cloudflare TLS fingerprint verification
        "logo_url": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=128&q=80",
    },
    "zooplus.ee": {
        "name": "Zooplus",
        "domain": "zooplus.ee",
        "base_url": "https://www.zooplus.com",
        "sitemaps": [
            "https://www.zooplus.com/sitemap.xml",
        ],
        "logo_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=128&q=80",
    },
}
