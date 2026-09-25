-- LemmikuHind SQLite Migration
-- Initial Schema & Extensions

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ean TEXT UNIQUE,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    brand TEXT,
    weight_kg REAL,
    image_url TEXT,
    category TEXT,
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    custom_description TEXT,
    custom_title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    price REAL NOT NULL,
    price_per_kg REAL,
    override_price REAL,
    in_stock INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    last_scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, store_id)
);

CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offer_id INTEGER NOT NULL REFERENCES store_offers(id) ON DELETE CASCADE,
    price REAL NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banner_placements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    width INTEGER,
    height INTEGER,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placement_id INTEGER NOT NULL REFERENCES banner_placements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    alt_text TEXT,
    client_name TEXT,
    weight INTEGER DEFAULT 1,
    impressions_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    start_date DATETIME,
    end_date DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_product ON store_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON store_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_price_history_offer ON price_history(offer_id);
CREATE INDEX IF NOT EXISTS idx_banners_placement ON banners(placement_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
