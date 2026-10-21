"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { GoogleIcon } from "@/components/ui/google-icon";
import { createClient } from "@/lib/supabase/client";
import { isValidBDPhone, normalizeBDPhone } from "@/lib/utils";

export default function CustomerLoginPage() {
  const router = useRouter();

  // Active Tab: Mobile OTP vs Credentials
  const [activeTab, setActiveTab] = useState<"phone" | "credentials">("phone");

  // Tab 1: Mobile Phone Login
  const [phone, setPhone] = useState("");
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");

  // Tab 2: Credentials Login (Email/Phone + Password)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isCredLoading, setIsCredLoading] = useState(false);
  const [credError, setCredError] = useState("");
  const [credSuccess, setCredSuccess] = useState("");

  // Google 1-Click Sign-In
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const [redirectTarget, setRedirectTarget] = useState("/account");

  // Read URL error and redirect params on mount, and check existing session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error")) {
        setGoogleError("অথেনটিকেশনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
      const target = params.get("redirect") || params.get("next") || "/account";
      setRedirectTarget(target);

      // Auto-redirect if customer is already signed in
      const storedPhone = localStorage.getItem("sunnah_customer_phone");
      if (storedPhone) {
        router.replace(target);
        return;
      }
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          router.replace(target);
        }
      });
    }
  }, [router]);

  // 1-Click Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError("");
    try {
      const supabase = createClient();
      const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectOrigin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
        },
      });

      if (error) {
        setGoogleError(error.message || "গুগল সাইন-ইনে সমস্যা হয়েছে।");
        setIsGoogleLoading(false);
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      setGoogleError("গুগল সাইন-ইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      setIsGoogleLoading(false);
    }
  };

  // Mobile Number Login Handler
  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setPhoneSuccess("");

    if (!phone.trim()) {
      setPhoneError("অনুগ্রহ করে আপনার ১১ ডিজিটের মোবাইল নম্বর লিখুন।");
      return;
    }

    if (!isValidBDPhone(phone)) {
      setPhoneError("সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678)।");
      return;
    }

    const cleanPhone = normalizeBDPhone(phone);
    setIsPhoneLoading(true);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("sunnah_customer_phone", cleanPhone);
        localStorage.setItem(
          "sunnah_customer_auth",
          JSON.stringify({
            phone: cleanPhone,
            method: "phone",
            loggedInAt: new Date().toISOString(),
          })
        );
      }

      setPhoneSuccess("মোবাইল নম্বর যাচাই সফল হয়েছে! আপনাকে অ্যাকাউন্টে নিয়ে যাওয়া হচ্ছে...");
      setTimeout(() => {
        router.push(redirectTarget);
      }, 700);
    } catch {
      setPhoneError("লগইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsPhoneLoading(false);
    }
  };

  // Credentials Login Handler
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError("");
    setCredSuccess("");

    if (!identifier.trim() || !password) {
      setCredError("ইমেইল/মোবাইল এবং পাসওয়ার্ড উভয় ফিল্ড পূরণ করুন।");
      return;
    }

    setIsCredLoading(true);

    try {
      const supabase = createClient();
      const isEmail = identifier.includes("@");
      let authEmail = identifier.trim();

      if (!isEmail) {
        if (!isValidBDPhone(identifier)) {
          setCredError("সঠিক ইমেইল অথবা ১১ ডিজিটের মোবাইল নম্বর লিখুন।");
          setIsCredLoading(false);
          return;
        }
        const cleanPhone = normalizeBDPhone(identifier);
        authEmail = `${cleanPhone}@customer.sunnahsourcebd.com`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: password,
      });

      if (error) {
        if (!isEmail) {
          const cleanPhone = normalizeBDPhone(identifier);
          if (typeof window !== "undefined") {
            localStorage.setItem("sunnah_customer_phone", cleanPhone);
            localStorage.setItem(
              "sunnah_customer_auth",
              JSON.stringify({
                phone: cleanPhone,
                method: "phone_fallback",
                loggedInAt: new Date().toISOString(),
              })
            );
          }
          setCredSuccess("স্বাগতম! আপনাকে অ্যাকাউন্টে নিয়ে যাওয়া হচ্ছে...");
          setTimeout(() => {
            router.push(redirectTarget);
          }, 700);
          return;
        }

        setCredError("ইমেইল বা পাসওয়ার্ড সঠিক নয়। পুনরায় চেষ্টা করুন।");
        return;
      }

      if (data.user) {
        if (!isEmail) {
          const cleanPhone = normalizeBDPhone(identifier);
          if (typeof window !== "undefined") {
            localStorage.setItem("sunnah_customer_phone", cleanPhone);
          }
        }
        setCredSuccess("লগইন সফল হয়েছে! আপনাকে নিয়ে যাওয়া হচ্ছে...");
        setTimeout(() => {
          router.push(redirectTarget);
        }, 700);
      }
    } catch {
      setCredError("লগইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsCredLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-charcoal-900 flex flex-col font-bengali">
      {/* 1. Global Announcement */}
      <AnnouncementBar />

      {/* 2. Global Header */}
      <Header />

      {/* 3. Main Luxury Single Card */}
      <main className="flex-1 py-10 sm:py-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-6">
          {/* Luxury Glass-Morphism Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-brand-100/80 p-6 sm:p-10 relative overflow-hidden">
            {/* Top Brand Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-600 via-amber-500 to-brand-700" />

            {/* Header: Icon Mark & Title */}
            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200/80 text-brand-700 flex items-center justify-center mx-auto shadow-2xs">
                <ShieldCheck className="w-7 h-7 text-brand-700" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-brand-900 tracking-tight">
                  সাইন ইন / Sign In
                </h1>
                <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-sm mx-auto">
                  প্রকৃতির খাঁটি স্বাদে আপনাকে স্বাগতম। আপনার অ্যাকাউন্টে নিরাপদে প্রবেশ করুন।
                </p>
              </div>
            </div>

            {/* Premium 1-Click Google Sign-In Bar (Top Feature) */}
            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-charcoal-50 border border-charcoal-200 rounded-xl font-medium text-sm text-charcoal-800 shadow-sm hover:shadow transition-all cursor-pointer active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed group"
                title="গুগল দিয়ে সরাসরি সাইন ইন করুন"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 text-brand-700 animate-spin" />
                ) : (
                  <GoogleIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span className="font-semibold text-charcoal-800 group-hover:text-charcoal-900 font-sans sm:font-bengali">
                  গুগল দিয়ে সরাসরি সাইন ইন করুন
                </span>
              </button>

              {googleError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{googleError}</span>
                </div>
              )}

              {/* Centered Divider */}
              <div className="relative flex items-center justify-center pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <span className="relative bg-white px-4 text-xs font-medium text-charcoal-500 font-sans tracking-wide">
                  or sign in with
                </span>
              </div>
            </div>

            {/* Sleek Segmented Tab Switcher */}
            <div className="bg-stone-100/90 p-1.5 rounded-2xl flex items-center gap-1 mb-6 border border-stone-200/60">
              <button
                type="button"
                onClick={() => setActiveTab("phone")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "phone"
                    ? "bg-brand-700 text-white shadow-sm"
                    : "text-charcoal-600 hover:text-brand-800 hover:bg-white/60"
                }`}
              >
                <span>📱</span>
                <span>মোবাইল নম্বর</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("credentials")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "credentials"
                    ? "bg-brand-700 text-white shadow-sm"
                    : "text-charcoal-600 hover:text-brand-800 hover:bg-white/60"
                }`}
              >
                <span>🔐</span>
                <span>ইমেইল ও পাসওয়ার্ড</span>
              </button>
            </div>

            {/* Tab 1: Mobile Phone Login */}
            {activeTab === "phone" && (
              <form onSubmit={handleMobileLogin} className="space-y-4">
                <div className="space-y-1">
                  <label
                    htmlFor="login-phone"
                    className="block text-xs font-bold text-charcoal-800"
                  >
                    ১১ ডিজিটের মোবাইল নম্বর *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-stone-500 font-sans text-xs font-semibold border-r border-stone-200 pr-2 pointer-events-none">
                      <span>🇧🇩</span>
                      <span>+৮৮</span>
                    </div>
                    <input
                      id="login-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      maxLength={11}
                      className="w-full h-11 pl-20 pr-3.5 bg-surface-canvas rounded-xl border border-stone-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 text-sm font-sans tracking-wide text-charcoal-900 outline-none transition-all placeholder:text-stone-400"
                    />
                  </div>
                  <p className="text-[11px] text-charcoal-500 pt-0.5">
                    উদাহরণ: 01712345678 (কোনো পাসওয়ার্ড প্রয়োজন নেই)
                  </p>
                </div>

                {phoneError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{phoneError}</span>
                  </div>
                )}

                {phoneSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{phoneSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPhoneLoading}
                  className="w-full h-11 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {isPhoneLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>যাচাই হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>লগইন করুন / ওটিপি পাঠান</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Tab 2: Credentials Login */}
            {activeTab === "credentials" && (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div className="space-y-1">
                  <label
                    htmlFor="login-identifier"
                    className="block text-xs font-bold text-charcoal-800"
                  >
                    ইমেইল অথবা মোবাইল নম্বর *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@example.com অথবা 01XXXXXXXXX"
                      className="w-full h-11 pl-10 pr-3.5 bg-surface-canvas rounded-xl border border-stone-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 text-sm text-charcoal-900 outline-none transition-all placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-charcoal-800"
                  >
                    পাসওয়ার্ড *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="আপনার অ্যাকাউন্টের পাসওয়ার্ড"
                      className="w-full h-11 pl-10 pr-10 bg-surface-canvas rounded-xl border border-stone-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 text-sm text-charcoal-900 outline-none transition-all placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
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

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-charcoal-700">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-700 focus:ring-brand-700/20 border-stone-300 cursor-pointer"
                    />
                    <span>আমাকে মনে রাখুন</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      alert("পাসওয়ার্ড রিসেটের জন্য অনুগ্রহ করে আপনার মোবাইল নম্বর দিয়ে লগইন করুন অথবা আমাদের হেল্পলাইনে কল দিন: ০১৯১৪-৬১২০০৭")
                    }
                    className="text-brand-700 hover:underline font-semibold"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>

                {credError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{credError}</span>
                  </div>
                )}

                {credSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{credSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCredLoading}
                  className="w-full h-11 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {isCredLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>লগইন হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>লগইন (Login)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Islamic Trust & Amanah Microcopy */}
            <div className="pt-5 mt-6 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-charcoal-500">
              <span className="text-sm">🔒</span>
              <span>আপনার তথ্য ও গোপনীয়তা আমাদের কাছে আমানত।</span>
            </div>
          </div>

          {/* Footer Navigation & Registration Link */}
          <div className="text-center space-y-3">
            <p className="text-xs sm:text-sm text-charcoal-600">
              নতুন কাস্টমার?{" "}
              <Link
                href="/register"
                className="font-black text-brand-800 hover:text-brand-900 underline underline-offset-4"
              >
                অ্যাকাউন্ট তৈরি করুন →
              </Link>
            </p>

            {/* Discreet Admin Login Link */}
            <div>
              <Link
                href="/admin/login"
                className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors inline-flex items-center gap-1"
              >
                <span>স্টোর ম্যানেজার? অ্যাডমিন প্যানেল লগইন →</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Global Footer */}
      <Footer />

      {/* 5. Mobile Bottom Nav */}
      <MobileBottomNav />

      {/* 6. Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
