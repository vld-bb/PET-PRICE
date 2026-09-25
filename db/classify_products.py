"""Comprehensive Product Taxonomy and Species Classifier for LemmikuHind.

Applies exact classification across all 407 catalog products to ensure:
1. No cat products (Animonda Vom Feinsten, Benek, Carny, Applaws cat, etc.) are labeled as dog.
2. No poultry meat ingredients ('linnulihaga') in cat/dog food are misclassified as birds.
3. Aquarium equipment and fish food (Aquael, Juwel, Tetra, Eheim) are classified as 'kalad'.
4. Small animal products (Versele-Laga Cavia, Millamore aspen bedding, Beeztees branches) are 'vaikeloomad'.
5. Updates both `species`, `category_group`, `category_slug`, AND `category` text column.
"""

import sqlite3
import re
from datetime import datetime, timezone

def classify_product(p_id, title, brand):
    title_raw = title or ""
    brand_raw = brand or ""
    t = f"{title_raw} {brand_raw}".lower().strip()

    # 1. BIRDS (linnud)
    # Exclude: "lindiga" (tape/ribbon in leash), "linnuliha", "linnusüdamega", "jaanalind"
    is_bird = False
    if p_id in [81, 118, 309, 405]:
        is_bird = True
    elif any(k in t for k in ["viirpapagoi", "papagoi", "kanaarilind", "kakaduu", "metslinnu"]):
        is_bird = True
    elif "lindude tisst" in t or "lindude täissööt" in t or "linnutoid" in t or "seemnesegu linnu" in t:
        is_bird = True

    if is_bird:
        if "vitamiin" in t:
            return "linnud", "tervis", "vitamiinid", "Linnud (Vitamiinid & Toidulisandid)"
        return "linnud", "toit_maiused", "seemned", "Linnud (Seemnesegud & Toit)"

    # 2. AQUARIUM / FISH (kalad)
    is_fish = False
    if any(b in brand_raw.lower() for b in ["aquael", "juwel", "sera", "eheim", "tetra"]):
        is_fish = True
    elif any(k in t for k in ["akvaarium", "sisefilter", "vlisfilter", "välisfilter", "veeparandaja", 
                             "veepuhastus", "kalatoit", "helvestoit", "aeraator", "soojendi akvaariumi"]):
        is_fish = True

    if is_fish:
        if any(k in t for k in ["filter", "tidis", "täidis", "pump", "soojendi", "lamp", "led", "uv", "zeomax", "bioceramax", "carbomax", "circulator", "sterilizatorius"]):
            return "kalad", "hugieen_hooldus", "mahked_puhastus", "Akvaarium (Filtrid & Tehnika)"
        return "kalad", "toit_maiused", "helvestoit", "Akvaarium (Kalatoit & Hooldus)"

    # 3. SMALL ANIMALS / RODENTS (vaikeloomad)
    is_rodent = False
    if p_id in [112, 139, 163, 175, 308, 324, 360]:
        is_rodent = True
    elif any(k in t for k in ["nrilis", "närilis", "merisiga", "merisigade", "hamster", "deegu", "tintilja", "tšintšilja"]):
        is_rodent = True
    elif ("klik" in t or "küülik" in t) and not any(k in t for k in ["koer", "kass", "kutsik", "mrg", "märg"]):
        is_rodent = True
    elif "millamore" in t:
        is_rodent = True

    if is_rodent:
        if "allapanu" in t or "saepuru" in t:
            return "vaikeloomad", "hugieen_hooldus", "mahked_puhastus", "Väikeloomad (Allapanu & Hein)"
        if "vitamiin" in t:
            return "vaikeloomad", "tervis", "vitamiinid", "Väikeloomad (Vitamiinid & Toidulisandid)"
        if "oksad" in t or "snack" in t or "suupisted" in t:
            return "vaikeloomad", "toit_maiused", "maiused", "Väikeloomad (Maiused & Närimine)"
        return "vaikeloomad", "toit_maiused", "toit_kuulikud", "Väikeloomad (Täissöödad)"

    # 4. CAT (kass) vs DOG (koer)
    cat_words = [
        "kass", "kassi", "kasside", "kassidele", "kassile", "kassipoeg", "kassipojale", "kitten", 
        "feline", "hairball", "carny", "vom feinsten", "kassiliiv", "liivakast", "kraapimispuu", 
        "kraapimispost", "õngevarras", "ongevarras", "linnasepasta", "kassimuru", "cat malt", 
        "valge tuunikala", "feliway", "felix", "whiskas", "sheba", "gourmet", "ever clean", 
        "sanabelle", "fish4cats", "cat chow", "inaba", "churu", "tuunikala/juust", "tuunikala ja",
        "tuunikalaga ja", "organic veis 100g", "organic kana 100g", "bilanx", "encore kassi",
        "gastro-intestinal cat", "struvite cat", "obesity cat", "diabetic cat", "ultrahypo cat",
        "struvite management cat", "renal cat", "vet life cat", "b-wild cat"
    ]
    
    is_benek_cat = ("benek" in t or "certech" in t) and not any(k in t for k in ["koertele", "koera "])

    is_cat = any(k in t for k in cat_words) or is_benek_cat or bool(re.search(r'\bcat\b', t)) or bool(re.search(r'\bcats\b', t))

    dog_words = [
        "koer", "koera", "koertele", "koerale", "kutsik", "kutsikale", "kutsikatele", "puppy", 
        "canine", "large breed", "medium breed", "small breed", "maxi adult", "mini adult", 
        "medium adult", "giant adult", "junior large", "junior medium", "koerarihm", "koerapesa",
        "hurtta", "flexi", "kong", "barker", "rinti", "animology", "aatu kuivtoit", "leader"
    ]
    is_dog = any(k in t for k in dog_words) or bool(re.search(r'\bdog\b', t)) or bool(re.search(r'\bdogs\b', t))

    # Dual products (e.g. "koertele ja kassidele")
    is_dual = ("koer" in t and "kass" in t) or "koertele ja kassidele" in t or "koera ja kassi" in t or "koera/kassi" in t

    if is_dual:
        species = "koer"
    elif is_cat and not is_dog:
        species = "kass"
    elif is_dog:
        species = "koer"
    elif is_cat:
        species = "kass"
    else:
        species = "koer"

    # Category Group, Slug and Category Label for Cats & Dogs
    cat_group = "toit_maiused"
    cat_slug = "kuivtoit"

    if species == "kass":
        if any(k in t for k in ["kassiliiv", "liiv", "bentoniit", "silikaat", "allapanu", "compact", "natural", "lavendli"]) and not any(k in t for k in ["šampoon", "sampoon"]):
            cat_group = "hugieen_hooldus"
            cat_slug = "kassiliivad"
            category = "Kassitarbed (Kassiliivad)"
        elif any(k in t for k in ["liivakast", "tualett", "kühvel", "kuhvel"]):
            cat_group = "hugieen_hooldus"
            cat_slug = "liivakastid"
            category = "Kassitarbed (Liivakastid & Tualetid)"
        elif any(k in t for k in ["kraapimispuu", "kraapimispost", "kraapimis", "ronimispuu"]):
            cat_group = "manguasjad"
            cat_slug = "kraapimispuud"
            category = "Kassitarbed (Kraapimispuud)"
        elif any(k in t for k in ["mänguasi", "manguasi", "õngevarras", "ongevarras", "laser", "hiir", "pall"]):
            cat_group = "manguasjad"
            cat_slug = "interaktiivsed"
            category = "Kassitarbed (Mänguasjad)"
        elif any(k in t for k in ["šampoon", "sampoon", "palsam", "puhastuskinnas"]):
            cat_group = "hugieen_hooldus"
            cat_slug = "sampoonid"
            category = "Kassitarbed (Šampoonid & Hooldus)"
        elif any(k in t for k in ["hari", "kamm", "kraas", "furminator"]):
            cat_group = "hugieen_hooldus"
            cat_slug = "harjad_kammid"
            category = "Kassitarbed (Harjad & Kammid)"
        elif any(k in t for k in ["lõhnaeemaldaja", "lohnaeemaldaja", "lõhnatu allapanu", "desinfitseerimis", "pihusti", "sprei"]):
            cat_group = "hugieen_hooldus"
            cat_slug = "mahked_puhastus"
            category = "Kassitarbed (Puhastus & Hügieen)"
        elif any(k in t for k in ["pesa", "padi", "ase", "koobas", "madrats"]):
            cat_group = "pesad_transport"
            cat_slug = "pesad"
            category = "Kassitarbed (Pesad & Padjad)"
        elif any(k in t for k in ["transport", "kandekott", "transpordipuur", "reisikott"]):
            cat_group = "pesad_transport"
            cat_slug = "transport"
            category = "Kassitarbed (Transport & Puurid)"
        elif any(k in t for k in ["feliway", "rahusti", "feromoon", "stress"]):
            cat_group = "tervis"
            cat_slug = "rahustid"
            category = "Kassitarbed (Rahustid & Feromoonid)"
        elif any(k in t for k in ["vitamiin", "toidulisand", "pasta", "malt", "cat malt", "õli", "siirup", "tilgad"]):
            cat_group = "tervis"
            cat_slug = "vitamiinid"
            category = "Kassitarbed (Vitamiinid & Toidulisandid)"
        elif any(k in t for k in ["parasiit", "kirbu", "puugi", "tõrje"]):
            cat_group = "tervis"
            cat_slug = "parasiiditorje"
            category = "Kassitarbed (Parasiiditõrje)"
        elif any(k in t for k in ["konserv", "pasteet", "märgtoit", "margtoit", "pouch", "einekotike", "broth", 
                                "tarrendis", "kastmes", "jellied", "vom feinsten", "carny", "tuunikala", "tuna"]):
            cat_group = "toit_maiused"
            cat_slug = "margtoit"
            category = "Kassitoit (Märgtoit / Konservid)"
        elif any(k in t for k in ["maius", "delights", "padjakesed", "sticks", "maiusepala", "maiused"]):
            cat_group = "toit_maiused"
            cat_slug = "maiused"
            category = "Kassitoit (Maiused)"
        elif any(k in t for k in ["veterinaar", "vet life", "urinary", "renal", "hepatic", "gastro", "diabetic", "struvite", "obesity", "ultrahypo"]):
            cat_group = "toit_maiused"
            cat_slug = "veterinaartoit"
            category = "Kassitoit (Veterinaartoit)"
        else:
            cat_group = "toit_maiused"
            cat_slug = "kuivtoit"
            category = "Kassitoit (Kuivtoit)"
    else:
        # Dog categories
        if any(k in t for k in ["pesa", "padi", "ase", "madrats", "tekike"]):
            cat_group = "pesad_transport"
            cat_slug = "pesad"
            category = "Koeratarbed (Pesad & Padjad)"
        elif any(k in t for k in ["transport", "kandekott", "puur", "reisipuur", "autovöö", "autovoo", "turvavöö"]):
            cat_group = "pesad_transport"
            cat_slug = "transport"
            category = "Koeratarbed (Transport & Puurid)"
        elif any(k in t for k in ["mänguasi", "manguasi", "pall", "köis", "kois", "laser", "plüüs", "frisbee", "kong"]):
            cat_group = "manguasjad"
            cat_slug = "pallid_narimine"
            category = "Koeratarbed (Mänguasjad)"
        elif any(k in t for k in ["traks", "traksid", "harness"]):
            cat_group = "jalutamine_rihmad"
            cat_slug = "traksid"
            category = "Koeratarbed (Traksid & Rihmad)"
        elif any(k in t for k in ["kaelarihm", "collar", "kaelarihmad", "e-collar"]):
            cat_group = "jalutamine_rihmad"
            cat_slug = "kaelarihmad"
            category = "Koeratarbed (Kaelarihmad)"
        elif any(k in t for k in ["jalutusrihm", "rihm", "flexi", "leash"]):
            cat_group = "jalutamine_rihmad"
            cat_slug = "jalutusrihmad"
            category = "Koeratarbed (Jalutusrihmad)"
        elif any(k in t for k in ["riie", "riided", "vest", "jope", "kombinesoon", "mantel"]):
            cat_group = "jalutamine_rihmad"
            cat_slug = "riided"
            category = "Koeratarbed (Riided & Mantlid)"
        elif any(k in t for k in ["šampoon", "sampoon", "palsam", "pesugeel", "pesu"]):
            cat_group = "hugieen_hooldus"
            cat_slug = "sampoonid"
            category = "Koeratarbed (Šampoonid & Hooldus)"
        elif any(k in t for k in ["hari", "kamm", "trimmer", "kraas", "furminator"]):
            cat_group = "hugieen_hooldus"
            cat_slug = "harjad_kammid"
            category = "Koeratarbed (Harjad & Kammid)"
        elif any(k in t for k in ["küünelõikur", "kuuneloikur", "käpapalsam", "kapapalsam"]):
            cat_group = "hugieen_hooldus"
            cat_slug = "kuuned_kapad"
            category = "Koeratarbed (Käpad & Küüned)"
        elif any(k in t for k in ["lõhnaeemaldaja", "lohnaeemaldaja", "mähkmed", "mahkmed", "pissilapp", "training pads", "peletusvahend"]):
            cat_group = "hugieen_hooldus"
            cat_slug = "mahked_puhastus"
            category = "Koeratarbed (Puhastus & Hügieen)"
        elif any(k in t for k in ["adaptil", "rahusti", "feromoon", "stress"]):
            cat_group = "tervis"
            cat_slug = "rahustid"
            category = "Koeratarbed (Rahustid)"
        elif any(k in t for k in ["vitamiin", "toidulisand", "pasta", "apto-flex", "siirup", "õli", "oli", "hambahooldus", "tilgad"]):
            cat_group = "tervis"
            cat_slug = "vitamiinid"
            category = "Koeratarbed (Vitamiinid & Toidulisandid)"
        elif any(k in t for k in ["parasiit", "kirbu", "puugi", "ripats kaitseks"]):
            cat_group = "tervis"
            cat_slug = "parasiiditorje"
            category = "Koeratarbed (Parasiiditõrje)"
        elif any(k in t for k in ["konserv", "pasteet", "märgtoit", "margtoit", "pouch", "einekotike"]):
            cat_group = "toit_maiused"
            cat_slug = "margtoit"
            category = "Koeratoit (Märgtoit / Konservid)"
        elif any(k in t for k in ["maius", "delights", "närimiskont", "narimiskont", "maiusepala", "sticks", "bone"]):
            cat_group = "toit_maiused"
            cat_slug = "maiused"
            category = "Koeratoit (Maiused)"
        elif any(k in t for k in ["veterinaar", "vet life", "urinary", "renal", "hepatic", "gastro", "diabetic", "hypoallergenic"]) and any(k in t for k in ["dieet", "talumatus"]):
            cat_group = "toit_maiused"
            cat_slug = "veterinaartoit"
            category = "Koeratoit (Veterinaartoit)"
        elif any(k in t for k in ["kauss", "söötur", "sootur", "jooginõu", "jooginou"]):
            cat_group = "toit_maiused"
            cat_slug = "sooginoud"
            category = "Koeratarbed (Kausid & Sööturid)"
        else:
            cat_group = "toit_maiused"
            cat_slug = "kuivtoit"
            category = "Koeratoit (Kuivtoit)"

    return species, cat_group, cat_slug, category

def run_classification():
    conn = sqlite3.connect('petprice.db')
    c = conn.cursor()
    c.execute("SELECT id, title, brand FROM products ORDER BY id ASC")
    products = c.fetchall()

    updated = 0
    breakdown = {}
    for p_id, title, brand in products:
        species, cat_group, cat_slug, category = classify_product(p_id, title, brand)
        c.execute("""
            UPDATE products 
            SET species = ?, category_group = ?, category_slug = ?, category = ?
            WHERE id = ?
        """, (species, cat_group, cat_slug, category, p_id))
        updated += 1
        breakdown[species] = breakdown.get(species, 0) + 1

    conn.commit()
    conn.close()
    print(f"Successfully updated classification for {updated} products.")
    print("Species Breakdown:", breakdown)

if __name__ == "__main__":
    run_classification()
