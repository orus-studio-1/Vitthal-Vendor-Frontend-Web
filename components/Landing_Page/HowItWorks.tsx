"use client";

import { UserPlus, FileText, HandshakeIcon, Truck, Wallet } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Register Your Business",
    detail: "Sign up with your GST number and business documents. Verification takes 24-48 hours.",
  },
  {
    icon: FileText,
    step: "02",
    title: "List Your Products",
    detail: "Add your products with prices, MOQ, and stock availability. Upload your catalog easily.",
  },
  {
    icon: HandshakeIcon,
    step: "03",
    title: "Receive Orders",
    detail: "Get notified when buyers send RFQs. Negotiate and confirm orders through the platform.",
  },
  {
    icon: Truck,
    step: "04",
    title: "Fulfill & Deliver",
    detail: "Pack and ship orders to buyers. Track delivery status through your dashboard.",
  },
  {
    icon: Wallet,
    step: "05",
    title: "Get Paid",
    detail: "Receive payment directly to your bank account within 7 days of order delivery.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-zinc-50 border-t border-zinc-200">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-zinc-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-base text-zinc-600 max-w-2xl mx-auto">
            Start selling in 5 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm h-full">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    Step {item.step}
                  </span>
                  <h3 className="font-heading mt-2 text-base font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {item.detail}
                  </p>
                </div>
                {/* Connector line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-zinc-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
