"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Mail, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone) {
      toast.error("Email and phone number are required.");
      return;
    }
    if (!confirm) {
      toast.error("Please confirm that you want to delete your vendor account.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/request-deletion-public`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-request-from": "vendor",
        },
        body: JSON.stringify({ email, phone, reason }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        toast.success("Request submitted successfully!");
      } else {
        toast.error(data.message || "Failed to submit request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-zinc-50 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          
          {submitted ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6">
                <CheckCircle2 size={36} strokeWidth={1.5} />
              </div>
              <h1 className="font-heading text-2xl font-bold text-zinc-900 sm:text-3xl">
                Request Submitted
              </h1>
              <p className="mt-4 text-zinc-600 leading-relaxed max-w-md">
                Your request to delete the vendor account associated with <strong className="text-zinc-900">{email}</strong> has been received. Please note that your data will be permanently deleted after checking and verification by our admin. The admin will send you an email regarding this request; please respond to that email to confirm and proceed with the deletion.
              </p>
              <div className="mt-8">
                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
                >
                  Return to Home
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-5 mb-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h1 className="font-heading text-xl font-bold text-zinc-900 sm:text-2xl">
                    Delete Your Vendor Account
                  </h1>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Submit a request to permanently delete your vendor account and data
                  </p>
                </div>
              </div>

              {/* Warning box */}
              <div className="flex gap-3 rounded-lg bg-amber-50/70 border border-amber-200/50 p-4 mb-6">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">Important Notice</h3>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    This request will result in the permanent deletion of your vendor profile, product catalogs, business listings, and order history. Please note that your data will be permanently deleted only after checking and verification by our admin. The admin will send you an email regarding this request; you must respond to that email to confirm and proceed with the deletion.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                      <Mail size={16} />
                    </span>
                    <input
                      required
                      type="email"
                      placeholder="e.g. vendor@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                      <Phone size={16} />
                    </span>
                    <input
                      required
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Reason for Deletion <span className="text-zinc-400 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us why you are leaving so we can improve our vendor services..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                  />
                </div>

                <div className="relative flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="confirm"
                      name="confirm"
                      type="checkbox"
                      checked={confirm}
                      onChange={(e) => setConfirm(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="confirm" className="font-medium text-zinc-700 cursor-pointer select-none">
                      I confirm that I want to delete my vendor account and erase all my business data
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting request...
                      </>
                    ) : (
                      "Submit Vendor Deletion Request"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
