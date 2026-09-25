"""Schema.org JSON-LD and OpenGraph Universal Product Extractor."""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Union
from bs4 import BeautifulSoup

from scraper.normalizer import parse_weight_kg, calculate_price_per_kg, slugify, infer_category

logger = logging.getLogger(__name__)


class ScrapedProductOffer:
    """Normalized product offer representation extracted from a web page."""

    def __init__(
        self,
        title: str,
        price: float,
        url: str,
        ean: Optional[str] = None,
        brand: Optional[str] = None,
        weight_kg: Optional[float] = None,
        price_per_kg: Optional[float] = None,
        image_url: Optional[str] = None,
        category: Optional[str] = None,
        in_stock: bool = True,
        currency: str = "EUR",
    ):
        self.title = title
        self.price = price
        self.url = url
        self.ean = ean
        self.brand = brand
        self.weight_kg = weight_kg
        self.price_per_kg = price_per_kg or calculate_price_per_kg(price, weight_kg)
        self.image_url = image_url
        self.category = category or infer_category(title)
        self.in_stock = in_stock
        self.currency = currency
        self.slug = slugify(f"{brand or ''} {title}".strip())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "price": self.price,
            "url": self.url,
            "ean": self.ean,
            "brand": self.brand,
            "weight_kg": self.weight_kg,
            "price_per_kg": self.price_per_kg,
            "image_url": self.image_url,
            "category": self.category,
            "in_stock": self.in_stock,
            "currency": self.currency,
            "slug": self.slug,
        }


class JsonLdExtractor:
    """Universal parser prioritizing Schema.org JSON-LD with OpenGraph/HTML fallback."""

    def parse(self, html: str, page_url: str) -> Optional[ScrapedProductOffer]:
        """Extract product offer details from HTML content."""
        if not html:
            return None

        soup = BeautifulSoup(html, "html.parser")

        # Specific rule for zooplus.com / zooplus.ee:
        # Prevent extracting products from category pages reached via HTTP redirects.
        # Check the canonical URL to get the final redirected destination.
        canonical_tag = soup.find("link", rel="canonical")
        og_url_tag = soup.find("meta", property="og:url")
        final_url = page_url
        if canonical_tag and canonical_tag.get("href"):
            final_url = str(canonical_tag.get("href"))
        elif og_url_tag and og_url_tag.get("content"):
            final_url = str(og_url_tag.get("content"))
            
        if "zooplus.com" in final_url or "zooplus.ee" in final_url:
            if not re.search(r"/\d+(?:\?.*)?$", final_url):
                return None

        # 1. Attempt Schema.org JSON-LD extraction
        offer = self._extract_from_json_ld(soup, page_url)

        # 2. Fallback to OpenGraph and Meta tags
        if not offer:
            offer = self._extract_from_opengraph(soup, page_url)

        if offer:
            # Check if HTML DOM contains an active sale/special price lower than parsed price
            dom_price = self._extract_price_from_html_dom(soup)
            if dom_price > 0 and (offer.price <= 0 or dom_price < offer.price):
                offer.price = dom_price
                offer.price_per_kg = calculate_price_per_kg(dom_price, offer.weight_kg)

        if offer and offer.title and offer.price > 0:
            return offer

        return None

    def _extract_from_json_ld(self, soup: BeautifulSoup, page_url: str) -> Optional[ScrapedProductOffer]:
        scripts = soup.find_all("script", type="application/ld+json")
        for script in scripts:
            if not script.string:
                continue
            try:
                data = json.loads(script.string.strip())
                product_node = self._find_product_node(data)
                if product_node:
                    return self._node_to_offer(product_node, page_url)
            except Exception as e:
                logger.debug("Failed parsing JSON-LD script on %s: %s", page_url, e)

        return None

    def _find_product_node(self, data: Union[Dict, List]) -> Optional[Dict]:
        """Traverse JSON structures to find @type == 'Product'."""
        if isinstance(data, list):
            for item in data:
                found = self._find_product_node(item)
                if found:
                    return found
        elif isinstance(data, dict):
            # Check @graph
            if "@graph" in data and isinstance(data["@graph"], list):
                for item in data["@graph"]:
                    found = self._find_product_node(item)
                    if found:
                        return found

            item_type = data.get("@type", "")
            if item_type == "Product" or (isinstance(item_type, list) and "Product" in item_type):
                return data

        return None

    def _clean_price_val(self, val: Any) -> float:
        if val is None:
            return 0.0
        try:
            cleaned = str(val).replace(",", ".").replace("€", "").replace("\xa0", "").strip()
            match = re.search(r"(\d+(?:\.\d+)?)", cleaned)
            if match:
                return float(match.group(1))
        except (ValueError, TypeError):
            pass
        return 0.0

    def _extract_best_price_from_offers(self, offers: Any) -> tuple[float, str, bool]:
        """Inspect offers list/dict and priceSpecification objects to extract lowest active purchasing price."""
        if not offers:
            return 0.0, "EUR", True

        offer_nodes = offers if isinstance(offers, list) else [offers]
        candidates: List[float] = []
        currency = "EUR"
        in_stock = True

        for o in offer_nodes:
            if not isinstance(o, dict):
                continue

            curr = o.get("priceCurrency", "EUR") or "EUR"
            if curr:
                currency = curr

            avail = str(o.get("availability", "")).lower()
            if "outofstock" in avail or "soldout" in avail:
                in_stock = False

            # Check priceSpecification
            specs = o.get("priceSpecification")
            if specs:
                spec_nodes = specs if isinstance(specs, list) else [specs]
                for s in spec_nodes:
                    if isinstance(s, dict):
                        # Skip UnitPrice to avoid scraping price per kg/piece
                        ptype = str(s.get("priceType", ""))
                        if "UnitPrice" in ptype:
                            continue
                        
                        val = s.get("price")
                        p = self._clean_price_val(val)
                        if p > 0:
                            candidates.append(p)

            # Check direct price & lowPrice
            for key in ["price", "lowPrice"]:
                val = o.get(key)
                p = self._clean_price_val(val)
                if p > 0:
                    candidates.append(p)

        price = min(candidates) if candidates else 0.0
        return price, currency, in_stock

    def _node_to_offer(self, node: Dict, page_url: str) -> Optional[ScrapedProductOffer]:
        # Name / Title
        title = node.get("name")
        if not title:
            return None

        # Clean title
        title = str(title).strip()

        # Brand
        brand = None
        brand_val = node.get("brand")
        if isinstance(brand_val, dict):
            brand = brand_val.get("name")
        elif isinstance(brand_val, str):
            brand = brand_val
        if not brand:
            brand = self._infer_brand_from_title(title)

        # Barcode (GTIN / EAN / SKU)
        ean = None
        for key in ["gtin13", "gtin", "isbn", "ean", "gtin14", "gtin8", "sku"]:
            val = node.get(key)
            if val and str(val).strip():
                candidate = str(val).strip().replace(" ", "").replace("-", "")
                if candidate.isdigit() and 8 <= len(candidate) <= 14:
                    ean = candidate
                    break

        # Offers: price, currency, availability
        offers = node.get("offers")
        price, currency, in_stock = self._extract_best_price_from_offers(offers)

        # Image
        image_url = None
        raw_img = node.get("image")
        if isinstance(raw_img, list) and raw_img:
            first_img = raw_img[0]
            image_url = first_img.get("url") if isinstance(first_img, dict) else str(first_img)
        elif isinstance(raw_img, dict):
            image_url = raw_img.get("url")
        elif isinstance(raw_img, str):
            image_url = raw_img

        # Weight
        weight_kg = parse_weight_kg(title)
        if not weight_kg:
            desc = node.get("description", "")
            if desc:
                weight_kg = parse_weight_kg(str(desc))

        return ScrapedProductOffer(
            title=title,
            price=price,
            url=page_url,
            ean=ean,
            brand=brand,
            weight_kg=weight_kg,
            image_url=image_url,
            in_stock=in_stock,
            currency=currency,
        )

    def _extract_price_from_html_dom(self, soup: BeautifulSoup) -> float:
        """Inspect HTML DOM selectors prioritizing special/sale prices and ignoring old prices."""
        sale_selectors = [
            ".product-buy__type-price",
            "span[data-unit-price]",
            ".price--on-sale .price__sale .price-item--sale",
            ".price__sale .price-item--sale",
            ".price-item--sale",
            "span[data-price-type='finalPrice']",
            ".special-price .price",
            ".special-price",
            ".sale-price",
            ".current-price",
            ".price-new",
            "ins .amount",
            ".product-info-main .price",
        ]
        for sel in sale_selectors:
            elem = soup.select_one(sel)
            if elem:
                data_unit = elem.get("data-unit-price")
                if data_unit and str(data_unit).isdigit():
                    val = float(data_unit)
                    if val > 1000:
                        return val / 100.0
                    elif val > 0:
                        return val

                p = self._clean_price_val(elem.text)
                if p > 0:
                    return p

        # Check price containers after decomposing old price elements
        try:
            soup_copy = BeautifulSoup(str(soup), "html.parser")
            for old_elem in soup_copy.select(".price__sale .price-item--regular, .old-price, .regular-price, .price-old, .price-before-discount, del, s, strike, .line-through"):
                old_elem.decompose()

            for sel in [".price", ".amount"]:
                for elem in soup_copy.select(sel):
                    p = self._clean_price_val(elem.text)
                    if p > 0:
                        return p
        except Exception:
            pass

        return 0.0

    def _extract_from_opengraph(self, soup: BeautifulSoup, page_url: str) -> Optional[ScrapedProductOffer]:
        title_tag = (
            soup.find("meta", property="og:title")
            or soup.find("meta", attrs={"name": "twitter:title"})
            or soup.find("title")
        )
        title = title_tag.get("content", "") if title_tag and hasattr(title_tag, "get") else (title_tag.text if title_tag else "")
        title = title.strip()
        if not title:
            return None

        # Clean title suffix
        title = re.sub(r"\s*[\|\-–]\s*(PetCity|Kika|Zoomaailm|Fera|Koerland|Zooplus).*$", "", title, flags=re.IGNORECASE)

        # Price
        price = self._extract_price_from_html_dom(soup)
        if price <= 0:
            price_tag = (
                soup.find("meta", property="product:price:amount")
                or soup.find("meta", property="og:price:amount")
                or soup.find("meta", attrs={"itemprop": "price"})
            )
            if price_tag and price_tag.get("content"):
                price = self._clean_price_val(price_tag["content"])

        # Image
        image_tag = (
            soup.find("meta", property="og:image")
            or soup.find("meta", attrs={"name": "twitter:image"})
            or soup.find("link", rel="image_src")
        )
        image_url = image_tag.get("content") or image_tag.get("href") if image_tag else None

        # Availability
        in_stock = True
        avail_tag = soup.find("meta", property="product:availability")
        if avail_tag and "oos" in str(avail_tag.get("content", "")).lower():
            in_stock = False

        brand = self._infer_brand_from_title(title)
        weight_kg = parse_weight_kg(title)

        return ScrapedProductOffer(
            title=title,
            price=price,
            url=page_url,
            brand=brand,
            weight_kg=weight_kg,
            image_url=image_url,
            in_stock=in_stock,
        )

    def _infer_brand_from_title(self, title: str) -> Optional[str]:
        known_brands = [
            "Royal Canin",
            "Acana",
            "Orijen",
            "Hill's",
            "Brit Care",
            "Brit",
            "Purina Pro Plan",
            "Purina",
            "Josera",
            "Applaws",
            "Edgard & Cooper",
            "Carnilove",
            "Taste of the Wild",
            "Farmina",
            "Belcando",
            "Leonardo",
            "Animonda",
            "Monge",
        ]
        title_lower = title.lower()
        for b in known_brands:
            if b.lower() in title_lower:
                return b
        return None


def extract_product_data(html: str, page_url: str) -> Optional[Dict[str, Any]]:
    """Module-level helper function for extracting product offer data from HTML."""
    extractor = JsonLdExtractor()
    offer = extractor.parse(html, page_url)
    return offer.to_dict() if offer else None
