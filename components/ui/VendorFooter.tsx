"use client";

import { Mail, Phone, MapPin } from "lucide-react";

export function VendorFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-900 mt-auto">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-semibold text-white">Vitthal</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Vendor
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              India&apos;s trusted B2B marketplace for industrial suppliers. 
              Grow your business with verified buyers and seamless order management.
            </p>
            <div className="mt-6 space-y-2">
              <a href="mailto:vendors@vitthal.com" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <Mail size={16} />
                vendors@vitthal.com
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <Phone size={16} />
                +91 98765 43210
              </a>
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                <MapPin size={16} />
                Mumbai, Maharashtra, India
              </p>
            </div>
          </div>

          {/* Seller Tools */}
          <div>
            <h4 className="text-sm font-semibold text-white">Seller Tools</h4>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li>
                <a href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/products" className="hover:text-white transition-colors">
                  Product Management
                </a>
              </li>
              <li>
                <a href="/orders" className="hover:text-white transition-colors">
                  Order Management
                </a>
              </li>
              <li>
                <a href="/analytics" className="hover:text-white transition-colors">
                  Sales Analytics
                </a>
              </li>
              <li>
                <a href="/inventory" className="hover:text-white transition-colors">
                  Inventory Tracking
                </a>
              </li>
            </ul>
          </div>

          {/* Payments & Finance */}
          <div>
            <h4 className="text-sm font-semibold text-white">Payments & Finance</h4>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li>
                <a href="/payments" className="hover:text-white transition-colors">
                  Payment Overview
                </a>
              </li>
              <li>
                <a href="/invoices" className="hover:text-white transition-colors">
                  Invoices
                </a>
              </li>
              <li>
                <a href="/statements" className="hover:text-white transition-colors">
                  Account Statements
                </a>
              </li>
              <li>
                <a href="/bank-details" className="hover:text-white transition-colors">
                  Bank Account Settings
                </a>
              </li>
              <li>
                <a href="/tax-documents" className="hover:text-white transition-colors">
                  Tax Documents (GST)
                </a>
              </li>
            </ul>
          </div>

          {/* Support & Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white">Support & Resources</h4>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li>
                <a href="/help" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/seller-guide" className="hover:text-white transition-colors">
                  Seller Guidelines
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-white transition-colors">
                  Commission & Fees
                </a>
              </li>
              <li>
                <a href="/training" className="hover:text-white transition-colors">
                  Training Resources
                </a>
              </li>
              <li>
                <a href="/disputes" className="hover:text-white transition-colors">
                  Raise a Dispute
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-zinc-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-zinc-500">
              &copy; {currentYear} Vitthal Vendor Portal. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="/seller-agreement" className="hover:text-white transition-colors">
                Seller Agreement
              </a>
              <a href="/cookies" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
