-- LemmikuHind Migration 002: Banner Engine & Product Overrides

-- 1. Product Overrides
ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN is_featured INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN custom_description TEXT;
ALTER TABLE products ADD COLUMN custom_title TEXT;

-- 2. Store Offer Overrides
ALTER TABLE store_offers ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE store_offers ADD COLUMN override_price REAL;

-- 3. Banner Placements
CREATE TABLE IF NOT EXISTS banner_placements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    width INTEGER,
    height INTEGER,
    is_active INTEGER DEFAULT 1
);

-- 4. Banners
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

CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON store_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_placement ON banners(placement_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
