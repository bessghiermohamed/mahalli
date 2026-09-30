// Hand-written database types matching supabase/migrations/0001_init.sql.
// numeric columns are returned by PostgREST as strings — convert with `num()` from lib/utils.

export type OrderStatus =
  | "new"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  bio: string | null;
  whatsapp: string;
  instagram: string | null;
  facebook: string | null;
  default_delivery_fee: number | null; // string from API — use num()
  created_at: string;
  updated_at: string;
}

export interface Wilaya {
  id: number;
  code: number;
  name_ar: string;
  name_fr: string;
  default_delivery_fee: number; // string from API — use num()
}

export interface StoreDeliveryFee {
  id: string;
  store_id: string;
  wilaya_id: number;
  fee: number; // string from API — use num()
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number; // string from API — use num()
  stock: number | null; // string|null from API — use num()
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  wilaya_id: number;
  commune: string;
  address: string;
  notes: string | null;
  subtotal: number; // string from API — use num()
  delivery_fee: number; // string from API — use num()
  total: number; // string from API — use num()
  status: OrderStatus;
  client_request_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price_snapshot: number; // string from API — use num()
  quantity: number;
  subtotal: number; // string from API — use num()
}

// Joined shapes used by queries
export type OrderWithRelations = Order & {
  wilaya: Pick<Wilaya, "code" | "name_ar" | "name_fr"> | null;
  order_items: Pick<
    OrderItem,
    "id" | "product_name_snapshot" | "unit_price_snapshot" | "quantity" | "subtotal"
  >[];
};

export type ProductWithImages = Product & {
  product_images: ProductImage[];
};

export interface StoreStats {
  total_orders: number;
  month_orders: number;
  revenue: number;
  month_revenue: number;
  delivered: number;
  cancelled: number;
  new_orders: number;
  top_products: { name: string; qty: number; revenue: number }[];
}

export interface PublicOrderResult {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  commune: string;
  address: string;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  wilaya: { code: number; name_ar: string; name_fr: string } | null;
  items: {
    name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }[];
}
