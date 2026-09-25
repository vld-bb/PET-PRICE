"""Database seeder for LemmikuHind.

Populates the 6 Estonian stores and a comprehensive pet food catalog with
realistic multi-store price offers and historical price trends.
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from datetime import datetime, timedelta, timezone
import random
from db.database import init_db, get_db_session
from db.models import Store, Product, StoreOffer, PriceHistory, BannerPlacement, Banner

STORES_DATA = [
    {
        "name": "PetCity",
        "domain": "petcity.ee",
        "logo_url": "/stores/petcity.svg",
    },
    {
        "name": "Kika",
        "domain": "kika.ee",
        "logo_url": "/stores/kika.svg",
    },
    {
        "name": "Zoomaailm",
        "domain": "zoomaailm.ee",
        "logo_url": "/stores/zoomaailm.svg",
    },
    {
        "name": "Fera",
        "domain": "fera.ee",
        "logo_url": "/stores/fera.svg",
    },
    {
        "name": "Koerland",
        "domain": "koerland.ee",
        "logo_url": "/stores/koerland.svg",
    },
    {
        "name": "Zooplus",
        "domain": "zooplus.ee",
        "logo_url": "/stores/zooplus.svg",
    },
]

PRODUCTS_DATA = [
    {
        "ean": "3182550702447",
        "slug": "royal-canin-maxi-adult-15kg",
        "title": "Royal Canin Maxi Adult kuivtoit suurtele koertele 15 kg",
        "brand": "Royal Canin",
        "weight_kg": 15.0,
        "image_url": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Suur tõug)",
        "base_price": 74.90,
    },
    {
        "ean": "3182550702331",
        "slug": "royal-canin-medium-adult-15kg",
        "title": "Royal Canin Medium Adult kuivtoit keskmist tõugu koertele 15 kg",
        "brand": "Royal Canin",
        "weight_kg": 15.0,
        "image_url": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Keskmine tõug)",
        "base_price": 72.50,
    },
    {
        "ean": "0649925201202",
        "slug": "acana-heritage-adult-large-breed-17kg",
        "title": "Acana Heritage Adult Large Breed teraviljavaba koeratoit 17 kg",
        "brand": "Acana",
        "weight_kg": 17.0,
        "image_url": "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Suur tõug)",
        "base_price": 89.90,
    },
    {
        "ean": "0649925101144",
        "slug": "acana-singles-grass-fed-lamb-11-4kg",
        "title": "Acana Singles Grass-Fed Lamb hüpoallergeenne kuivtoit lambaga 11.4 kg",
        "brand": "Acana",
        "weight_kg": 11.4,
        "image_url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Tundlikule koerale)",
        "base_price": 84.50,
    },
    {
        "ean": "064992201111",
        "slug": "orijen-original-dog-11-4kg",
        "title": "Orijen Original Dog bioloogiliselt sobiv täistoit 11.4 kg",
        "brand": "Orijen",
        "weight_kg": 11.4,
        "image_url": "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Teraviljavaba)",
        "base_price": 96.00,
    },
    {
        "ean": "052742025810",
        "slug": "hills-science-plan-canine-adult-large-breed-chicken-14kg",
        "title": "Hill's Science Plan Canine Adult Large Breed kanaga 14 kg",
        "brand": "Hill's",
        "weight_kg": 14.0,
        "image_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Suur tõug)",
        "base_price": 68.90,
    },
    {
        "ean": "8595602517480",
        "slug": "brit-care-adult-large-breed-lamb-rice-12kg",
        "title": "Brit Care Adult Large Breed Lamb & Rice kuivtoit lambaga 12 kg",
        "brand": "Brit Care",
        "weight_kg": 12.0,
        "image_url": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Hüpoallergeenne)",
        "base_price": 54.90,
    },
    {
        "ean": "8595602517459",
        "slug": "brit-care-puppy-lamb-rice-12kg",
        "title": "Brit Care Puppy Lamb & Rice kutsikatoit lambaliha ja riisiga 12 kg",
        "brand": "Brit Care",
        "weight_kg": 12.0,
        "image_url": "https://images.unsplash.com/photo-1591856372175-103328e3b1c6?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Kutsikale)",
        "base_price": 57.50,
    },
    {
        "ean": "7613035118744",
        "slug": "purina-pro-plan-medium-adult-optibalance-chicken-14kg",
        "title": "Purina Pro Plan Medium Adult Everyday Nutrition kanaga 14 kg",
        "brand": "Purina Pro Plan",
        "weight_kg": 14.0,
        "image_url": "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Keskmine tõug)",
        "base_price": 62.00,
    },
    {
        "ean": "4032254714652",
        "slug": "josera-optiness-large-breed-15kg",
        "title": "Josera Optiness vähendatud valgusisaldusega kuivtoit koertele 15 kg",
        "brand": "Josera",
        "weight_kg": 15.0,
        "image_url": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Täiskasvanud)",
        "base_price": 51.90,
    },
    {
        "ean": "5425039481234",
        "slug": "edgard-cooper-fresh-free-run-chicken-salmon-7kg",
        "title": "Edgard & Cooper täissööt värske vabapidamise kana ja lõhega 7 kg",
        "brand": "Edgard & Cooper",
        "weight_kg": 7.0,
        "image_url": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Teraviljavaba)",
        "base_price": 64.90,
    },
    {
        "ean": "8595602528776",
        "slug": "carnilove-salmon-turkey-large-breed-12kg",
        "title": "Carnilove Salmon & Turkey for Large Breed Adult teraviljavaba 12 kg",
        "brand": "Carnilove",
        "weight_kg": 12.0,
        "image_url": "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600&q=80",
        "category": "Koeratoit (Kuivtoit - Suur tõug)",
        "base_price": 59.90,
    },
    # Cat food products
    {
        "ean": "3182550702157",
        "slug": "royal-canin-fit-32-adult-cat-10kg",
        "title": "Royal Canin Fit 32 kuivtoit täiskasvanud kassidele 10 kg",
        "brand": "Royal Canin",
        "weight_kg": 10.0,
        "image_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80",
        "category": "Kassitoit (Kuivtoit - Täiskasvanud)",
        "base_price": 69.90,
    },
    {
        "ean": "3182550702225",
        "slug": "royal-canin-sterilised-37-10kg",
        "title": "Royal Canin Sterilised 37 kuivtoit steriliseeritud kassidele 10 kg",
        "brand": "Royal Canin",
        "weight_kg": 10.0,
        "image_url": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80",
        "category": "Kassitoit (Kuivtoit - Steriliseeritud)",
        "base_price": 72.00,
    },
    {
        "ean": "064992630546",
        "slug": "acana-homestead-harvest-cat-4-5kg",
        "title": "Acana Homestead Harvest täistoit kassidele linnulihaga 4.5 kg",
        "brand": "Acana",
        "weight_kg": 4.5,
        "image_url": "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&q=80",
        "category": "Kassitoit (Kuivtoit - Teraviljavaba)",
        "base_price": 42.50,
    },
    {
        "ean": "064992610548",
        "slug": "orijen-cat-kitten-5-4kg",
        "title": "Orijen Cat & Kitten teraviljavaba kassitoit 5.4 kg",
        "brand": "Orijen",
        "weight_kg": 5.4,
        "image_url": "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600&q=80",
        "category": "Kassitoit (Kuivtoit - Kõik eluetapid)",
        "base_price": 58.00,
    },
    {
        "ean": "052742023915",
        "slug": "hills-science-plan-feline-adult-sterilised-chicken-10kg",
        "title": "Hill's Science Plan Feline Adult Sterilised kanaga 10 kg",
        "brand": "Hill's",
        "weight_kg": 10.0,
        "image_url": "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&q=80",
        "category": "Kassitoit (Kuivtoit - Steriliseeritud)",
        "base_price": 66.50,
    },
    {
        "ean": "8595602528158",
        "slug": "brit-care-cat-grain-free-sterilized-weight-control-7kg",
        "title": "Brit Care Cat Grain-Free Sterilized Weight Control 7 kg",
        "brand": "Brit Care",
        "weight_kg": 7.0,
        "image_url": "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600&q=80",
        "category": "Kassitoit (Kuivtoit - Steriliseeritud)",
        "base_price": 44.90,
    },
    {
        "ean": "5060122491112",
        "slug": "applaws-cat-chicken-salmon-dry-7-5kg",
        "title": "Applaws teraviljavaba täissööt kanaliha ja lõhega kassidele 7.5 kg",
        "brand": "Applaws",
        "weight_kg": 7.5,
        "image_url": "https://images.unsplash.com/photo-1513360010508-32c8bf082103?w=600&q=80",
        "category": "Kassitoit (Kuivtoit - Teraviljavaba)",
        "base_price": 48.90,
    },
    {
        "ean": "5060122492235",
        "slug": "applaws-cat-selection-tin-multipack-12x70g",
        "title": "Applaws märgtoidu multipakk kassidele valikus 12 x 70 g (0.84 kg)",
        "brand": "Applaws",
        "weight_kg": 0.84,
        "image_url": "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&q=80",
        "category": "Kassitoit (Märgtoit / Konservid)",
        "base_price": 16.90,
    },
    {
        "ean": "8595602534562",
        "slug": "carnilove-cat-pouches-rich-in-quail-multipack-12x85g",
        "title": "Carnilove märgsööt kassidele vutiga metsikutes maitsetes 12 x 85 g (1.02 kg)",
        "brand": "Carnilove",
        "weight_kg": 1.02,
        "image_url": "https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600&q=80",
        "category": "Kassitoit (Märgtoit / Konservid)",
        "base_price": 14.90,
    },
    {
        "ean": "4032254719999",
        "slug": "josera-culinesse-adult-cat-salmon-10kg",
        "title": "Josera Culinesse kõrge toiteväärtusega kuivtoit lõhega kassidele 10 kg",
        "brand": "Josera",
        "weight_kg": 10.0,
        "image_url": "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=600&q=80",
        "category": "Kassitoit (Kuivtoit - Täiskasvanud)",
        "base_price": 46.50,
    },
]


def seed_database():
    """Initializes tables and seeds authentic Estonian stores, products, offers, and price trends."""
    init_db()

    with get_db_session() as session:
        # 1. Upsert Stores
        stores_map = {}
        for s_data in STORES_DATA:
            existing = session.query(Store).filter(Store.domain == s_data["domain"]).first()
            if not existing:
                store = Store(
                    name=s_data["name"],
                    domain=s_data["domain"],
                    logo_url=s_data["logo_url"],
                )
                session.add(store)
                session.flush()
                stores_map[s_data["domain"]] = store
            else:
                stores_map[s_data["domain"]] = existing

        print(f"Loaded {len(stores_map)} stores.")

        # 2. Seed Products and Multi-store Offers
        store_list = list(stores_map.values())
        now = datetime.now()

        for p_data in PRODUCTS_DATA:
            product = session.query(Product).filter(Product.ean == p_data["ean"]).first()
            if not product:
                product = Product(
                    ean=p_data["ean"],
                    slug=p_data["slug"],
                    title=p_data["title"],
                    brand=p_data["brand"],
                    weight_kg=p_data["weight_kg"],
                    image_url=p_data["image_url"],
                    category=p_data["category"],
                )
                session.add(product)
                session.flush()

            # Create offers in 3 to 6 stores for each product
            # Choose a deterministic random subset of stores
            rng = random.Random(p_data["ean"])
            chosen_stores = rng.sample(store_list, k=rng.randint(3, len(store_list)))

            base_price = p_data["base_price"]

            for store in chosen_stores:
                # Price varies from -15% to +10% across stores
                variation = rng.uniform(-0.15, 0.10)
                current_price = round(base_price * (1.0 + variation), 2)
                price_per_kg = round(current_price / p_data["weight_kg"], 2) if p_data["weight_kg"] else None
                in_stock = rng.random() > 0.10  # 90% stock rate

                offer = session.query(StoreOffer).filter(
                    StoreOffer.product_id == product.id,
                    StoreOffer.store_id == store.id,
                ).first()

                store_product_url = f"https://www.{store.domain}/tooted/{p_data['slug']}"

                if not offer:
                    offer = StoreOffer(
                        product_id=product.id,
                        store_id=store.id,
                        url=store_product_url,
                        price=current_price,
                        price_per_kg=price_per_kg,
                        in_stock=in_stock,
                    )
                    session.add(offer)
                    session.flush()
                else:
                    offer.price = current_price
                    offer.price_per_kg = price_per_kg
                    offer.in_stock = in_stock
                    offer.url = store_product_url

                # Seed realistic historical price trajectory (e.g., 4 data points over 45 days)
                existing_history = session.query(PriceHistory).filter(PriceHistory.offer_id == offer.id).count()
                if existing_history == 0:
                    history_points = [
                        (now - timedelta(days=45), round(current_price * rng.uniform(0.96, 1.08), 2)),
                        (now - timedelta(days=30), round(current_price * rng.uniform(0.98, 1.05), 2)),
                        (now - timedelta(days=15), round(current_price * rng.uniform(0.95, 1.04), 2)),
                        (now - timedelta(days=1), current_price),
                    ]
                    for rec_time, hist_price in history_points:
                        ph = PriceHistory(
                            offer_id=offer.id,
                            price=hist_price,
                            recorded_at=rec_time,
                        )
                        session.add(ph)

        session.commit()
        print("Database successfully seeded with Estonian pet food products, offers, and price trends!")

    # Seed banner placements and promotional banners
    seed_banners(session)


BANNER_PLACEMENTS_DATA = [
    {
        "identifier": "header_top",
        "name": "Ülariba teavitusbänner",
        "description": "Lehe ülaosas kuvatav kitsas teavitus- või sooduskampaania bänner.",
        "width": 1200,
        "height": 60,
    },
    {
        "identifier": "home_hero",
        "name": "Avalehe herobänner",
        "description": "Avalehe peamine suur promobänner päise all enne otsinguriba.",
        "width": 1200,
        "height": 250,
    },
    {
        "identifier": "catalog_leaderboard",
        "name": "Kataloogi vahebänner",
        "description": "Tootekataloogis filtrite ja tootenimekirja vahel kuvatav bänner.",
        "width": 970,
        "height": 150,
    },
    {
        "identifier": "product_sidebar",
        "name": "Tootelehe külgriba bänner",
        "description": "Toote detailvaates hindade võrdlustabeli kõrval asuv promobänner.",
        "width": 300,
        "height": 250,
    },
]

BANNERS_DATA = [
    {
        "placement_identifier": "home_hero",
        "title": "PetCity Kevadpakkumised - Kõik koeratoidud kuni -25%",
        "image_url": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200&h=300&fit=crop&q=80",
        "target_url": "https://www.petcity.ee",
        "alt_text": "PetCity lemmikloomatoidu sooduspakkumised",
        "client_name": "PetCity Kampaania",
        "weight": 5,
        "impressions_count": 1420,
        "clicks_count": 86,
    },
    {
        "placement_identifier": "home_hero",
        "title": "Royal Canin Tõutoidud - Telli mugavalt lemmikule koju",
        "image_url": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=1200&h=300&fit=crop&q=80",
        "target_url": "https://www.petcity.ee",
        "alt_text": "Royal Canin tõutoidud koertele ja kassidele",
        "client_name": "Royal Canin Promo",
        "weight": 3,
        "impressions_count": 950,
        "clicks_count": 48,
    },
    {
        "placement_identifier": "header_top",
        "title": "Kika Kliendipäevad: Tasuta tarne pakiautomaati ostudelt alates 29€!",
        "image_url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1200&h=80&fit=crop&q=80",
        "target_url": "https://www.kika.ee",
        "alt_text": "Kika tasuta tarne kampaania",
        "client_name": "Kika Kliendipäevad",
        "weight": 4,
        "impressions_count": 2100,
        "clicks_count": 115,
    },
    {
        "placement_identifier": "catalog_leaderboard",
        "title": "Zoomaailm: Parim valik kvaliteetseid kassikonserve ja maiuseid",
        "image_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=970&h=180&fit=crop&q=80",
        "target_url": "https://zoomaailm.ee",
        "alt_text": "Zoomaailm kassitoidu eripakkumised",
        "client_name": "Zoomaailm Erihinnad",
        "weight": 3,
        "impressions_count": 780,
        "clicks_count": 39,
    },
    {
        "placement_identifier": "product_sidebar",
        "title": "Acana Biologically Appropriate - Looduslik ja teraviljavaba toit",
        "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&q=80",
        "target_url": "https://fera.ee",
        "alt_text": "Acana premium lemmikloomatoit",
        "client_name": "Acana Eesti",
        "weight": 5,
        "impressions_count": 640,
        "clicks_count": 52,
    },
]


def seed_banners(session=None):
    """Seeds default banner placements and promotional campaign banners."""
    close_session_at_end = False
    if session is None:
        init_db()
        from db.database import SessionLocal
        session = SessionLocal()
        close_session_at_end = True

    try:
        placements_map = {}
        for p_data in BANNER_PLACEMENTS_DATA:
            placement = session.query(BannerPlacement).filter(
                BannerPlacement.identifier == p_data["identifier"]
            ).first()

            if not placement:
                placement = BannerPlacement(
                    identifier=p_data["identifier"],
                    name=p_data["name"],
                    description=p_data["description"],
                    width=p_data["width"],
                    height=p_data["height"],
                    is_active=True,
                )
                session.add(placement)
                session.flush()
            placements_map[p_data["identifier"]] = placement.id

        for b_data in BANNERS_DATA:
            placement_id = placements_map.get(b_data["placement_identifier"])
            if not placement_id:
                continue

            banner = session.query(Banner).filter(
                Banner.title == b_data["title"]
            ).first()

            if not banner:
                banner = Banner(
                    placement_id=placement_id,
                    title=b_data["title"],
                    image_url=b_data["image_url"],
                    target_url=b_data["target_url"],
                    alt_text=b_data["alt_text"],
                    client_name=b_data["client_name"],
                    weight=b_data["weight"],
                    impressions_count=b_data["impressions_count"],
                    clicks_count=b_data["clicks_count"],
                    is_active=True,
                )
                session.add(banner)
            else:
                banner.is_active = True

        session.commit()
        print("Banner placements and demo promotional campaigns successfully seeded!")
    finally:
        if close_session_at_end:
            session.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--banners-only", action="store_true", help="Seed only banner placements and campaigns")
    args = parser.parse_args()

    if args.banners_only:
        seed_banners()
    else:
        seed_database()
