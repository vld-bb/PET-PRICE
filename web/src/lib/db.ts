import fs from "fs";
import path from "path";
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import {
  Product,
  Store,
  StoreOffer,
  PriceHistoryPoint,
  ProductQueryParams,
  BannerPlacement,
  Banner,
  AdminProductQueryParams,
  AdminStats,
} from "./types";

let cachedDb: SqlJsDatabase | null = null;
let lastDbMtime: number = 0;

export function getSqliteDbPath(): string {
  const candidates = [
    path.resolve(process.cwd(), "petprice.db"),
    path.resolve(process.cwd(), "../petprice.db"),
    path.resolve(__dirname, "../../../petprice.db"),
    path.resolve(__dirname, "../../../../petprice.db"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ c)) {
      return c;
    }
  }
  return path.resolve(process.cwd(), "petprice.db");
}

export async function getSqliteDb(): Promise<SqlJsDatabase> {
  const dbPath = getSqliteDbPath();
  const exists = fs.existsSync(/*turbopackIgnore: true*/ dbPath);
  const stats = exists ? fs.statSync(/*turbopackIgnore: true*/ dbPath) : null;
  const currentMtime = stats ? stats.mtimeMs : 0;

  if (cachedDb && currentMtime === lastDbMtime) {
    return cachedDb;
  }

  const wasmPath = path.resolve(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm");
  const wasmBinary = fs.readFileSync(/*turbopackIgnore: true*/ wasmPath);
  const wasmArrayBuffer = wasmBinary.buffer.slice(
    wasmBinary.byteOffset,
    wasmBinary.byteOffset + wasmBinary.byteLength
  ) as ArrayBuffer;
  const SQL = await initSqlJs({ wasmBinary: wasmArrayBuffer });

  if (!exists) {
    throw new Error(`Database file not found at ${dbPath}. Please run 'python db/seed.py' first.`);
  }

  const filebuffer = fs.readFileSync(/*turbopackIgnore: true*/ dbPath);
  cachedDb = new SQL.Database(filebuffer);
  lastDbMtime = currentMtime;
  return cachedDb;
}

export function saveSqliteDb(db: SqlJsDatabase): void {
  const dbPath = getSqliteDbPath();
  const binary = db.export();
  fs.writeFileSync(/*turbopackIgnore: true*/ dbPath, Buffer.from(binary));
  lastDbMtime = fs.statSync(/*turbopackIgnore: true*/ dbPath).mtimeMs;
}

export async function getStores(): Promise<Store[]> {
  const db = await getSqliteDb();
  const res = db.exec("SELECT id, name, domain, logo_url, created_at FROM stores ORDER BY id ASC");
  if (!res.length) return [];
  const rows = res[0].values;
  return rows.map((r) => ({
    id: r[0] as number,
    name: r[1] as string,
    domain: r[2] as string,
    logo_url: r[3] as string | null,
    created_at: r[4] as string,
  }));
}

// -------------------------------------------------------------
// PUBLIC PRODUCT CATALOG QUERIES
// -------------------------------------------------------------

export async function getProducts(params: ProductQueryParams = {}): Promise<Product[]> {
  const db = await getSqliteDb();

  const stores = await getStores();
  const storeMap = new Map<number, Store>();
  for (const s of stores) {
    storeMap.set(s.id, s);
  }

  // Public catalog only queries active products (is_active != 0) with active store offers
  let query = `
    SELECT id, ean, slug, title, brand, weight_kg, image_url, category,
           is_active, is_featured, custom_description, custom_title, created_at, updated_at,
           species, category_group, category_slug
    FROM products p
    WHERE (p.is_active IS NULL OR p.is_active = 1)
      AND EXISTS (
        SELECT 1 FROM store_offers o
        WHERE o.product_id = p.id AND (o.is_active IS NULL OR o.is_active = 1)
      )
  `;

  if (params.search && params.search.trim()) {
    const s = params.search.trim().replace(/'/g, "''");
    query += ` AND (title LIKE '%${s}%' OR custom_title LIKE '%${s}%' OR brand LIKE '%${s}%' OR ean LIKE '%${s}%')`;
  }

  if (params.featured_only) {
    query += ` AND is_featured = 1`;
  }

  const selectedAnimal = params.animal || params.pet;
  if (selectedAnimal && selectedAnimal !== "all") {
    if (selectedAnimal === "dog" || selectedAnimal === "koer" || selectedAnimal === "koerad") {
      query += ` AND (species = 'koer' OR (species IS NULL AND (category LIKE '%Koer%' OR title LIKE '%koer%'))) AND (species != 'kass' AND species != 'kalad' AND species != 'linnud' AND species != 'vaikeloomad')`;
    } else if (selectedAnimal === "cat" || selectedAnimal === "kass" || selectedAnimal === "kassid") {
      query += ` AND (species = 'kass' OR (species IS NULL AND (category LIKE '%Kass%' OR title LIKE '%kass%'))) AND (species != 'koer' AND species != 'kalad' AND species != 'linnud' AND species != 'vaikeloomad')`;
    } else if (selectedAnimal === "vaikeloomad" || selectedAnimal === "narilised" || selectedAnimal === "närilised") {
      query += ` AND (species = 'vaikeloomad' OR (species IS NULL AND (category LIKE '%Väikeloom%' OR title LIKE '%küülik%' OR title LIKE '%merisiga%')))`;
    } else if (selectedAnimal === "linnud") {
      query += ` AND (species = 'linnud' OR (species IS NULL AND (category LIKE '%Lind%' OR title LIKE '%papagoi%')))`;
    } else if (selectedAnimal === "kalad") {
      query += ` AND (species = 'kalad' OR (species IS NULL AND (category LIKE '%Akvaarium%' OR title LIKE '%kala%')))`;
    } else if (selectedAnimal === "eksootilised") {
      query += ` AND (species = 'eksootilised' OR (species IS NULL AND (category LIKE '%Eksootiline%' OR title LIKE '%roomaja%')))`;
    }
  }

  if (params.category_group) {
    const safeGroup = params.category_group.replace(/'/g, "''");
    query += ` AND (category_group = '${safeGroup}')`;
  }

  const selectedCat = params.category_slug || params.cat || params.category;
  if (selectedCat && selectedCat !== "all") {
    const safeCat = selectedCat.replace(/'/g, "''");
    query += ` AND (category_slug = '${safeCat}' OR category LIKE '%${safeCat}%')`;
  }

  if (params.type && params.type !== "all") {
    if (params.type === "dry") {
      query += ` AND (category LIKE '%Kuivtoit%' OR title LIKE '%kuivtoit%')`;
    } else if (params.type === "wet") {
      query += ` AND (category LIKE '%Märgtoit%' OR category LIKE '%Konserv%' OR title LIKE '%konserv%' OR title LIKE '%pouch%')`;
    }
  }

  if (params.brands && params.brands.length > 0) {
    const brandList = params.brands.map((b) => `'${b.replace(/'/g, "''").toUpperCase().trim()}'`).join(",");
    query += ` AND UPPER(TRIM(brand)) IN (${brandList})`;
  }

  if (params.stage && params.stage !== "all") {
    if (params.stage === "puppy") {
      query += ` AND (title LIKE '%puppy%' OR title LIKE '%kutsik%' OR title LIKE '%kitten%' OR title LIKE '%kassipoeg%')`;
    } else if (params.stage === "large") {
      query += ` AND (title LIKE '%large%' OR title LIKE '%suur%')`;
    } else if (params.stage === "sterilised") {
      query += ` AND (title LIKE '%sterilised%' OR title LIKE '%steriliseeritud%')`;
    }
  }

  query += ` ORDER BY id ASC`;

  const prodRes = db.exec(query);
  if (!prodRes.length) return [];

  const productRows = prodRes[0].values;
  const products: Product[] = [];

  // Fetch only active store offers for public view
  const offersRes = db.exec(`
    SELECT id, product_id, store_id, url, price, price_per_kg, override_price, in_stock, is_active, last_scraped_at
    FROM store_offers
    WHERE (is_active IS NULL OR is_active = 1)
    ORDER BY COALESCE(override_price, price) ASC
  `);

  const offersByProduct = new Map<number, StoreOffer[]>();
  if (offersRes.length) {
    for (const r of offersRes[0].values) {
      const pId = r[1] as number;
      const originalPrice = Number(r[4]);
      const overridePrice = r[6] !== null && r[6] !== undefined ? Number(r[6]) : null;
      const effectivePrice = overridePrice !== null ? overridePrice : originalPrice;

      const offer: StoreOffer = {
        id: r[0] as number,
        product_id: pId,
        store_id: r[2] as number,
        url: r[3] as string,
        price: originalPrice,
        price_per_kg: r[5] ? Number(r[5]) : null,
        override_price: overridePrice,
        effective_price: effectivePrice,
        in_stock: Boolean(r[7]),
        is_active: r[8] === null || r[8] === undefined ? true : Boolean(r[8]),
        last_scraped_at: r[9] as string,
        store: storeMap.get(r[2] as number),
      };

      if (!offersByProduct.has(pId)) {
        offersByProduct.set(pId, []);
      }
      offersByProduct.get(pId)!.push(offer);
    }
  }

  for (const r of productRows) {
    const pId = r[0] as number;
    const offers = offersByProduct.get(pId) || [];

    // Hide products that have no active offers
    if (offers.length === 0) continue;

    // Filter by stores if specified
    if (params.stores && params.stores.length > 0) {
      const matchesStore = offers.some((o) =>
        o.store && (
          params.stores!.includes(o.store.name) ||
          params.stores!.includes(o.store.domain) ||
          params.stores!.includes(o.store.domain.split(".")[0])
        )
      );
      if (!matchesStore) continue;
    }

    let lowestPrice = Infinity;
    let highestPrice = 0;
    let bestPricePerKg = Infinity;

    for (const off of offers) {
      const effPrice = off.effective_price ?? off.price;
      if (effPrice < lowestPrice) lowestPrice = effPrice;
      if (effPrice > highestPrice) highestPrice = effPrice;
      if (off.price_per_kg && off.price_per_kg < bestPricePerKg) {
        bestPricePerKg = off.price_per_kg;
      }
    }

    // Filter by min / max price bounds
    if (params.min_price !== undefined && lowestPrice < params.min_price) {
      continue;
    }
    if (params.max_price !== undefined && lowestPrice > params.max_price) {
      continue;
    }

    const savingsPercent =
      highestPrice > 0 && lowestPrice < Infinity
        ? Math.round(((highestPrice - lowestPrice) / highestPrice) * 100)
        : 0;

    const originalTitle = r[3] as string;
    const customTitle = (r[11] as string | null) || null;
    const displayTitle = customTitle || originalTitle;

    products.push({
      id: pId,
      ean: r[1] as string | null,
      slug: r[2] as string,
      title: originalTitle,
      brand: r[4] as string | null,
      weight_kg: r[5] ? Number(r[5]) : null,
      image_url: r[6] as string | null,
      category: r[7] as string | null,
      species: (r[14] as string | null) || null,
      category_group: (r[15] as string | null) || null,
      category_slug: (r[16] as string | null) || null,
      is_active: r[8] === null || r[8] === undefined ? true : Boolean(r[8]),
      is_featured: Boolean(r[9]),
      custom_description: (r[10] as string | null) || null,
      custom_title: customTitle,
      display_title: displayTitle,
      created_at: r[12] as string,
      updated_at: r[13] as string,
      offers,
      lowest_price: lowestPrice === Infinity ? undefined : lowestPrice,
      highest_price: highestPrice === 0 ? undefined : highestPrice,
      best_price_per_kg: bestPricePerKg === Infinity ? undefined : bestPricePerKg,
      stores_count: offers.length,
      savings_percent: savingsPercent,
    });
  }

  if (params.sort === "price_asc") {
    products.sort((a, b) => (a.lowest_price || 9999) - (b.lowest_price || 9999));
  } else if (params.sort === "price_per_kg") {
    products.sort((a, b) => (a.best_price_per_kg || 9999) - (b.best_price_per_kg || 9999));
  } else if (params.sort === "savings") {
    products.sort((a, b) => (b.savings_percent || 0) - (a.savings_percent || 0));
  } else if (params.sort === "title") {
    products.sort((a, b) => (a.display_title || a.title).localeCompare(b.display_title || b.title));
  }

  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = await getSqliteDb();
  const safeSlug = slug.replace(/'/g, "''");

  const prodRes = db.exec(`
    SELECT id, ean, slug, title, brand, weight_kg, image_url, category,
           is_active, is_featured, custom_description, custom_title, created_at, updated_at,
           species, category_group, category_slug
    FROM products
    WHERE slug = '${safeSlug}' AND (is_active IS NULL OR is_active = 1)
    LIMIT 1
  `);

  if (!prodRes.length || !prodRes[0].values.length) {
    return null;
  }

  const r = prodRes[0].values[0];
  const pId = r[0] as number;

  const stores = await getStores();
  const storeMap = new Map<number, Store>();
  for (const s of stores) {
    storeMap.set(s.id, s);
  }

  const offersRes = db.exec(`
    SELECT id, product_id, store_id, url, price, price_per_kg, override_price, in_stock, is_active, last_scraped_at
    FROM store_offers
    WHERE product_id = ${pId} AND (is_active IS NULL OR is_active = 1)
    ORDER BY COALESCE(override_price, price) ASC
  `);

  const offers: StoreOffer[] = [];
  if (offersRes.length) {
    for (const offRow of offersRes[0].values) {
      const offerId = offRow[0] as number;
      const originalPrice = Number(offRow[4]);
      const overridePrice = offRow[6] !== null && offRow[6] !== undefined ? Number(offRow[6]) : null;
      const effectivePrice = overridePrice !== null ? overridePrice : originalPrice;

      const histRes = db.exec(`
        SELECT id, offer_id, price, recorded_at
        FROM price_history
        WHERE offer_id = ${offerId}
        ORDER BY recorded_at ASC
      `);

      const priceHistory: PriceHistoryPoint[] = [];
      if (histRes.length) {
        for (const h of histRes[0].values) {
          priceHistory.push({
            id: h[0] as number,
            offer_id: h[1] as number,
            price: Number(h[2]),
            recorded_at: h[3] as string,
          });
        }
      }

      offers.push({
        id: offerId,
        product_id: pId,
        store_id: offRow[2] as number,
        url: offRow[3] as string,
        price: originalPrice,
        price_per_kg: offRow[5] ? Number(offRow[5]) : null,
        override_price: overridePrice,
        effective_price: effectivePrice,
        in_stock: Boolean(offRow[7]),
        is_active: offRow[8] === null || offRow[8] === undefined ? true : Boolean(offRow[8]),
        last_scraped_at: offRow[9] as string,
        store: storeMap.get(offRow[2] as number),
        price_history: priceHistory,
      });
    }
  }

  let lowestPrice = Infinity;
  let highestPrice = 0;
  let bestPricePerKg = Infinity;

  for (const off of offers) {
    const effPrice = off.effective_price ?? off.price;
    if (effPrice < lowestPrice) lowestPrice = effPrice;
    if (effPrice > highestPrice) highestPrice = effPrice;
    if (off.price_per_kg && off.price_per_kg < bestPricePerKg) {
      bestPricePerKg = off.price_per_kg;
    }
  }

  const savingsPercent =
    highestPrice > 0 && lowestPrice < Infinity
      ? Math.round(((highestPrice - lowestPrice) / highestPrice) * 100)
      : 0;

  const originalTitle = r[3] as string;
  const customTitle = (r[11] as string | null) || null;
  const displayTitle = customTitle || originalTitle;

  return {
    id: pId,
    ean: r[1] as string | null,
    slug: r[2] as string,
    title: originalTitle,
    brand: r[4] as string | null,
    weight_kg: r[5] ? Number(r[5]) : null,
    image_url: r[6] as string | null,
    category: r[7] as string | null,
    species: (r[14] as string | null) || null,
    category_group: (r[15] as string | null) || null,
    category_slug: (r[16] as string | null) || null,
    is_active: r[8] === null || r[8] === undefined ? true : Boolean(r[8]),
    is_featured: Boolean(r[9]),
    custom_description: (r[10] as string | null) || null,
    custom_title: customTitle,
    display_title: displayTitle,
    created_at: r[12] as string,
    updated_at: r[13] as string,
    offers,
    lowest_price: lowestPrice === Infinity ? undefined : lowestPrice,
    highest_price: highestPrice === 0 ? undefined : highestPrice,
    best_price_per_kg: bestPricePerKg === Infinity ? undefined : bestPricePerKg,
    stores_count: offers.length,
    savings_percent: savingsPercent,
  };
}

// -------------------------------------------------------------
// ADMIN PRODUCT & CATALOG MANAGEMENT QUERIES & MUTATIONS
// -------------------------------------------------------------

export async function getAdminProducts(params: AdminProductQueryParams = {}): Promise<Product[]> {
  const db = await getSqliteDb();

  const stores = await getStores();
  const storeMap = new Map<number, Store>();
  for (const s of stores) {
    storeMap.set(s.id, s);
  }

  let query = `
    SELECT id, ean, slug, title, brand, weight_kg, image_url, category,
           is_active, is_featured, custom_description, custom_title, created_at, updated_at
    FROM products
    WHERE 1=1
  `;

  if (params.search && params.search.trim()) {
    const s = params.search.trim().replace(/'/g, "''");
    query += ` AND (title LIKE '%${s}%' OR custom_title LIKE '%${s}%' OR brand LIKE '%${s}%' OR ean LIKE '%${s}%')`;
  }

  if (params.brand && params.brand !== "all") {
    const b = params.brand.replace(/'/g, "''").toUpperCase().trim();
    query += ` AND UPPER(TRIM(brand)) = '${b}'`;
  }

  if (params.category && params.category !== "all") {
    const c = params.category.replace(/'/g, "''");
    query += ` AND category LIKE '%${c}%'`;
  }

  if (params.status === "active") {
    query += ` AND (is_active IS NULL OR is_active = 1)`;
  } else if (params.status === "inactive") {
    query += ` AND is_active = 0`;
  } else if (params.status === "featured") {
    query += ` AND is_featured = 1`;
  }

  query += ` ORDER BY id DESC`;

  const prodRes = db.exec(query);
  if (!prodRes.length) return [];

  const productRows = prodRes[0].values;
  const products: Product[] = [];

  // Fetch ALL offers for admin
  const offersRes = db.exec(`
    SELECT id, product_id, store_id, url, price, price_per_kg, override_price, in_stock, is_active, last_scraped_at
    FROM store_offers
    ORDER BY COALESCE(override_price, price) ASC
  `);

  const offersByProduct = new Map<number, StoreOffer[]>();
  if (offersRes.length) {
    for (const r of offersRes[0].values) {
      const pId = r[1] as number;
      const originalPrice = Number(r[4]);
      const overridePrice = r[6] !== null && r[6] !== undefined ? Number(r[6]) : null;
      const effectivePrice = overridePrice !== null ? overridePrice : originalPrice;

      const offer: StoreOffer = {
        id: r[0] as number,
        product_id: pId,
        store_id: r[2] as number,
        url: r[3] as string,
        price: originalPrice,
        price_per_kg: r[5] ? Number(r[5]) : null,
        override_price: overridePrice,
        effective_price: effectivePrice,
        in_stock: Boolean(r[7]),
        is_active: r[8] === null || r[8] === undefined ? true : Boolean(r[8]),
        last_scraped_at: r[9] as string,
        store: storeMap.get(r[2] as number),
      };

      if (!offersByProduct.has(pId)) {
        offersByProduct.set(pId, []);
      }
      offersByProduct.get(pId)!.push(offer);
    }
  }

  for (const r of productRows) {
    const pId = r[0] as number;
    const offers = offersByProduct.get(pId) || [];

    // Filter by match status if specified
    if (params.match_status === "multi_store" && offers.length < 2) continue;
    if (params.match_status === "single_store" && offers.length !== 1) continue;
    if (params.match_status === "no_offers" && offers.length > 0) continue;

    let lowestPrice = Infinity;
    let highestPrice = 0;
    for (const off of offers) {
      const effPrice = off.effective_price ?? off.price;
      if (effPrice < lowestPrice) lowestPrice = effPrice;
      if (effPrice > highestPrice) highestPrice = effPrice;
    }

    const originalTitle = r[3] as string;
    const customTitle = (r[11] as string | null) || null;
    const displayTitle = customTitle || originalTitle;

    products.push({
      id: pId,
      ean: r[1] as string | null,
      slug: r[2] as string,
      title: originalTitle,
      brand: r[4] as string | null,
      weight_kg: r[5] ? Number(r[5]) : null,
      image_url: r[6] as string | null,
      category: r[7] as string | null,
      is_active: r[8] === null || r[8] === undefined ? true : Boolean(r[8]),
      is_featured: Boolean(r[9]),
      custom_description: (r[10] as string | null) || null,
      custom_title: customTitle,
      display_title: displayTitle,
      created_at: r[12] as string,
      updated_at: r[13] as string,
      offers,
      lowest_price: lowestPrice === Infinity ? undefined : lowestPrice,
      highest_price: highestPrice === 0 ? undefined : highestPrice,
      stores_count: offers.length,
    });
  }

  return products;
}

export async function getAdminProductById(id: number): Promise<Product | null> {
  const db = await getSqliteDb();

  const prodRes = db.exec(`
    SELECT id, ean, slug, title, brand, weight_kg, image_url, category,
           is_active, is_featured, custom_description, custom_title, created_at, updated_at
    FROM products
    WHERE id = ${id}
    LIMIT 1
  `);

  if (!prodRes.length || !prodRes[0].values.length) return null;
  const r = prodRes[0].values[0];

  const stores = await getStores();
  const storeMap = new Map<number, Store>();
  for (const s of stores) {
    storeMap.set(s.id, s);
  }

  const offersRes = db.exec(`
    SELECT id, product_id, store_id, url, price, price_per_kg, override_price, in_stock, is_active, last_scraped_at
    FROM store_offers
    WHERE product_id = ${id}
    ORDER BY id ASC
  `);

  const offers: StoreOffer[] = [];
  if (offersRes.length) {
    for (const offRow of offersRes[0].values) {
      const originalPrice = Number(offRow[4]);
      const overridePrice = offRow[6] !== null && offRow[6] !== undefined ? Number(offRow[6]) : null;
      offers.push({
        id: offRow[0] as number,
        product_id: id,
        store_id: offRow[2] as number,
        url: offRow[3] as string,
        price: originalPrice,
        price_per_kg: offRow[5] ? Number(offRow[5]) : null,
        override_price: overridePrice,
        effective_price: overridePrice !== null ? overridePrice : originalPrice,
        in_stock: Boolean(offRow[7]),
        is_active: offRow[8] === null || offRow[8] === undefined ? true : Boolean(offRow[8]),
        last_scraped_at: offRow[9] as string,
        store: storeMap.get(offRow[2] as number),
      });
    }
  }

  return {
    id: r[0] as number,
    ean: r[1] as string | null,
    slug: r[2] as string,
    title: r[3] as string,
    brand: r[4] as string | null,
    weight_kg: r[5] ? Number(r[5]) : null,
    image_url: r[6] as string | null,
    category: r[7] as string | null,
    is_active: r[8] === null || r[8] === undefined ? true : Boolean(r[8]),
    is_featured: Boolean(r[9]),
    custom_description: (r[10] as string | null) || null,
    custom_title: (r[11] as string | null) || null,
    display_title: (r[11] as string) || (r[3] as string),
    created_at: r[12] as string,
    updated_at: r[13] as string,
    offers,
    stores_count: offers.length,
  };
}

export async function updateProductAdmin(
  id: number,
  data: {
    custom_title?: string | null;
    custom_description?: string | null;
    title?: string;
    brand?: string | null;
    category?: string | null;
    weight_kg?: number | null;
    image_url?: string | null;
    is_active?: boolean;
    is_featured?: boolean;
  }
): Promise<void> {
  const db = await getSqliteDb();

  const sets: string[] = [];
  if (data.custom_title !== undefined) {
    sets.push(`custom_title = ${data.custom_title ? `'${data.custom_title.replace(/'/g, "''")}'` : "NULL"}`);
  }
  if (data.custom_description !== undefined) {
    sets.push(`custom_description = ${data.custom_description ? `'${data.custom_description.replace(/'/g, "''")}'` : "NULL"}`);
  }
  if (data.title !== undefined) {
    sets.push(`title = '${data.title.replace(/'/g, "''")}'`);
  }
  if (data.brand !== undefined) {
    sets.push(`brand = ${data.brand ? `'${data.brand.replace(/'/g, "''")}'` : "NULL"}`);
  }
  if (data.category !== undefined) {
    sets.push(`category = ${data.category ? `'${data.category.replace(/'/g, "''")}'` : "NULL"}`);
  }
  if (data.weight_kg !== undefined) {
    sets.push(`weight_kg = ${data.weight_kg !== null ? data.weight_kg : "NULL"}`);
  }
  if (data.image_url !== undefined) {
    sets.push(`image_url = ${data.image_url ? `'${data.image_url.replace(/'/g, "''")}'` : "NULL"}`);
  }
  if (data.is_active !== undefined) {
    sets.push(`is_active = ${data.is_active ? 1 : 0}`);
  }
  if (data.is_featured !== undefined) {
    sets.push(`is_featured = ${data.is_featured ? 1 : 0}`);
  }

  sets.push(`updated_at = datetime('now')`);

  if (sets.length > 0) {
    db.run(`UPDATE products SET ${sets.join(", ")} WHERE id = ${id}`);
    saveSqliteDb(db);
  }
}

export async function createProductAdmin(data: {
  title: string;
  slug?: string;
  brand?: string | null;
  category?: string | null;
  weight_kg?: number | null;
  image_url?: string | null;
  ean?: string | null;
  custom_description?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
}): Promise<number> {
  const db = await getSqliteDb();

  const slug =
    data.slug ||
    data.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") + `-${Date.now().toString().slice(-4)}`;

  const cleanTitle = data.title.replace(/'/g, "''");
  const cleanSlug = slug.replace(/'/g, "''");
  const brandVal = data.brand ? `'${data.brand.replace(/'/g, "''")}'` : "NULL";
  const catVal = data.category ? `'${data.category.replace(/'/g, "''")}'` : "NULL";
  const weightVal = data.weight_kg !== undefined && data.weight_kg !== null ? data.weight_kg : "NULL";
  const imgVal = data.image_url ? `'${data.image_url.replace(/'/g, "''")}'` : "NULL";
  const eanVal = data.ean ? `'${data.ean.replace(/'/g, "''")}'` : "NULL";
  const descVal = data.custom_description ? `'${data.custom_description.replace(/'/g, "''")}'` : "NULL";
  const activeVal = data.is_active !== false ? 1 : 0;
  const featVal = data.is_featured ? 1 : 0;

  db.run(`
    INSERT INTO products (title, slug, brand, category, weight_kg, image_url, ean, custom_description, is_active, is_featured)
    VALUES ('${cleanTitle}', '${cleanSlug}', ${brandVal}, ${catVal}, ${weightVal}, ${imgVal}, ${eanVal}, ${descVal}, ${activeVal}, ${featVal})
  `);

  saveSqliteDb(db);

  const idRes = db.exec("SELECT last_insert_rowid()");
  return Number(idRes[0].values[0][0]);
}

export async function updateStoreOfferAdmin(
  id: number,
  data: {
    is_active?: boolean;
    override_price?: number | null;
  }
): Promise<void> {
  const db = await getSqliteDb();

  const sets: string[] = [];
  if (data.is_active !== undefined) {
    sets.push(`is_active = ${data.is_active ? 1 : 0}`);
  }
  if (data.override_price !== undefined) {
    sets.push(`override_price = ${data.override_price !== null ? data.override_price : "NULL"}`);
  }

  if (sets.length > 0) {
    db.run(`UPDATE store_offers SET ${sets.join(", ")} WHERE id = ${id}`);
    saveSqliteDb(db);
  }
}

export async function createStoreOfferAdmin(data: {
  product_id: number;
  store_id: number;
  url: string;
  price: number;
  price_per_kg?: number | null;
  override_price?: number | null;
  in_stock?: boolean;
  is_active?: boolean;
}): Promise<number> {
  const db = await getSqliteDb();

  const urlClean = data.url.replace(/'/g, "''");
  const pKg = data.price_per_kg !== undefined && data.price_per_kg !== null ? data.price_per_kg : "NULL";
  const oPrice = data.override_price !== undefined && data.override_price !== null ? data.override_price : "NULL";
  const inStock = data.in_stock !== false ? 1 : 0;
  const active = data.is_active !== false ? 1 : 0;

  db.run(`
    INSERT INTO store_offers (product_id, store_id, url, price, price_per_kg, override_price, in_stock, is_active)
    VALUES (${data.product_id}, ${data.store_id}, '${urlClean}', ${data.price}, ${pKg}, ${oPrice}, ${inStock}, ${active})
  `);

  saveSqliteDb(db);
  const idRes = db.exec("SELECT last_insert_rowid()");
  return Number(idRes[0].values[0][0]);
}

// -------------------------------------------------------------
// BANNER MANAGEMENT SYSTEM (PLACEMENTS & BANNERS)
// -------------------------------------------------------------

export async function getBannerPlacements(): Promise<BannerPlacement[]> {
  const db = await getSqliteDb();

  const res = db.exec(`
    SELECT bp.id, bp.identifier, bp.name, bp.description, bp.width, bp.height, bp.is_active,
           COUNT(b.id) as banners_count
    FROM banner_placements bp
    LEFT JOIN banners b ON bp.id = b.placement_id
    GROUP BY bp.id
    ORDER BY bp.id ASC
  `);

  if (!res.length) return [];
  return res[0].values.map((r) => ({
    id: r[0] as number,
    identifier: r[1] as string,
    name: r[2] as string,
    description: r[3] as string | null,
    width: r[4] ? Number(r[4]) : null,
    height: r[5] ? Number(r[5]) : null,
    is_active: Boolean(r[6]),
    banners_count: Number(r[7]),
  }));
}

export async function getBannersAdmin(): Promise<Banner[]> {
  const db = await getSqliteDb();

  const res = db.exec(`
    SELECT b.id, b.placement_id, bp.identifier, b.title, b.image_url, b.target_url,
           b.alt_text, b.client_name, b.weight, b.impressions_count, b.clicks_count,
           b.start_date, b.end_date, b.is_active, b.created_at
    FROM banners b
    LEFT JOIN banner_placements bp ON b.placement_id = bp.id
    ORDER BY b.id DESC
  `);

  if (!res.length) return [];
  return res[0].values.map((r) => {
    const imps = Number(r[9]);
    const clicks = Number(r[10]);
    const ctr = imps > 0 ? Number(((clicks / imps) * 100).toFixed(2)) : 0;

    return {
      id: r[0] as number,
      placement_id: r[1] as number,
      placement_identifier: r[2] as string,
      title: r[3] as string,
      image_url: r[4] as string,
      target_url: r[5] as string,
      alt_text: r[6] as string | null,
      client_name: r[7] as string | null,
      weight: Number(r[8]),
      impressions_count: imps,
      clicks_count: clicks,
      ctr_percent: ctr,
      start_date: r[11] as string | null,
      end_date: r[12] as string | null,
      is_active: Boolean(r[13]),
      created_at: r[14] as string,
    };
  });
}

export async function createBannerAdmin(data: {
  placement_id: number;
  title: string;
  image_url: string;
  target_url: string;
  alt_text?: string | null;
  client_name?: string | null;
  weight?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}): Promise<number> {
  const db = await getSqliteDb();

  const titleClean = data.title.replace(/'/g, "''");
  const imgClean = data.image_url.replace(/'/g, "''");
  const tgtClean = data.target_url.replace(/'/g, "''");
  const altClean = data.alt_text ? `'${data.alt_text.replace(/'/g, "''")}'` : "NULL";
  const clientClean = data.client_name ? `'${data.client_name.replace(/'/g, "''")}'` : "NULL";
  const weight = data.weight || 1;
  const startVal = data.start_date ? `'${data.start_date}'` : "NULL";
  const endVal = data.end_date ? `'${data.end_date}'` : "NULL";
  const active = data.is_active !== false ? 1 : 0;

  db.run(`
    INSERT INTO banners (placement_id, title, image_url, target_url, alt_text, client_name, weight, start_date, end_date, is_active)
    VALUES (${data.placement_id}, '${titleClean}', '${imgClean}', '${tgtClean}', ${altClean}, ${clientClean}, ${weight}, ${startVal}, ${endVal}, ${active})
  `);

  saveSqliteDb(db);
  const idRes = db.exec("SELECT last_insert_rowid()");
  return Number(idRes[0].values[0][0]);
}

export async function updateBannerAdmin(
  id: number,
  data: Partial<Banner>
): Promise<void> {
  const db = await getSqliteDb();

  const sets: string[] = [];
  if (data.placement_id !== undefined) sets.push(`placement_id = ${data.placement_id}`);
  if (data.title !== undefined) sets.push(`title = '${data.title.replace(/'/g, "''")}'`);
  if (data.image_url !== undefined) sets.push(`image_url = '${data.image_url.replace(/'/g, "''")}'`);
  if (data.target_url !== undefined) sets.push(`target_url = '${data.target_url.replace(/'/g, "''")}'`);
  if (data.alt_text !== undefined) sets.push(`alt_text = ${data.alt_text ? `'${data.alt_text.replace(/'/g, "''")}'` : "NULL"}`);
  if (data.client_name !== undefined) sets.push(`client_name = ${data.client_name ? `'${data.client_name.replace(/'/g, "''")}'` : "NULL"}`);
  if (data.weight !== undefined) sets.push(`weight = ${data.weight}`);
  if (data.start_date !== undefined) sets.push(`start_date = ${data.start_date ? `'${data.start_date}'` : "NULL"}`);
  if (data.end_date !== undefined) sets.push(`end_date = ${data.end_date ? `'${data.end_date}'` : "NULL"}`);
  if (data.is_active !== undefined) sets.push(`is_active = ${data.is_active ? 1 : 0}`);

  if (sets.length > 0) {
    db.run(`UPDATE banners SET ${sets.join(", ")} WHERE id = ${id}`);
    saveSqliteDb(db);
  }
}

export async function deleteBannerAdmin(id: number): Promise<void> {
  const db = await getSqliteDb();
  db.run(`DELETE FROM banners WHERE id = ${id}`);
  saveSqliteDb(db);
}

// -------------------------------------------------------------
// PUBLIC BANNER DELIVERY ENGINE & TRACKING
// -------------------------------------------------------------

export async function getActiveBannerForPlacement(placementIdentifier: string): Promise<Banner | null> {
  const db = await getSqliteDb();
  const safeIdentifier = placementIdentifier.replace(/'/g, "''");

  // Query active banners within schedule for placement
  const res = db.exec(`
    SELECT b.id, b.placement_id, bp.identifier, b.title, b.image_url, b.target_url,
           b.alt_text, b.client_name, b.weight, b.impressions_count, b.clicks_count
    FROM banners b
    JOIN banner_placements bp ON b.placement_id = bp.id
    WHERE bp.identifier = '${safeIdentifier}'
      AND bp.is_active = 1
      AND b.is_active = 1
      AND (b.start_date IS NULL OR b.start_date <= datetime('now'))
      AND (b.end_date IS NULL OR b.end_date >= datetime('now'))
  `);

  if (!res.length || !res[0].values.length) return null;

  const candidates: Banner[] = res[0].values.map((r) => ({
    id: r[0] as number,
    placement_id: r[1] as number,
    placement_identifier: r[2] as string,
    title: r[3] as string,
    image_url: r[4] as string,
    target_url: r[5] as string,
    alt_text: r[6] as string | null,
    client_name: r[7] as string | null,
    weight: Math.max(1, Number(r[8])),
    impressions_count: Number(r[9]),
    clicks_count: Number(r[10]),
    is_active: true,
    start_date: null,
    end_date: null,
  }));

  if (candidates.length === 1) {
    return candidates[0];
  }

  // Weighted random selection:
  const totalWeight = candidates.reduce((sum, b) => sum + b.weight, 0);
  let randomValue = Math.random() * totalWeight;

  for (const b of candidates) {
    if (randomValue < b.weight) {
      return b;
    }
    randomValue -= b.weight;
  }

  return candidates[0];
}

export async function getAllActiveBannersForPlacement(placementIdentifier: string): Promise<Banner[]> {
  const db = await getSqliteDb();
  const safeIdentifier = placementIdentifier.replace(/'/g, "''");

  const res = db.exec(`
    SELECT b.id, b.placement_id, bp.identifier, b.title, b.image_url, b.target_url,
           b.alt_text, b.client_name, b.weight, b.impressions_count, b.clicks_count
    FROM banners b
    JOIN banner_placements bp ON b.placement_id = bp.id
    WHERE bp.identifier = '${safeIdentifier}'
      AND bp.is_active = 1
      AND b.is_active = 1
      AND (b.start_date IS NULL OR b.start_date <= datetime('now'))
      AND (b.end_date IS NULL OR b.end_date >= datetime('now'))
    ORDER BY b.weight DESC, b.id ASC
  `);

  if (!res.length || !res[0].values.length) return [];

  return res[0].values.map((r) => ({
    id: r[0] as number,
    placement_id: r[1] as number,
    placement_identifier: r[2] as string,
    title: r[3] as string,
    image_url: r[4] as string,
    target_url: r[5] as string,
    alt_text: r[6] as string | null,
    client_name: r[7] as string | null,
    weight: Math.max(1, Number(r[8])),
    impressions_count: Number(r[9]),
    clicks_count: Number(r[10]),
    is_active: true,
    start_date: null,
    end_date: null,
  }));
}

export async function recordBannerImpression(bannerId: number): Promise<void> {
  try {
    const db = await getSqliteDb();
    db.run(`UPDATE banners SET impressions_count = impressions_count + 1 WHERE id = ${bannerId}`);
    saveSqliteDb(db);
  } catch (err) {
    console.error(`Failed to record impression for banner ${bannerId}:`, err);
  }
}

export async function recordBannerClick(bannerId: number): Promise<string | null> {
  try {
    const db = await getSqliteDb();
    const res = db.exec(`SELECT target_url FROM banners WHERE id = ${bannerId}`);
    if (!res.length || !res[0].values.length) return null;

    const targetUrl = res[0].values[0][0] as string;
    db.run(`UPDATE banners SET clicks_count = clicks_count + 1 WHERE id = ${bannerId}`);
    saveSqliteDb(db);

    return targetUrl;
  } catch (err) {
    console.error(`Failed to record click for banner ${bannerId}:`, err);
    return null;
  }
}

// -------------------------------------------------------------
// ADMIN OVERVIEW KPI STATS
// -------------------------------------------------------------

export async function getAdminStats(): Promise<AdminStats> {
  const db = await getSqliteDb();

  const totalProducts = db.exec("SELECT count(*) FROM products")[0]?.values[0][0] as number || 0;
  const activeProducts = db.exec("SELECT count(*) FROM products WHERE (is_active IS NULL OR is_active = 1)")[0]?.values[0][0] as number || 0;
  const inactiveProducts = totalProducts - activeProducts;

  const totalOffers = db.exec("SELECT count(*) FROM store_offers")[0]?.values[0][0] as number || 0;
  const activeOffers = db.exec("SELECT count(*) FROM store_offers WHERE (is_active IS NULL OR is_active = 1)")[0]?.values[0][0] as number || 0;
  const totalStores = db.exec("SELECT count(*) FROM stores")[0]?.values[0][0] as number || 0;

  const totalBanners = db.exec("SELECT count(*) FROM banners")[0]?.values[0][0] as number || 0;
  const activeBanners = db.exec("SELECT count(*) FROM banners WHERE is_active = 1")[0]?.values[0][0] as number || 0;

  const metricsRes = db.exec("SELECT COALESCE(SUM(impressions_count), 0), COALESCE(SUM(clicks_count), 0) FROM banners");
  const totalImpressions = Number(metricsRes[0]?.values[0][0] || 0);
  const totalClicks = Number(metricsRes[0]?.values[0][1] || 0);
  const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

  return {
    total_products: totalProducts,
    active_products: activeProducts,
    inactive_products: inactiveProducts,
    total_offers: totalOffers,
    active_offers: activeOffers,
    total_stores: totalStores,
    total_banners: totalBanners,
    active_banners: activeBanners,
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    avg_ctr_percent: avgCtr,
  };
}

export async function getDatabaseStats() {
  const db = await getSqliteDb();
  const prodCount = db.exec("SELECT count(*) FROM products")[0]?.values[0][0] || 0;
  const storeCount = db.exec("SELECT count(*) FROM stores")[0]?.values[0][0] || 0;
  const offerCount = db.exec("SELECT count(*) FROM store_offers")[0]?.values[0][0] || 0;
  const historyCount = db.exec("SELECT count(*) FROM price_history")[0]?.values[0][0] || 0;

  return {
    products: prodCount,
    stores: storeCount,
    offers: offerCount,
    price_records: historyCount,
  };
}

export async function getFilterFacets(species?: string) {
  const db = await getSqliteDb();

  let brandQuery = `
    SELECT UPPER(TRIM(p.brand)) AS brand_name, COUNT(*) AS cnt
    FROM products p
    WHERE (p.is_active IS NULL OR p.is_active = 1)
      AND p.brand IS NOT NULL AND TRIM(p.brand) != ''
      AND EXISTS (
        SELECT 1 FROM store_offers o
        WHERE o.product_id = p.id AND (o.is_active IS NULL OR o.is_active = 1)
      )
  `;
  if (species && species !== "all") {
    brandQuery += ` AND p.species = '${species.replace(/'/g, "''")}'`;
  }
  brandQuery += ` GROUP BY UPPER(TRIM(p.brand)) ORDER BY cnt DESC, brand_name ASC`;

  const brandRes = db.exec(brandQuery);
  const brands = brandRes.length
    ? brandRes[0].values.map((r) => ({ name: r[0] as string, count: Number(r[1]) }))
    : [];

  const storeRes = db.exec(`
    SELECT s.id, s.name, s.domain, count(o.id) as cnt
    FROM stores s
    LEFT JOIN store_offers o ON s.id = o.store_id AND (o.is_active IS NULL OR o.is_active = 1) AND o.in_stock = 1
    GROUP BY s.id, s.name, s.domain
    ORDER BY cnt DESC
  `);
  const stores = storeRes.length
    ? storeRes[0].values.map((r) => ({
        id: r[0] as number,
        name: r[1] as string,
        domain: r[2] as string,
        count: Number(r[3]),
      }))
    : [];

  const priceRes = db.exec(`
    SELECT MIN(COALESCE(override_price, price)), MAX(COALESCE(override_price, price))
    FROM store_offers
    WHERE (is_active IS NULL OR is_active = 1) AND in_stock = 1
  `);
  const minPrice = priceRes.length && priceRes[0].values[0][0] !== null ? Math.floor(Number(priceRes[0].values[0][0])) : 1;
  const maxPrice = priceRes.length && priceRes[0].values[0][1] !== null ? Math.ceil(Number(priceRes[0].values[0][1])) : 150;

  const catRes = db.exec(`
    SELECT p.species, p.category_group, p.category_slug, count(*) as cnt
    FROM products p
    WHERE (p.is_active IS NULL OR p.is_active = 1)
      AND p.species IS NOT NULL
      AND p.category_group IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM store_offers o
        WHERE o.product_id = p.id AND (o.is_active IS NULL OR o.is_active = 1)
      )
    GROUP BY p.species, p.category_group, p.category_slug
    ORDER BY p.species, p.category_group, cnt DESC
  `);
  const categories = catRes.length
    ? catRes[0].values.map((r) => ({
        species: r[0] as string,
        category_group: r[1] as string,
        category_slug: r[2] as string,
        count: Number(r[3]),
      }))
    : [];

  return {
    brands,
    stores,
    priceRange: { min: minPrice, max: maxPrice },
    categories,
  };
}
