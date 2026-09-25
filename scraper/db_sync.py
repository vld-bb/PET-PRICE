"""Database synchronizer: Upserts products, store offers, and records price history."""

from datetime import datetime
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from db.models import Store, Product, StoreOffer, PriceHistory
from scraper.jsonld_extractor import ScrapedProductOffer
from scraper.matcher import ProductMatcher

logger = logging.getLogger(__name__)


class DatabaseSync:
    """Handles transactional upsert of scraped offers into products, store_offers, and price_history."""

    def __init__(self, session: Session, trigram_threshold: float = 0.85):
        self.session = session
        self.matcher = ProductMatcher(session, trigram_threshold=trigram_threshold)

    def sync_offer(self, offer: ScrapedProductOffer, store_domain: str) -> Dict[str, Any]:
        """Ingests a scraped offer: matches or creates product, upserts offer, appends price history."""
        # 1. Resolve Store
        store = self.session.query(Store).filter(Store.domain == store_domain).first()
        if not store:
            store = Store(name=store_domain.split(".")[0].capitalize(), domain=store_domain)
            self.session.add(store)
            self.session.flush()

        # 2. Match or Create Product
        product, match_strategy = self.matcher.match(offer)
        created_product = False

        if not product:
            # Ensure unique slug
            base_slug = offer.slug
            slug = base_slug
            counter = 1
            while self.session.query(Product).filter(Product.slug == slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1

            try:
                from db.classify_products import classify_product
                species, cat_group, cat_slug, proper_category = classify_product(0, offer.title, offer.brand)
            except Exception:
                species, cat_group, cat_slug, proper_category = "koer", "toit_maiused", "kuivtoit", offer.category

            product = Product(
                ean=offer.ean,
                slug=slug,
                title=offer.title,
                brand=offer.brand,
                weight_kg=offer.weight_kg,
                image_url=offer.image_url,
                category=proper_category or offer.category,
                species=species,
                category_group=cat_group,
                category_slug=cat_slug,
            )
            self.session.add(product)
            self.session.flush()
            created_product = True
        else:
            # Enrich existing product if newly discovered info is available
            if not product.ean and offer.ean:
                product.ean = offer.ean
            if not product.image_url and offer.image_url:
                product.image_url = offer.image_url
            if product.weight_kg is None and offer.weight_kg is not None:
                product.weight_kg = offer.weight_kg

        # 3. Upsert Store Offer
        existing_offer = (
            self.session.query(StoreOffer)
            .filter(
                StoreOffer.product_id == product.id,
                StoreOffer.store_id == store.id,
            )
            .first()
        )

        now = datetime.now()
        price_changed = False
        offer_created = False

        if not existing_offer:
            new_offer = StoreOffer(
                product_id=product.id,
                store_id=store.id,
                url=offer.url,
                price=offer.price,
                price_per_kg=offer.price_per_kg,
                in_stock=offer.in_stock,
                last_scraped_at=now,
            )
            self.session.add(new_offer)
            self.session.flush()
            target_offer = new_offer
            offer_created = True
            price_changed = True
        else:
            target_offer = existing_offer
            if abs(float(existing_offer.price) - float(offer.price)) >= 0.01:
                price_changed = True

            existing_offer.price = offer.price
            existing_offer.price_per_kg = offer.price_per_kg
            existing_offer.in_stock = offer.in_stock
            existing_offer.url = offer.url
            existing_offer.last_scraped_at = now

        # 4. Append to Price History if price changed or initial offer
        if price_changed:
            ph = PriceHistory(
                offer_id=target_offer.id,
                price=offer.price,
                recorded_at=now,
            )
            self.session.add(ph)

        self.session.commit()

        return {
            "product_id": product.id,
            "product_title": product.title,
            "product_created": created_product,
            "match_strategy": match_strategy,
            "offer_created": offer_created,
            "price_changed": price_changed,
            "price": offer.price,
            "price_per_kg": offer.price_per_kg,
        }
