"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const hasMinLength = password.length >= 7;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  const passwordsMatch = password === confirmPassword && password !== "";

  // Send OTP
  async function handleSendOTP() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/otp/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          body: JSON.stringify({ email: email.trim() }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setOtp("");
        if (data.expiresAt) {
          setOtpExpiry(new Date(data.expiresAt));
        }
        toast.success("OTP sent to your email");
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Verify OTP
  async function handleVerifyOTP() {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/otp/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          body: JSON.stringify({ email: email.trim(), otp }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setStep("reset");
        setOtp("");
        setOtpExpiry(null);
        toast.success("Email verified. Set your new password");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Reset Password + Logout
  async function handleResetPassword() {
    if (!isPasswordStrong) {
      toast.error("Please create a strong password");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      // Reset password
      const resetRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-from": "vendor",
          },
          credentials: "include",
          body: JSON.stringify({ email: email.trim(), password }),
        },
      );

      const resetData = await resetRes.json();

      if (!resetRes.ok) {
        toast.error(resetData.message || "Failed to reset password");
        setIsLoading(false);
        return;
      }

      // Logout to clear cookies
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            "x-request-from": "vendor",
          },
        });
      } catch {
        // Ignore logout errors, proceed anyway
      }

      // Clear any stored auth data
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage");
      }

      toast.success("Password reset successfully");
      setStep("success");
    } catch {
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="flex items-center justify-center text-xl font-semibold tracking-tight text-zinc-900"
          >
            <Image src={"/favicon.ico"} height="104" width="100" alt="MTWO Logo" />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {step === "email" &&
              "Enter your email to receive a verification code"}
            {step === "otp" && "Enter the verification code sent to your email"}
            {step === "reset" && "Create a new strong password"}
            {step === "success" && "Your password has been reset successfully"}
          </p>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          {/* Step 1: Email Input */}
          {step === "email" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                />
              </div>
              <button
                onClick={handleSendOTP}
                disabled={
                  !email ||
                  isLoading ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                }
                className="h-11 w-full rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Sending..." : "Send verification code"}
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-3 text-sm text-zinc-600">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                  {otpExpiry && (
                    <span className="block text-xs text-zinc-500 mt-1">
                      Expires at {otpExpiry.toLocaleTimeString()}
                    </span>
                  )}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(value);
                  }}
                  className="h-12 w-full rounded-md border border-zinc-300 px-3 text-center text-xl font-medium tracking-[0.5em] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("email")}
                  disabled={isLoading}
                  className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== 6 || isLoading}
                  className="h-11 flex-1 rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </button>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full text-center text-sm text-[#1d4ed8] hover:text-[#1e40af]"
              >
                Resend code
              </button>
            </div>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <div className="space-y-4">
              {/* New Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 pr-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p
                    className={
                      hasMinLength ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    At least 7 characters
                  </p>
                  <p
                    className={
                      hasUppercase ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    Contains an uppercase letter
                  </p>
                  <p
                    className={
                      hasLowercase ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    Contains a lowercase letter
                  </p>
                  <p
                    className={hasNumber ? "text-emerald-600" : "text-zinc-500"}
                  >
                    Contains at least 1 number
                  </p>
                  <p
                    className={
                      hasSpecialChar ? "text-emerald-600" : "text-zinc-500"
                    }
                  >
                    Contains at least 1 special character
                  </p>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 pr-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-1.5 text-xs text-red-600">
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                onClick={handleResetPassword}
                disabled={!isPasswordStrong || !passwordsMatch || isLoading}
                className="h-11 w-full rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Resetting..." : "Reset password"}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="rounded-full bg-emerald-100 p-4 mx-auto w-fit">
                <svg
                  className="h-8 w-8 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Password Reset Successful
              </h3>
              <p className="text-sm text-zinc-600">
                Your password has been reset. Please log in with your new
                password.
              </p>
              <Link
                href="/login"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#1d4ed8] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1e40af]"
              >
                Go to login
              </Link>
            </div>
          )}
        </section>

        {/* Back to login link (except on success step) */}
        {step !== "success" && (
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
