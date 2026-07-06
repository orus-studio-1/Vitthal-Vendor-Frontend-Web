"use client";

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from "react";
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, Package, ShoppingBag, BarChart3, Settings, HelpCircle, Bell, FileText, MessageSquare, DollarSign, FileCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { toast } from "sonner";
import Image from "next/image";

import { VendorHeaderSkeleton } from "./VendorHeaderSkeleton";
export function VendorHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const { notifications, unreadCount, isLoading: notificationsLoading, isLoadingMore, hasMore, fetchNotifications, fetchMore, fetchUnreadCount, markRead, markAllRead, initSocket, disconnectSocket } = useNotificationStore();
  const router = useRouter();

  // Close dropdown when clicking outside
  useLayoutEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      fetchUnreadCount();
      initSocket(user.userId);
      return () => disconnectSocket();
    }
  }, [isAuthenticated, user?.userId, fetchUnreadCount, initSocket, disconnectSocket]);

  function handleOpenNotifications() {
    setNotifDropdown(!notifDropdown);
    if (!notifDropdown) void fetchNotifications();
  }

  // Infinite scroll handler for dropdown
  const handleDropdownScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 80;
      if (nearBottom && hasMore && !isLoadingMore) {
        fetchMore();
      }
    },
    [hasMore, isLoadingMore, fetchMore]
  );

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  async function handleLogout() {
    await logout();
    setProfileDropdown(false);
    toast.success("Logged out successfully");
    router.push("/");
  }

  const isService = user?.vendorType === "service" || user?.vendorType === "both";
  const isProduct = user?.vendorType === "product" || user?.vendorType === "both";

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isProduct
      ? [
          { href: "/products", label: "Products", icon: Package },
          { href: "/orders", label: "Orders", icon: ShoppingBag },
          { href: "/quotation-orders", label: "Quotation Orders", icon: FileCheck },
        ]
      : []
    ),
    ...(isService
      ? [
          { href: "/services", label: "Services", icon: Package },
          { href: "/bookings", label: "Bookings", icon: ShoppingBag },
          { href: "/service-quotation-orders", label: "Quotation Orders", icon: FileCheck },
        ]
      : []
    ),
    { href: "/payouts", label: "Payouts", icon: DollarSign },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const mobileMainMenuLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isProduct
      ? [
          { href: "/products", label: "Products", icon: Package },
          { href: "/orders", label: "Orders", icon: ShoppingBag },
          { href: "/quotation-orders", label: "Quotation Orders", icon: FileCheck },
        ]
      : []
    ),
    ...(isService
      ? [
          { href: "/services", label: "Services", icon: Package },
          { href: "/bookings", label: "Bookings", icon: ShoppingBag },
          { href: "/service-quotation-orders", label: "Quotation Orders", icon: FileCheck },
        ]
      : []
    ),
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const mobileSupportLinks = [
    { href: "/chat", label: "Chat with Admin", icon: MessageSquare },
    { href: "/help-support", label: "Help & Support", icon: HelpCircle },
  ];

  const mobileAccountLinks = [
    { href: "/profile", label: "Profile Settings", icon: User },
    { href: isService ? "/service-quotations" : "/quotations", label: "Quotations", icon: FileText },
    { href: "/payouts", label: "Payouts & Settlements", icon: DollarSign },
    { href: "/settings", label: "Account Settings", icon: Settings },
  ];
  if (isLoading && !isAuthenticated) {
    return <VendorHeaderSkeleton />;
  }


  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
      {/* Top bar */}
      <div className="border-b border-zinc-100 bg-emerald-50/50">
        <div className="mx-auto flex h-9 w-full max-w-7xl items-center justify-between px-4 text-xs text-zinc-600 sm:px-6 lg:px-8">
          <p className="font-medium text-emerald-700">Vendor Portal</p>
          <div className="hidden sm:flex items-center gap-4">
            <span>support@mtwo.in</span>
            <span className="text-zinc-300">|</span>
            <span>+91 85300 90303</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex h-16 w-full max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.jpeg"
            alt="MTWO Groups"
            width={32}
            height={32}
            unoptimized
          />
          <span className="text-xl font-semibold tracking-tight text-zinc-900">MTWO Groups</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Vendor
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm font-medium text-zinc-700">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-2">
          {isLoading ? (
            // Skeleton loaders for desktop auth buttons
            <>
              <div className="animate-pulse h-5 w-16 bg-zinc-200 rounded"></div>
              <div className="animate-pulse h-8 w-20 bg-zinc-200 rounded"></div>
            </>
          ) : isAuthenticated ? (
            <>
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleOpenNotifications}
                  className="relative flex items-center justify-center rounded-xl border border-transparent p-2 text-zinc-600 transition-all hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifDropdown && (
                  <div className="absolute right-0 top-full mt-3 w-88 max-h-120 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10 z-50 flex flex-col backdrop-blur-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 bg-linear-to-r from-zinc-50 via-white to-emerald-50/60 px-4 py-3.5">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-zinc-900">Notifications</p>
                        <p className="text-[11px] text-zinc-500">Recent updates and alerts</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href="/notifications"
                          onClick={() => setNotifDropdown(false)}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          See all
                        </Link>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllRead()}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-96 divide-y divide-zinc-50" onScroll={handleDropdownScroll}>
                      {notificationsLoading ? (
                        <div className="space-y-3 p-4">
                          {[...Array(4)].map((_, index) => (
                            <div key={index} className="flex gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5 animate-pulse">
                              <div className="mt-0.5 h-10 w-10 rounded-2xl bg-zinc-200/80" />
                              <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-3/4 rounded-full bg-zinc-200/80" />
                                <div className="h-3 w-full rounded-full bg-zinc-200/70" />
                                <div className="h-3 w-5/6 rounded-full bg-zinc-200/60" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-zinc-400">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Bell size={20} />
                          </div>
                          You have no notifications
                          <p className="mt-1 text-xs text-zinc-400">You&apos;ll see order, quotation, and account updates here.</p>
                        </div>
                      ) : (
                        <>
                          {notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (!n.is_read) markRead(n.id);
                                setNotifDropdown(false);
                                if (n.reference_type === "quotation" && n.reference_id) {
                                  const isServiceQuote = n.title?.toLowerCase().includes("service") || n.body?.toLowerCase().includes("service");
                                  router.push(isServiceQuote ? `/service-quotations/${n.reference_id}` : `/quotations/${n.reference_id}`);
                                } else if (n.reference_type === "product" && n.reference_id) {
                                  router.push(`/products`);
                                }
                              }}
                              className={`w-full text-left px-4 py-3.5 hover:bg-zinc-50 transition-colors flex gap-3.5 ${!n.is_read ? "bg-blue-50/40" : ""}`}
                            >
                              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${!n.is_read ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-500"}`}>
                                <Bell size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-semibold text-zinc-800 truncate">{n.title}</p>
                                  <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${!n.is_read ? "bg-blue-500" : "bg-zinc-200"}`} />
                                </div>
                                <p className="mt-1 text-xs leading-5 text-zinc-500 line-clamp-2">{n.body}</p>
                                <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">{timeAgo(n.created_at)}</p>
                              </div>
                            </button>
                          ))}
                          {isLoadingMore && (
                            <div className="flex items-center justify-center py-3">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-500" />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                  </div>
                )}
              </div>

              {/* Chat with Admin */}
              <Link
                href="/chat"
                className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Chat with Admin"
              >
                <MessageSquare size={20} />
              </Link>



              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-medium text-zinc-700">{user?.username || "My Account"}</span>
                  <ChevronDown size={16} className={`text-zinc-400 transition-transform ${profileDropdown ? "rotate-180" : ""}`} />
                </button>

                {profileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-2 shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-zinc-100">
                      <p className="text-sm font-medium text-zinc-900">{user?.username || "Vendor"}</p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email || ""}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      onClick={() => setProfileDropdown(false)}
                    >
                      <User size={18} className="text-zinc-400" />
                      Profile Settings
                    </Link>
                    <Link
                      href={isService ? "/service-quotations" : "/quotations"}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      onClick={() => setProfileDropdown(false)}
                    >
                      <FileText size={18} className="text-zinc-400" />
                      Quotations
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      onClick={() => setProfileDropdown(false)}
                    >
                      <Settings size={18} className="text-zinc-400" />
                      Account Settings
                    </Link>
                    <Link
                      href="/help-support"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      onClick={() => setProfileDropdown(false)}
                    >
                      <HelpCircle size={18} className="text-zinc-400" />
                      Help & Support
                    </Link>
                    <div className="border-t border-zinc-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition-colors"
              >
                Signup
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-zinc-700 hover:text-zinc-900 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation - Slide from Right */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 md:hidden shadow-2xl transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.jpeg"
              alt="MTWO Groups"
              width={32}
              height={32}
              unoptimized
            />
            <span className="text-lg font-semibold text-zinc-900">MTWO Groups</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Vendor
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-zinc-700 hover:text-zinc-900 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        {/* Sidebar Content */}
        <nav className="h-[calc(100%-73px)] overflow-y-auto">
          <ul className="flex flex-col px-4 py-4 space-y-1 text-sm font-medium text-zinc-700">
            {/* Main Menu Section */}
            <li>
              <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Main Menu</p>
            </li>
            {mobileMainMenuLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              </li>
            ))}

            {/* Support Section */}
            <li className="border-t border-zinc-200 mt-4 pt-4">
              <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Support</p>
            </li>
            {mobileSupportLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              </li>
            ))}

            {/* Account Section */}
            <li className="border-t border-zinc-200 mt-4 pt-4">
              <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Account</p>
            </li>
            {isLoading ? (
              // Mobile skeleton loaders
              <>
                <li className="animate-pulse py-2 px-3">
                  <div className="h-5 w-20 bg-zinc-200 rounded"></div>
                </li>
                <li className="animate-pulse py-2 px-3">
                  <div className="h-10 w-full bg-zinc-200 rounded border border-zinc-300"></div>
                </li>
              </>
            ) : isAuthenticated ? (
              <>
                {mobileAccountLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <link.icon size={18} />
                      {link.label}
                    </Link>
                  </li>
                ))}
                
                {/* Notifications link for mobile accessibility */}
                <li>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell size={18} />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>

                <li className="border-t border-zinc-200 mt-4 pt-4">
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-3 rounded-lg bg-emerald-600 px-3 py-3 text-white hover:bg-emerald-700 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    Signup
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
