"""Unit tests for Banner Management Engine and Product/Offer overrides."""

import pytest
from datetime import datetime, timezone
from db.models import BannerPlacement, Banner, Product, StoreOffer


def test_product_overrides_properties():
    p = Product(
        title="Royal Canin Mini Adult 8kg",
        slug="royal-canin-mini-adult-8kg",
        brand="Royal Canin",
        custom_title="Royal Canin Mini Adult Koeratoit 8kg (SOODUSHIND)",
        custom_description="Eriti maitsev ja tervislik kuivtoit väikest tõugu koertele.",
        is_active=True,
        is_featured=True,
    )

    d = p.to_dict()
    assert d["display_title"] == "Royal Canin Mini Adult Koeratoit 8kg (SOODUSHIND)"
    assert d["custom_description"] == "Eriti maitsev ja tervislik kuivtoit väikest tõugu koertele."
    assert d["is_active"] is True
    assert d["is_featured"] is True

    # Test fallback when custom_title is None
    p2 = Product(
        title="Acana Grasslands 11.4kg",
        slug="acana-grasslands-11-4kg",
        custom_title=None,
    )
    assert p2.to_dict()["display_title"] == "Acana Grasslands 11.4kg"


def test_store_offer_override_price():
    offer = StoreOffer(
        product_id=1,
        store_id=1,
        url="https://www.petcity.ee/tooted/acana-11kg",
        price=74.99,
        override_price=69.99,
        is_active=True,
    )

    assert offer.effective_price == 69.99
    d = offer.to_dict()
    assert d["price"] == 74.99
    assert d["override_price"] == 69.99
    assert d["effective_price"] == 69.99

    # Without override price
    offer2 = StoreOffer(
        product_id=1,
        store_id=2,
        url="https://www.kika.ee/acana",
        price=76.50,
        override_price=None,
    )
    assert offer2.effective_price == 76.50
    assert offer2.to_dict()["effective_price"] == 76.50


def test_banner_placement_and_banner_models():
    placement = BannerPlacement(
        identifier="home_hero",
        name="Avalehe herobänner",
        description="Avalehe peamine promobänner",
        width=1200,
        height=250,
        is_active=True,
    )
    assert placement.identifier == "home_hero"
    assert placement.is_active is True

    banner = Banner(
        placement_id=1,
        title="PetCity Kampaania",
        image_url="https://images.unsplash.com/petcity.jpg",
        target_url="https://www.petcity.ee",
        weight=5,
        impressions_count=1000,
        clicks_count=45,
        is_active=True,
    )
    placement.banners = [banner]

    assert banner.ctr_percent == 4.5
    d = banner.to_dict()
    assert d["title"] == "PetCity Kampaania"
    assert d["weight"] == 5
    assert d["impressions_count"] == 1000
    assert d["clicks_count"] == 45
    assert d["ctr_percent"] == 4.5
    assert d["is_active"] is True


def test_banner_weighted_random_selection():
    import random

    # 3 banners with weights 5, 3, 2
    candidates = [
        {"id": 1, "weight": 5},
        {"id": 2, "weight": 3},
        {"id": 3, "weight": 2},
    ]

    total_weight = sum(c["weight"] for c in candidates)
    counts = {1: 0, 2: 0, 3: 0}

    # Simulate 1,000 draws
    rng = random.Random(42)
    for _ in range(1000):
        rand = rng.random() * total_weight
        selected = candidates[0]
        for c in candidates:
            if rand < c["weight"]:
                selected = c
                break
            rand -= c["weight"]
        counts[selected["id"]] += 1

    # Banner 1 (weight 5) should have approximately 50% (most frequent)
    # Banner 2 (weight 3) ~30%
    # Banner 3 (weight 2) ~20%
    assert counts[1] > counts[2] > counts[3]
    assert 450 < counts[1] < 550
    assert 250 < counts[2] < 350
    assert 150 < counts[3] < 250
