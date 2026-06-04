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
    RefreshCcw
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
                                            <tr key={payout.payout_id} className="hover:bg-gray-50/50 transition-colors">
                                                {/* Order Details */}
                                                <td className="py-4 pl-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-semibold text-gray-900">
                                                            #{payout.order_id.split('-')[0].toUpperCase()}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleCopy(payout.order_id, payout.payout_id)}
                                                            className="text-gray-400 hover:text-gray-600 transition"
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

            </div>
        </div>
    );
}
