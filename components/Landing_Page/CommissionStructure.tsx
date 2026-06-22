"use client";

import { Check, HelpCircle } from "lucide-react";
import Link from "next/link";

const features = [
  "Zero registration fees",
  "Zero listing fees",
  "Unlimited product uploads",
  "Dedicated account manager",
  "Monthly payment settlements",
  "GST invoice support",
];

export function CommissionStructure() {
  return (
    <section className="bg-white border-t border-zinc-200">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Pricing */}
          <div>
            <h2 className="font-heading text-3xl font-bold text-zinc-900 sm:text-4xl mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base text-zinc-600 mb-8">
              No hidden charges. Pay only when you sell. Our commission structure is designed to help small and medium businesses grow.
            </p>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-emerald-700">2-5%</span>
                <span className="text-xl text-emerald-600">commission</span>
              </div>
              <p className="text-sm text-emerald-700 mb-6">
                Per successful order, based on product category
              </p>

              <div className="space-y-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
                      <Check size={12} className="text-white" />
                    </div>
                    <span className="text-sm text-zinc-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Category breakdown */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-zinc-900 mb-6">
              Commission by Category
            </h3>

            <div className="space-y-4">
              {[
                { category: "Plastic & Polymers", rate: "2%", examples: "PP, PE, PVC granules" },
                { category: "Metals & Alloys", rate: "3%", examples: "Steel, Aluminium, Copper" },
                { category: "Construction Materials", rate: "3%", examples: "Cement, Bricks, Tiles" },
                { category: "Chemicals & Solvents", rate: "4%", examples: "Industrial chemicals" },
                { category: "Machinery & Equipment", rate: "5%", examples: "Industrial machines" },
              ].map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{item.category}</p>
                    <p className="text-xs text-zinc-500">{item.examples}</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-700">{item.rate}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-100">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                Register to view detailed pricing
                <HelpCircle size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
