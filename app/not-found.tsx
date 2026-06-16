"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, ArrowLeft, BarChart3, PhoneCall, AlertCircle, LayoutDashboard, Settings } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50/50 px-4 py-16 sm:px-6 lg:px-8 font-body">
      <div className="max-w-xl w-full text-center">
        {/* Animated Visual representation: Vendor Logistics / Package Portal */}
        <div className="relative flex justify-center items-center mb-8 h-40">
          {/* Radar Waves / Pulse Rings */}
          <div className="absolute w-36 h-36 border border-emerald-200/50 rounded-full animate-ping opacity-25" />
          <div className="absolute w-28 h-28 border border-emerald-300/40 rounded-full animate-[ping_2s_ease-in-out_infinite] opacity-40" />

          {/* Dotted Orbit Path */}
          <div className="absolute w-32 h-32 border border-dashed border-emerald-400/30 rounded-full animate-[spin_20s_linear_infinite]" />

          {/* Floating Orbiting elements */}
          {/* Chart Icon */}
          <div className="absolute -translate-x-12 -translate-y-10 bg-white shadow-md border border-zinc-150 p-2 rounded-xl text-emerald-600 animate-[bounce_3s_ease-in-out_infinite] scale-90">
            <BarChart3 size={16} />
          </div>
          {/* Settings Icon */}
          <div className="absolute translate-x-12 translate-y-10 bg-white shadow-md border border-zinc-150 p-2 rounded-xl text-zinc-400 animate-[bounce_4s_ease-in-out_infinite] [animation-delay:0.5s] scale-90">
            <Settings size={16} />
          </div>

          {/* Central Container Box */}
          <div className="absolute flex items-center justify-center bg-emerald-50 border border-emerald-100 shadow-lg text-emerald-700 w-20 h-20 rounded-2xl animate-[bounce_2.5s_ease-in-out_infinite]">
            <Package size={38} strokeWidth={1.5} className="text-emerald-700" />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 border-2 border-white shadow-sm">
              <AlertCircle size={12} className="text-white" />
            </div>
          </div>
        </div>

        {/* 404 Text */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
          Vendor Portal Error: 404
        </span>

        <h2 className="font-heading mt-6 text-3xl font-extrabold text-zinc-900 sm:text-4xl tracking-tight">
          Resource Not Found
        </h2>

        <p className="mt-4 text-base font-light text-zinc-600 max-w-md mx-auto leading-relaxed">
          The vendor page or dashboard link you requested is not available. It might have expired, been relocated, or you might not have permission to access it.
        </p>

        {/* Action Button Controls */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-sm sm:max-w-none mx-auto">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto h-11 flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 hover:text-zinc-900 shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-11 flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition-all hover:bg-emerald-800 shadow-xs active:scale-[0.98]"
          >
            <LayoutDashboard size={16} />
            Vendor Dashboard
          </Link>

          <Link
            href="/quotations"
            className="w-full sm:w-auto h-11 flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100/60 px-5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
          >
            <Package size={16} />
            View Quotations
          </Link>
        </div>

        {/* Help Line */}
        <div className="mt-12 pt-6 border-t border-zinc-200/50 flex justify-center items-center gap-2 text-xs text-zinc-500">
          <PhoneCall size={14} />
          Having partner portal issues?
          <Link href="/contact-us" className="font-semibold text-emerald-700 hover:underline">
            Contact our Team
          </Link>
        </div>
      </div>
    </div>
  );
}
