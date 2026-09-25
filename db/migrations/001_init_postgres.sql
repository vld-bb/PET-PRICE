-- LemmikuHind PostgreSQL Migration
-- Initial Schema & Extensions

CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    ean VARCHAR(32) UNIQUE,            -- Primary key for matching across stores
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    weight_kg NUMERIC(6, 3),
    image_url TEXT,
    category VARCHAR(100),            -- Dog Food, Cat Food, etc.
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    custom_description TEXT,
    custom_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_offers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    price_per_kg NUMERIC(10, 2),
    override_price NUMERIC(10, 2),
    in_stock BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    last_scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, store_id)
);

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES store_offers(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banner_placements (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'home_hero', 'catalog_top', 'product_sidebar', 'comparison_sticky_bottom'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    width INT,
    height INT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    placement_id INTEGER REFERENCES banner_placements(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    image_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    client_name VARCHAR(100),            -- e.g. 'PetCity Campaign', 'Royal Canin Promo'
    weight INT DEFAULT 1,                -- Priority/Weight for rotation (higher = more frequent)
    impressions_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_product ON store_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_active ON store_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_price_history_offer ON price_history(offer_id);
CREATE INDEX IF NOT EXISTS idx_banners_placement ON banners(placement_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
