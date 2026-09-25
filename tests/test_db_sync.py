"""Unit tests for DatabaseSync upserts and price history tracking."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.models import Base, Store, Product, StoreOffer, PriceHistory
from scraper.jsonld_extractor import ScrapedProductOffer
from scraper.db_sync import DatabaseSync


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    sess = Session()
    yield sess
    sess.close()


def test_db_sync_new_product_and_price_history(session):
    sync = DatabaseSync(session)

    offer1 = ScrapedProductOffer(
        title="Royal Canin Medium Adult 15 kg",
        price=72.50,
        url="https://www.petcity.ee/rc-medium-15kg",
        ean="3182550702331",
        brand="Royal Canin",
        weight_kg=15.0,
    )

    res1 = sync.sync_offer(offer1, "petcity.ee")
    assert res1["product_created"] is True
    assert res1["offer_created"] is True
    assert res1["price_changed"] is True

    # Verify database state
    prod = session.query(Product).filter(Product.ean == "3182550702331").first()
    assert prod is not None
    assert prod.brand == "Royal Canin"

    offer_db = session.query(StoreOffer).filter(StoreOffer.product_id == prod.id).first()
    assert offer_db is not None
    assert offer_db.price == 72.50
    assert offer_db.price_per_kg == 4.83

    history = session.query(PriceHistory).filter(PriceHistory.offer_id == offer_db.id).all()
    assert len(history) == 1
    assert history[0].price == 72.50

    # Now simulate a price drop from PetCity
    offer2 = ScrapedProductOffer(
        title="Royal Canin Medium Adult 15 kg",
        price=67.90,  # Price drop!
        url="https://www.petcity.ee/rc-medium-15kg",
        ean="3182550702331",
        brand="Royal Canin",
        weight_kg=15.0,
    )
    res2 = sync.sync_offer(offer2, "petcity.ee")
    assert res2["product_created"] is False
    assert res2["offer_created"] is False
    assert res2["price_changed"] is True

    # Price history should now have 2 records
    history_after = session.query(PriceHistory).filter(PriceHistory.offer_id == offer_db.id).all()
    assert len(history_after) == 2
    assert history_after[-1].price == 67.90
