"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, Package, ShoppingBag, BarChart3, Settings, HelpCircle, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import Image from "next/image";

import { VendorHeaderSkeleton } from "./VendorHeaderSkeleton";
export function VendorHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const router = useRouter();

  // Close dropdown when clicking outside
  useLayoutEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setProfileDropdown(false);
    toast.success("Logged out successfully");
    router.push("/");
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/orders", label: "Orders", icon: ShoppingBag },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
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
            <span>support@MTWO.com</span>
            <span className="text-zinc-300">|</span>
            <span>+91 98765 43210</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
              <button
                type="button"
                className="relative rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              </button>

              {/* Help */}
              <Link
                href="/help"
                className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Help"
              >
                <HelpCircle size={20} />
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
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      onClick={() => setProfileDropdown(false)}
                    >
                      <Settings size={18} className="text-zinc-400" />
                      Account Settings
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
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 md:hidden shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
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
            <li>
              <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Main Menu</p>
            </li>
            {navLinks.map((link) => (
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
                <li>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings size={18} />
                    Settings
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HelpCircle size={18} />
                    Help & Support
                  </Link>
                </li>
                <li className="border-t border-zinc-200 mt-4 pt-4">
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-red-600 hover:bg-red-50 transition-colors"
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
