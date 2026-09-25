export interface Store {
  id: number;
  name: string;
  domain: string;
  logo_url: string | null;
  created_at?: string;
}

export interface PriceHistoryPoint {
  id: number;
  offer_id: number;
  price: number;
  recorded_at: string;
}

export interface StoreOffer {
  id: number;
  product_id: number;
  store_id: number;
  url: string;
  price: number;
  price_per_kg: number | null;
  override_price?: number | null;
  effective_price?: number;
  in_stock: boolean;
  is_active?: boolean;
  last_scraped_at: string;
  store?: Store;
  price_history?: PriceHistoryPoint[];
}

export interface Product {
  id: number;
  ean: string | null;
  slug: string;
  title: string;
  brand: string | null;
  weight_kg: number | null;
  image_url: string | null;
  category: string | null;
  species?: string | null; // 'koer' | 'kass' | 'vaikeloomad' | 'linnud' | 'kalad' | 'eksootilised'
  category_group?: string | null; // e.g. 'toit_maiused', 'pesad_transport', 'manguasjad', etc.
  category_slug?: string | null; // e.g. 'pesad', 'kuivtoit', 'traksid', etc.
  is_active?: boolean;
  is_featured?: boolean;
  custom_description?: string | null;
  custom_title?: string | null;
  display_title?: string;
  created_at?: string;
  updated_at?: string;
  offers: StoreOffer[];
  lowest_price?: number;
  highest_price?: number;
  best_price_per_kg?: number;
  stores_count?: number;
  savings_percent?: number;
}

export interface ProductQueryParams {
  search?: string;
  pet?: string; // 'all' | 'dog' | 'cat' | 'koer' | 'kass' | 'vaikeloomad' | 'linnud' | 'kalad' | 'eksootilised'
  animal?: string; // alias for species / pet
  type?: string; // 'all' | 'dry' | 'wet'
  category_group?: string; // 'toit_maiused' | 'pesad_transport' | 'manguasjad' | 'jalutamine_rihmad' | 'hugieen_hooldus' | 'tervis'
  category_slug?: string; // 'pesad' | 'transport' | 'traksid' | 'kraapimispuud' | 'kassiliivad' etc.
  cat?: string; // alias for category_slug
  category?: string; // alias for category_slug
  stage?: string; // 'all' | 'puppy' | 'adult' | 'large' | 'sterilised'
  sort?: string; // 'price_asc' | 'price_per_kg' | 'title' | 'savings'
  featured_only?: boolean;
  min_price?: number;
  max_price?: number;
  stores?: string[];
  brands?: string[];
}

export interface BannerPlacement {
  id: number;
  identifier: string;
  name: string;
  description: string | null;
  width: number | null;
  height: number | null;
  is_active: boolean;
  banners_count?: number;
}

export interface Banner {
  id: number;
  placement_id: number;
  placement_identifier?: string;
  title: string;
  image_url: string;
  target_url: string;
  alt_text: string | null;
  client_name: string | null;
  weight: number;
  impressions_count: number;
  clicks_count: number;
  ctr_percent?: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at?: string;
  placement?: BannerPlacement;
}

export interface AdminProductQueryParams {
  search?: string;
  brand?: string;
  category?: string;
  status?: "all" | "active" | "inactive" | "featured";
  match_status?: "all" | "multi_store" | "single_store" | "no_offers";
}

export interface AdminStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  total_offers: number;
  active_offers: number;
  total_stores: number;
  total_banners: number;
  active_banners: number;
  total_impressions: number;
  total_clicks: number;
  avg_ctr_percent: number;
}
