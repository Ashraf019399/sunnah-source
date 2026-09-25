"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { adminLoginAction } from "@/lib/actions/admin-auth-actions";
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Shield } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unauthorizedParam = searchParams.get("error") === "unauthorized";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    unauthorizedParam ? "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অ্যাডমিন অ্যাকাউন্টে এক্সেস অনুমোদিত।" : ""
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড উভয় ফিল্ড পূরণ করুন।");
      return;
    }

    startTransition(async () => {
      const res = await adminLoginAction({ email, password });
      if (res.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setErrorMessage(res.error || "লগইন ব্যর্থ হয়েছে। ক্রেডেনশিয়াল চেক করে আবার চেষ্টা করুন।");
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-surface-border p-6 sm:p-8">
        {/* Header with Logo */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex justify-center mb-1">
            <Link href="/" title="হোমপেজে যান" className="inline-block transition-transform hover:scale-105">
              <Image
                src="/images/logo.svg"
                alt="Sunnah Source"
                width={170}
                height={42}
                priority
                unoptimized
                className="h-9 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-accent-amber" />
            <span>অ্যাডমিন ম্যানেজমেন্ট পোর্টাল</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
            অ্যাডমিন লগইন
          </h1>
          <p className="text-xs text-charcoal-500">
            আপনার অনুমোদিত অ্যাডমিনিস্ট্রেটর ক্রেডেনশিয়াল দিয়ে সাইন ইন করুন
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-bold text-charcoal-700 mb-1.5"
            >
              অ্যাডমিন ইমেইল (Email)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sunnahsourcebd.com"
                disabled={isPending}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-surface-border bg-surface-canvas/50 text-charcoal-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed font-sans"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-bold text-charcoal-700 mb-1.5"
            >
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-border bg-surface-canvas/50 text-charcoal-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-500 hover:text-charcoal-700 focus:outline-none cursor-pointer"
                aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-700 hover:bg-brand-800 active:scale-[0.99] text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-accent-amber" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <span>লগইন করুন</span>
              )}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 pt-5 border-t border-surface-border/70 text-center">
          <p className="text-[11px] text-charcoal-500 leading-normal">
            শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত। সমস্ত অ্যাক্টিভিটি অডিট লগে রেকর্ড করা হয়।
          </p>
        </div>
      </div>

      {/* Return to website link */}
      <div className="text-center mt-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-brand-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>প্রধান স্টোরফ্রন্টে ফিরে যান</span>
        </Link>
      </div>
    </div>
  );
}
