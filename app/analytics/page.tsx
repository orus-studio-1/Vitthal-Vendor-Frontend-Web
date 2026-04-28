"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
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
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

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
  Filler
);

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#111',
      bodyColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0, 0, 0, 0.04)' },
      border: { display: false },
      ticks: { 
        color: '#9ca3af', 
        callback: (value: any) => '₹' + value + 'k'
      }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#9ca3af' }
    }
  }
};

const monthlySalesData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Revenue (in ₹k)',
      data: [420, 550, 480, 620, 800, 780, 950, 1100, 1080, 1220, 1480, 1600],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderRadius: 6,
      barThickness: 24,
    },
  ],
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        color: '#6b7280',
        font: { family: "'Inter', sans-serif", size: 12 }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#111',
      bodyColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 12,
    }
  },
  cutout: '70%',
};

const categoryData = {
  labels: ['Industrial Metals', 'Engineering Plastics', 'Specialty Chemicals', 'Auto Components'],
  datasets: [
    {
      data: [40, 30, 20, 10],
      backgroundColor: [
        'rgba(16, 185, 129, 0.9)',
        'rgba(59, 130, 246, 0.9)',
        'rgba(245, 158, 11, 0.9)',
        'rgba(139, 92, 246, 0.9)',
      ],
      borderWidth: 0,
      hoverOffset: 4
    },
  ],
};

const topSellingProducts = [
  { name: 'High-Tensile Steel Coil', category: 'Industrial Metals', sales: 1240, growth: '+18.5%', revenue: '₹4.2M' },
  { name: 'ABS Plastic Pellets (Bulk)', category: 'Engineering Plastics', sales: 980, growth: '+12.3%', revenue: '₹2.8M' },
  { name: 'Polyurethane Resin', category: 'Specialty Chemicals', sales: 750, growth: '+24.1%', revenue: '₹1.5M' },
  { name: 'Precision Aluminum Alloy', category: 'Industrial Metals', sales: 620, growth: '-2.4%', revenue: '₹3.1M' },
  { name: 'Industrial Grade Coolant', category: 'Specialty Chemicals', sales: 540, growth: '+5.2%', revenue: '₹0.8M' },
];

const AnalyticsPage = () => {
  const [isClient, setIsClient] = useState(false);
  const [timeframe, setTimeframe] = useState('This Year');

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Industrial Analytics</h1>
            <p className="text-gray-500 mt-1.5 font-medium">B2B Performance tracking for Metals, Plastics & Chemicals.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
              >
                <option>This Month</option>
                <option>Last 6 Months</option>
                <option>This Year</option>
                <option>All Time</option>
              </select>
              <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
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
              <p className="text-sm font-medium text-gray-500">Total Tonnage Sold</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">12,480 MT</h3>
              <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> +15.2% from last year
              </p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">₹4.2L</h3>
              <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> +8.4% from last month
              </p>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Top Segment</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">Metals</h3>
              <p className="text-sm font-medium text-gray-400 mt-1">
                40% of total volume
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Sales Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Revenue Trends</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Monthly revenue in ₹k over {timeframe.toLowerCase()}</p>
            </div>
            <div className="h-[340px] w-full">
              <Bar options={barChartOptions as any} data={monthlySalesData} />
            </div>
          </div>

          {/* Sales by Category Doughnut Chart */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 flex flex-col">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Segment Distribution</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Volume distribution by material type</p>
            </div>
            <div className="flex-1 min-h-[280px] relative">
              <Doughnut options={doughnutOptions} data={categoryData} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-6">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-gray-900">12.4k</span>
                  <span className="block text-xs font-medium text-gray-500">Metric Tons</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Selling Products List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Key Industrial Products</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Top performing materials by contract volume</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider rounded-xl">
                <tr>
                  <th className="px-6 py-4 rounded-l-xl">Material Specification</th>
                  <th className="px-6 py-4">Industry Segment</th>
                  <th className="px-6 py-4">Tonnage Sold</th>
                  <th className="px-6 py-4">Est. Revenue</th>
                  <th className="px-6 py-4 rounded-r-xl">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topSellingProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{product.sales} MT</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{product.revenue}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold flex items-center ${product.growth.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {product.growth.startsWith('+') ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                        {product.growth}
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

export default AnalyticsPage;