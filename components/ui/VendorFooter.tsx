"use client";

import Link from "next/link";
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
              <span className="text-lg font-semibold text-white">MTWO Groups</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Vendor
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
              India&apos;s trusted B2B marketplace for industrial suppliers. 
              Grow your business with verified buyers and seamless order management.
            </p>
            <div className="mt-6 space-y-2">
              <a href="mailto:vendors@MTWO.com" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <Mail size={16} />
                vendors@MTWO.com
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
                <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">Product Management</Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">Order Management</Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-white transition-colors">Sales Analytics</Link>
              </li>
              <li>
                <Link href="/inventory" className="hover:text-white transition-colors">Inventory Tracking</Link>
              </li>
            </ul>
          </div>

          {/* Payments & Finance */}
          <div>
            <h4 className="text-sm font-semibold text-white">Payments & Finance</h4>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li>
                <Link href="/payments" className="hover:text-white transition-colors">Payment Overview</Link>
              </li>
              <li>
                <Link href="/invoices" className="hover:text-white transition-colors">Invoices</Link>
              </li>
              <li>
                <Link href="/statements" className="hover:text-white transition-colors">Account Statements</Link>
              </li>
              <li>
                <Link href="/bank-details" className="hover:text-white transition-colors">Bank Account Settings</Link>
              </li>
              <li>
                <Link href="/tax-documents" className="hover:text-white transition-colors">Tax Documents (GST)</Link>
              </li>
            </ul>
          </div>

          {/* Support & Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white">Support & Resources</h4>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">Help Center</Link>
              </li>
              <li>
                <Link href="/seller-guide" className="hover:text-white transition-colors">Seller Guidelines</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">Commission & Fees</Link>
              </li>
              <li>
                <Link href="/training" className="hover:text-white transition-colors">Training Resources</Link>
              </li>
              <li>
                <Link href="/disputes" className="hover:text-white transition-colors">Raise a Dispute</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-zinc-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-zinc-500">
              &copy; {currentYear} MTWO Groups Vendor Portal. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/seller-agreement" className="hover:text-white transition-colors">Seller Agreement</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
