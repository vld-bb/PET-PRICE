# PetPrice 🐾 - Estonian Pet Food Price Comparison Engine

**PetPrice** is an end-to-end price comparison platform for pet food across Estonia's leading pet supply stores:
- **PetCity** (`petcity.ee`)
- **Kika** (`kika.ee`)
- **Zoomaailm** (`zoomaailm.ee`)
- **Fera** (`fera.ee`)
- **Koerland** (`koerland.ee`)
- **Zooplus** (`zooplus.ee`)

---

## 🏗️ Architecture & Features

```
PET PRICE/
├── scraper/                     # Python scraping & ingestion suite
│   ├── rate_limiter.py          # Domain-level Semaphore(2), jitter (1.5-3.5s), exponential backoff
│   ├── sitemap_parser.py        # XML sitemap discovery & leaf product URL filtering
│   ├── jsonld_extractor.py      # Schema.org JSON-LD & OpenGraph product extractor
│   ├── normalizer.py            # Weight parser ("15kg", "800g", "12x85g") & unit price (€/kg)
│   ├── matcher.py               # EAN exact match + Brand/Weight/Trigram similarity (>0.85)
│   ├── db_sync.py               # Upsert products, store offers & price history tracking
│   ├── stores.py                # Retailer metadata, sitemap endpoints & configurations
│   └── pipeline.py              # CLI & multi-store concurrent crawler orchestrator
├── db/                          # Database schema, models & seeder
│   ├── database.py              # SQLAlchemy engine (SQLite fallback & PostgreSQL)
│   ├── models.py                # SQLAlchemy 2.0 ORM models (Product, StoreOffer, Banner, Placement)
│   ├── migrations/
│   │   ├── 001_init_postgres.sql # PostgreSQL DDL migration
│   │   ├── 001_init_sqlite.sql   # SQLite DDL migration
│   │   └── 002_banner_engine.sql # Banner engine & product overrides migration
│   └── seed.py                  # Seeder with pet food catalog, banner placements & campaigns
├── web/                         # Next.js 16+ (App Router, Tailwind CSS, TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Dashboard with debounced search, quick filters & banner slots
│   │   │   ├── product/[slug]/  # Dedicated SEO-optimized product detail page
│   │   │   ├── admin/           # Admin Dashboard (/admin, /admin/products, /admin/banners, /admin/login)
│   │   │   └── api/             # API routes (/api/products, /api/banners, /api/admin)
│   │   ├── components/          # BannerSlot, ProductCard, ComparisonModal, SparklineChart, Header
│   │   ├── middleware.ts        # Admin route protection & Basic Auth / session verification
│   │   └── lib/                 # Database queries, mutations, banner rotation & TypeScript types
├── tests/                       # Automated pytest suite (26 unit tests)
├── requirements.txt             # Python dependencies
└── README.md                    # Setup and operation instructions
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ (tested on Node 20)
- npm or pnpm

### 2. Python Environment Setup
Install required Python dependencies:
```bash
pip install -r requirements.txt
```

### 3. Initialize & Seed Database
Initialize the SQLite database (`petprice.db`) and seed the 6 Estonian stores, product catalog, multi-retailer offers, and 45-day price trajectories:
```bash
python db/seed.py
```

### 4. Run Automated Tests
Execute the unit test suite covering weight normalization, EAN matching, trigram similarity, JSON-LD parsing, and price history tracking:
```bash
python -m pytest tests -v
```

### 5. Start Frontend Dashboard
Navigate to `web/` and launch the development server:
```bash
cd web
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🕷️ Scraping & Ingestion Engine

### Anti-Blocking & Politeness Policies
- **Domain Concurrency**: Limited to maximum 2 concurrent requests per domain (`asyncio.Semaphore(2)`).
- **Polite Jitter**: Randomized delays between 1.5s and 3.5s between requests.
- **Dynamic Headers**: Desktop `User-Agent` rotation with `Sec-Ch-Ua` headers and Estonian locale preference (`et-EE,et;q=0.9`).
- **Retry Backoff**: Automatic retry on `429 Too Many Requests` and `503` using `tenacity` exponential backoff.
- **Cloudflare TLS Bypass**: Fallback to TLS impersonation (`curl_cffi` Chrome 124 fingerprint) for Cloudflare-protected retailers (`koerland.ee`).

### Running the Crawler CLI

**Scrape a single store (e.g. Zoomaailm):**
```bash
python scraper/pipeline.py --store zoomaailm.ee --limit 10
```

**Scrape all stores:**
```bash
python scraper/pipeline.py --limit 15
```

Available store domains: `petcity.ee`, `kika.ee`, `zoomaailm.ee`, `fera.ee`, `koerland.ee`, `zooplus.ee`.

---

## ⏱️ Background Cron Job Configuration

To schedule periodic scraping and daily price updates:

### Linux / macOS (`crontab -e`)
```cron
# Run daily pet food price ingestion at 03:00 AM EET
0 3 * * * cd /path/to/petprice && python scraper/pipeline.py --limit 50 >> /var/log/petprice_scraper.log 2>&1
```

### Windows Task Scheduler (PowerShell)
```powershell
$Action = New-ScheduledTaskAction -Execute "python.exe" -Argument "scraper/pipeline.py --limit 50" -WorkingDirectory "C:\path\to\petprice"
$Trigger = New-ScheduledTaskTrigger -Daily -At "03:00AM"
Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName "PetPriceScraper" -Description "Daily pet food price sync"
```

---

## 🗄️ Database Configurations

### Local Development (SQLite)
By default, the platform creates and queries `petprice.db` locally in the workspace root.

### Production (PostgreSQL)
To run with PostgreSQL:
1. Apply the migration script:
   ```bash
   psql -d petprice -f db/migrations/001_init_postgres.sql
   ```
2. Set the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/petprice"
   ```
3. Run the seeder or scraper:
   ```bash
   python db/seed.py
   ```

---

## 🌐 Next.js Frontend Details

- **Instant Search**: Debounced search supporting brand names ("Royal Canin"), product titles, package weights, or 13-digit EAN barcodes.
- **Quick Filters**: Dogs / Cats, Dry Food / Wet Food / Canned, Puppy / Large Breed / Sterilised.
- **Sorting**: Lowest price (€), best unit price (€/kg), greatest price difference (%), or A-Z.
- **Price Comparison Modal**: Sorted store comparison table with stock status, direct outbound link buttons (`rel="noopener sponsored"`), and SVG price history sparklines.
- **SSR Detail Pages**: `/product/[slug]` with dynamic OpenGraph meta tags for SEO.

---

## 🛡️ License
MIT License. Built for Estonian pet owners.
