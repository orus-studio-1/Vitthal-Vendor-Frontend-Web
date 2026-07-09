"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { AlertTriangle, LogOut, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DeletionRecoveryOverlay() {
  const { user, recoverAccount, logout, isLoading } = useAuthStore();
  const [recovering, setRecovering] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  // If loading or no user, or deletion is not requested, don't show
  if (isLoading || !user || !user.deletionRequestedAt) {
    return null;
  }

  const getRemainingDays = () => {
    if (!user.deletionRequestedAt) return 14;
    const reqDate = new Date(user.deletionRequestedAt);
    const purgeDate = new Date(reqDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const diffTime = purgeDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const remainingDays = getRemainingDays();

  const handleRecover = async () => {
    const confirm = window.confirm(
      "Are you sure you want to cancel the deletion request and recover your B2B vendor account?"
    );
    if (!confirm) return;

    setRecovering(true);
    try {
      await recoverAccount();
      toast.success("Welcome back! Your B2B vendor account has been recovered.");
      router.refresh();
    } catch {
      toast.error("Failed to recover account. Please try again.");
    } finally {
      setRecovering(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Signed out successfully.");
      router.push("/login");
    } catch {
      toast.error("Sign out failed.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center bg-transparent py-10 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-600 animate-bounce" />
        </div>

        <h2 className="mt-4 text-center text-xl font-bold text-zinc-900">
          Vendor Account Deletion Pending
        </h2>

        <p className="mt-3 text-center text-sm text-zinc-600 leading-relaxed">
          You have requested to delete your B2B merchant account. It is currently deactivated and scheduled for permanent deletion in{" "}
          <span className="font-bold text-red-600">
            {remainingDays} {remainingDays === 1 ? "day" : "days"}
          </span>
          .
        </p>

        <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 text-center text-xs text-zinc-500 leading-relaxed">
          If you want to continue selling on MTWO Groups, you can recover your account now. Otherwise, your storefront, catalogs, and registry data will be permanently deleted after the 14-day window.
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleRecover}
            disabled={recovering || loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 p-3 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
          >
            {recovering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recover My Account
          </button>

          <button
            onClick={handleLogout}
            disabled={recovering || loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
