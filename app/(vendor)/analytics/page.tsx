"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface KPIData {
  totalQuantity: number;
  tonnageGrowth: number;
  avgOrderValue: number;
  aovGrowth: number;
  topSegment: {
    name: string;
    volume: number;
    percentage: number;
  } | null;
  totalRevenue: number;
  revenueGrowth: number;
}

interface CategoryDistribution {
  name: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  growth: number;
}

interface AnalyticsData {
  kpi: KPIData;
  revenueChart: {
    labels: string[];
    data: number[];
  };
  categoryDistribution: CategoryDistribution[];
  topProducts: TopProduct[];
}

const AnalyticsPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [timeframe, setTimeframe] = useState<
    "This Month" | "Last 6 Months" | "This Year" | "All Time"
  >("This Year");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const timeframeMap: Record<string, string> = {
        "This Month": "month",
        "Last 6 Months": "6months",
        "This Year": "year",
        "All Time": "all",
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/analytics?timeframe=${timeframeMap[timeframe]}`,
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
        setAnalyticsData(result.data);
      } else if (res.status === 401 || res.status === 403) {
        router.push("/login");
      } else {
        setError("Failed to fetch analytics data");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchAnalytics();
    }
  }, [isClient, timeframe]);

  const formatCurrency = (value: number | string): string => {
    const num = Number(value);
    if (isNaN(num)) return "₹0.00";
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toFixed(2)}`;
  };

  const formatGrowth = (value: number | string): string => {
    const num = Number(value);
    if (isNaN(num)) return "0.0%";
    const sign = num >= 0 ? "+" : "";
    return `${sign}${num.toFixed(1)}%`;
  };

  const handleDownload = () => {
    if (!analyticsData) return;

    let csv = "";
    
    // 1. KPI Metrics
    csv += "--- METRICS SUMMARY ---\n";
    csv += "Metric,Value,Growth\n";
    csv += `Timeframe,${timeframe},\n`;
    csv += `Total Quantity Sold,${analyticsData.kpi.totalQuantity.toLocaleString()} units,${formatGrowth(analyticsData.kpi.tonnageGrowth)}\n`;
    csv += `Avg. Order Value,₹${analyticsData.kpi.avgOrderValue.toFixed(2)},${formatGrowth(analyticsData.kpi.aovGrowth)}\n`;
    csv += `Top Segment,${analyticsData.kpi.topSegment?.name || "N/A"} (${analyticsData.kpi.topSegment?.percentage || 0}%),\n`;
    csv += `Total Revenue,₹${analyticsData.kpi.totalRevenue.toFixed(2)},${formatGrowth(analyticsData.kpi.revenueGrowth)}\n\n`;

    // 2. Category Distribution
    csv += "--- CATEGORY DISTRIBUTION ---\n";
    csv += "Category,Quantity,Revenue (INR),Percentage\n";
    analyticsData.categoryDistribution.forEach(cat => {
      csv += `"${cat.name}",${cat.quantity},${cat.revenue},${cat.percentage}%\n`;
    });
    csv += "\n";

    // 3. Top Products
    csv += "--- TOP SELLING PRODUCTS ---\n";
    csv += "Product Name,Category,Quantity Sold,Revenue (INR),Growth\n";
    analyticsData.topProducts.forEach(prod => {
      csv += `"${prod.name}","${prod.category}",${prod.sales},${prod.revenue},${prod.growth}%\n`;
    });

    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `vendor_analytics_${timeframe.replace(/\s+/g, "_").toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Analytics report downloaded successfully!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download analytics report.");
    }
  };

  // Chart data configuration
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#111",
        bodyColor: "#4b5563",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => `Revenue: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.04)" },
        border: { display: false },
        ticks: {
          color: "#9ca3af",
          callback: (value: any) => formatCurrency(value),
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af" },
      },
    },
  };

  const getBarChartData = () => {
    if (!analyticsData) return { labels: [], datasets: [] };
    return {
      labels: analyticsData.revenueChart.labels,
      datasets: [
        {
          label: "Revenue",
          data: analyticsData.revenueChart.data,
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderRadius: 6,
          barThickness: timeframe === "This Month" ? 16 : 24,
        },
      ],
    };
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: "#6b7280",
          font: { family: "'Inter', sans-serif", size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#111",
        bodyColor: "#4b5563",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 12,
      },
    },
    cutout: "70%",
  };

  const getCategoryData = () => {
    if (!analyticsData || analyticsData.categoryDistribution.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["rgba(200, 200, 200, 0.5)"],
            borderWidth: 0,
          },
        ],
      };
    }

    const colors = [
      "rgba(16, 185, 129, 0.9)",
      "rgba(59, 130, 246, 0.9)",
      "rgba(245, 158, 11, 0.9)",
      "rgba(139, 92, 246, 0.9)",
      "rgba(236, 72, 153, 0.9)",
      "rgba(6, 182, 212, 0.9)",
    ];

    return {
      labels: analyticsData.categoryDistribution.map((c) => c.name),
      datasets: [
        {
          data: analyticsData.categoryDistribution.map((c) => c.quantity),
          backgroundColor: colors.slice(
            0,
            analyticsData.categoryDistribution.length,
          ),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  };

  if (!isClient)
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  if (isLoading && !analyticsData) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-gray-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10">
        <div className="max-w-350 mx-auto text-center">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpi = analyticsData?.kpi;
  const totalTonnage =
    analyticsData?.categoryDistribution.reduce(
      (sum, cat) => sum + cat.quantity,
      0,
    ) || 0;

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans">
      <div className="max-w-350 mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Industrial Analytics
            </h1>
            <p className="text-gray-500 mt-1.5 font-medium">
              B2B Performance tracking for Metals, Plastics & Chemicals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
              >
                <option>This Month</option>
                <option>Last 6 Months</option>
                <option>This Year</option>
                <option>All Time</option>
              </select>
              <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button 
              onClick={handleDownload}
              className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              title="Download Report"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Quantity Sold
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {kpi?.totalQuantity.toLocaleString() || 0} units
              </h3>
              {kpi && (
                <p
                  className={`text-sm font-medium mt-1 flex items-center ${kpi.tonnageGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {kpi.tonnageGrowth >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                  )}
                  {formatGrowth(kpi.tonnageGrowth)} from previous period
                </p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Avg. Order Value
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(kpi?.avgOrderValue || 0)}
              </h3>
              {kpi && (
                <p
                  className={`text-sm font-medium mt-1 flex items-center ${kpi.aovGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {kpi.aovGrowth >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                  )}
                  {formatGrowth(kpi.aovGrowth)} from previous period
                </p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Top Segment</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {kpi?.topSegment?.name || "N/A"}
              </h3>
              <p className="text-sm font-medium text-gray-400 mt-1">
                {kpi?.topSegment
                  ? `${kpi.topSegment.percentage}% of total volume`
                  : "No sales data"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Revenue Trends
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                {timeframe === "This Month"
                  ? "Daily revenue over current month"
                  : `Revenue over ${timeframe.toLowerCase()}`}
              </p>
            </div>
            <div className="h-[340px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : (
                <Bar
                  options={barChartOptions as any}
                  data={getBarChartData()}
                />
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 flex flex-col">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Category Distribution
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Sales volume by product category
              </p>
            </div>
            <div className="flex-1 min-h-[280px] relative">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : (
                <>
                  <Doughnut
                    options={doughnutOptions}
                    data={getCategoryData()}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-6">
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-gray-900">
                        {totalTonnage.toLocaleString()}
                      </span>
                      <span className="block text-xs font-medium text-gray-500">
                        Total Units
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Best Selling Products List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Top Selling Products
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Best performing products by sales volume
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider rounded-xl">
                  <tr>
                    <th className="px-6 py-4 rounded-l-xl">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Quantity Sold</th>
                    <th className="px-6 py-4">Revenue</th>
                    <th className="px-6 py-4 rounded-r-xl">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {analyticsData?.topProducts &&
                  analyticsData.topProducts.length > 0 ? (
                    analyticsData.topProducts.map((product, idx) => (
                      <tr
                        key={product.id || idx}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors">
                              <Package className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-gray-900">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-600">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {product.sales.toLocaleString()} units
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold flex items-center ${product.growth >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {product.growth >= 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                            )}
                            {formatGrowth(product.growth)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-gray-500 font-medium"
                      >
                        No sales data available for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
