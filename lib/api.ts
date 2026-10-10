const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
const QUOTATION_API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:9001';

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
  images: string[];
}

export interface ReviewStats {
  total_reviews: number;
  avg_rating: string;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewsResponse {
  reviews: any[];
  stats: ReviewStats;
  pagination: {
    current_page: number;
    per_page: number;
    has_more: boolean;
  };
}

export interface ProductDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  product_type: string;
  rating: number;
  review_count: number;
  price?: number;
  moq: number;
  stock_quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  images: string[];
  specifications: Record<string, any>;
  attributes?: Record<string, any>;
  material?: string;
  grade?: string;
  application?: string;
  standard?: string;
}

export interface VendorQuotationSummary {
  id: string;
  status: string;
  requested_quantity: number;
  requested_price: number | null;
  current_offer_price: number | null;
  current_offer_quantity: number | null;
  current_offer_by: string | null;
  accepted_price: number | null;
  accepted_quantity: number | null;
  rejection_reason: string | null;
  buyer_city: string | null;
  buyer_state: string | null;
  buyer_country: string | null;
  buyer_pincode: string | null;
  buyer_id: string;
  created_at: string;
  updated_at: string;
  product_name: string;
  vendor_document_url?: string | null;
  vendor_document_s3_key?: string | null;
  order_id?: string | null;
  unit?: string | null;
}

export interface VendorQuotationMessage {
  id: string;
  sender_role: string;
  action: string;
  offer_price: number | null;
  offer_quantity: number | null;
  note: string | null;
  reason: string | null;
  created_at: string;
}

export interface VendorQuotationDetail {
  quotation: VendorQuotationSummary & { product_id: string };
  messages: VendorQuotationMessage[];
}

export type PublicVendorQuotationStatus =
  | "sent"
  | "vendor_opened"
  | "vendor_approved"
  | "vendor_rejected"
  | "admin_approved"
  | "admin_rejected";

export interface PublicVendorQuotation {
  id: string;
  quotation_number: string;
  quotation_kind: "vendor_agreement" | "order_request";
  vendor_id: string;
  product_id: string | null;
  sent_to_email: string;
  title: string;
  quantity: number;
  unit: string;
  target_price: number | null;
  requested_moq: number | null;
  request_notes: string | null;
  validity_date: string | null;
  status: PublicVendorQuotationStatus;
  vendor_price: number | null;
  vendor_moq: number | null;
  vendor_notes: string | null;
  vendor_rejection_reason: string | null;
  token_expires_at: string;
  vendor_opened_at: string | null;
  vendor_responded_at: string | null;
  company_name: string;
  vendor_name: string;
  business_type?: string;
  gst_number?: string;
  company_website?: string;
  alternative_number?: string;
  designation?: string;
  business_description?: string;
  credit_cycle?: string;
  minimum_commision_percentage?: number | null;
  maximum_commision_percentage?: number | null;
  created_by_admin_name: string;
  admin_reviewed_at: string | null;
  admin_review_notes: string | null;
  categories?: Array<{
    code: string;
    label: string;
    min_commision_percentage: number;
    max_commision_percentage: number;
  }>;
}

export interface VendorAdminQuotationSummary {
  id: string;
  quotation_number: string;
  quotation_kind: "vendor_agreement" | "order_request";
  product_id: string | null;
  title: string;
  quantity: number;
  unit: string;
  target_price: number | null;
  requested_moq: number | null;
  request_notes: string | null;
  validity_date: string | null;
  status: PublicVendorQuotationStatus;
  vendor_price: number | null;
  vendor_moq: number | null;
  vendor_notes: string | null;
  vendor_rejection_reason: string | null;
  vendor_opened_at: string | null;
  vendor_responded_at: string | null;
  admin_reviewed_at: string | null;
  admin_review_notes: string | null;
  company_name: string;
  vendor_name: string;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vendor_token') : null;
    return {
      'Content-Type': 'application/json',
      'x-request-from': 'vendor',
      ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
    };
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `API request failed with status ${response.status}`);
    }

    throw new Error('Server returned a non-JSON response.');
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: "include"
      });

      const data = await this.parseResponse<T>(response);

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
        credentials: "include"
      });

      const data = await this.parseResponse<T>(response);

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
        credentials: "include"
      });

      const data = await this.parseResponse<T>(response);

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

      const data = await this.parseResponse<T>(response);

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
  getProductReviews: async (productId: string, offset = 0, limit = 10): Promise<ApiResponse<ReviewsResponse>> => {
    return apiClient.get<ReviewsResponse>(`/products/vendor/product/${productId}/reviews?offset=${offset}&limit=${limit}`);
  },

  // Update vendor product
  updateVendorProduct: async (productId: string, updates: Partial<ProductDetails>): Promise<ApiResponse<ProductDetails>> => {
    return apiClient.put<ProductDetails>(`/products/vendor/product/${productId}`, updates);
  },
};

export const vendorQuotationApi = {
  listDashboardQuotations: async (): Promise<ApiResponse<VendorAdminQuotationSummary[]>> => {
    const response = await fetch(`${QUOTATION_API_BASE_URL}/api/quotations/vendor/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-request-from': 'vendor',
      },
      credentials: 'include',
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(text || 'Quotation service returned a non-JSON response.');
    }

    const data = (await response.json()) as ApiResponse<VendorAdminQuotationSummary[]>;
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load dashboard quotations');
    }

    return data;
  },

  getQuotation: async (token: string): Promise<ApiResponse<PublicVendorQuotation>> => {
    const response = await fetch(`${QUOTATION_API_BASE_URL}/api/quotations/vendor/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-request-from': 'vendor',
      },
      credentials: 'include',
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(text || 'Quotation service returned a non-JSON response.');
    }

    const data = (await response.json()) as ApiResponse<PublicVendorQuotation>;
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load quotation');
    }

    return data;
  },

  respondToQuotation: async (
    token: string,
    payload:
      | {
        decision: "approved";
        vendorPrice?: number | null;
        vendorMoq?: number | null;
        vendorNotes?: string;
        vendorSignatureData: string;
      }
      | {
        decision: "rejected";
        rejectionReason: string;
      }
  ): Promise<ApiResponse<PublicVendorQuotation>> => {
    const response = await fetch(`${QUOTATION_API_BASE_URL}/api/quotations/vendor/${token}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-from': 'vendor',
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(text || 'Quotation service returned a non-JSON response.');
    }

    const data = (await response.json()) as ApiResponse<PublicVendorQuotation>;
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit quotation response');
    }

    return data;
  },

  getQuotationPdfUrl: (token: string) => `${QUOTATION_API_BASE_URL}/api/quotations/vendor/${token}/pdf`,
};

export const vendorNegotiationApi = {
  listQuotations: async (): Promise<ApiResponse<VendorQuotationSummary[]>> => {
    return apiClient.get<VendorQuotationSummary[]>(`/quotations/vendor/list`);
  },

  getQuotation: async (id: string): Promise<ApiResponse<VendorQuotationDetail>> => {
    return apiClient.get<VendorQuotationDetail>(`/quotations/vendor/${id}`);
  },

  respondToQuotation: async (id: string, payload: {
    action: "offer" | "counter" | "reject" | "accept";
    offerPrice?: number;
    offerQuantity?: number;
    deliveryDays?: number;
    tokenPercentage?: number;
    reason?: string;
    note?: string;
  }): Promise<ApiResponse<void>> => {
    return apiClient.post<void>(`/quotations/vendor/${id}/respond`, payload);
  },

  requestDispatchPayment: async (id: string, note?: string): Promise<ApiResponse<void>> => {
    return apiClient.post<void>(`/quotations/vendor/${id}/request-dispatch-payment`, { note });
  },
};

export interface VendorChatMessage {
  id: string;
  vendorId: string;
  senderUserId: string;
  senderRole: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface VendorChatResponse {
  vendor: {
    id: string;
    user_id: string;
    company_name: string;
    name: string;
    email: string;
  };
  messages: VendorChatMessage[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export const vendorChatApi = {
  getMessages: async (page = 1, limit = 50): Promise<ApiResponse<VendorChatResponse>> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vendor_token') : null;
    const response = await fetch(`${QUOTATION_API_BASE_URL}/api/vendors/chat?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-request-from': 'vendor',
        ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "API request failed");
    return data;
  },

  sendMessage: async (body: string): Promise<ApiResponse<VendorChatMessage>> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vendor_token') : null;
    const response = await fetch(`${QUOTATION_API_BASE_URL}/api/vendors/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-from': 'vendor',
        ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ body }),
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "API request failed");
    return data;
  },
};

export const vendorPayoutApi = {
  listPayouts: async (): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/orders/vendor/payouts`);
  },
  requestPayout: async (transactionType: 'order' | 'service', transactionId: string) => {
    return apiClient.post(`/orders/vendor/payouts/${transactionType}/${transactionId}/request`);
  },
  getBankDetails: async () => {
    return apiClient.get<{
      bank_name: string | null;
      account_holder_name: string | null;
      account_last_four: string | null;
      ifsc_code: string | null;
      cheque_uploaded: boolean;
    }>(`/vendors/payout-bank-details`);
  },
  updateBankDetails: async (formData: FormData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vendor_token') : null;
    const response = await fetch(`${API_BASE_URL}/api/vendors/payout-bank-details`, {
      method: 'PUT',
      headers: {
        'x-request-from': 'vendor',
        ...(token && token !== 'null' && token !== 'undefined' && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to update bank details');
    return data;
  },
};
