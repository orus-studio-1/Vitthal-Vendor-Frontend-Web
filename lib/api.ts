const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface ProductAnalytics {
  price: number;
  moq: number;
  stock_quantity: number;
  is_active: boolean;
  vendor_product_created_at: string;
  vendor_product_updated_at: string;
  product_name: string;
  category: string;
  product_type: string;
  product_rating: number;
  total_reviews: number;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  last_order_date: string | null;
  total_views: number;
  unique_views: number;
  cart_additions: number;
  conversion_rate: number;
  monthly_sales: MonthlySale[];
  recent_orders: RecentOrder[];
}

export interface MonthlySale {
  month: string;
  orders_count: number;
  revenue: number;
  quantity_sold: number;
}

export interface RecentOrder {
  order_id: string;
  order_date: string;
  total_amount: number;
  order_status: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customer_name: string;
  customer_email: string;
}

export interface ProductReview {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_name: string;
  user_email: string;
  helpful_count: number;
  verified_purchase: boolean;
}

export interface ProductDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  product_type: string;
  rating: number;
  review_count: number;
  price: number;
  moq: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: string[];
  specifications: Record<string, any>;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vendor_token') : null;
    return {
      'Content-Type': 'application/json',
      'x-request-from' : 'vendor',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials : "include"
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials : "include"
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials : "include"
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();

// Product specific API calls
export const productApi = {
  // Get vendor product details
  getProductDetails: async (productId: string): Promise<ApiResponse<ProductDetails>> => {
    return apiClient.get<ProductDetails>(`/products/vendor/product/${productId}`);
  },

  // Get product analytics
  getProductAnalytics: async (productId: string): Promise<ApiResponse<ProductAnalytics>> => {
    return apiClient.get<ProductAnalytics>(`/products/vendor/product/${productId}/analytics`);
  },

  // Get product reviews
  getProductReviews: async (productId: string, offset = 0, limit = 10): Promise<ApiResponse<{ reviews: ProductReview[], total: number }>> => {
    return apiClient.get<{ reviews: ProductReview[], total: number }>(`/products/vendor/product/${productId}/reviews?offset=${offset}&limit=${limit}`);
  },

  // Update vendor product
  updateVendorProduct: async (productId: string, updates: Partial<ProductDetails>): Promise<ApiResponse<ProductDetails>> => {
    return apiClient.put<ProductDetails>(`/products/vendor/product/${productId}`, updates);
  },
};
