"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Download,
  Printer,
  MoreVertical,
  Check,
  X,
} from "lucide-react";

interface OrderItem {
  product_id: string;
  product_name: string;
  product_description: string | null;
  image_url: string | null;
  quantity: number;
  price: number;
}

interface Order {
  order_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: string;
  langitude: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: OrderItem[];
}

const OrderDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/vendor/${orderId}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
        },
      );

      if (res.ok) {
        const result = await res.json();
        setOrder(result.data);
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login");
      } else if (res.status === 404) {
        setError("Order not found");
      } else {
        setError("Failed to fetch order details");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatOrderId = (id: string): string => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return (
      map[status.toLowerCase()] ||
      status.charAt(0).toUpperCase() + status.slice(1)
    );
  };

  const getStatusIcon = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "delivered") return <CheckCircle2 className="w-5 h-5" />;
    if (normalized === "processing") return <CheckCircle2 className="w-5 h-5" />;
    if (normalized === "shipped") return <Truck className="w-5 h-5" />;
    if (normalized === "cancelled") return <XCircle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "delivered" || normalized === "processing") {
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: "text-emerald-600",
      };
    }
    if (normalized === "shipped") {
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: "text-blue-600",
      };
    }
    if (normalized === "cancelled") {
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        icon: "text-rose-600",
      };
    }
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: "text-amber-600",
    };
  };

  const getPaymentStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "paid") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (normalized === "failed") {
      return "bg-rose-100 text-rose-700";
    }
    return "bg-amber-100 text-amber-700";
  };

  const calculateSubtotal = (items: OrderItem[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/vendor/${order.order_id}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        // Update local state
        setOrder((prevOrder) => 
          prevOrder ? { ...prevOrder, status: newStatus } : null
        );
      } else {
        console.error("Failed to update order status");
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextStatusOptions = () => {
    if (!order) return [];
    
    const currentStatus = order.status.toLowerCase();
    const options = [];
    
    if (currentStatus === "pending") {
      options.push({ value: "processing", label: "Accept Order", color: "bg-emerald-600 hover:bg-emerald-700" });
      options.push({ value: "cancelled", label: "Reject Order", color: "bg-rose-600 hover:bg-rose-700" });
    } else if (currentStatus === "processing") {
      options.push({ value: "shipped", label: "Mark as Shipped", color: "bg-blue-600 hover:bg-blue-700" });
    } else if (currentStatus === "shipped") {
      options.push({ value: "delivered", label: "Mark as Delivered", color: "bg-emerald-600 hover:bg-emerald-700" });
    }
    
    return options;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10">
        <div className="max-w-[1400px] mx-auto">
          <button
            onClick={() => router.push("/orders")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
          <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-12 text-center">
            <p className="text-red-500 font-medium mb-4">
              {error || "Order not found"}
            </p>
            <button
              onClick={fetchOrderDetails}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = getStatusColor(order.status);
  const subtotal = calculateSubtotal(order.items);

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/orders")}
              className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Order {formatOrderId(order.order_id)}
              </h1>
              <p className="text-gray-500 text-sm font-medium mt-0.5">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            {getNextStatusOptions().length > 0 && (
              <div className="flex items-center gap-2">
                {getNextStatusOptions().map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => updateOrderStatus(option.value)}
                    disabled={isUpdating}
                    className={`px-4 py-2.5 text-white rounded-xl transition-all text-sm font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${option.color}`}
                  >
                    {isUpdating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      option.value === "confirmed" ? <Check className="w-4 h-4" /> :
                      option.value === "cancelled" ? <X className="w-4 h-4" /> :
                      option.value === "shipped" ? <Truck className="w-4 h-4" /> :
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`${statusColors.bg} ${statusColors.border} border rounded-2xl p-5`}
          >
            <div className="flex items-center gap-3">
              <div className={`${statusColors.icon} p-2 bg-white rounded-xl`}>
                {getStatusIcon(order.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Order Status
                </p>
                <p className={`text-lg font-bold ${statusColors.text}`}>
                  {getStatusLabel(order.status)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl text-gray-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Payment Status
                </p>
                <p
                  className={`text-lg font-bold capitalize ${getPaymentStatusColor(order.payment_status)} px-3 py-0.5 rounded-lg inline-block mt-1`}
                >
                  {order.payment_status}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl text-gray-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Last Updated
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(order.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100/80">
                <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  {order.items.length} products in this order
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-6 flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {item.product_name}
                      </h3>
                      {item.product_description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {item.product_description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm text-gray-500">
                          Qty:{" "}
                          <span className="font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Price:{" "}
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(item.price)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-gray-50/50 border-t border-gray-100/80">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Shipping</span>
                    <span className="font-semibold text-gray-900">Free</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Customer</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-xl text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Name</p>
                    <p className="font-semibold text-gray-900">
                      {order.customer_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-xl text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email</p>
                    <p className="font-semibold text-gray-900">
                      {order.customer_email}
                    </p>
                  </div>
                </div>
                {order.customer_phone && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-xl text-gray-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Phone</p>
                      <p className="font-semibold text-gray-900">
                        {order.customer_phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Shipping Address
              </h2>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-xl text-gray-500 flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.customer_name}
                  </p>
                  <p className="text-gray-600 mt-1">{order.address_line}</p>
                  <p className="text-gray-600">
                    {order.city}, {order.state} - {order.pincode}
                  </p>
                  <p className="text-gray-600">{order.country}</p>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${order.status !== "pending" ? "bg-emerald-500" : "bg-gray-300"}`}
                    ></div>
                    <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                  </div>
                  <div>
                    <p
                      className={`font-semibold ${order.status !== "pending" ? "text-gray-900" : "text-gray-400"}`}
                    >
                      Confirmed
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.status !== "pending"
                        ? "Order has been confirmed"
                        : "Awaiting confirmation"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${order.status === "shipped" || order.status === "delivered" ? "bg-emerald-500" : "bg-gray-300"}`}
                    ></div>
                    <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                  </div>
                  <div>
                    <p
                      className={`font-semibold ${order.status === "shipped" || order.status === "delivered" ? "text-gray-900" : "text-gray-400"}`}
                    >
                      Shipped
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.status === "shipped" ||
                      order.status === "delivered"
                        ? "Order has been shipped"
                        : "Awaiting shipment"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${order.status === "delivered" ? "bg-emerald-500" : "bg-gray-300"}`}
                    ></div>
                  </div>
                  <div>
                    <p
                      className={`font-semibold ${order.status === "delivered" ? "text-gray-900" : "text-gray-400"}`}
                    >
                      Delivered
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.status === "delivered"
                        ? "Order has been delivered"
                        : "Awaiting delivery"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
