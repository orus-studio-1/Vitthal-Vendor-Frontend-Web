'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Package, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Star, 
  Calendar,
  DollarSign,
  Eye,
  BarChart3,
  MessageSquare,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { productApi, ProductAnalytics, ProductReview, ProductDetails, ReviewStats } from '@/lib/api';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function VendorProductViewPage() {
  const params = useParams();
  const productId = params.id as string;

  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsStats, setReviewsStats] = useState<ReviewStats | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reviews'>('overview');
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, reviewsPage]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [detailsResponse, analyticsResponse] = await Promise.all([
        productApi.getProductDetails(productId),
        productApi.getProductAnalytics(productId)
      ]);

      const rawDetails = detailsResponse.data as (ProductDetails & Record<string, any>) | undefined;
      const analyticsData = analyticsResponse.data;
      if (analyticsData) {
        setAnalytics(analyticsData);
        setTotalReviews(analyticsData.total_reviews);
      }
      if (rawDetails) {
        const firstVariant = Array.isArray(rawDetails.variants) ? rawDetails.variants[0] : undefined;
        const rawPrice = rawDetails.price ?? analyticsData?.price ?? firstVariant?.price;
        const price = rawPrice == null || rawPrice === "" ? undefined : Number(rawPrice);
        setProductDetails({
          ...rawDetails,
          id: rawDetails.id ?? rawDetails.product_id,
          name: rawDetails.name ?? rawDetails.product_name,
          price: Number.isFinite(price) ? price : undefined,
          moq: Number(rawDetails.moq ?? analyticsData?.moq ?? firstVariant?.moq) || 1,
          stock_quantity: Number(rawDetails.stock_quantity ?? analyticsData?.stock_quantity ?? firstVariant?.stock_quantity) || 0,
          is_active: Boolean(rawDetails.is_active ?? analyticsData?.is_active ?? firstVariant?.is_active),
          created_at: rawDetails.created_at ?? analyticsData?.vendor_product_created_at,
          updated_at: rawDetails.updated_at ?? analyticsData?.vendor_product_updated_at,
          images: Array.isArray(rawDetails.images)
            ? rawDetails.images.map((image: string | { image_url?: string }) => typeof image === "string" ? image : image.image_url || "").filter(Boolean)
            : [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await productApi.getProductReviews(productId, reviewsPage, 10);
      if (response.data) {
        const mappedReviews = response.data.reviews.map((r: any) => ({
          id: r.review_id,
          rating: r.rating,
          review_text: r.review_text,
          created_at: r.review_date,
          user_name: r.customer_name,
          user_email: r.customer_email,
          helpful_count: r.helpful_count || 0,
          verified_purchase: r.verified_purchase,
          images: r.images || [],
        }));
        setReviews(mappedReviews);
        setReviewsStats(response.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = amount == null || amount === '' ? Number.NaN : Number(amount);
    if (!Number.isFinite(numAmount)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || !Number.isFinite(new Date(dateString).getTime())) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const monthlySalesChartData = analytics ? {
    labels: analytics.monthly_sales.map(sale => 
      new Date(sale.month).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    ).reverse(),
    datasets: [
      {
        label: 'Revenue',
        data: analytics.monthly_sales.map(sale => sale.revenue).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Orders',
        data: analytics.monthly_sales.map(sale => sale.orders_count).reverse(),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        yAxisID: 'y1',
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue (₹)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Orders',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Product</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!productDetails || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{productDetails.name}</h1>
                <p className="text-sm text-gray-500">{productDetails.category} • {productDetails.product_type}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                productDetails.is_active 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              )}>
                {productDetails.is_active ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Inactive
                  </>
                )}
              </span>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Package },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center px-1 py-4 border-b-2 text-sm font-medium",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Product Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Price</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(productDetails.price)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Stock Quantity</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.stock_quantity.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingCart className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">MOQ</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.moq.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Rating</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.product_rating ? Number(analytics.product_rating).toFixed(1) : '0.0'}
                      <span className="text-sm text-gray-500 ml-1">({analytics.total_reviews})</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                    <p className="text-gray-900">{productDetails.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Product Information</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Category:</dt>
                        <dd className="text-sm font-medium text-gray-900">{productDetails.category}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Product Type:</dt>
                        <dd className="text-sm font-medium text-gray-900">{productDetails.product_type}</dd>
                      </div>
                      {productDetails.material && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Material:</dt>
                          <dd className="text-sm font-medium text-gray-900">{productDetails.material}</dd>
                        </div>
                      )}
                      {productDetails.grade && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Grade:</dt>
                          <dd className="text-sm font-medium text-gray-900">{productDetails.grade}</dd>
                        </div>
                      )}
                      {productDetails.application && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Application:</dt>
                          <dd className="text-sm font-medium text-gray-900">{productDetails.application}</dd>
                        </div>
                      )}
                      {productDetails.standard && (
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-500">Standard:</dt>
                          <dd className="text-sm font-medium text-gray-900">{productDetails.standard}</dd>
                        </div>
                      )}
                      {productDetails.attributes && Object.entries(productDetails.attributes)
                        .filter(([key]) => !["material", "grade", "application", "standard"].includes(key.toLowerCase()))
                        .map(([key, value]) => (
                          <div className="flex justify-between" key={key}>
                            <dt className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</dt>
                            <dd className="text-sm font-medium text-gray-900 text-right max-w-[60%] whitespace-pre-wrap">{String(value)}</dd>
                          </div>
                        ))}
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Created:</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatDate(productDetails.created_at)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Last Updated:</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatDate(productDetails.updated_at)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Performance Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{analytics.total_orders}</p>
                    <p className="text-sm text-gray-500 mt-1">Total Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(analytics.total_revenue)}</p>
                    <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{analytics.cart_additions}</p>
                    <p className="text-sm text-gray-500 mt-1">Cart Additions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">{analytics.conversion_rate ? Number(analytics.conversion_rate).toFixed(1) : '0.0'}%</p>
                    <p className="text-sm text-gray-500 mt-1">Conversion Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.total_revenue)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">12.5%</span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Orders</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.total_orders}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">8.2%</span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.avg_order_value)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-600 font-medium">3.1%</span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Page Views</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.total_views.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">15.3%</span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue & Orders Trend</h3>
                {monthlySalesChartData && (
                  <Line data={monthlySalesChartData} options={chartOptions} />
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Sales Quantity</h3>
                {monthlySalesChartData && (
                  <Bar 
                    data={{
                      labels: monthlySalesChartData.labels,
                      datasets: [
                        {
                          label: 'Quantity Sold',
                          data: analytics.monthly_sales.map(sale => sale.quantity_sold).reverse(),
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Quantity',
                          },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.recent_orders.map((order) => (
                      <tr key={order.order_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.order_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.order_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(order.total_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                            order.order_status === 'completed' ? "bg-green-100 text-green-800" :
                            order.order_status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                            order.order_status === 'cancelled' ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          )}>
                            {order.order_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Reviews Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">{analytics.product_rating ? Number(analytics.product_rating).toFixed(1) : '0.0'}</p>
                  <div className="flex items-center justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-5 w-5",
                          i < Math.floor(Number(analytics.product_rating) || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{analytics.total_reviews} reviews</p>
                </div>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviewsStats?.rating_distribution[rating as 1 | 2 | 3 | 4 | 5] || 0;
                      const total = reviewsStats?.total_reviews || 0;
                      const percent = total > 0 ? (count / total) * 100 : 0;

                      return (
                        <div key={rating} className="flex items-center">
                          <span className="text-sm text-gray-600 w-3">{rating}</span>
                          <Star className="h-4 w-4 text-yellow-400 fill-current mx-1" />
                          <div className="flex-1 mx-3">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {reviewsLoading ? (
                  <div className="p-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                    i < review.rating
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                            {review.verified_purchase && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 mb-2">{review.review_text}</p>
                          {review.images && review.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 mt-2">
                              {review.images.map((imgUrl, idx) => (
                                <div key={idx} className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                    src={imgUrl} 
                                    alt={`Attachment ${idx + 1}`} 
                                    className="h-full w-full object-cover cursor-zoom-in hover:scale-105 transition-transform"
                                    onClick={() => window.open(imgUrl, '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="font-medium">{review.user_name}</span>
                            <span className="mx-2">•</span>
                            <span>{formatDate(review.created_at)}</span>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <span className="text-sm">👍 {review.helpful_count}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No reviews yet.
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {totalReviews > 10 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {reviewsPage * 10 + 1} to {Math.min((reviewsPage + 1) * 10, totalReviews)} of {totalReviews} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setReviewsPage(Math.max(0, reviewsPage - 1))}
                        disabled={reviewsPage === 0}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setReviewsPage(reviewsPage + 1)}
                        disabled={(reviewsPage + 1) * 10 >= totalReviews}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
