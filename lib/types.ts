export type OrderStatus = 'new' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'

export interface ServiceZone {
  id: string
  city_name: string
  center_lat: number
  center_lng: number
  radius_km: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  unit: string
  image_url: string | null
  in_stock: boolean
  created_at: string
}

export interface OrderItem {
  product_id: string
  name: string
  price: number
  qty: number
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  delivery_lat: number
  delivery_lng: number
  delivery_address_text: string
  service_zone_id: string
  items: OrderItem[]
  total_amount: number
  status: OrderStatus
  created_at: string
}

export interface CartItem extends Product {
  qty: number
}

// Minimal Database type for Supabase client generic
export interface Database {
  public: {
    Tables: {
      service_zones: { Row: ServiceZone; Insert: Omit<ServiceZone, 'id' | 'created_at'>; Update: Partial<ServiceZone> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at'>; Update: Partial<Product> }
      orders: { Row: Order; Insert: Omit<Order, 'id' | 'created_at' | 'status'>; Update: Partial<Order> }
    }
    Functions: {
      is_within_service_zone: { Args: { lat: number; lng: number }; Returns: string | null }
    }
  }
}
