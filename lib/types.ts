export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cod'
export type OrderStatus = 'placed' | 'preparing' | 'out_for_delivery' | 'delivered'

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
  category: string
  description: string | null
  price: number
  original_price: number | null
  unit: string
  image_url: string | null
  is_in_stock: boolean
  is_drop_offer: boolean
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
}

export interface Order {
  id: string
  order_number: number
  customer_name: string
  phone_number: string
  address_notes: string
  delivery_lat: number
  delivery_lng: number
  total_amount: number
  payment_status: PaymentStatus
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  order_status: OrderStatus
  created_at: string
}

export interface CartItem extends Product {
  qty: number
}

export interface Database {
  public: {
    Tables: {
      service_zones: { Row: ServiceZone; Insert: Omit<ServiceZone, 'id' | 'created_at'>; Update: Partial<ServiceZone> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at'>; Update: Partial<Product> }
      drop_order_count: { Row: { count: number }; Insert: never; Update: never }
      orders: { Row: Order; Insert: Omit<Order, 'id' | 'order_number' | 'created_at'>; Update: Partial<Order> }
      order_items: { Row: OrderItem; Insert: Omit<OrderItem, 'id'>; Update: Partial<OrderItem> }
    }
    Functions: {
      check_delivery_zone: { Args: { user_lat: number; user_lng: number }; Returns: { zone_id: string; city_name: string }[] }
    }
  }
}
