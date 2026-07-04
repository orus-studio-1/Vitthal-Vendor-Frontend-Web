"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Clock,
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  Key,
  Download,
  Filter,
  Eye,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

type Booking = {
  id: string;
  status: "pending" | "active" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  total_amount: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  booking_notes: string | null;
  created_at: string;
  service_name: string;
  client_name: string;
  client_email: string;
  pricing_type: string;
  vendor_service_id: string;
  service_quotation_id?: string | null;
};

export default function ServiceQuotationOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Orders");

  // OTP Modal State
  const [completingBooking, setCompletingBooking] = useState<Booking | null>(null);
  const [otp, setOtp] = useState("");
  const [submittingOtp, setSubmittingOtp] = useState(false);

  useEffect(() => {
    if (user && user.vendorType !== "service" && user.vendorType !== "both") {
      router.replace("/unauthorizedAccessed");
    }
  }, [user, router]);

  const fetchBookings = async () => {
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const res = await fetch(`${apiUrl}/api/services/vendor/bookings`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
        },
      });

      if (res.ok) {
        const json = await res.json();
        setBookings(json.data || []);
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login");
      } else {
        setError("Failed to fetch service bookings");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching bookings. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteClick = (booking: Booking) => {
    setCompletingBooking(booking);
    setOtp("");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingBooking || otp.length !== 6) return;
    setSubmittingOtp(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const res = await fetch(`${apiUrl}/api/services/vendor/bookings/${completingBooking.id}/complete`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Booking completed successfully!");
        setBookings(
          bookings.map((b) =>
            b.id === completingBooking.id ? { ...b, status: "completed" } : b
          )
        );
        setCompletingBooking(null);
      } else {
        toast.error(data.message || "Invalid OTP or failed to complete booking");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error verifying OTP");
    } finally {
      setSubmittingOtp(false);
    }
  };

  // Filter Bookings to show only quotation-based ones
  const filteredBookings = bookings
    .filter((b) => !!b.service_quotation_id)
    .filter((b) => {
      const orderId = `#${b.id.slice(0, 8).toUpperCase()}`;
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        orderId.toLowerCase().includes(query) ||
        b.service_name.toLowerCase().includes(query) ||
        b.client_name.toLowerCase().includes(query) ||
        b.client_email.toLowerCase().includes(query);

      // Map display labels to service status values
      const statusMap: Record<string, string> = {
        "All Orders": "all",
        "Pending": "pending",
        "Processing": "active",
        "Completed": "completed",
        "Cancelled": "cancelled"
      };

      const matchesStatus =
        statusFilter === "All Orders" ||
        b.status.toLowerCase() === statusMap[statusFilter]?.toLowerCase();
      return matchesSearch && matchesStatus;
    });

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      pending: "Pending",
      active: "Processing",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return (
      map[status.toLowerCase()] ||
      status.charAt(0).toUpperCase() + status.slice(1)
    );
  };

  const getStatusIcon = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "completed") return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
    if (normalized === "active") return <Clock className="w-4 h-4 mr-1.5" />;
    if (normalized === "cancelled") return <XCircle className="w-4 h-4 mr-1.5" />;
    return <Clock className="w-4 h-4 mr-1.5" />;
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-100/50";
    if (normalized === "active") return "bg-blue-50 text-blue-700 border-blue-100/50";
    if (normalized === "cancelled") return "bg-rose-50 text-rose-700 border-rose-100/50";
    return "bg-amber-50 text-amber-700 border-amber-100/50";
  };

  const formatOrderId = (id: string): string => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const exportToCSV = () => {
    if (filteredBookings.length === 0) {
      toast.error("No bookings to export");
      return;
    }
    const headers = [
      "Order ID",
      "Client Name",
      "Client Email",
      "Service Name",
      "Total Amount",
      "Status",
      "Payment Status",
      "Created At",
    ];
    const rows = filteredBookings.map((b) => [
      formatOrderId(b.id),
      b.client_name,
      b.client_email,
      b.service_name,
      b.total_amount,
      b.status,
      b.payment_status,
      new Date(b.created_at).toLocaleDateString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `service_quotation_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Service Quotation Orders Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View and manage customer orders originating from service quotations.
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID or Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/55 border border-gray-200 text-gray-900 text-sm font-medium rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {["All Orders", "Pending", "Processing", "Completed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                }}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  statusFilter === status
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-205"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table Container */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 flex items-center justify-center">
              <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-500 font-semibold mb-4">{error}</p>
              <button
                onClick={fetchBookings}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-bold"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-7 py-5">Order ID</th>
                    <th className="px-7 py-5">Customer</th>
                    <th className="px-7 py-5">Date</th>
                    <th className="px-7 py-5">Service</th>
                    <th className="px-7 py-5">Total</th>
                    <th className="px-7 py-5">Status</th>
                    <th className="px-7 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-7 py-5 font-bold text-gray-900">
                          {formatOrderId(booking.id)}
                        </td>
                        <td className="px-7 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                              {booking.client_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{booking.client_name}</p>
                              <p className="text-xs text-gray-500">{booking.client_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-7 py-5 text-gray-500 font-medium">
                          {formatDate(booking.created_at)}
                        </td>
                        <td className="px-7 py-5">
                          <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {booking.service_name}
                          </p>
                          <p className="text-gray-400 text-xs mt-0.5 capitalize">{booking.pricing_type} Rate</p>
                        </td>
                        <td className="px-7 py-5 font-bold text-gray-900">
                          ₹{parseFloat(booking.total_amount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-7 py-5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center border ${getStatusColor(booking.status)}`}
                            >
                              {getStatusIcon(booking.status)}
                              {getStatusLabel(booking.status)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border capitalize ${
                                booking.payment_status === "paid"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {booking.payment_status}
                            </span>
                          </div>
                        </td>
                        <td className="px-7 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {(booking.status === "active" || booking.status === "pending") && (
                              <button
                                onClick={() => handleCompleteClick(booking)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm"
                              >
                                <Key className="w-3.5 h-3.5" />
                                Verify OTP
                              </button>
                            )}
                              <button
                                onClick={() =>
                                  router.push(`/bookings/${booking.id}`)
                                }
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="View Booking Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-7 py-16 text-center text-gray-500">
                        No service quotation orders yet. Quotation orders will appear here once negotiations are complete and bookings are generated.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* OTP Completion Modal */}
      {completingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Complete Service Booking</h3>
            <p className="text-gray-500 text-xs mb-4">
              Enter the 6-digit OTP provided by the client (<span className="font-semibold">{completingBooking.client_name}</span>) to verify service completion and process payment.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Client Verification OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-gray-300 rounded-lg text-center tracking-[1em] font-mono text-xl py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:tracking-normal placeholder:font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingBooking(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOtp || otp.length !== 6}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center min-w-[80px]"
                >
                  {submittingOtp ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Verify & Complete"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
