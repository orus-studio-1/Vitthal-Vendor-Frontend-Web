"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  BarChart,
  Wallet,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuthStore } from '@/store/authStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#111',
      bodyColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      boxPadding: 6,
      usePointStyle: true,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.04)',
        drawBorder: false,
      },
      border: { dash: [4, 4], display: false },
      ticks: {
        color: '#9ca3af',
        padding: 12,
        font: {
          family: "'Inter', sans-serif",
          size: 12,
        },
        callback: (value: any) => '₹' + value,
      }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#9ca3af',
        padding: 12,
        font: {
          family: "'Inter', sans-serif",
          size: 12,
        },
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  },
};

const chartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Revenue',
      data: [1200, 1900, 1500, 2200, 2800, 2400, 3100],
      fill: true,
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        return gradient;
      },
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 2.5,
      tension: 0.4,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: 'rgba(16, 185, 129, 1)',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
};

const recentOrders = [
  { id: '#ORD-9801', customer: 'Tata Motors', product: 'High-Tensile Steel Coil', date: 'Today, 10:30 AM', amount: '₹4.5L', status: 'Completed' },
  { id: '#ORD-9802', customer: 'Mahindra & Mahindra', product: 'ABS Plastic Pellets', date: 'Today, 09:15 AM', amount: '₹2.2L', status: 'Processing' },
  { id: '#ORD-9803', customer: 'Maruti Suzuki', product: 'Industrial Lubricant', date: 'Yesterday', amount: '₹1.8L', status: 'Pending' },
  { id: '#ORD-9804', customer: 'Hyundai India', product: 'Aluminum Alloy Sheets', date: 'Yesterday', amount: '₹6.5L', status: 'Completed' },
  { id: '#ORD-9805', customer: 'Ashok Leyland', product: 'Polyurethane Resin', date: 'Oct 24', amount: '₹1.2L', status: 'Processing' },
];

const topProducts = [
  { name: 'High-Tensile Steel Coil', sales: 1240, revenue: '₹4.2M' },
  { name: 'ABS Plastic Pellets', sales: 980, revenue: '₹2.8M' },
  { name: 'Aluminum Alloy Sheets', sales: 620, revenue: '₹3.1M' },
];

const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1.5">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
      </div>
      <div className="p-3.5 bg-emerald-50/80 rounded-2xl text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-300">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="mt-5 flex items-center">
      <span className={`flex items-center text-sm font-semibold px-2 py-1 rounded-lg ${trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {trendValue}
      </span>
      <span className="text-sm text-gray-400 ml-3 font-medium">vs last week</span>
    </div>
    {/* Decorative background element */}
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br from-emerald-50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
  </div>
);

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    setIsClient(true);
    checkVendorSetup();
  }, []);

  const checkVendorSetup = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/checkSetupStatus`,
        {
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (!data.isSetupComplete) {
          router.push("/profile/setup");
        } else {
          setIsSetupComplete(true);
        }
      } else {
        // If check fails, redirect to setup to be safe
        router.push("/profile/setup");
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
      // On error, redirect to setup
      router.push("/profile/setup");
    } finally {
      setIsCheckingSetup(false);
    }
  };

  if (!isClient || isCheckingSetup) return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!isSetupComplete) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-gray-500 mt-1.5 font-medium">Welcome back! Here's what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold shadow-sm focus:ring-2 focus:ring-gray-200 outline-none">
              Export Report
            </button>
            <button className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-sm font-semibold shadow-sm shadow-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 outline-none flex items-center gap-2">
              <Package className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Revenue" value="₹24,560.00" icon={Wallet} trend="up" trendValue="+12.5%" />
          <StatCard title="Total Orders" value="1,245" icon={ShoppingCart} trend="up" trendValue="+8.2%" />
          <StatCard title="Active Products" value="48" icon={Package} trend="up" trendValue="+2.4%" />
          <StatCard title="Total Customers" value="892" icon={Users} trend="up" trendValue="+14.1%" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100/80 shadow-sm p-7 relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Revenue Analytics</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Weekly earnings overview</p>
              </div>
              <select className="bg-gray-50/80 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block px-4 py-2 outline-none cursor-pointer hover:bg-gray-100 transition-colors">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-[320px] w-full mt-4">
              <Line options={chartOptions as any} data={chartData} />
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-7 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Top Products</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Best selling items</p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6 flex-1 mt-2">
              {topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{product.name}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{product.sales} sales</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{product.revenue}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-100/50">
              View All Products
            </button>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm overflow-hidden">
          <div className="p-7 border-b border-gray-100/80 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recent Orders</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Latest transactions across your store</p>
            </div>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl transition-colors">
              View All Orders
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-7 py-4">Order ID</th>
                  <th className="px-7 py-4">Customer</th>
                  <th className="px-7 py-4">Product</th>
                  <th className="px-7 py-4">Date</th>
                  <th className="px-7 py-4">Amount</th>
                  <th className="px-7 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors cursor-pointer group">
                    <td className="px-7 py-5 font-bold text-gray-900">{order.id}</td>
                    <td className="px-7 py-5 font-medium text-gray-700">{order.customer}</td>
                    <td className="px-7 py-5 font-medium text-gray-700">{order.product}</td>
                    <td className="px-7 py-5 text-gray-500 font-medium">{order.date}</td>
                    <td className="px-7 py-5 font-bold text-gray-900">{order.amount}</td>
                    <td className="px-7 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-2
                                                ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : ''}
                                                ${order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border border-blue-100/50' : ''}
                                                ${order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100/50' : ''}
                                            `}>
                        <span className={`w-1.5 h-1.5 rounded-full
                                                    ${order.status === 'Completed' ? 'bg-emerald-500' : ''}
                                                    ${order.status === 'Processing' ? 'bg-blue-500' : ''}
                                                    ${order.status === 'Pending' ? 'bg-amber-500' : ''}
                                                `}></span>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;