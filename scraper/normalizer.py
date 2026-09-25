"""Normalization utilities for weight, price per unit, slugs, and categories."""

import re
import unicodedata
from typing import Optional, Tuple


def parse_weight_kg(text: str) -> Optional[float]:
    """Parse package weight from title, description, or packaging string into float kilograms.

    Handles:
    - Standard kg: "12 kg", "12kg", "12.5 kg", "12,5kg" -> 12.5
    - Standard g: "800 g", "800g", "400 g", "85 g" -> 0.8, 0.4, 0.085
    - Multipacks: "2 x 10 kg", "2x10kg", "12x85g", "24 x 400 g", "12 x 70 g" -> count * single_weight
    """
    if not text:
        return None

    clean_text = text.replace(",", ".")

    # 1. Multipack pattern: e.g. "12 x 85 g", "24x400g", "2 x 10 kg"
    multipack_pattern = re.compile(
        r"(\d+)\s*(?:x|\*)\s*(\d+(?:\.\d+)?)\s*(kg|g)\b",
        re.IGNORECASE,
    )
    match_multi = multipack_pattern.search(clean_text)
    if match_multi:
        count = int(match_multi.group(1))
        val = float(match_multi.group(2))
        unit = match_multi.group(3).lower()
        if unit == "kg":
            return round(count * val, 3)
        elif unit == "g":
            return round(count * (val / 1000.0), 3)

    # 2. Single weight kg pattern: e.g. "15 kg", "11.4kg"
    kg_pattern = re.compile(r"(\d+(?:\.\d+)?)\s*kg\b", re.IGNORECASE)
    match_kg = kg_pattern.search(clean_text)
    if match_kg:
        return round(float(match_kg.group(1)), 3)

    # 3. Single weight g pattern: e.g. "800 g", "400g"
    g_pattern = re.compile(r"(\d+(?:\.\d+)?)\s*g\b", re.IGNORECASE)
    match_g = g_pattern.search(clean_text)
    if match_g:
        val = float(match_g.group(1))
        # Filter out unrealistic small grams (e.g. 5g sample) or large numbers (>30000g)
        if 20 <= val <= 30000:
            return round(val / 1000.0, 3)

    return None


def calculate_price_per_kg(price: float, weight_kg: Optional[float]) -> Optional[float]:
    """Calculate unit price (€/kg) rounded to 2 decimal places."""
    if not weight_kg or weight_kg <= 0:
        return None
    return round(float(price) / float(weight_kg), 2)


def slugify(text: str) -> str:
    """Generate a clean URL slug handling Estonian characters (ä, ö, ü, õ)."""
    # Replace Estonian umlauts
    replacements = {
        "ä": "a",
        "ö": "o",
        "ü": "u",
        "õ": "o",
        "Ä": "a",
        "Ö": "o",
        "Ü": "u",
        "Õ": "o",
        "š": "s",
        "ž": "z",
        "Š": "s",
        "Ž": "z",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)

    # Normalize unicode
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text or "product"


def infer_category(title: str, existing_category: Optional[str] = None) -> str:
    """Infer high-level category (Dog/Cat Food, Dry/Wet) from product title or tags."""
    title_lower = title.lower()

    cat_indicators = [
        "kass", "kassi", "kassipoeg", "kassidele", "cat", "feline", "kitten", 
        "sterilised", "hairball", "carny", "vom feinsten", "benek", "felix", 
        "whiskas", "sheba", "gourmet", "inaba", "churu", "tuunikala", "kassiliiv"
    ]
    is_cat = any(w in title_lower for w in cat_indicators)
    is_dog = any(w in title_lower for w in ["koer", "koera", "kutsik", "dog", "canine", "puppy", "large breed", "medium breed", "small breed"])

    if "kassiliiv" in title_lower or ("benek" in title_lower and not is_dog):
        return "Kassitarbed (Kassiliivad)"

    is_wet = any(w in title_lower for w in ["konserv", "pouch", "märgsööt", "märgtoit", "tin", "einekotike", "paté", "pate", "pasteet"])

    pet_type = "Kassitoit" if is_cat and not is_dog else ("Kassitoit" if is_cat else "Koeratoit")
    food_type = "Märgtoit / Konservid" if is_wet else "Kuivtoit"

    return f"{pet_type} ({food_type})"


def clean_title_for_matching(title: str) -> str:
    """Strips package weight tokens, boilerplate words, and symbols to leave brand + core product words."""
    t = title.lower()
    # Strip weights like "12kg", "800 g", "12 x 85g"
    t = re.sub(r"\d+\s*(?:x|\*)\s*\d+(?:\.\d+)?\s*(?:kg|g)\b", " ", t)
    t = re.sub(r"\d+(?:[\.,]\d+)?\s*(?:kg|g)\b", " ", t)

    # Strip generic boilerplate noise words
    noise_words = [
        "kuivtoit",
        "taissoot",
        "taistoit",
        "konserv",
        "koeratoit",
        "kassitoit",
        "koertele",
        "kassidele",
        "koera",
        "kassi",
        "lemmikloomatoit",
    ]
    # Replace Estonian umlauts in title
    replacements = {"ä": "a", "ö": "o", "ü": "u", "õ": "o"}
    for k, v in replacements.items():
        t = t.replace(k, v)

    for nw in noise_words:
        t = re.sub(r"\b" + nw + r"\b", " ", t)

    # Strip punctuation and extra spaces
    t = re.sub(r"[^\w\s]", " ", t)
    return " ".join(t.split())
