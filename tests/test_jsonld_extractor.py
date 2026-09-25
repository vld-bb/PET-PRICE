"""Unit tests for JSON-LD and OpenGraph product extractors."""

import pytest
from scraper.jsonld_extractor import JsonLdExtractor


def test_jsonld_extractor_standard_product():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "Acana Singles Grass-Fed Lamb koeratoit 11.4 kg",
            "image": "https://example.com/acana-lamb.jpg",
            "brand": {
                "@type": "Brand",
                "name": "Acana"
            },
            "gtin13": "0649925101144",
            "offers": {
                "@type": "Offer",
                "priceCurrency": "EUR",
                "price": "84.50",
                "availability": "https://schema.org/InStock",
                "url": "https://example.com/toode/acana-lamb"
            }
        }
        </script>
    </head>
    <body></body>
    </html>
    """
    extractor = JsonLdExtractor()
    offer = extractor.parse(html, "https://example.com/toode/acana-lamb")

    assert offer is not None
    assert offer.title == "Acana Singles Grass-Fed Lamb koeratoit 11.4 kg"
    assert offer.brand == "Acana"
    assert offer.ean == "0649925101144"
    assert offer.price == 84.50
    assert offer.weight_kg == 11.4
    assert offer.price_per_kg == 7.41
    assert offer.in_stock is True
    assert offer.image_url == "https://example.com/acana-lamb.jpg"


def test_jsonld_extractor_graph_array():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "WebSite",
                    "url": "https://example.com"
                },
                {
                    "@type": "Product",
                    "name": "Royal Canin Fit 32 kassitoit 10 kg",
                    "sku": "3182550702157",
                    "brand": "Royal Canin",
                    "offers": [
                        {
                            "@type": "Offer",
                            "price": 69.90,
                            "priceCurrency": "EUR",
                            "availability": "https://schema.org/InStock"
                        }
                    ]
                }
            ]
        }
        </script>
    </head>
    <body></body>
    </html>
    """
    extractor = JsonLdExtractor()
    offer = extractor.parse(html, "https://example.com/fit-32")

    assert offer is not None
    assert "Fit 32" in offer.title
    assert offer.brand == "Royal Canin"
    assert offer.ean == "3182550702157"
    assert offer.price == 69.90
    assert offer.weight_kg == 10.0


def test_opengraph_fallback():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta property="og:title" content="Josera Optiness 15 kg | PetCity" />
        <meta property="product:price:amount" content="51.90" />
        <meta property="og:image" content="https://example.com/josera.jpg" />
    </head>
    <body></body>
    </html>
    """
    extractor = JsonLdExtractor()
    offer = extractor.parse(html, "https://example.com/josera-optiness")

    assert offer is not None
    assert "Josera Optiness" in offer.title
    assert offer.price == 51.90
    assert offer.brand == "Josera"
    assert offer.weight_kg == 15.0


def test_sale_price_extraction():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "Divine Sense Kodune Lõhnasprei 250ml",
            "offers": [
                {
                    "@type": "Offer",
                    "price": "30.49",
                    "priceCurrency": "EUR"
                },
                {
                    "@type": "Offer",
                    "price": "21.34",
                    "priceCurrency": "EUR"
                }
            ]
        }
        </script>
    </head>
    <body>
        <div className="product-info-price">
            <span className="old-price">30.49 €</span>
            <span className="special-price">21.34 €</span>
        </div>
    </body>
    </html>
    """
    extractor = JsonLdExtractor()
    offer = extractor.parse(html, "https://www.kika.ee/products/divine-sense")

    assert offer is not None
    assert offer.price == 21.34

