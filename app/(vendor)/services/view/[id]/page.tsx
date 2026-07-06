"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Edit,
  Power,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Search,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Eye,
  MessageSquare,
  Star,
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
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
  Filler,
} from "chart.js";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

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

type ServiceOffering = {
  id: string;
  price: string;
  pricing_type: "flat" | "hourly" | "project" | "milestone";
  moq: number;
  is_active: boolean;
  created_at: string;
  service_id: string;
  service_name: string;
  service_status: string;
  service_image: string;
  category_name: string;
  booking_count: number;
  delivery_days?: number;
  token_percentage?: string;
};

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
};

type Review = {
  id: string;
  rating: number;
  review_title: string;
  review_text: string;
  images: string[];
  created_at: string;
  reviewer_name: string;
};

export default function ServiceViewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const offeringId = params.id as string;

  const [offering, setOffering] = useState<ServiceOffering | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0.0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "reviews">("overview");

  useEffect(() => {
    if (user && user.vendorType !== "service" && user.vendorType !== "both") {
      router.replace("/unauthorizedAccessed");
    }
  }, [user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:9001";
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

      // 1. Fetch offerings to find our matching one
      const token = typeof window !== "undefined" ? localStorage.getItem("vendor_token") : null;
      const offeringsRes = await fetch(`${adminUrl}/api/services/vendor/offerings`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
          ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!offeringsRes.ok) {
        if (offeringsRes.status === 401 || offeringsRes.status === 403) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch service offerings");
      }

      const offeringsData = await offeringsRes.json();
      const allOfferings: ServiceOffering[] = offeringsData.data || [];
      const currentOffering = allOfferings.find((o) => o.id === offeringId);

      if (!currentOffering) {
        setError("Service offering not found or access denied.");
        setLoading(false);
        return;
      }

      setOffering(currentOffering);

      // 2. Fetch Bookings of the vendor
      const bookingsRes = await fetch(`${apiUrl}/api/services/vendor/bookings`, {
        credentials: "include",
        headers: {
          "x-request-from": "vendor",
        },
      });

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const allBookings: Booking[] = bookingsData.data || [];
        const filteredBookings = allBookings.filter(
          (b) => b.vendor_service_id === offeringId
        );
        setBookings(filteredBookings);
      }

      // 3. Fetch Service Reviews
      if (currentOffering.service_id) {
        const serviceRes = await fetch(`${apiUrl}/api/services/${currentOffering.service_id}`, {
          credentials: "include",
          headers: {
            "x-request-from": "vendor",
          },
        });
        if (serviceRes.ok) {
          const serviceJson = await serviceRes.json();
          if (serviceJson.data) {
            const actualReviews = serviceJson.data.reviews || [];
            setReviews(actualReviews);
            if (actualReviews.length > 0) {
              const totalRating = actualReviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0);
              setRating(totalRating / actualReviews.length);
              setReviewCount(actualReviews.length);
            } else {
              setRating(0.0);
              setReviewCount(0);
            }
          }
        }
      }

    } catch (err) {
      console.error(err);
      setError("Failed to load details. Please make sure backends are online.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [offeringId]);

  const handleToggleStatus = async () => {
    if (!offering) return;
    try {
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:9001";
      const token = typeof window !== "undefined" ? localStorage.getItem("vendor_token") : null;
      const res = await fetch(`${adminUrl}/api/services/vendor/offerings/${offering.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
          ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ isActive: !offering.is_active }),
      });

      if (res.ok) {
        toast.success(`Service successfully ${!offering.is_active ? "activated" : "deactivated"}`);
        setOffering({ ...offering, is_active: !offering.is_active });
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error updating status");
    }
  };



  // Calculations for Analytics
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const totalRevenue = activeBookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
  const totalOrders = activeBookings.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const mockPageViews = totalOrders * 8 + 42;

  // Group bookings by month for Chart.js
  const getMonthlyChartData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels: string[] = [];
    const revenueData: number[] = [];
    const ordersData: number[] = [];

    // Last 6 months trend
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      labels.push(`${monthName} ${year}`);

      const monthBookings = bookings.filter((b) => {
        const date = new Date(b.created_at);
        return (
          date.getMonth() === d.getMonth() &&
          date.getFullYear() === d.getFullYear() &&
          b.status !== "cancelled"
        );
      });

      const monthRevenue = monthBookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
      revenueData.push(monthRevenue);
      ordersData.push(monthBookings.length);
    }

    return { labels, revenueData, ordersData };
  };

  const { labels, revenueData, ordersData } = getMonthlyChartData();

  const trendChartData = {
    labels,
    datasets: [
      {
        label: "Revenue (₹)",
        data: revenueData,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Bookings",
        data: ordersData,
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        yAxisID: "y1",
      },
    ],
  };

  const barChartData = {
    labels,
    datasets: [
      {
        label: "Job Quantity",
        data: ordersData,
        backgroundColor: "rgba(99, 102, 241, 0.85)",
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Revenue (₹)",
          font: { size: 10 },
        },
        ticks: { font: { size: 9 } },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Bookings",
          font: { size: 10 },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: { size: 9 },
          stepSize: 1,
        },
      },
      x: {
        ticks: { font: { size: 9 } },
      },
    },
  };

  // Review Breakdown Calculations
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const rounded = Math.round(r.rating);
    if (rounded >= 1 && rounded <= 5) {
      starCounts[rounded as 5 | 4 | 3 | 2 | 1]++;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error || !offering) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error || "Offering not found"}</p>
        <Link
          href="/services"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-sm pb-12">
      {/* Back button & Breadcrumb header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Link
            href="/services"
            className="inline-flex items-center text-xs font-semibold text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Services
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
            <div className="flex items-center gap-3">
              {offering.service_image ? (
                <img
                  src={offering.service_image}
                  alt={offering.service_name}
                  className="w-12 h-12 rounded-lg object-cover border border-gray-250 bg-gray-50"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-250 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-gray-500" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {offering.service_name}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {offering.category_name} • <span className="capitalize">{offering.pricing_type} Rate</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  offering.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-red-50 text-red-700 border-red-100"
                }`}
              >
                {offering.is_active ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1.5" />
                    Active
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1.5" />
                    Inactive
                  </>
                )}
              </span>
              <button
                onClick={handleToggleStatus}
                className={`inline-flex items-center px-3.5 py-2 border rounded-md text-xs font-medium transition-colors shadow-sm ${
                  offering.is_active
                    ? "bg-white border-red-300 text-red-700 hover:bg-red-50"
                    : "bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <Power className="h-3.5 w-3.5 mr-1.5" />
                {offering.is_active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => router.push(`/services/edit/${offering.id}`)}
                className="inline-flex items-center px-3.5 py-2 bg-gray-900 border border-transparent rounded-md text-xs font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Offering
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === "overview"
                  ? "border-gray-950 text-gray-950"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === "analytics"
                  ? "border-gray-950 text-gray-950"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-semibold transition-colors ${
                activeTab === "reviews"
                  ? "border-gray-950 text-gray-950"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Reviews
            </button>
          </nav>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-500">Service Price</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      ₹{parseFloat(offering.price).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-500">Total Bookings</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      {offering.booking_count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-500">Minimum Order Qty</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      {offering.moq} unit(s)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-500">Offering Created</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      {new Date(offering.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Details Layout */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-base font-bold text-gray-900">Service Details</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Description */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-150">
                      We offer high-quality professional {offering.service_name} services, fully compliant with B2B industry standards. Standard scheduling, negotiation channels, and completion verification procedures apply.
                    </p>
                  </div>

                  {/* Right Column: Information Block */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Service Specification</h4>
                    <dl className="divide-y divide-gray-150 border-t border-b border-gray-150">
                      <div className="flex justify-between py-2.5">
                        <dt className="text-gray-500">Service Category:</dt>
                        <dd className="font-medium text-gray-950">{offering.category_name}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-gray-500">Pricing Model:</dt>
                        <dd className="font-medium text-gray-950 capitalize">{offering.pricing_type} Rate</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-gray-500">Minimum Order (MOQ):</dt>
                        <dd className="font-medium text-gray-950">{offering.moq} unit(s)</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-gray-500">Global Service Status:</dt>
                        <dd className="font-semibold text-emerald-700 capitalize">{offering.service_status}</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-gray-500">Date Added:</dt>
                        <dd className="font-medium text-gray-950">
                          {new Date(offering.created_at).toLocaleString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-base font-bold text-gray-900">Performance Summary</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="border-r border-gray-200 last:border-0 py-2">
                    <p className="text-3xl font-extrabold text-blue-600">{bookings.length}</p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1.5">
                      Total Bookings
                    </p>
                  </div>
                  <div className="border-r border-gray-200 last:border-0 py-2">
                    <p className="text-3xl font-extrabold text-emerald-600">
                      ₹
                      {bookings
                        .reduce((sum, b) => sum + parseFloat(b.total_amount), 0)
                        .toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1.5">
                      Estimated Revenue
                    </p>
                  </div>
                  <div className="py-2">
                    <p className="text-3xl font-extrabold text-purple-600">
                      {bookings.filter((b) => b.status === "completed").length}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1.5">
                      Completed Jobs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₹{totalRevenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>12.5% vs last month</span>
                </div>
              </div>

              {/* Total Bookings */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>8.2% vs last month</span>
                </div>
              </div>

              {/* Avg Booking Value */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Avg Booking Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₹{avgOrderValue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-red-600 font-medium">
                  <TrendingUp className="h-3 w-3 rotate-180" />
                  <span>3.1% vs last month</span>
                </div>
              </div>

              {/* Page Views */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Page Views</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{mockPageViews}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                    <Eye className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>15.3% vs last month</span>
                </div>
              </div>
            </div>

            {/* Charts Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Revenue & Bookings Trend</h4>
                <div className="h-80 relative">
                  <Line data={trendChartData} options={chartOptions} />
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Monthly Job Quantity</h4>
                <div className="h-80 relative">
                  <Bar
                    data={barChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: {
                          ticks: { font: { size: 9 }, stepSize: 1 },
                        },
                        x: {
                          ticks: { font: { size: 9 } },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Bookings List */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">Recent Bookings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-medium">
                      <th className="px-6 py-3">Booking ID</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.slice(0, 5).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No bookings registered yet.
                        </td>
                      </tr>
                    ) : (
                      bookings.slice(0, 5).map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            #{b.id.split("-")[0].toUpperCase()}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{b.client_name}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{b.client_email}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs">
                            {new Date(b.created_at).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-950">
                            ₹{parseFloat(b.total_amount).toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border capitalize ${
                                b.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : b.status === "active"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : b.status === "cancelled"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${
                                b.payment_status === "paid"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : b.payment_status === "refunded"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {b.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Top Review Summary card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* Large rating block */}
                <div className="text-center md:border-r border-gray-200 py-2">
                  <p className="text-5xl font-extrabold text-gray-900">
                    {rating > 0 ? rating.toFixed(1) : "0.0"}
                  </p>
                  <div className="flex justify-center my-2 gap-1">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`h-5 w-5 ${
                          starIdx <= Math.round(rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-250"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                  </p>
                </div>

                {/* Progress bar breakdown */}
                <div className="col-span-2 space-y-2 max-w-md mx-auto w-full">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = starCounts[stars as 5 | 4 | 3 | 2 | 1];
                    const percent = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center">
                        <span className="text-sm text-gray-600 w-3">{stars}</span>
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

            {/* Customer Reviews List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">Customer Reviews</h3>
              </div>
              <div className="divide-y divide-gray-150">
                {reviews.length === 0 ? (
                  <div className="px-6 py-16 text-center text-gray-500">
                    <p className="font-semibold text-gray-700">No reviews yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Buyers will be able to review this service once jobs are successfully completed.
                    </p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-6 hover:bg-gray-50/20 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{rev.reviewer_name}</p>
                          <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`h-3.5 w-3.5 ${
                                  starIdx <= rev.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(rev.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {rev.review_title && (
                        <h4 className="font-semibold text-gray-950 mt-3">{rev.review_title}</h4>
                      )}
                      <p className="text-gray-600 mt-1.5 leading-relaxed text-xs">
                        {rev.review_text}
                      </p>

                      {rev.images && rev.images.length > 0 && (
                        <div className="flex gap-2 mt-4 flex-wrap">
                          {rev.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt="Review attachment"
                              className="w-16 h-16 rounded-lg object-cover border border-gray-250 bg-gray-50"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
