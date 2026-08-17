"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Search,
  Filter,
  MoreVertical,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  Check,
  X,
  Bell,
  Truck,
  FileText,
} from "lucide-react";
import { downloadCsv, downloadPdfReport } from "@/lib/export-utils";

interface OrderItem {
  product_id: string;
  product_name: string;
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
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  order_type?: string;
  items: OrderItem[];
}

const OrdersPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user && user.vendorType === "service") {
      router.replace("/unauthorizedAccessed");
    }
  }, [user, router]);

  const [statusFilter, setStatusFilter] = useState("All Orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
    
    // Set up polling to check for new orders every 30 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/vendor`,
        {
          credentials: "include",
          headers: {
            "x-request-from": "vendor",
          },
        },
      );
      if (res.ok) {
        const result = await res.json();
        setOrders(result.data || []);
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login");
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const directOrders = orders.filter((order) => order.order_type !== "quotation");

  const filteredOrders = directOrders.filter((order) => {
    const orderId = `#${order.order_id.slice(0, 8).toUpperCase()}`;
    const matchesSearch =
      orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Map display labels to actual status values
    const statusMap: Record<string, string> = {
      "All Orders": "all",
      "Pending": "pending",
      "Processing": "processing", 
      "Shipped": "shipped",
      "Completed": "delivered",
      "Cancelled": "cancelled"
    };
    
    const matchesStatus =
      statusFilter === "All Orders" ||
      order.status.toLowerCase() === statusMap[statusFilter]?.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const formatOrderId = (id: string): string => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number | string): string => {
    const num = Number(value);
    if (isNaN(num)) return "₹0.00";
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toFixed(2)}`;
  };

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Completed",
      cancelled: "Cancelled",
    };
    return (
      map[status.toLowerCase()] ||
      status.charAt(0).toUpperCase() + status.slice(1)
    );
  };

  const getStatusIcon = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "delivered" || normalized === "completed")
      return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
    if (
      normalized === "processing" ||
      normalized === "shipped"
    )
      return <Clock className="w-4 h-4 mr-1.5" />;
    if (normalized === "cancelled")
      return <XCircle className="w-4 h-4 mr-1.5" />;
    return <Clock className="w-4 h-4 mr-1.5" />;
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "delivered" || normalized === "completed")
      return "bg-emerald-50 text-emerald-700 border-emerald-100/50";
    if (
      normalized === "processing" ||
      normalized === "shipped"
    )
      return "bg-blue-50 text-blue-700 border-blue-100/50";
    if (normalized === "cancelled")
      return "bg-rose-50 text-rose-700 border-rose-100/50";
    return "bg-amber-50 text-amber-700 border-amber-100/50";
  };

  const getTotalItems = (items: OrderItem[]): string => {
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    return `${total} items`;
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/vendor/${orderId}/status`,
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
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === orderId
              ? { ...order, status: newStatus }
              : order
          )
        );
      } else {
        console.error("Failed to update order status");
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const newOrders = directOrders.filter((order) => order.status === "pending");
  const otherOrders = directOrders.filter((order) => order.status !== "pending");

  // Pagination logic
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-menu')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const exportOrdersCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return;
    }

    const headers = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Date",
      "Status",
      "Payment Status",
      "Items",
      "Total Amount (INR)",
      "Delivery Address",
      "City",
      "State",
      "Pincode",
    ];

    const rows = filteredOrders.map((order) => {
      const itemsSummary = (order.items || [])
        .map((it) => `${it.product_name || "Product"} (x${it.quantity})`)
        .join("; ");
      const address = [order.address_line, order.city, order.state, order.pincode]
        .filter(Boolean)
        .join(", ");

      return [
        `#${order.order_id.slice(0, 8).toUpperCase()}`,
        order.customer_name || "N/A",
        order.customer_email || "N/A",
        order.customer_phone || "N/A",
        order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "N/A",
        order.status.toUpperCase(),
        (order.payment_status || "N/A").toUpperCase(),
        itemsSummary || "N/A",
        order.total_amount,
        address || "N/A",
        order.city || "",
        order.state || "",
        order.pincode || "",
      ];
    });

    downloadCsv(
      `MTWO_Vendor_Orders_${new Date().toISOString().split("T")[0]}.csv`,
      headers,
      rows
    );
  };

  const exportOrdersPDF = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return;
    }

    const rows = filteredOrders.map((order) => {
      const itemsSummary = (order.items || [])
        .map((it) => `${it.product_name || "Product"} (x${it.quantity})`)
        .join("; ");

      return [
        `#${order.order_id.slice(0, 8).toUpperCase()}`,
        order.customer_name || "N/A",
        order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "N/A",
        order.status.toUpperCase(),
        (order.payment_status || "N/A").toUpperCase(),
        itemsSummary || "N/A",
        `INR ${Number(order.total_amount).toLocaleString("en-IN")}`,
      ];
    });

    const sections = [
      {
        heading: `Vendor Orders Summary (${filteredOrders.length} Orders)`,
        headers: ["Order ID", "Customer", "Date", "Status", "Payment", "Items Summary", "Total"],
        rows,
      },
    ];

    downloadPdfReport(
      "Vendor Customer Orders Report",
      sections,
      `MTWO_Vendor_Orders_${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const exportSingleOrderPDF = (order: Order) => {
    const itemRows = (order.items || []).map((it) => [
      it.product_name || "Product",
      it.quantity,
      `INR ${Number(it.price).toLocaleString("en-IN")}`,
      `INR ${(Number(it.price) * it.quantity).toLocaleString("en-IN")}`,
    ]);

    const fullAddress = [order.address_line, order.city, order.state, order.pincode]
      .filter(Boolean)
      .join(", ");

    const sections = [
      {
        heading: `Order Details - #${order.order_id.slice(0, 8).toUpperCase()}`,
        rows: [
          ["Order Reference", `#${order.order_id.toUpperCase()}`],
          ["Order Date", order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "N/A"],
          ["Customer Name", order.customer_name || "N/A"],
          ["Customer Contact", `${order.customer_phone || "N/A"} (${order.customer_email || "N/A"})`],
          ["Shipping Address", fullAddress || "N/A"],
          ["Order Status", order.status.toUpperCase()],
          ["Payment Status", (order.payment_status || "N/A").toUpperCase()],
          ["Total Amount", `INR ${Number(order.total_amount).toLocaleString("en-IN")}`],
        ],
      },
      {
        heading: "Ordered Items",
        headers: ["Item Name", "Quantity", "Unit Price", "Total"],
        rows: itemRows,
      },
    ];

    downloadPdfReport(
      `Order Manifest - #${order.order_id.slice(0, 8).toUpperCase()}`,
      sections,
      `Order_${order.order_id.slice(0, 8).toUpperCase()}.pdf`
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Orders Management
            </h1>
            <p className="text-gray-500 mt-1.5 font-medium">
              View and manage your recent customer orders.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportOrdersCSV}
              disabled={filteredOrders.length === 0}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 text-blue-600" />
              Export CSV
            </button>
            <button
              onClick={exportOrdersPDF}
              disabled={filteredOrders.length === 0}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm font-medium rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {[
              "All Orders",
              "Pending",
              "Processing",
              "Shipped",
              "Completed",
              "Cancelled",
            ].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  statusFilter === status
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
            <button className="p-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors ml-auto md:ml-0">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Orders Alert Section */}
        {newOrders.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-3xl p-6 shadow-lg animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 text-white p-3 rounded-full animate-pulse">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {newOrders.length} New Order{newOrders.length > 1 ? "s" : ""} Pending
                  </h2>
                  <p className="text-gray-600 font-medium">
                    Review and accept or reject new customer orders
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {newOrders.slice(0, 3).map((order, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900">
                          {formatOrderId(order.order_id)}
                        </span>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                          NEW
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">{order.customer_name}</span>
                        <span>{formatDate(order.created_at)}</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </span>
                        <span>{getTotalItems(order.items)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateOrderStatus(order.order_id, "processing")}
                        disabled={updatingOrderId === order.order_id}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingOrderId === order.order_id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.order_id, "cancelled")}
                        disabled={updatingOrderId === order.order_id}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingOrderId === order.order_id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => router.push(`/orders/${order.order_id}`)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {newOrders.length > 3 && (
                <div className="text-center pt-2">
                  <button className="text-emerald-600 hover:text-emerald-700 font-bold text-sm">
                    View {newOrders.length - 3} more new orders →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-500 font-medium mb-4">{error}</p>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-7 py-5">Order ID</th>
                      <th className="px-7 py-5">Customer</th>
                      <th className="px-7 py-5">Date</th>
                      <th className="px-7 py-5">Items</th>
                      <th className="px-7 py-5">Total</th>
                      <th className="px-7 py-5">Status</th>
                      <th className="px-7 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((order, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50/80 transition-colors group"
                        >
                          <td className="px-7 py-5 font-bold text-gray-900">
                            {formatOrderId(order.order_id)}
                          </td>
                          <td className="px-7 py-5 font-semibold text-gray-700">
                            {order.customer_name}
                          </td>
                          <td className="px-7 py-5 text-gray-500 font-medium">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-7 py-5 font-medium text-gray-700">
                            {getTotalItems(order.items)}
                          </td>
                          <td className="px-7 py-5 font-bold text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td className="px-7 py-5">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center border ${getStatusColor(order.status)}`}
                            >
                              {getStatusIcon(order.status)}
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-7 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Shipping and delivery are now handled by the fulfillment center */}
                              {order.status === "processing" && (
                                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-200">
                                  Awaiting FC Pickup
                                </span>
                              )}
                              <button
                                onClick={() =>
                                  router.push(`/orders/${order.order_id}`)
                                }
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <div className="relative dropdown-menu">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === order.order_id ? null : order.order_id);
                                  }}
                                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {activeDropdown === order.order_id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <button
                                      onClick={() => {
                                        router.push(`/orders/${order.order_id}`);
                                        setActiveDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Details
                                    </button>
                                     <button
                                       onClick={() => {
                                         exportSingleOrderPDF(order);
                                         setActiveDropdown(null);
                                       }}
                                       className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                                     >
                                       <Download className="w-4 h-4 text-blue-600" />
                                       Export Order (PDF)
                                     </button>
                                    {order.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            updateOrderStatus(order.order_id, 'processing');
                                            setActiveDropdown(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                        >
                                          <Check className="w-4 h-4" />
                                          Accept Order
                                        </button>
                                        <button
                                          onClick={() => {
                                            updateOrderStatus(order.order_id, 'cancelled');
                                            setActiveDropdown(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                                        >
                                          <X className="w-4 h-4" />
                                          Reject Order
                                        </button>
                                      </>
                                    )}
                                    {/* Shipped/Delivered are now handled by the fulfillment center pipeline */}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-7 py-16 text-center text-gray-500 font-medium"
                        >
                          {directOrders.length === 0
                            ? "No orders yet. Orders will appear here once customers start purchasing."
                            : "No orders found matching your search or filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-emerald-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
