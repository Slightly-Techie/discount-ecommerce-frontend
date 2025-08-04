export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  discount_price?: string;
  discount_start?: string;
  discount_end?: string;
  image_url: string;
  category: {
    id: string;
    name: string;
    slug: string;
    description: string;
  };
  tags: string[];
  status: 'active' | 'inactive';
  is_available: boolean;
  is_featured: boolean;
  stock: number;
  related_products?: string[];
  brand?: string;
  rating?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}