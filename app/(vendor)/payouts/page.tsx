'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    CreditCard,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Calendar,
    Copy,
    Check,
    RefreshCcw,
    X,
    Package,
    MapPin,
    User,
    Mail,
    Phone,
    FileText,
    ArrowUpRight,
    Truck,
    XCircle
} from 'lucide-react';
import { vendorPayoutApi } from '@/lib/api';

interface Payout {
    payout_id: string;
    order_id: string;
    vendor_id: string;
    payout_percentage: string | number;
    payout_amount: string | number;
    payout_status: string;
    delivered_at: string | null;
    due_date: string | null;
    last_paid_at: string | null;
    payout_notes: string | null;
    order_total_amount: string | number;
    order_status: string;
    client_payment_status: string | null;
    customer_name: string;
    vendor_name: string;
    vendor_credit_cycle: string | null;
    client_paid_amount: string | number;
    client_paid_percentage: string | number;
}

export default function VendorPayoutsPage() {
    const router = useRouter();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Detail Drawer state
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
    const [orderDetail, setOrderDetail] = useState<any | null>(null);
    const [trackingDetail, setTrackingDetail] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const getPayoutTimelineDetails = (payout: Payout) => {
        if (payout.payout_status === 'paid') {
            return {
                status: 'settled',
                text: 'Fully Settled',
                daysText: 'Settled',
                color: 'text-emerald-700 bg-emerald-50 border-emerald-100'
            };
        }
        if (!payout.due_date) {
            return {
                status: 'awaiting_delivery',
                text: 'Awaiting Delivery',
                daysText: 'Pending delivery to start cycle',
                color: 'text-slate-500 bg-slate-100 border-slate-200'
            };
        }
        const now = new Date();
        const due = new Date(payout.due_date);
        now.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return {
                status: 'overdue',
                text: 'Overdue',
                daysText: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`,
                color: 'text-rose-700 bg-rose-50 border-rose-100 font-semibold'
            };
        } else if (diffDays === 0) {
            return {
                status: 'due_today',
                text: 'Due Today',
                daysText: 'Due today',
                color: 'text-amber-700 bg-amber-50 border-amber-100 font-semibold'
            };
        } else {
            return {
                status: 'pending',
                text: 'In Progress',
                daysText: `Expected in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
                color: 'text-blue-700 bg-blue-50 border-blue-100'
            };
        }
    };

    const fetchOrderDetails = async (orderId: string) => {
        setDetailLoading(true);
        setDetailError(null);
        setOrderDetail(null);
        setTrackingDetail(null);
        try {
            const [orderRes, trackRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/vendor/${orderId}`, {
                    credentials: "include",
                    headers: { "x-request-from": "vendor" }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/vendor/${orderId}/track`, {
                    credentials: "include",
                    headers: { "x-request-from": "vendor" }
                })
            ]);

            if (orderRes.ok) {
                const orderData = await orderRes.json();
                setOrderDetail(orderData.data);
            } else {
                setDetailError("Failed to fetch order details.");
            }

            if (trackRes.ok) {
                const trackData = await trackRes.json();
                setTrackingDetail(trackData.data);
            }
        } catch (err) {
            console.error("Error fetching order details:", err);
            setDetailError("Network error loading details.");
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        if (selectedOrderId) {
            void fetchOrderDetails(selectedOrderId);
        }
    }, [selectedOrderId]);

    const fetchPayouts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/orders/vendor/payouts`,
                {
                    credentials: "include",
                    headers: {
                        "x-request-from": "vendor",
                    },
                }
            );

            if (res.ok) {
                const result = await res.json();
                setPayouts(result.data || []);
            } else if (res.status === 401 || res.status === 403) {
                router.push("/login");
            } else {
                setError("Failed to fetch payouts ledger.");
            }
        } catch (err) {
            console.error("Error fetching payouts:", err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchPayouts();
    }, []);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Calculate days remaining helper
    const getDaysLeft = (dueDateStr: string | null, payoutStatus: string) => {
        if (payoutStatus === 'paid') return { text: 'Settled', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        if (!dueDateStr) return { text: 'Awaiting Delivery', color: 'bg-zinc-150 text-zinc-500 border-zinc-200' };
        
        const now = new Date();
        const due = new Date(dueDateStr);
        now.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { 
                text: `Overdue by ${Math.abs(diffDays)}d`, 
                color: 'bg-red-50 text-red-700 border-red-150 animate-pulse font-semibold' 
            };
        } else if (diffDays === 0) {
            return { text: 'Due Today', color: 'bg-amber-50 text-amber-700 border-amber-150 font-semibold' };
        } else {
            return { text: `${diffDays}d left`, color: 'bg-blue-50 text-blue-700 border-blue-150' };
        }
    };

    // Calculate Stats
    const stats = useMemo(() => {
        let totalSettled = 0;
        let totalOutstanding = 0;
        let overdueCount = 0;

        payouts.forEach(p => {
            const orderAmt = Number(p.order_total_amount);
            const paidAmt = Number(p.payout_amount);

            totalSettled += paidAmt;
            totalOutstanding += (orderAmt - paidAmt);

            if (p.payout_status !== 'paid' && p.due_date) {
                const now = new Date();
                const due = new Date(p.due_date);
                now.setHours(0, 0, 0, 0);
                due.setHours(0, 0, 0, 0);
                if (due.getTime() < now.getTime()) {
                    overdueCount++;
                }
            }
        });

        return {
            totalSettled,
            totalOutstanding,
            overdueCount
        };
    }, [payouts]);

    // Search and Filter
    const filteredPayouts = useMemo(() => {
        let result = payouts;

        if (statusFilter !== 'all') {
            if (statusFilter === 'overdue') {
                result = result.filter(p => {
                    if (p.payout_status === 'paid' || !p.due_date) return false;
                    const now = new Date();
                    const due = new Date(p.due_date);
                    now.setHours(0, 0, 0, 0);
                    due.setHours(0, 0, 0, 0);
                    return due.getTime() < now.getTime();
                });
            } else {
                result = result.filter(p => p.payout_status === statusFilter);
            }
        }

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            result = result.filter(p => 
                p.customer_name.toLowerCase().includes(query) ||
                p.order_id.toLowerCase().includes(query)
            );
        }

        return result;
    }, [payouts, searchTerm, statusFilter]);

    return (
        <div className="min-h-screen bg-[#fafafa] p-6 md:p-8 lg:p-10 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Payouts & Settlements
                        </h1>
                        <p className="text-gray-500 mt-1.5 font-medium">
                            Monitor client payments and administrative releases to your bank account.
                        </p>
                    </div>
                    <button 
                        onClick={fetchPayouts}
                        disabled={loading}
                        className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Ledger
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {/* Total Settled */}
                    <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-xs transition hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-500">Total Settled</span>
                            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-gray-900">₹{stats.totalSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                            <p className="mt-1 text-xs text-gray-400">Transferred by admin to you</p>
                        </div>
                    </div>

                    {/* Total Outstanding */}
                    <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-xs transition hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-500">Total Outstanding</span>
                            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-gray-900">₹{stats.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                            <p className="mt-1 text-xs text-gray-400">Owed/pending admin release</p>
                        </div>
                    </div>

                    {/* Overdue */}
                    <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-xs transition hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-500">Overdue Settlements</span>
                            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-gray-900">{stats.overdueCount}</h3>
                            <p className="mt-1 text-xs text-gray-400">Past credit cycle terms</p>
                        </div>
                    </div>
                </div>

                {/* Table & Filtering */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-sm p-6">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm font-medium rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                                placeholder="Search by Order ID or Customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">Status:</span>
                            <div className="flex rounded-2xl bg-gray-100 p-1">
                                {[
                                    { val: 'all', label: 'All' },
                                    { val: 'pending', label: 'Pending' },
                                    { val: 'partially_paid', label: 'Partial' },
                                    { val: 'paid', label: 'Paid' },
                                    { val: 'overdue', label: 'Overdue' }
                                ].map((status) => (
                                    <button
                                        key={status.val}
                                        onClick={() => setStatusFilter(status.val)}
                                        className={`rounded-xl px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                                            statusFilter === status.val
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredPayouts.length === 0 ? (
                        <div className="rounded-2xl bg-zinc-50 py-16 text-center text-zinc-400">
                            <CreditCard className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
                            <p className="text-sm font-medium">No payout records found matching your filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm text-gray-600">
                                <thead>
                                    <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400">
                                        <th className="pb-3 pl-2">Order Details</th>
                                        <th className="pb-3">Client Payment status</th>
                                        <th className="pb-3">Admin Settlement status</th>
                                        <th className="pb-3 text-center">Days Remaining</th>
                                        <th className="pb-3">Credit Cycle</th>
                                        <th className="pb-3 pr-2">Settlement Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-150">
                                    {filteredPayouts.map((payout) => {
                                        const daysBadge = getDaysLeft(payout.due_date, payout.payout_status);
                                        return (
                                            <tr 
                                                key={payout.payout_id} 
                                                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setSelectedOrderId(payout.order_id);
                                                    setSelectedPayout(payout);
                                                }}
                                            >
                                                {/* Order Details */}
                                                <td className="py-4 pl-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-semibold text-gray-900">
                                                            #{payout.order_id.split('-')[0].toUpperCase()}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopy(payout.order_id, payout.payout_id);
                                                            }}
                                                            className="text-gray-400 hover:text-gray-650 transition p-1 hover:bg-gray-100 rounded-md"
                                                        >
                                                            {copiedId === payout.payout_id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                                                        </button>
                                                    </div>
                                                    <p className="font-bold text-gray-950 mt-1">₹{Number(payout.order_total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{payout.customer_name}</p>
                                                </td>

                                                {/* Client Payment status */}
                                                <td className="py-4 whitespace-nowrap">
                                                    <p className="font-bold text-indigo-700">
                                                        ₹{Number(payout.client_paid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-[10px] uppercase font-semibold text-gray-400 mt-0.5">
                                                        {Number(payout.client_paid_percentage).toFixed(0)}% paid by Client
                                                    </p>
                                                </td>

                                                {/* Admin Settlement status */}
                                                <td className="py-4 whitespace-nowrap">
                                                    <p className="font-bold text-emerald-700">
                                                        ₹{Number(payout.payout_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <div className="mt-1 flex items-center">
                                                        {payout.payout_status === 'paid' && (
                                                            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                                                                Fully Settled
                                                            </span>
                                                        )}
                                                        {payout.payout_status === 'partially_paid' && (
                                                            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
                                                                {Number(payout.payout_percentage).toFixed(0)}% Settled
                                                            </span>
                                                        )}
                                                        {payout.payout_status === 'pending' && (
                                                            <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 uppercase">
                                                                Unsettled
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Days Remaining */}
                                                <td className="py-4 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${daysBadge.color}`}>
                                                        {daysBadge.text}
                                                    </span>
                                                </td>

                                                {/* Credit Cycle / Due Dates */}
                                                <td className="py-4">
                                                    <p className="font-bold text-gray-700">{payout.vendor_credit_cycle || 'Standard Terms'}</p>
                                                    {payout.delivered_at && (
                                                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            <span>Delivered: {new Date(payout.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Settlement Details */}
                                                <td className="py-4 pr-2 whitespace-nowrap">
                                                    {payout.last_paid_at ? (
                                                        <>
                                                            <p className="font-semibold text-gray-800">
                                                                {new Date(payout.last_paid_at).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[150px]" title={payout.payout_notes || ''}>
                                                                {payout.payout_notes || 'No transaction notes'}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Awaiting admin release</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Drawer */}
                {selectedOrderId && (
                    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
                        {/* Backdrop */}
                        <div 
                            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
                            onClick={() => setSelectedOrderId(null)} 
                        />
                        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-gray-150 flex items-center justify-between bg-gray-50">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-950">Payout Order Details</h2>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {selectedOrderId}</p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedOrderId(null)}
                                        className="rounded-xl border border-gray-200 p-2 text-gray-400 hover:text-gray-650 hover:bg-gray-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {detailLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-sm text-gray-500 font-medium">Fetching order info...</p>
                                        </div>
                                    ) : detailError ? (
                                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-750">
                                            {detailError}
                                        </div>
                                    ) : orderDetail ? (
                                        <>
                                            {/* Status Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                                                    <p className="text-xs text-gray-400 font-medium uppercase">Order Status</p>
                                                    <p className="text-base font-bold text-gray-900 mt-1 capitalize">{orderDetail.status}</p>
                                                </div>
                                                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                                                    <p className="text-xs text-gray-400 font-medium uppercase">Payment Status</p>
                                                    <p className="text-base font-bold text-gray-900 mt-1 capitalize">{orderDetail.payment_status}</p>
                                                </div>
                                            </div>

                                            {/* Payout Settlement Timeline */}
                                            {selectedPayout && (
                                                <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                                                    <h3 className="font-bold text-gray-950 text-sm tracking-tight border-b border-gray-100 pb-2 flex items-center justify-between">
                                                        <span>Payout Settlement Timeline</span>
                                                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                                                            Cycle: {selectedPayout.vendor_credit_cycle || 'Standard Terms'}
                                                        </span>
                                                    </h3>
                                                    <div className="relative pl-6 border-l border-gray-150 space-y-6 py-2 ml-3">
                                                        {/* Step 1: Order Delivered */}
                                                        <div className="relative">
                                                            <span className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ${
                                                                selectedPayout.delivered_at ? 'bg-emerald-500 ring-emerald-50 text-white' : 'bg-slate-350 ring-slate-50'
                                                            }`}>
                                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                            </span>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">Order Delivered</p>
                                                                {selectedPayout.delivered_at ? (
                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                        Delivered on {new Date(selectedPayout.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs text-gray-400 mt-0.5">Awaiting order delivery completion</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Step 2: Credit terms */}
                                                        <div className="relative">
                                                            <span className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ${
                                                                selectedPayout.delivered_at ? 'bg-emerald-500 ring-emerald-50 text-white' : 'bg-slate-350 ring-slate-50'
                                                            }`}>
                                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                            </span>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">Credit Cycle Term Active</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    {selectedPayout.vendor_credit_cycle || 'Standard terms (15 Days)'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Step 3: Expected payout */}
                                                        <div className="relative">
                                                            {(() => {
                                                                const details = getDaysLeft(selectedPayout.due_date, selectedPayout.payout_status);
                                                                const isFinished = selectedPayout.payout_status === 'paid';
                                                                const isActive = selectedPayout.delivered_at && !isFinished;
                                                                return (
                                                                    <>
                                                                        <span className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ${
                                                                            isFinished ? 'bg-emerald-500 ring-emerald-50' : 
                                                                            isActive ? 'bg-blue-500 ring-blue-50 animate-pulse' : 
                                                                            'bg-slate-300 ring-slate-50'
                                                                        }`}>
                                                                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                                        </span>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-gray-900">Estimated Settlement Date</p>
                                                                            {selectedPayout.due_date ? (
                                                                                <div className="mt-1 flex flex-col gap-1">
                                                                                    <p className="text-xs text-slate-500">
                                                                                        Expected Date: {new Date(selectedPayout.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                                    </p>
                                                                                    <span className={`inline-flex items-center self-start rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${details.color}`}>
                                                                                        {details.text}
                                                                                    </span>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-xs text-gray-400 mt-0.5">Will be calculated upon delivery</p>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Step 4: Admin release */}
                                                        <div className="relative">
                                                            <span className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ${
                                                                selectedPayout.payout_status === 'paid' ? 'bg-emerald-500 ring-emerald-50' : 
                                                                selectedPayout.payout_status === 'partially_paid' ? 'bg-amber-500 ring-amber-50' : 
                                                                'bg-slate-300 ring-slate-50'
                                                            }`}>
                                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                            </span>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">Admin Release & Settlement</p>
                                                                <div className="mt-1 space-y-1">
                                                                    <p className="text-xs text-gray-500">
                                                                        Status: <span className="font-semibold uppercase text-gray-700">{selectedPayout.payout_status}</span> 
                                                                        {selectedPayout.payout_status !== 'pending' && ` (${Number(selectedPayout.payout_percentage).toFixed(0)}% settled)`}
                                                                    </p>
                                                                    {selectedPayout.last_paid_at && (
                                                                        <p className="text-xs text-slate-400">
                                                                            Settled on: {new Date(selectedPayout.last_paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </p>
                                                                    )}
                                                                    {selectedPayout.payout_notes && (
                                                                        <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 p-2 rounded-xl mt-1.5">
                                                                            Note: {selectedPayout.payout_notes}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Customer & Address */}
                                            <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                                                <h3 className="font-bold text-gray-950 text-sm tracking-tight border-b border-gray-100 pb-2">Customer & Delivery Information</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <User className="w-4 h-4 text-gray-455 shrink-0" />
                                                            <span className="font-medium text-gray-900">{orderDetail.customer_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <Mail className="w-4 h-4 text-gray-455 shrink-0" />
                                                            <span className="text-gray-600 truncate">{orderDetail.customer_email}</span>
                                                        </div>
                                                        {orderDetail.customer_phone && (
                                                            <div className="flex items-center gap-2.5">
                                                                <Phone className="w-4 h-4 text-gray-455 shrink-0" />
                                                                <span className="text-gray-600">{orderDetail.customer_phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2.5">
                                                        <MapPin className="w-4 h-4 text-gray-455 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-gray-800 leading-relaxed">
                                                                {orderDetail.address_line}<br />
                                                                {orderDetail.city}, {orderDetail.state} - {orderDetail.pincode}<br />
                                                                {orderDetail.country}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                                                <h3 className="font-bold text-gray-950 text-sm tracking-tight border-b border-gray-100 pb-2">Ordered Products</h3>
                                                <div className="divide-y divide-gray-100">
                                                    {orderDetail.items && orderDetail.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="py-4 flex items-start gap-4 first:pt-0 last:pb-0">
                                                            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden">
                                                                {item.image_url ? (
                                                                    <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="w-6 h-6 text-gray-300" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-gray-900 text-sm truncate">{item.product_name}</h4>
                                                                {item.product_description && (
                                                                    <p className="text-xs text-gray-450 line-clamp-1 mt-0.5">{item.product_description}</p>
                                                                )}
                                                                {item.variant_properties && Object.keys(item.variant_properties).length > 0 && (
                                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                                        {Object.entries(item.variant_properties).map(([key, val]) => (
                                                                            <span key={key} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-650 capitalize border border-gray-200">
                                                                                {key}: {String(val)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <p className="text-xs text-gray-500 mt-1.5">
                                                                    Qty: <span className="font-semibold text-gray-800">{item.quantity}</span> • Price: <span className="font-semibold text-gray-800">₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-gray-950 text-sm">₹{Number(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t border-gray-150 pt-3 flex justify-between items-center bg-gray-50/50 p-3 rounded-xl">
                                                    <span className="text-sm font-semibold text-gray-600">Total Order Amount</span>
                                                    <span className="text-base font-bold text-emerald-700">₹{Number(orderDetail.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>

                                            {/* Status History Timeline */}
                                            <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                                                <h3 className="font-bold text-gray-950 text-sm tracking-tight border-b border-gray-100 pb-2">Order Tracking Timeline</h3>
                                                {trackingDetail && trackingDetail.statusHistory && trackingDetail.statusHistory.length > 0 ? (
                                                    <div className="relative pl-6 border-l border-gray-150 space-y-6 py-2 ml-3">
                                                        {trackingDetail.statusHistory.map((history: any, index: number) => (
                                                            <div key={history.id || index} className="relative">
                                                                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-emerald-50 text-white">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                                </span>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900 capitalize">
                                                                        {history.status.replaceAll('_', ' ')}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                                        {new Date(history.created_at).toLocaleString('en-IN', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </p>
                                                                    {history.note && (
                                                                        <p className="text-xs text-gray-650 mt-1 bg-gray-50 border border-gray-100 p-2 rounded-xl">
                                                                            {history.note}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="relative pl-6 border-l border-gray-150 space-y-6 py-2 ml-3">
                                                        {/* Custom standard fallback timeline */}
                                                        <div className="relative">
                                                            <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-emerald-50">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                            </span>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 capitalize">{orderDetail.status}</p>
                                                                <p className="text-[11px] text-gray-400 mt-0.5">Current order state</p>
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 ring-4 ring-gray-100">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                            </span>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-400">Order Placed</p>
                                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                                    {new Date(orderDetail.created_at).toLocaleString('en-IN', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-20 text-gray-450 italic">
                                            No information found for this order.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
