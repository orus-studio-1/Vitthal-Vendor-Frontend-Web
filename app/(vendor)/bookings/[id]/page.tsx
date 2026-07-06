"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Key,
  Briefcase,
  DollarSign,
  FileText,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

interface Booking {
  id: string;
  status: "pending" | "active" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  total_amount: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  booking_notes: string | null;
  created_at: string;
  service_name: string;
  service_description: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  pricing_type: string;
  vendor_service_id: string;
  service_quotation_id?: string | null;
  scope_of_work?: string | null;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const { user } = useAuthStore();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [submittingOtp, setSubmittingOtp] = useState(false);

  useEffect(() => {
    if (user && user.vendorType !== "service" && user.vendorType !== "both") {
      router.replace("/unauthorizedAccessed");
    }
  }, [user, router]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const res = await fetch(`${apiUrl}/api/services/vendor/bookings/${bookingId}`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
        },
      });

      if (res.ok) {
        const json = await res.json();
        setBooking(json.data);
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login");
      } else if (res.status === 404) {
        setError("Booking not found");
      } else {
        setError("Failed to fetch booking details");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || otp.length !== 6) return;
    setSubmittingOtp(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
      const res = await fetch(`${apiUrl}/api/services/vendor/bookings/${booking.id}/complete`, {
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
        setBooking({ ...booking, status: "completed" });
        setShowOtpModal(false);
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

  const getStatusBadgeColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      active: "bg-blue-50 text-blue-700 border-blue-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return map[status.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getPaymentBadgeColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      paid: "bg-green-50 text-green-700 border-green-200",
      refunded: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return map[status.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const formatOrderId = (id: string): string => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Not Scheduled";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-zinc-50 p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-center">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-950 mb-2">{error || "Booking not found"}</h2>
          <p className="text-zinc-500 text-sm mb-6">
            The booking you are looking for does not exist or you do not have permission to view it.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          {(booking.status === "pending" || booking.status === "active") && (
            <button
              onClick={() => {
                setOtp("");
                setShowOtpModal(true);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold flex items-center gap-2 shadow-md shadow-emerald-100"
            >
              <Key className="w-4 h-4" />
              Verify OTP to Complete
            </button>
          )}
        </div>

        {/* Title Block */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Booking {formatOrderId(booking.id)}
            </h1>
            {booking.service_quotation_id && (
              <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                Quotation Order
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">
            Placed on {formatDate(booking.created_at)}
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className={`p-3.5 rounded-xl border ${getStatusBadgeColor(booking.status)}`}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Booking Status</p>
              <p className="text-lg font-extrabold text-zinc-900 mt-0.5 capitalize">{booking.status}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className={`p-3.5 rounded-xl border ${getPaymentBadgeColor(booking.payment_status)}`}>
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Payment Status</p>
              <p className="text-lg font-extrabold text-zinc-900 mt-0.5 capitalize">{booking.payment_status}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Scheduled Date</p>
              <p className="text-sm font-extrabold text-zinc-900 mt-0.5">
                {booking.scheduled_start ? new Date(booking.scheduled_start).toLocaleDateString("en-IN") : "To Be Scheduled"}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Service & Notes Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2 border-b border-gray-50 pb-4">
                <Briefcase className="w-5 h-5 text-zinc-500" />
                Service Details
              </h3>
              
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Service Name</p>
                <p className="text-base font-bold text-zinc-900 mt-1">{booking.service_name}</p>
              </div>

              {booking.service_description && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Service Description</p>
                  <p className="text-zinc-600 text-sm mt-1 leading-relaxed">{booking.service_description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pricing Type</p>
                  <p className="text-sm font-bold text-zinc-900 mt-1 capitalize">{booking.pricing_type} Rate</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Agreed Amount</p>
                  <p className="text-sm font-bold text-zinc-900 mt-1">₹{parseFloat(booking.total_amount).toLocaleString("en-IN")}</p>
                </div>
              </div>

              {(booking.scope_of_work || booking.booking_notes) && (
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <p className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 mb-2">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    {booking.service_quotation_id ? "Scope of Work" : "Booking Notes"}
                  </p>
                  <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-line">
                    {booking.scope_of_work || booking.booking_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customer Info & Timeline */}
          <div className="space-y-6">
            
            {/* Client Info Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-gray-50 pb-3">
                <User className="w-4 h-4 text-zinc-500" />
                Customer Contact
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Name</p>
                  <p className="text-sm font-bold text-zinc-900 mt-0.5">{booking.client_name}</p>
                </div>

                <div className="flex items-center gap-2 text-zinc-600">
                  <Mail className="w-4 h-4 text-zinc-400" />
                  <a href={`mailto:${booking.client_email}`} className="text-sm hover:underline font-medium">
                    {booking.client_email}
                  </a>
                </div>

                {booking.client_phone && (
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <a href={`tel:${booking.client_phone}`} className="text-sm hover:underline font-medium">
                      {booking.client_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
              <h3 className="text-base font-bold text-zinc-900 mb-4 border-b border-gray-50 pb-3">
                Booking Timeline
              </h3>
              
              <div className="relative border-l border-zinc-100 pl-6 ml-3 space-y-6 py-2">
                {/* Placed */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                  <p className="text-xs font-bold text-zinc-950">Booking Created</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{formatDate(booking.created_at)}</p>
                </div>

                {/* Scheduled */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                    booking.scheduled_start ? "bg-emerald-500" : "bg-zinc-200"
                  }`}>
                    {booking.scheduled_start && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <p className={`text-xs font-bold ${booking.scheduled_start ? "text-zinc-950" : "text-zinc-400"}`}>
                    Service Scheduled
                  </p>
                  {booking.scheduled_start && (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Starts: {formatDate(booking.scheduled_start)}
                    </p>
                  )}
                </div>

                {/* Completed */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                    booking.status === "completed" ? "bg-emerald-500" : "bg-zinc-200"
                  }`}>
                    {booking.status === "completed" && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <p className={`text-xs font-bold ${booking.status === "completed" ? "text-zinc-950" : "text-zinc-400"}`}>
                    Service Completed
                  </p>
                  {booking.status === "completed" && (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Completed & Verified
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* OTP Completion Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Verify Service Completion</h3>
            <p className="text-gray-500 text-xs mb-4">
              Enter the 6-digit OTP provided by the client (<span className="font-semibold">{booking.client_name}</span>) to verify service completion and process payment.
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
                  onClick={() => setShowOtpModal(false)}
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
