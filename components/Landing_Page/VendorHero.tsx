"use client";

import Image from "next/image";
import Link from "next/link";
import { TrendingUp, Users, Package, Wallet } from "lucide-react";

export function VendorHero() {
  return (
    <section
      className="relative flex items-center bg-zinc-50"
      style={{ minHeight: "calc(100vh - 73px)" }}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
        {/* Left column */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Vendor Partner Program
          </span>

          <h1 className="font-heading mt-5 max-w-xl text-4xl font-bold leading-[1.2] tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.25rem]">
            Grow Your Business with <span className="text-emerald-700">Verified Buyers</span>
          </h1>

          <p className="mt-5 max-w-lg text-base font-light leading-relaxed text-zinc-600 sm:text-lg">
            Join 2,300+ trusted suppliers on India&apos;s leading B2B industrial marketplace. 
            Get quality orders, manage everything in one place, and receive timely payments.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="flex h-12 items-center justify-center whitespace-nowrap rounded-lg bg-emerald-700 px-7 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              Register as Vendor
            </Link>
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById("benefits");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="h-12 whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-7 text-sm font-medium text-zinc-700 transition-colors hover:border-emerald-600 hover:text-emerald-700"
            >
              Learn More
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-200 pt-6 text-xs text-zinc-500">
            <span className="font-medium text-zinc-400 uppercase tracking-wider">Trusted Partners</span>
            {["Tata Steel", "Reliance", "Hindalco", "JSW"].map((co) => (
              <span key={co} className="font-semibold text-zinc-600">{co}</span>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-md">
            <Image
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&h=720&fit=crop"
              alt="Warehouse and logistics operations"
              width={1000}
              height={720}
              className="h-80 w-full object-cover"
              priority
            />
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, value: "15,000+", label: "Active Buyers" },
              { icon: Package, value: "50,000+", label: "Monthly Orders" },
              { icon: Wallet, value: "7 Days", label: "Payment Cycle" },
              { icon: TrendingUp, value: "40%", label: "Business Growth" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <stat.icon size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-lg font-bold text-zinc-900">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
