"""Unit tests for product matching logic (EAN & Brand + Weight + Trigram similarity)."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.models import Base, Product
from scraper.matcher import trigram_similarity, ProductMatcher
from scraper.jsonld_extractor import ScrapedProductOffer
from scraper.normalizer import clean_title_for_matching


@pytest.fixture
def memory_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Prepopulate a product
    p1 = Product(
        ean="3182550702447",
        slug="royal-canin-maxi-adult-15kg",
        title="Royal Canin Maxi Adult kuivtoit suurtele koertele 15 kg",
        brand="Royal Canin",
        weight_kg=15.0,
        category="Koeratoit (Kuivtoit)",
    )
    p2 = Product(
        ean=None,  # No EAN
        slug="brit-care-adult-large-breed-12kg",
        title="Brit Care Adult Large Breed Lamb & Rice 12 kg",
        brand="Brit Care",
        weight_kg=12.0,
        category="Koeratoit (Kuivtoit)",
    )
    session.add_all([p1, p2])
    session.commit()

    yield session
    session.close()


def test_trigram_similarity():
    sim_identical = trigram_similarity("royal canin maxi adult", "royal canin maxi adult")
    assert sim_identical == 1.0

    t1 = clean_title_for_matching("Brit Care Adult Large Breed Lamb & Rice")
    t2 = clean_title_for_matching("Brit Care Adult Large Breed Lamb and Rice kuivtoit")
    sim_similar = trigram_similarity(t1, t2)
    assert sim_similar > 0.85

    sim_diff = trigram_similarity("royal canin maxi adult", "acana wild prairie dog")
    assert sim_diff < 0.3


def test_matcher_ean(memory_db):
    matcher = ProductMatcher(memory_db)
    offer = ScrapedProductOffer(
        title="Royal Canin Maxi Adult koeratoit 15kg",
        price=69.90,
        url="https://example.com/p1",
        ean="3182550702447",
        brand="Royal Canin",
        weight_kg=15.0,
    )
    matched, strategy = matcher.match(offer)
    assert matched is not None
    assert strategy == "ean"
    assert matched.slug == "royal-canin-maxi-adult-15kg"


def test_matcher_fuzzy_trigram(memory_db):
    matcher = ProductMatcher(memory_db, trigram_threshold=0.80)
    # Offer without EAN barcode, but matching brand ("Brit Care"), weight (12.0kg), and high title similarity
    offer = ScrapedProductOffer(
        title="Brit Care Adult Large Breed Lamb & Rice koeratoit 12kg",
        price=54.90,
        url="https://example.com/p2",
        ean=None,
        brand="Brit Care",
        weight_kg=12.0,
    )
    matched, strategy = matcher.match(offer)
    assert matched is not None
    assert strategy == "fuzzy_trigram"
    assert matched.slug == "brit-care-adult-large-breed-12kg"


def test_matcher_no_match(memory_db):
    matcher = ProductMatcher(memory_db)
    offer = ScrapedProductOffer(
        title="Farmina N&D Quinoa Dog Lamb 7kg",
        price=45.0,
        url="https://example.com/p3",
        ean="8010276033444",
        brand="Farmina",
        weight_kg=7.0,
    )
    matched, strategy = matcher.match(offer)
    assert matched is None
    assert strategy == "none"
