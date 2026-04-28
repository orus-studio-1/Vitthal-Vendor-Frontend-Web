"use client";

import React, { useState } from 'react';
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
    ChevronRight
} from 'lucide-react';

const mockOrders = [
  { id: '#ORD-9801', customer: 'Tata Motors Ltd.', date: 'Oct 28, 2023', items: '24 MT', total: '₹4.5L', status: 'Completed' },
  { id: '#ORD-9802', customer: 'Mahindra & Mahindra', date: 'Oct 28, 2023', items: '12 MT', total: '₹2.2L', status: 'Processing' },
  { id: '#ORD-9803', customer: 'Maruti Suzuki India', date: 'Oct 27, 2023', items: '8 MT', total: '₹1.8L', status: 'Pending' },
  { id: '#ORD-9804', customer: 'Hyundai Motors', date: 'Oct 27, 2023', items: '35 MT', total: '₹6.5L', status: 'Completed' },
  { id: '#ORD-9805', customer: 'Ashok Leyland', date: 'Oct 26, 2023', items: '6 MT', total: '₹1.2L', status: 'Processing' },
  { id: '#ORD-9806', customer: 'TVS Motors', date: 'Oct 26, 2023', items: '50 MT', total: '₹9.8L', status: 'Cancelled' },
  { id: '#ORD-9807', customer: 'Hero MotoCorp', date: 'Oct 25, 2023', items: '18 MT', total: '₹3.4L', status: 'Completed' },
  { id: '#ORD-9808', customer: 'Force Motors', date: 'Oct 25, 2023', items: '10 MT', total: '₹1.9L', status: 'Pending' },
];

const OrdersPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Orders');

    const filteredOrders = mockOrders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              order.customer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All Orders' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'Completed': return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
            case 'Processing': return <Clock className="w-4 h-4 mr-1.5" />;
            case 'Pending': return <Clock className="w-4 h-4 mr-1.5" />;
            case 'Cancelled': return <XCircle className="w-4 h-4 mr-1.5" />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100/50';
            case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-100/50';
            case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100/50';
            case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-100/50';
            default: return 'bg-gray-50 text-gray-700 border-gray-100/50';
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Orders Management</h1>
                        <p className="text-gray-500 mt-1.5 font-medium">View and manage your recent customer orders.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export CSV
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
                        {['All Orders', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                                    statusFilter === status 
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' 
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
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

                {/* Orders Table */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm overflow-hidden">
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
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-7 py-5 font-bold text-gray-900">{order.id}</td>
                                            <td className="px-7 py-5 font-semibold text-gray-700">{order.customer}</td>
                                            <td className="px-7 py-5 text-gray-500 font-medium">{order.date}</td>
                                            <td className="px-7 py-5 font-medium text-gray-700">{order.items}</td>
                                            <td className="px-7 py-5 font-bold text-gray-900">{order.total}</td>
                                            <td className="px-7 py-5">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center border ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-7 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="View Details">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="More Options">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-7 py-16 text-center text-gray-500 font-medium">
                                            No orders found matching your search or filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="p-5 border-t border-gray-100/80 flex items-center justify-between bg-gray-50/30">
                        <p className="text-sm text-gray-500 font-medium">
                            Showing <span className="font-bold text-gray-900">1</span> to <span className="font-bold text-gray-900">{filteredOrders.length}</span> of <span className="font-bold text-gray-900">{mockOrders.length}</span> results
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50" disabled>
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button className="p-2 border border-emerald-500 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-sm min-w-[36px]">
                                1
                            </button>
                            <button className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors text-sm min-w-[36px]">
                                2
                            </button>
                            <button className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrdersPage;