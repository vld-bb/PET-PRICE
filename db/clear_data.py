"""Script to delete test products, offers, and price history from the database."""

import sys
from pathlib import Path
import argparse

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from db.database import get_db_session, init_db, DATABASE_URL
from db.models import Product, StoreOffer, PriceHistory, Store


def clear_test_data(include_stores: bool = False):
    """Deletes all products, store offers, and price history. Optionally deletes stores."""
    init_db()

    with get_db_session() as session:
        history_count = session.query(PriceHistory).count()
        offers_count = session.query(StoreOffer).count()
        products_count = session.query(Product).count()

        # Delete price history and offers first, then products
        session.query(PriceHistory).delete()
        session.query(StoreOffer).delete()
        session.query(Product).delete()

        stores_deleted = 0
        if include_stores:
            stores_deleted = session.query(Store).count()
            session.query(Store).delete()

        session.commit()

        print(f"Cleared from database ({DATABASE_URL}):")
        print(f" - {products_count} products deleted")
        print(f" - {offers_count} store offers deleted")
        print(f" - {history_count} price history records deleted")
        if include_stores:
            print(f" - {stores_deleted} stores deleted")
        else:
            remaining_stores = session.query(Store).count()
            print(f" - Kept {remaining_stores} retailer stores ready for scraping")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Delete test data from LemmikuHind database")
    parser.add_argument(
        "--include-stores",
        action="store_true",
        help="Also delete the 6 store definitions",
    )
    args = parser.parse_args()
    clear_test_data(include_stores=args.include_stores)
