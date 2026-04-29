"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    Package
} from 'lucide-react';

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
    items: OrderItem[];
}

const OrdersPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/orders/vendor`,
                {
                    credentials: "include",
                }
            );

            if (res.ok) {
                const result = await res.json();
                setOrders(result.data || []);
            } else if (res.status === 401 || res.status === 403) {
                router.push('/login');
            } else {
                setError('Failed to fetch orders');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const orderId = `#${order.order_id.slice(0, 8).toUpperCase()}`;
        const matchesSearch = orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All Orders' || 
                              order.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const formatOrderId = (id: string): string => {
        return `#${id.slice(0, 8).toUpperCase()}`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatCurrency = (value: number): string => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value.toFixed(2)}`;
    };

    const getStatusLabel = (status: string): string => {
        const map: Record<string, string> = {
            pending: 'Pending',
            confirmed: 'Processing',
            shipped: 'Shipped',
            delivered: 'Completed',
            cancelled: 'Cancelled',
        };
        return map[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
    };

    const getStatusIcon = (status: string) => {
        const normalized = status.toLowerCase();
        if (normalized === 'delivered' || normalized === 'completed') return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
        if (normalized === 'confirmed' || normalized === 'processing' || normalized === 'shipped') return <Clock className="w-4 h-4 mr-1.5" />;
        if (normalized === 'cancelled') return <XCircle className="w-4 h-4 mr-1.5" />;
        return <Clock className="w-4 h-4 mr-1.5" />;
    };

    const getStatusColor = (status: string) => {
        const normalized = status.toLowerCase();
        if (normalized === 'delivered' || normalized === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100/50';
        if (normalized === 'confirmed' || normalized === 'processing' || normalized === 'shipped') return 'bg-blue-50 text-blue-700 border-blue-100/50';
        if (normalized === 'cancelled') return 'bg-rose-50 text-rose-700 border-rose-100/50';
        return 'bg-amber-50 text-amber-700 border-amber-100/50';
    };

    const getTotalItems = (items: OrderItem[]): string => {
        const total = items.reduce((sum, item) => sum + item.quantity, 0);
        return `${total} items`;
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
                                        {filteredOrders.length > 0 ? (
                                            filteredOrders.map((order, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-7 py-5 font-bold text-gray-900">{formatOrderId(order.order_id)}</td>
                                                    <td className="px-7 py-5 font-semibold text-gray-700">{order.customer_name}</td>
                                                    <td className="px-7 py-5 text-gray-500 font-medium">{formatDate(order.created_at)}</td>
                                                    <td className="px-7 py-5 font-medium text-gray-700">{getTotalItems(order.items)}</td>
                                                    <td className="px-7 py-5 font-bold text-gray-900">{formatCurrency(order.total_amount)}</td>
                                                    <td className="px-7 py-5">
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center border ${getStatusColor(order.status)}`}>
                                                            {getStatusIcon(order.status)}
                                                            {getStatusLabel(order.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-7 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button 
                                                                onClick={() => router.push(`/orders/${order.order_id}`)}
                                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                                                title="View Details"
                                                            >
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
                                                    {orders.length === 0 ? 'No orders yet. Orders will appear here once customers start purchasing.' : 'No orders found matching your search or filter.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            {filteredOrders.length > 0 && (
                                <div className="p-5 border-t border-gray-100/80 flex items-center justify-between bg-gray-50/30">
                                    <p className="text-sm text-gray-500 font-medium">
                                        Showing <span className="font-bold text-gray-900">1</span> to <span className="font-bold text-gray-900">{filteredOrders.length}</span> of <span className="font-bold text-gray-900">{orders.length}</span> results
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
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default OrdersPage;