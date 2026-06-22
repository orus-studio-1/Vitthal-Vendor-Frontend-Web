"use client";

import { ShieldCheck, Zap, CreditCard, HeadphonesIcon, BarChart3, Building2 } from "lucide-react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Verified Buyers Only",
    detail: "Connect with genuine businesses - all buyers are KYC verified before accessing vendor listings",
  },
  {
    icon: Zap,
    title: "Quality Leads Daily",
    detail: "Receive RFQs from serious buyers with clear requirements and realistic budgets",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    detail: "7-day payment guarantee with protection against delayed or cancelled orders",
  },
  {
    icon: BarChart3,
    title: "Business Dashboard",
    detail: "Track orders, manage inventory, view sales analytics - all in one simple dashboard",
  },
  {
    icon: Building2,
    title: "Your Brand Store",
    detail: "Create your company profile with products, certifications, and customer reviews",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Support",
    detail: "Get help from our vendor success team via phone or email during business hours",
  },
];

export function VendorBenefits() {
  return (
    <section id="benefits" className="bg-white border-t border-zinc-200">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-zinc-900 sm:text-4xl">
            Why Sell on MTWO Groups
          </h2>
          <p className="mt-3 text-base text-zinc-600 max-w-2xl mx-auto">
            Everything you need to grow your industrial supply business online
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article
                key={benefit.title}
                className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-500/30 hover:shadow-md"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-700">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="font-heading text-base font-semibold text-zinc-900">{benefit.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-600">{benefit.detail}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
