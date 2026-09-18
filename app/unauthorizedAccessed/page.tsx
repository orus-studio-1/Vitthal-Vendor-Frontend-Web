import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

const UnauthorizedAccessed = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert size={32} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Access Restricted</h1>
          <p className="text-sm text-zinc-500">
            You do not have permission to access this section with your current account profile type or session permissions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
          >
            <Home size={16} /> Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 font-medium text-sm hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={16} /> Login Again
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedAccessed;