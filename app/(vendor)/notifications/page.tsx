"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNotificationStore, type Notification } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Package,
  Image as ImageIcon,
  ShoppingBag,
  FileText,
  MessageSquare,
  Filter,
  ChevronRight,
  Sparkles,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type FilterTab = "all" | "unread" | "product" | "quotation";

const NOTIFICATION_CONFIG: Record<string, {
  icon: typeof Bell;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  product_approved: { icon: Package, colorClass: "text-emerald-600", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" },
  product_rejected: { icon: Package, colorClass: "text-red-600", bgClass: "bg-red-50", borderClass: "border-red-200" },
  image_approved: { icon: ImageIcon, colorClass: "text-blue-600", bgClass: "bg-blue-50", borderClass: "border-blue-200" },
  image_rejected: { icon: ImageIcon, colorClass: "text-red-600", bgClass: "bg-red-50", borderClass: "border-red-200" },
  vendor_product_approved: { icon: ShoppingBag, colorClass: "text-emerald-600", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" },
  vendor_product_rejected: { icon: ShoppingBag, colorClass: "text-red-600", bgClass: "bg-red-50", borderClass: "border-red-200" },
  quotation_request_received: { icon: FileText, colorClass: "text-indigo-600", bgClass: "bg-indigo-50", borderClass: "border-indigo-200" },
  quotation_offer_received: { icon: FileText, colorClass: "text-indigo-600", bgClass: "bg-indigo-50", borderClass: "border-indigo-200" },
  quotation_counter_received: { icon: MessageSquare, colorClass: "text-amber-600", bgClass: "bg-amber-50", borderClass: "border-amber-200" },
  quotation_accepted: { icon: FileText, colorClass: "text-emerald-600", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" },
  quotation_rejected: { icon: FileText, colorClass: "text-red-600", bgClass: "bg-red-50", borderClass: "border-red-200" },
  admin_confirmation_sent: { icon: Bell, colorClass: "text-blue-600", bgClass: "bg-blue-50", borderClass: "border-blue-200" },
  admin_confirmation_accepted: { icon: Check, colorClass: "text-emerald-600", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" },
  admin_confirmation_rejected: { icon: Bell, colorClass: "text-red-600", bgClass: "bg-red-50", borderClass: "border-red-200" },
  general: { icon: Bell, colorClass: "text-zinc-600", bgClass: "bg-zinc-50", borderClass: "border-zinc-200" },
};

function getNotifConfig(type: string) {
  return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.general;
}

function isProductType(type: string) {
  return [
    "product_approved", "product_rejected",
    "image_approved", "image_rejected",
    "vendor_product_approved", "vendor_product_rejected",
  ].includes(type);
}

function isQuotationType(type: string) {
  return [
    "quotation_request_received", "quotation_offer_received",
    "quotation_counter_received", "quotation_accepted", "quotation_rejected",
    "admin_confirmation_sent", "admin_confirmation_accepted", "admin_confirmation_rejected",
  ].includes(type);
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function groupByDate(notifications: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const buckets: Record<string, Notification[]> = {};

  for (const n of notifications) {
    const d = new Date(n.created_at);
    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    }

    if (!buckets[label]) buckets[label] = [];
    buckets[label].push(n);
  }

  for (const [label, items] of Object.entries(buckets)) {
    groups.push({ label, items });
  }

  return groups;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchNotifications,
    fetchMore,
    markRead,
    markAllRead,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, fetchMore]);

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Filter by tab
    if (activeTab === "unread") result = result.filter((n) => !n.is_read);
    else if (activeTab === "product") result = result.filter((n) => isProductType(n.type));
    else if (activeTab === "quotation") result = result.filter((n) => isQuotationType(n.type));

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notifications, activeTab, searchQuery]);

  const grouped = useMemo(() => groupByDate(filteredNotifications), [filteredNotifications]);

  const productCount = useMemo(() => notifications.filter((n) => isProductType(n.type)).length, [notifications]);
  const quotationCount = useMemo(() => notifications.filter((n) => isQuotationType(n.type)).length, [notifications]);

  function handleNotificationClick(n: Notification) {
    if (!n.is_read) markRead(n.id);

    const isProductQuotation =
      n.reference_type === "quotation" ||
      (!n.reference_type && n.type === "quotation_request_received" && !n.title?.toLowerCase().includes("service"));

    const isServiceNotif =
      n.reference_type === "service_quotation" ||
      n.reference_type === "service_ticket" ||
      n.reference_type === "service" ||
      n.reference_type === "service_booking" ||
      (!isProductQuotation && (n.type?.includes("service") || n.title?.toLowerCase().includes("service") || n.body?.toLowerCase().includes("service")));

    if (isServiceNotif && n.reference_id) {
      router.push(`/service-quotations/${n.reference_id}`);
    } else if (n.reference_id && (isProductQuotation || n.reference_type === "quotation" || n.type?.includes("quotation"))) {
      router.push(`/quotations/${n.reference_id}`);
    } else if (n.reference_type === "product" && n.reference_id) {
      router.push(`/products`);
    } else {
      router.push(`/notifications`);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-zinc-200" />
          <div className="h-4 w-40 rounded-full bg-zinc-200" />
        </div>
      </div>
    );
  }

  const isService = user?.vendorType === "service";

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "product", label: isService ? "Service" : "Product", count: productCount },
    { key: "quotation", label: "Quotation", count: quotationCount },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur-xl sticky top-[calc(4rem+36px)] z-30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-all hover:shadow-sm"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Notifications</h1>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {isService ? "Stay updated with your service bookings and quotations" : "Stay updated with your product approvals and quotations"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md active:scale-[0.98]"
              >
                <CheckCheck size={16} />
                Mark All Read
              </button>
            )}
          </div>

          {/* Tabs + Search */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1 rounded-xl bg-zinc-100/80 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                        activeTab === tab.key
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-200/80 text-zinc-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-700 placeholder-zinc-400 transition-all focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Mark All Read */}
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="mb-4 sm:hidden flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all active:scale-[0.98]"
          >
            <CheckCheck size={16} />
            Mark All Read
          </button>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-zinc-100 bg-white p-5">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-zinc-100" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-3/5 rounded-full bg-zinc-100" />
                    <div className="h-3.5 w-full rounded-full bg-zinc-100" />
                    <div className="h-3 w-1/4 rounded-full bg-zinc-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-inner">
                <BellOff size={40} className="text-emerald-400" />
              </div>
              <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
                <Sparkles size={16} className="text-amber-400" />
              </div>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-zinc-800">
              {activeTab === "unread"
                ? "You're all caught up!"
                : activeTab === "product"
                ? (isService ? "No service notifications" : "No product notifications")
                : activeTab === "quotation"
                ? "No quotation notifications"
                : searchQuery
                ? "No matching notifications"
                : "No notifications yet"}
            </h3>
            <p className="mt-2 max-w-sm text-center text-sm text-zinc-500">
              {activeTab === "unread"
                ? "There are no unread notifications. All updates have been reviewed."
                : `When there are updates about your ${isService ? "services" : "products"} or quotations, they'll appear here.`}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <div key={group.label}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    {group.label}
                  </h2>
                  <div className="h-px flex-1 bg-zinc-100" />
                  <span className="text-xs font-medium text-zinc-300">
                    {group.items.length} notification{group.items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {group.items.map((n) => {
                    const config = getNotifConfig(n.type);
                    const Icon = config.icon;

                    return (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`group w-full text-left rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.995] ${
                          !n.is_read
                            ? `${config.bgClass}/30 ${config.borderClass} shadow-sm`
                            : "border-zinc-100 bg-white hover:border-zinc-200"
                        }`}
                      >
                        <div className="flex items-start gap-3.5 sm:gap-4">
                          {/* Icon */}
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-105 ${
                              !n.is_read
                                ? `${config.bgClass} ${config.colorClass} shadow-sm`
                                : "bg-zinc-100 text-zinc-400"
                            }`}
                          >
                            <Icon size={20} />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3
                                className={`text-sm leading-snug ${
                                  !n.is_read
                                    ? "font-bold text-zinc-900"
                                    : "font-semibold text-zinc-600"
                                }`}
                              >
                                {n.title}
                              </h3>
                              <div className="flex items-center gap-2 shrink-0">
                                {!n.is_read && (
                                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse" />
                                )}
                                <ChevronRight
                                  size={14}
                                  className="text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500"
                                />
                              </div>
                            </div>
                            <p
                              className={`mt-1.5 text-sm leading-relaxed ${
                                !n.is_read ? "text-zinc-700" : "text-zinc-500"
                              }`}
                            >
                              {n.body}
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <Clock size={12} />
                                {formatTimeAgo(n.created_at)}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  isProductType(n.type)
                                    ? "bg-violet-50 text-violet-600"
                                    : isQuotationType(n.type)
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "bg-zinc-100 text-zinc-500"
                                }`}
                              >
                                {isProductType(n.type) ? (isService ? "Service" : "Product") : isQuotationType(n.type) ? "Quotation" : "General"}
                              </span>
                              {!n.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markRead(n.id);
                                  }}
                                  className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                                >
                                  <Check size={12} />
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-1" />

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 size={20} className="animate-spin text-emerald-500" />
                <span className="text-sm font-medium text-zinc-400">Loading more notifications...</span>
              </div>
            )}

            {/* End of list */}
            {!hasMore && notifications.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-6">
                <div className="h-px w-12 bg-zinc-200" />
                <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">End of notifications</span>
                <div className="h-px w-12 bg-zinc-200" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
