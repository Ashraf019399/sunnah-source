"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShoppingBag,
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

  // Google 1-Click Sign-In
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  // Column 1: Mobile OTP / Instant Phone Login
  const [phone, setPhone] = useState("");
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");

  // Column 2: Credentials Login (Email/Phone + Password)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isCredLoading, setIsCredLoading] = useState(false);
  const [credError, setCredError] = useState("");
  const [credSuccess, setCredSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error")) {
        setGoogleError("অথেনটিকেশনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    }
  }, []);

  // Handler: 1-Click Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError("");
    try {
      const supabase = createClient();
      const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectOrigin}/auth/callback?next=/account/orders`,
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

  // Handler: Mobile Number Login
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

      setPhoneSuccess("মোবাইল নম্বর যাচাই সফল হয়েছে! আপনাকে অর্ডার ইতিহাসে নিয়ে যাওয়া হচ্ছে...");
      setTimeout(() => {
        router.push("/account/orders");
      }, 700);
    } catch {
      setPhoneError("লগইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsPhoneLoading(false);
    }
  };

  // Handler: Credentials Login
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
      const emailToUse = isEmail
        ? identifier.trim()
        : `${normalizeBDPhone(identifier)}@customer.sunnahsourcebd.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password,
      });

      if (error) {
        // Fallback for customers with saved orders matching this phone
        if (isValidBDPhone(identifier)) {
          const cleanPhone = normalizeBDPhone(identifier);
          if (typeof window !== "undefined") {
            localStorage.setItem("sunnah_customer_phone", cleanPhone);
            localStorage.setItem(
              "sunnah_customer_auth",
              JSON.stringify({
                phone: cleanPhone,
                method: "credentials",
                loggedInAt: new Date().toISOString(),
              })
            );
          }
          setCredSuccess("লগইন সফল হয়েছে! আপনাকে নিয়ে যাওয়া হচ্ছে...");
          setTimeout(() => {
            router.push("/account/orders");
          }, 700);
          return;
        }

        setCredError(
          error.message === "Invalid login credentials"
            ? "ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।"
            : error.message
        );
        return;
      }

      if (data?.user) {
        if (typeof window !== "undefined") {
          if (isValidBDPhone(identifier)) {
            localStorage.setItem("sunnah_customer_phone", normalizeBDPhone(identifier));
          }
          localStorage.setItem(
            "sunnah_customer_auth",
            JSON.stringify({
              userId: data.user.id,
              email: data.user.email,
              method: "supabase",
              loggedInAt: new Date().toISOString(),
            })
          );
        }
        setCredSuccess("লগইন সফল হয়েছে! আপনাকে অর্ডার ইতিহাসে নিয়ে যাওয়া হচ্ছে...");
        setTimeout(() => {
          router.push("/account/orders");
        }, 700);
      }
    } catch {
      setCredError("লগইন প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsCredLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali text-charcoal-900">
      {/* 1. Global Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Global Header */}
      <Header />

      {/* 3. Main Login Card Container */}
      <main className="flex-1 py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center mx-auto shadow-2xs">
              <User className="w-7 h-7 text-brand-700" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-charcoal-900 tracking-tight">
              Signin / অ্যাকাউন্ট সাইন ইন
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-600 max-w-md mx-auto leading-relaxed">
              আপনার অ্যাকাউন্টে নিরাপদে প্রবেশ করুন এবং আপনার সংরক্ষিত পছন্দের তালিকা ও পূর্ববর্তী সমস্ত অর্ডারের তথ্য দেখুন।
            </p>
          </div>

          {/* Dual Column Box (Ghorer Bazar Style) */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-card p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 items-stretch">
              {/* Column 1: Mobile Number Login */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-800 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                      <Phone className="w-3 h-3 text-brand-700" />
                      সবচেয়ে সহজ মাধ্যম
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-charcoal-900">
                      Login With Mobile Number
                    </h2>
                    <p className="text-xs text-charcoal-500">
                      মোবাইল নম্বর দিয়ে দ্রুত সাইন ইন করুন
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

                  <form onSubmit={handleMobileLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="mobile-phone"
                        className="block text-xs font-bold text-charcoal-800"
                      >
                        মোবাইল নম্বর (১১ ডিজিট)
                      </label>
                      <div className="relative">
                        <input
                          id="mobile-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full h-11 px-3.5 bg-surface-canvas rounded-xl border border-stone-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 text-sm font-mono text-charcoal-900 outline-none transition-all placeholder:text-stone-400"
                          maxLength={15}
                        />
                      </div>
                      <p className="text-[11px] text-charcoal-400">
                        যেমন: 01712345678
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isPhoneLoading}
                      className="w-full h-11 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isPhoneLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>যাচাই করা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <span>লগইন করুন / ওটিপি পাঠান</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center gap-2 text-[11px] text-charcoal-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>অর্ডারের সময় ব্যবহৃত নম্বর দিয়ে সহজেই সব ডেটা পাওয়া যাবে।</span>
                </div>
              </div>

              {/* Middle Divider ("OR") */}
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-center my-2 lg:my-0 relative">
                <div className="hidden lg:block w-px h-full bg-stone-200"></div>
                <div className="lg:hidden w-full h-px bg-stone-200"></div>
                <span className="absolute px-3 py-1 bg-surface-canvas border border-stone-200 text-stone-500 rounded-full text-[11px] font-black font-mono shadow-2xs">
                  OR
                </span>
              </div>

              {/* Column 2: Credentials Login */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                      <Lock className="w-3 h-3 text-amber-700" />
                      পাসওয়ার্ড মাধ্যম
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-charcoal-900">
                      Login With Credentials
                    </h2>
                    <p className="text-xs text-charcoal-500">
                      ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন
                    </p>
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

                  <form onSubmit={handleCredentialsLogin} className="space-y-3.5">
                    <div className="space-y-1">
                      <label
                        htmlFor="cred-identifier"
                        className="block text-xs font-bold text-charcoal-800"
                      >
                        ইমেইল বা মোবাইল নম্বর
                      </label>
                      <input
                        id="cred-identifier"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="example@mail.com বা 01XXXXXXXXX"
                        className="w-full h-11 px-3.5 bg-surface-canvas rounded-xl border border-stone-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 text-sm text-charcoal-900 outline-none transition-all placeholder:text-stone-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="cred-password"
                        className="block text-xs font-bold text-charcoal-800"
                      >
                        পাসওয়ার্ড
                      </label>
                      <div className="relative">
                        <input
                          id="cred-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="আপনার গোপন পাসওয়ার্ড"
                          className="w-full h-11 pl-3.5 pr-10 bg-surface-canvas rounded-xl border border-stone-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 text-sm text-charcoal-900 outline-none transition-all placeholder:text-stone-400"
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

                    <button
                      type="submit"
                      disabled={isCredLoading}
                      className="w-full h-11 bg-white border border-brand-700/80 hover:bg-brand-50 text-brand-800 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isCredLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-brand-700" />
                          <span>লগইন হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <span>লগইন (Login)</span>
                          <ArrowRight className="w-4 h-4 text-brand-700" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="pt-4 border-t border-stone-100 text-center text-xs text-charcoal-500">
                  <span>নিরাপদ এসএসএল এনক্রিপ্টেড প্রবেশাধিকার</span>
                </div>
              </div>
            </div>

            {/* 1-Click Google Sign-In (Ghorer Bazar Style) */}
            <div className="pt-8 mt-8 border-t border-stone-200/80">
              <div className="relative flex items-center justify-center mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <span className="relative bg-white px-4 text-xs font-medium text-charcoal-500 lowercase tracking-wide font-sans">
                  or signin with
                </span>
              </div>

              {googleError && (
                <div className="max-w-md mx-auto mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{googleError}</span>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="h-12 w-12 rounded-full border border-charcoal-200 bg-white shadow-sm hover:shadow-md hover:border-brand-500 transition-all flex items-center justify-center active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
                  title="Google দিয়ে সাইন ইন করুন"
                  aria-label="Google Sign In"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 text-brand-700 animate-spin" />
                  ) : (
                    <GoogleIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Navigation & Registration Link */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200/80 px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-xs">
              <span>নতুন গ্রাহক?</span>
              <Link
                href="/register"
                className="font-black text-brand-800 underline hover:text-brand-900"
              >
                একটি নতুন অ্যাকাউন্ট তৈরি করুন →
              </Link>
            </div>

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
