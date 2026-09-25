"""Unit tests for weight parsing, unit price calculation, and normalization."""

import pytest
from scraper.normalizer import (
    parse_weight_kg,
    calculate_price_per_kg,
    slugify,
    infer_category,
    clean_title_for_matching,
)


def test_parse_weight_kg_standard_kg():
    assert parse_weight_kg("Royal Canin Maxi Adult 15 kg") == 15.0
    assert parse_weight_kg("Acana Grass-Fed Lamb 11.4kg") == 11.4
    assert parse_weight_kg("Brit Care Puppy 12,5 kg") == 12.5
    assert parse_weight_kg("Edgard & Cooper 2.5kg") == 2.5


def test_parse_weight_kg_standard_grams():
    assert parse_weight_kg("Royal Canin Fit 32 400 g") == 0.4
    assert parse_weight_kg("Taste of the Wild 800g") == 0.8
    assert parse_weight_kg("Applaws Cat Tin 70 g") == 0.07


def test_parse_weight_kg_multipacks():
    # 12 x 85g = 1.02 kg
    assert parse_weight_kg("Carnilove Cat Pouches 12 x 85 g") == 1.02
    assert parse_weight_kg("Applaws Selection 12x70g") == 0.84
    # 2 x 10kg = 20.0 kg
    assert parse_weight_kg("Josera Economy 2 x 10 kg") == 20.0


def test_calculate_price_per_kg():
    assert calculate_price_per_kg(74.90, 15.0) == 4.99
    assert calculate_price_per_kg(14.90, 1.02) == 14.61
    assert calculate_price_per_kg(10.0, 0) is None
    assert calculate_price_per_kg(10.0, None) is None


def test_slugify():
    assert slugify("Royal Canin Maxi Adult 15 kg") == "royal-canin-maxi-adult-15-kg"
    assert slugify("Edgard & Cooper täissööt lõhega") == "edgard-cooper-taissoot-lohega"


def test_infer_category():
    assert "Koeratoit" in infer_category("Royal Canin Maxi Adult kuivtoit koertele")
    assert "Kuivtoit" in infer_category("Royal Canin Maxi Adult kuivtoit koertele")
    assert "Kassitoit" in infer_category("Applaws kassitoit kanaga")
    assert "Märgtoit" in infer_category("Carnilove konserv kassidele")


def test_clean_title_for_matching():
    cleaned1 = clean_title_for_matching("Royal Canin Maxi Adult 15 kg")
    cleaned2 = clean_title_for_matching("Royal Canin Maxi Adult 15kg kuivtoit")
    assert "royal canin maxi adult" in cleaned1
    assert "royal canin maxi adult" in cleaned2
