export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  discount_price?: string;
  discount_start?: string;
  discount_end?: string;
  image_url: string;
  /** Uploaded image URL; image_url is used for retailer-hosted photos. */
  image?: string | null;
  images?: { image: string; alt_text?: string | null }[];
  slug?: string;
  /** "internal" for vendor deals listed on GrottoMore, "external" for retailer deals. */
  source?: 'internal' | 'external';
  /** Retailer name for external deals, e.g. "Shoprite". */
  source_platform?: string | null;
  source_url?: string | null;
  created_at?: string;
  category: {
    id?: string;
    name: string;
    slug: string;
    description: string;
  };
  tags: string[];
  status: 'active' | 'inactive';
  is_available: boolean;
  is_featured: boolean;
  stock: number;
  /** Full product objects on the detail endpoint; IDs in admin forms. */
  related_products?: (Product | string)[];
  reviews?: { rating: number; is_approved?: boolean }[];
  brand?: string;
  rating?: number;
  createdAt?: Date;
  updatedAt?: Date;
  quantity?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: string;
  id: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}