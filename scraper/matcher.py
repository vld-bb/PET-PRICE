"""Product matching engine: EAN exact matching and brand + weight + trigram similarity."""

from typing import List, Optional, Tuple, Set
from sqlalchemy.orm import Session

from db.models import Product
from scraper.jsonld_extractor import ScrapedProductOffer
from scraper.normalizer import clean_title_for_matching


def get_character_trigrams(text: str) -> Set[str]:
    """Generates set of character trigrams with boundary padding for robust similarity."""
    if not text:
        return set()
    padded = f"  {text.strip().lower()}  "
    return {padded[i : i + 3] for i in range(len(padded) - 2)}


def trigram_similarity(text1: str, text2: str) -> float:
    """Calculates Sørensen-Dice trigram similarity (compatible with PostgreSQL pg_trgm).

    Returns a float between 0.0 and 1.0.
    """
    t1 = get_character_trigrams(text1)
    t2 = get_character_trigrams(text2)

    if not t1 or not t2:
        return 0.0

    intersection = len(t1.intersection(t2))
    return (2.0 * intersection) / (len(t1) + len(t2))


class ProductMatcher:
    """Matches a scraped product offer against existing database catalog."""

    def __init__(self, session: Session, trigram_threshold: float = 0.85):
        self.session = session
        self.trigram_threshold = trigram_threshold

    def match(self, offer: ScrapedProductOffer) -> Tuple[Optional[Product], str]:
        """Finds matching product for the given scraped offer.

        Returns (matched_product, match_strategy).
        match_strategy is one of: 'ean', 'fuzzy_trigram', or 'none'.
        """
        # 1. Primary Match: EAN barcode
        if offer.ean:
            matched_by_ean = (
                self.session.query(Product)
                .filter(Product.ean == offer.ean)
                .first()
            )
            if matched_by_ean:
                return matched_by_ean, "ean"

        # 2. Secondary Match (when EAN is absent or not found in DB):
        # Must match: Brand + exact weight_kg (within tolerance) + cleaned title trigram similarity > 0.85
        if offer.weight_kg is not None and offer.brand:
            # Query candidate products with same brand
            candidates = (
                self.session.query(Product)
                .filter(Product.brand.ilike(offer.brand.strip()))
                .all()
            )

            cleaned_offer_title = clean_title_for_matching(offer.title)
            best_match: Optional[Product] = None
            highest_score: float = 0.0

            for candidate in candidates:
                # Check weight match (within 0.05 kg / 50g tolerance)
                if candidate.weight_kg is None:
                    continue
                if abs(candidate.weight_kg - offer.weight_kg) > 0.05:
                    continue

                cleaned_candidate_title = clean_title_for_matching(candidate.title)
                score = trigram_similarity(cleaned_offer_title, cleaned_candidate_title)

                if score > self.trigram_threshold and score > highest_score:
                    highest_score = score
                    best_match = candidate

            if best_match:
                return best_match, "fuzzy_trigram"

        return None, "none"
