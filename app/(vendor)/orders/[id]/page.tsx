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
  Check,
  X,
  Store,
  Warehouse,
  Navigation,
  Send,
  ArrowRight,
  Lock,
} from "lucide-react";
import { downloadPdfReport } from "@/lib/export-utils";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────

interface OrderItem {
  product_id: string;
  product_name: string;
  product_description: string | null;
  image_url: string | null;
  quantity: number;
  price: number;
  variant_properties?: Record<string, string>;
}

interface Order {
  order_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  pickup_otp: string | null;
  created_at: string;
  updated_at: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: string;
  langitude: string;
  vendor_city: string | null;
  vendor_state: string | null;
  vendor_latitude: number | null;
  vendor_longitude: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: OrderItem[];
}

interface StatusHistoryEntry {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
}

interface FulfillmentEntry {
  id: string;
  fulfillment_status: string;
  fulfillment_note: string | null;
  fulfillment_updated_at: string;
  stop_sequence: number | null;
  location_label: string | null;
  center_id: string | null;
  center_name: string | null;
  center_address: string | null;
  center_city: string | null;
  center_state: string | null;
  center_country: string | null;
  center_pincode: string | null;
  center_latitude: number | null;
  center_longitude: number | null;
}

interface RoutePlanStop {
  id: string;
  stop_sequence: number;
  fulfillment_center_id: string;
  center_name: string;
  center_city: string;
  center_state: string;
  center_pincode: string | null;
  center_latitude: number | null;
  center_longitude: number | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  status: string;
}

interface DispatchInfo {
  order_id: string;
  quotation_request_id: string | null;
  token_percentage: number | null;
  token_amount_expected: number | null;
  total_order_amount_excl_gst: number;
  total_with_gst: number;
  dispatch_amount_expected: number | null;
  dispatch_percentage: number | null;
  total_amount_paid: number;
  remaining_balance: number;
  is_fully_paid: boolean;
  can_vendor_request_dispatch: boolean;
  can_client_pay_dispatch: boolean;
  latest_dispatch_request: any | null;
  successful_payments: any[];
}

interface Order {
  order_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  pickup_otp: string | null;
  created_at: string;
  updated_at: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: string;
  langitude: string;
  vendor_city: string | null;
  vendor_state: string | null;
  vendor_latitude: number | null;
  vendor_longitude: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: OrderItem[];
  dispatch?: DispatchInfo;
}

interface TrackingData {
  order: {
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
    order_reference: string | null;
    order_notes: string | null;
    vendor_name: string;
    vendor_id: string;
    vendor_city: string | null;
    vendor_state: string | null;
    vendor_latitude: number | null;
    vendor_longitude: number | null;
  };
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
  fulfillmentTracking: FulfillmentEntry[];
  routePlan: RoutePlanStop[];
}

// ── Helpers ─────────────────────────────────────────────────────────────

const formatOrderId = (id: string): string => `#${id.slice(0, 8).toUpperCase()}`;

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatShortDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
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
    awaiting_dispatch: "Awaiting Dispatch",
    dispatch_payment_pending: "Dispatch Payment Pending",
    ready_for_pickup: "Ready for Pickup",
  };
  return map[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusIcon = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "delivered") return <CheckCircle2 className="w-5 h-5" />;
  if (normalized === "processing") return <CheckCircle2 className="w-5 h-5" />;
  if (normalized === "shipped") return <Truck className="w-5 h-5" />;
  if (normalized === "cancelled") return <XCircle className="w-5 h-5" />;
  if (normalized === "ready_for_pickup") return <CheckCircle2 className="w-5 h-5" />;
  if (normalized === "dispatch_payment_pending") return <Clock className="w-5 h-5" />;
  if (normalized === "awaiting_dispatch") return <Clock className="w-5 h-5" />;
  return <Clock className="w-5 h-5" />;
};

const getStatusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "delivered" || normalized === "processing") {
    return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "text-emerald-600" };
  }
  if (normalized === "shipped") {
    return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "text-blue-600" };
  }
  if (normalized === "cancelled") {
    return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: "text-rose-600" };
  }
  if (normalized === "ready_for_pickup") {
    return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: "text-indigo-600" };
  }
  if (normalized === "dispatch_payment_pending") {
    return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "text-orange-600" };
  }
  if (normalized === "awaiting_dispatch") {
    return { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", icon: "text-sky-600" };
  }
  return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "text-amber-600" };
};

const getPaymentStatusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "paid") return "bg-emerald-100 text-emerald-700";
  if (normalized === "failed") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

const calculateSubtotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// ── Route Journey Map (Vendor Version) ──────────────────────────────────

function VendorRouteJourneyMap({
  routePlan,
  trackingOrder,
  buyerCity,
  buyerState,
  buyerPincode,
}: {
  routePlan: RoutePlanStop[];
  trackingOrder: TrackingData["order"];
  buyerCity: string;
  buyerState: string;
  buyerPincode: string;
}) {
  const sellerLocation = trackingOrder.vendor_city && trackingOrder.vendor_state
    ? `${trackingOrder.vendor_city}, ${trackingOrder.vendor_state}`
    : trackingOrder.vendor_name || "Your Warehouse";

  const buyerLocation = `${buyerCity}, ${buyerState}`;
  const currentStatus = trackingOrder.status.toLowerCase();
  const sellerDone = currentStatus !== "pending";
  const buyerDone = currentStatus === "delivered";

  const completedStops = routePlan.filter(
    (s) => s.status === "departed" || s.status === "arrived"
  ).length;
  const inTransitStops = routePlan.filter((s) => s.status === "in_transit").length;
  const totalStops = routePlan.length + 2;
  const isOrderShipped = ["shipped", "delivered"].includes(currentStatus);
  const isDelivered = currentStatus === "delivered";

  const progressPercent = isDelivered
    ? 100
    : ((1 + completedStops + inTransitStops * 0.5) / (totalStops - 1)) * 100;

  const getStopStyles = (status: string) => {
    switch (status) {
      case "departed":
      case "arrived":
        return {
          ring: "ring-emerald-500 bg-emerald-500",
          icon: "text-white",
          badge: "bg-emerald-100 text-emerald-700",
          badgeText: status === "departed" ? "Departed" : "Arrived",
        };
      case "in_transit":
        return {
          ring: "ring-blue-500 bg-blue-500 animate-pulse",
          icon: "text-white",
          badge: "bg-blue-100 text-blue-700",
          badgeText: "In Transit",
        };
      default:
        return {
          ring: "ring-zinc-300 bg-white",
          icon: "text-zinc-400",
          badge: "bg-zinc-100 text-zinc-500",
          badgeText: "Upcoming",
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Shipment Route</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {routePlan.length} fulfillment {routePlan.length === 1 ? "center" : "centers"} on route
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{Math.round(progressPercent)}%</p>
          <p className="text-xs text-gray-500">Journey Complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Journey stops */}
      <div className="p-6">
        <div className="space-y-0">
          {/* Seller (Your warehouse) */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-2 shrink-0 ${
                sellerDone ? "ring-emerald-500 bg-emerald-500" : "ring-amber-400 bg-amber-400 animate-pulse"
              }`}>
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className={`w-0.5 flex-1 min-h-[40px] ${
                sellerDone && routePlan.length > 0
                  ? routePlan[0].status !== "upcoming"
                    ? "bg-emerald-500"
                    : "bg-gradient-to-b from-emerald-500 to-gray-200"
                  : "bg-gray-200"
              }`} />
            </div>
            <div className="pb-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-gray-900">Your Warehouse</p>
                {sellerDone && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> Dispatched
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{sellerLocation}</p>
            </div>
          </div>

          {/* FC Stops */}
          {routePlan.map((stop, index) => {
            const styles = getStopStyles(stop.status);
            const isLast = index === routePlan.length - 1;
            const nextStop = routePlan[index + 1];

            return (
              <div key={stop.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-2 shrink-0 ${styles.ring}`}>
                    <Warehouse className={`w-5 h-5 ${styles.icon}`} />
                  </div>
                  <div className={`w-0.5 flex-1 min-h-[40px] ${
                    stop.status === "departed"
                      ? isLast
                        ? isDelivered || isOrderShipped ? "bg-emerald-500"
                          : "bg-gradient-to-b from-emerald-500 to-gray-200"
                        : nextStop?.status !== "upcoming"
                          ? "bg-emerald-500"
                          : "bg-gradient-to-b from-emerald-500 to-gray-200"
                      : stop.status === "in_transit" || stop.status === "arrived"
                        ? "bg-gradient-to-b from-blue-400 to-gray-200"
                        : "bg-gray-200"
                  }`} />
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-bold ${stop.status === "upcoming" ? "text-gray-400" : "text-gray-900"}`}>
                      {stop.center_name}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles.badge}`}>
                      {stop.status === "departed" && <CheckCircle2 className="w-3 h-3" />}
                      {stop.status === "in_transit" && <Truck className="w-3 h-3" />}
                      {stop.status === "arrived" && <MapPin className="w-3 h-3" />}
                      {styles.badgeText}
                    </span>
                  </div>
                  <p className={`text-sm mt-0.5 ${stop.status === "upcoming" ? "text-gray-400" : "text-gray-500"}`}>
                    {stop.center_city}, {stop.center_state}
                    {stop.center_pincode && ` — ${stop.center_pincode}`}
                  </p>

                  <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                    {stop.actual_arrival && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Arrived: {formatShortDate(stop.actual_arrival)}
                      </span>
                    )}
                    {!stop.actual_arrival && stop.estimated_arrival && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        ETA: {formatShortDate(stop.estimated_arrival)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Customer Destination */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-2 shrink-0 ${
                buyerDone ? "ring-emerald-500 bg-emerald-500" : "ring-gray-300 bg-white"
              }`}>
                <MapPin className={`w-5 h-5 ${buyerDone ? "text-white" : "text-gray-400"}`} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-bold ${buyerDone ? "text-gray-900" : "text-gray-400"}`}>
                  Customer Address
                </p>
                {buyerDone && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> Delivered
                  </span>
                )}
              </div>
              <p className={`text-sm mt-0.5 ${buyerDone ? "text-gray-500" : "text-gray-400"}`}>
                {buyerLocation} — {buyerPincode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────

const OrderDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      fetchTrackingData();
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

  const fetchTrackingData = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/vendor/${orderId}/track`,
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
        setTrackingData(result.data);
      }
      // Non-critical: silently fail if tracking not available yet
    } catch (err) {
      console.error("Error fetching tracking data:", err);
    }
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
        setOrder((prevOrder) => 
          prevOrder ? { ...prevOrder, status: newStatus } : null
        );
        fetchOrderDetails();
        fetchTrackingData();
        toast?.success?.(newStatus === "processing" ? "Order accepted — stock deducted and FC pickup scheduled." : "Status updated.");
      } else {
        const data = await res.json().catch(() => ({}));
        toast?.error?.(data?.message || "Failed to update order status");
      }
    } catch (err: any) {
      toast?.error?.(err?.message || "Error updating order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const [dispatchNote, setDispatchNote] = useState<string>("");
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [isRequestingDispatch, setIsRequestingDispatch] = useState(false);

  const handleRequestDispatchPayment = async () => {
    if (!order) return;
    setIsRequestingDispatch(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dispatch/orders/${order.order_id}/request`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          body: JSON.stringify({ dispatch_note: dispatchNote || undefined }),
        }
      );
      if (res.ok) {
        toast?.success?.("Dispatch payment request sent to client.");
        setDispatchNote("");
        setShowDispatchModal(false);
        fetchOrderDetails();
      } else {
        const data = await res.json().catch(() => ({}));
        toast?.error?.(data?.message || "Failed to send dispatch request");
      }
    } catch (err: any) {
      toast?.error?.(err?.message || "Error requesting dispatch");
    } finally {
      setIsRequestingDispatch(false);
    }
  };

  const downloadOrderReport = () => {
    if (!order) return;

    const itemRows = order.items.map((it) => [
      it.product_name,
      it.quantity,
      `INR ${Number(it.price).toLocaleString("en-IN")}`,
      `INR ${(Number(it.price) * it.quantity).toLocaleString("en-IN")}`,
    ]);

    const fullAddress = [order.address_line, order.city, order.state, order.pincode]
      .filter(Boolean)
      .join(", ");

    const sections = [
      {
        heading: `Order Overview - #${order.order_id.slice(0, 8).toUpperCase()}`,
        rows: [
          ["Order Reference", `#${order.order_id.toUpperCase()}`],
          ["Order Date", order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "N/A"],
          ["Customer Name", order.customer_name || "N/A"],
          ["Customer Email", order.customer_email || "N/A"],
          ["Customer Phone", order.customer_phone || "N/A"],
          ["Delivery Address", fullAddress || "N/A"],
          ["Order Status", order.status.toUpperCase()],
          ["Payment Status", (order.payment_status || "N/A").toUpperCase()],
          ["Grand Total", `INR ${Number(order.total_amount).toLocaleString("en-IN")}`],
        ],
      },
      {
        heading: "Purchased Items",
        headers: ["Product", "Qty", "Unit Price", "Subtotal"],
        rows: itemRows,
      },
    ];

    downloadPdfReport(
      `Order Manifest - #${order.order_id.slice(0, 8).toUpperCase()}`,
      sections,
      `Order_${order.order_id.slice(0, 8).toUpperCase()}.pdf`
    );
  };

  const downloadInvoice = () => {
    if (!order) return;

    const itemRows = order.items.map((it) => [
      it.product_name,
      it.quantity,
      `INR ${Number(it.price).toLocaleString("en-IN")}`,
      `INR ${(Number(it.price) * it.quantity).toLocaleString("en-IN")}`,
    ]);

    const fullAddress = [order.address_line, order.city, order.state, order.pincode]
      .filter(Boolean)
      .join(", ");

    const sections = [
      {
        heading: "Tax Invoice Details",
        rows: [
          ["Invoice No.", `INV-${order.order_id.slice(0, 8).toUpperCase()}`],
          ["Date of Issue", new Date().toLocaleDateString("en-IN")],
          ["Order Date", order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "N/A"],
          ["Billed To (Customer)", order.customer_name || "N/A"],
          ["Contact Info", `${order.customer_phone || "N/A"} / ${order.customer_email || "N/A"}`],
          ["Shipping / Billing Address", fullAddress || "N/A"],
          ["Payment Status", (order.payment_status || "PAID").toUpperCase()],
        ],
      },
      {
        heading: "Line Items & Charges",
        headers: ["Item Description", "Qty", "Rate (INR)", "Amount (INR)"],
        rows: itemRows,
      },
      {
        heading: "Payment Summary",
        rows: [
          ["Subtotal", `INR ${Number(order.total_amount).toLocaleString("en-IN")}`],
          ["Taxes (Included)", "18% GST Applicable"],
          ["Total Payable Amount", `INR ${Number(order.total_amount).toLocaleString("en-IN")}`],
        ],
      },
    ];

    downloadPdfReport(
      `Tax Invoice - INV-${order.order_id.slice(0, 8).toUpperCase()}`,
      sections,
      `Invoice_INV-${order.order_id.slice(0, 8).toUpperCase()}.pdf`
    );
  };

  const getNextStatusOptions = () => {
    if (!order) return [];
    
    const currentStatus = order.status.toLowerCase();
    const options = [];
    
    if (currentStatus === "pending" || currentStatus === "ready_for_pickup") {
      options.push({ value: "processing", label: "Accept Order", color: "bg-emerald-600 hover:bg-emerald-700" });
    }
    if (currentStatus === "pending") {
      options.push({ value: "cancelled", label: "Reject Order", color: "bg-rose-600 hover:bg-rose-700" });
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
  const routePlan = trackingData?.routePlan || [];
  const hasRouteplan = routePlan.length > 0;
  const isCancelled = order.status.toLowerCase() === "cancelled";

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
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={downloadOrderReport}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              Export
            </button>
            {order.status.toLowerCase() !== "pending" && order.status.toLowerCase() !== "cancelled" && (
              <button
                onClick={downloadInvoice}
                className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Download Invoice
              </button>
            )}
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
            {order.dispatch?.can_vendor_request_dispatch && (
              <button
                onClick={() => setShowDispatchModal(true)}
                disabled={isRequestingDispatch}
                className="px-4 py-2.5 text-white rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all text-sm font-semibold shadow-sm flex items-center gap-2 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                Request Dispatch Payment
              </button>
            )}
          </div>
        </div>

        {showDispatchModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Dispatch Payment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send a dispatch payment request to the client for the remaining balance of{" "}
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(order.dispatch?.remaining_balance || 0)}
                </span>
                . Client will be notified immediately.
              </p>
              <div className="space-y-3 mb-5 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total (incl. 18% GST)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order.dispatch?.total_with_gst || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Token Paid ({order.dispatch?.token_percentage}%)</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(order.dispatch?.total_amount_paid || 0)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-amber-200">
                  <span className="font-semibold text-gray-900">Dispatch Balance</span>
                  <span className="font-bold text-orange-700">{formatCurrency(order.dispatch?.remaining_balance || 0)}</span>
                </div>
              </div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Optional Dispatch Note</label>
              <textarea
                value={dispatchNote}
                onChange={(e) => setDispatchNote(e.target.value)}
                placeholder="e.g. Order ready. Please pay the balance to proceed with delivery."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                rows={3}
              />
              <div className="flex items-center gap-3 justify-end mt-5">
                <button
                  onClick={() => setShowDispatchModal(false)}
                  disabled={isRequestingDispatch}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestDispatchPayment}
                  disabled={isRequestingDispatch}
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl disabled:opacity-60 flex items-center gap-2"
                >
                  {isRequestingDispatch ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispatch Payment Section */}
        {order.dispatch && order.dispatch.quotation_request_id && (
          <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">Dispatch Payment Summary</h2>
                <p className="text-xs text-gray-500 mt-0.5">Bulk order with 2-step payment: token + dispatch balance</p>
              </div>
              {order.dispatch.latest_dispatch_request?.status === "pending" && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Payment Requested</span>
              )}
              {order.dispatch.latest_dispatch_request?.status === "paid" && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Balance Paid</span>
              )}
              {order.dispatch.is_fully_paid && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Ready for Pickup</span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Order Value</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{formatCurrency(order.dispatch.total_order_amount_excl_gst)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                <p className="text-xs text-gray-500 font-medium">Total (incl. GST)</p>
                <p className="mt-1 text-sm font-bold text-sky-800">{formatCurrency(order.dispatch.total_with_gst)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-gray-500 font-medium">Token Amount Paid</p>
                <p className="mt-1 text-sm font-bold text-emerald-800">{formatCurrency(order.dispatch.total_amount_paid)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                <p className="text-xs text-gray-500 font-medium">Dispatch Balance</p>
                <p className="mt-1 text-sm font-bold text-orange-800">{formatCurrency(order.dispatch.remaining_balance)}</p>
              </div>
            </div>

            {order.dispatch.latest_dispatch_request && (
              <div className="mt-5 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-sm">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div>
                    <span className="text-xs text-gray-500 font-medium">Requested At: </span>
                    <span className="font-semibold text-gray-800">
                      {new Date(order.dispatch.latest_dispatch_request.requested_at).toLocaleString()}
                    </span>
                  </div>
                  {order.dispatch.latest_dispatch_request.dispatch_note && (
                    <div className="w-full md:w-auto md:flex-1">
                      <span className="text-xs text-gray-500 font-medium">Note: </span>
                      <span className="text-gray-800">{order.dispatch.latest_dispatch_request.dispatch_note}</span>
                    </div>
                  )}
                  {order.dispatch.latest_dispatch_request.paid_at && (
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Paid At: </span>
                      <span className="font-semibold text-emerald-700">
                        {new Date(order.dispatch.latest_dispatch_request.paid_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.status.toLowerCase() === "ready_for_pickup" && (
              <div className="mt-5 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl text-indigo-700 border border-indigo-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-900">Client has paid dispatch balance in full.</p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Click <span className="font-semibold">Accept Order</span> to deduct stock, generate route plan and handover to fulfillment center pickup.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-${order.pickup_otp ? 4 : 3} gap-4`}>
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
          {order.pickup_otp && (
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl text-amber-600 shadow-sm border border-amber-100">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Pickup OTP Code
                  </p>
                  <p className="text-xl font-black text-amber-700 tracking-wider mt-0.5">
                    {order.pickup_otp}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Route Journey Map ─────────────────────────────────────── */}
        {hasRouteplan && !isCancelled && trackingData && (
          <VendorRouteJourneyMap
            routePlan={routePlan}
            trackingOrder={trackingData.order}
            buyerCity={order.city}
            buyerState={order.state}
            buyerPincode={order.pincode}
          />
        )}

        {/* Direct delivery fallback */}
        {!hasRouteplan && !isCancelled && order.status.toLowerCase() !== "pending" && (
          <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Shipment Route</h2>
                <p className="text-xs text-gray-500 mt-0.5">Direct delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Origin</p>
                  <p className="text-sm font-bold text-gray-900">
                    {order.vendor_city ? `${order.vendor_city}, ${order.vendor_state}` : "Your Warehouse"}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400 mx-2 shrink-0" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Destination</p>
                  <p className="text-sm font-bold text-gray-900">{order.city}, {order.state}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              No intermediate fulfillment centers on this route. Order is being delivered directly.
            </p>
          </div>
        )}

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
                      {item.variant_properties && Object.keys(item.variant_properties).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(item.variant_properties).map(([key, val]) => (
                            <span key={key} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600 capitalize border border-gray-200">
                              {key}: {String(val)}
                            </span>
                          ))}
                        </div>
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
