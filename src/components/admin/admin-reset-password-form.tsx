"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

type ResetStatus = "loading" | "ready" | "expired" | "success";

export function AdminResetPasswordForm() {
  const [status, setStatus] = useState<ResetStatus>("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;
    const hash = window.location.hash || "";
    const search = window.location.search || "";

    // 1. Check for immediate Supabase error in hash or search
    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(search);

    const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
    const errorDescription =
      hashParams.get("error_description") ||
      searchParams.get("error_description") ||
      hashParams.get("error") ||
      searchParams.get("error");

    const isExplicitError =
      errorCode === "otp_expired" ||
      errorCode === "access_denied" ||
      Boolean(errorDescription && (errorDescription.includes("expired") || errorDescription.includes("denied")));

    if (isExplicitError) {
      setStatus("expired");
      return;
    }

    // Extract tokens from URL hash if present
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");
    const hasRecoveryTokens = Boolean(accessToken || type === "recovery");

    const supabase = createClient();
    let handled = false;

    const markReady = () => {
      if (!isMounted) return;
      handled = true;
      setStatus("ready");
      // Clean up sensitive tokens from the browser URL bar
      if (typeof window !== "undefined" && window.location.hash && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    // 2. Listen to Supabase Auth state changes (PASSWORD_RECOVERY, INITIAL_SESSION, SIGNED_IN)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "PASSWORD_RECOVERY") {
        markReady();
      } else if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        markReady();
      } else if (event === "INITIAL_SESSION" && !session && !hasRecoveryTokens) {
        // Direct visit or finished initialization without any session or tokens
        handled = true;
        setStatus("expired");
      }
    });

    // 3. Fallback check: check active session or explicitly set session if tokens in hash
    const checkSessionAndTokens = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session) {
          markReady();
          return;
        }

        // If recovery tokens exist in URL but Supabase auto-detection hasn't resolved it yet
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!isMounted) return;

          if (data?.session) {
            markReady();
            return;
          }

          if (error) {
            handled = true;
            setStatus("expired");
            return;
          }
        }
      } catch {
        // Ignore and allow fallback / timeout
      }
    };

    checkSessionAndTokens();

    // 4. Timeout safety: if neither session nor tokens resolved within 6 seconds, show expired
    const timer = setTimeout(() => {
      if (!isMounted) return;
      if (!handled) {
        setStatus((current) => (current === "loading" ? "expired" : current));
      }
    }, 6000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage("অনুগ্রহ করে উভয় পাসওয়ার্ড ফিল্ড পূরণ করুন। (Both password fields are required.)");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে। (Password must be at least 8 characters.)");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("উভয় পাসওয়ার্ড হুবহু মিলতে হবে। (Passwords must match.)");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(
          error.message || "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
        );
      } else {
        // Success: Clean up URL hash to remove exposed recovery tokens
        if (typeof window !== "undefined" && window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname);
        }
        // Sign out temporary recovery session
        await supabase.auth.signOut();
        setStatus("success");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "সার্ভার এরর ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-surface-border p-6 sm:p-8">
        {/* Brand Header */}
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
            <KeyRound className="w-3.5 h-3.5 text-accent-amber" />
            <span>অ্যাডমিন পাসওয়ার্ড রিকভারি</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
            পাসওয়ার্ড রিসেট করুন
          </h1>
          <p className="text-xs text-charcoal-500">
            আপনার অ্যাডমিনিস্ট্রেটর অ্যাকাউন্টের জন্য নতুন ও সুরক্ষিত পাসওয়ার্ড সেট করুন
          </p>
        </div>

        {/* State 1: Loading Verification */}
        {status === "loading" && (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
            <p className="text-xs font-semibold text-charcoal-700">
              রিকভারি সেশন যাচাই করা হচ্ছে...
            </p>
            <p className="text-[11px] text-charcoal-500">
              Verifying recovery link tokens...
            </p>
          </div>
        )}

        {/* State 2: Expired or Invalid Link */}
        {status === "expired" && (
          <div className="space-y-5 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-accent-dark flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-charcoal-900">
                লিঙ্কটির মেয়াদ শেষ হয়ে গেছে
              </h2>
              <p className="text-xs text-charcoal-500 leading-relaxed">
                পাসওয়ার্ড রিসেট লিঙ্কটির মেয়াদ শেষ হয়ে গেছে অথবা লিঙ্কটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে লগইন পেজ থেকে পুনরায় চেষ্টা করুন।
              </p>
              <p className="text-[11px] text-stone-400 font-sans">
                This password reset link has expired. Please request a new one.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl text-sm transition-all shadow-md"
              >
                <span>অ্যাডমিন লগইন পেজে যান</span>
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Success Screen */}
        {status === "success" && (
          <div className="space-y-5 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-charcoal-900">
                পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!
              </h2>
              <p className="text-xs text-charcoal-500 leading-relaxed">
                আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে। এখন নতুন পাসওয়ার্ড ব্যবহার করে অ্যাডমিন পোর্টালে সাইন ইন করুন।
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold font-sans">
                Password updated successfully.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl text-sm transition-all shadow-md"
              >
                <span>অ্যাডমিন লগইন করুন (Go to Login)</span>
              </Link>
            </div>
          </div>
        )}

        {/* State 4: Active Form (Ready) */}
        {status === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-bold text-charcoal-700 mb-1.5"
              >
                নতুন পাসওয়ার্ড (New Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="কমপক্ষে ৮ অক্ষর (Min. 8 characters)"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-border bg-surface-canvas/50 text-charcoal-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-500 hover:text-charcoal-700 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-charcoal-400 block mt-1">
                কমপক্ষে ৮টি অক্ষর প্রদান করুন
              </span>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-bold text-charcoal-700 mb-1.5"
              >
                পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় নতুন পাসওয়ার্ড দিন"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-border bg-surface-canvas/50 text-charcoal-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-500 hover:text-charcoal-700 focus:outline-none cursor-pointer"
                  aria-label={showConfirmPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-700 hover:bg-brand-800 active:scale-[0.99] text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-accent-amber" />
                    <span>আপডেট করা হচ্ছে...</span>
                  </>
                ) : (
                  <span>পাসওয়ার্ড আপডেট করুন (Update Password)</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security Notice */}
        <div className="mt-6 pt-5 border-t border-surface-border/70 text-center">
          <p className="text-[11px] text-charcoal-500 leading-normal">
            সুন্নাহ সোর্স অ্যাডমিন নিরাপত্তা প্রোটোকল দ্বারা সুরক্ষিত।
          </p>
        </div>
      </div>

      {/* Return to login link */}
      <div className="text-center mt-5">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-brand-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>অ্যাডমিন লগইনে ফিরে যান</span>
        </Link>
      </div>
    </div>
  );
}
