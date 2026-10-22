"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  User,
  ArrowRight,
  ShieldCheck,
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

export default function CustomerRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Google 1-Click Sign-In
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrorMessage("অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন।");
      return;
    }

    if (!isValidBDPhone(phone)) {
      setErrorMessage("সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678)।");
      return;
    }

    if (!address.trim()) {
      setErrorMessage("অনুগ্রহ করে আপনার ডেলিভারি ঠিকানা লিখুন (যেমন: বাড়ি নং, রোড, থানা, জেলা)।");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }

    const cleanPhone = normalizeBDPhone(phone);
    setIsLoading(true);

    try {
      // 1. Attempt Supabase Auth Sign Up
      const supabase = createClient();
      const syntheticEmail = `${cleanPhone}@customer.sunnahsourcebd.com`;

      await supabase.auth.signUp({
        email: syntheticEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: cleanPhone,
            delivery_address: address.trim(),
          },
        },
      });

      // 2. Persist Customer Profile locally so customer orders and checkout auto-fill
      if (typeof window !== "undefined") {
        localStorage.setItem("sunnah_customer_phone", cleanPhone);
        localStorage.setItem(
          "sunnah_customer_profile",
          JSON.stringify({
            name: fullName.trim(),
            phone: cleanPhone,
            address: address.trim(),
            registeredAt: new Date().toISOString(),
          })
        );
        localStorage.setItem(
          "sunnah_customer_auth",
          JSON.stringify({
            phone: cleanPhone,
            name: fullName.trim(),
            method: "registered",
            loggedInAt: new Date().toISOString(),
          })
        );
      }

      setSuccessMessage("আলহামদুলিল্লাহ! আপনার অ্যাকাউন্ট তৈরি সফল হয়েছে। আপনাকে প্রবেশ করানো হচ্ছে...");
      setTimeout(() => {
        router.push("/account/orders");
      }, 800);
    } catch {
      setErrorMessage("অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
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
                <UserPlus className="w-7 h-7 text-brand-700" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-brand-900 tracking-tight">
                  অ্যাকাউন্ট তৈরি করুন / Register
                </h1>
                <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-sm mx-auto">
                  সুন্নাহ সোর্স পরিবারে আপনাকে স্বাগতম। খাঁটি প্রাকৃতিক পণ্য নিরাপদে অর্ডার করুন।
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
                title="গুগল দিয়ে সরাসরি অ্যাকাউন্ট তৈরি করুন"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 text-brand-700 animate-spin" />
                ) : (
                  <GoogleIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span className="font-semibold text-charcoal-800 group-hover:text-charcoal-900 font-sans sm:font-bengali">
                  গুগল দিয়ে সরাসরি সাইন ইন / রেজিস্টার করুন
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
                  or register with form
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label
                  htmlFor="register-name"
                  className="block text-xs font-bold text-charcoal-800"
                >
                  পূর্ণ নাম (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="register-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full h-11 pl-10 pr-3.5 bg-surface-canvas rounded-xl border border-stone-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 text-sm text-charcoal-900 outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label
                  htmlFor="register-phone"
                  className="block text-xs font-bold text-charcoal-800"
                >
                  মোবাইল নম্বর (Phone Number) *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-stone-500 font-sans text-xs font-semibold border-r border-stone-200 pr-2 pointer-events-none">
                    <span>🇧🇩</span>
                    <span>+৮৮</span>
                  </div>
                  <input
                    id="register-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                    className="w-full h-11 pl-20 pr-3.5 bg-surface-canvas rounded-xl border border-stone-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 text-sm font-sans tracking-wide text-charcoal-900 outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label
                  htmlFor="register-address"
                  className="block text-xs font-bold text-charcoal-800"
                >
                  ডেলিভারি ঠিকানা (Delivery Address) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    id="register-address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="বাড়ি নং, রোড নং, থানা, জেলা"
                    className="w-full py-2.5 pl-10 pr-3.5 bg-surface-canvas rounded-xl border border-stone-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 text-sm text-charcoal-900 outline-none transition-all placeholder:text-stone-400 resize-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label
                  htmlFor="register-password"
                  className="block text-xs font-bold text-charcoal-800"
                >
                  পাসওয়ার্ড (Password) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
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

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Alert */}
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>অ্যাকাউন্ট তৈরি করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Islamic Trust & Amanah Microcopy */}
            <div className="pt-5 mt-6 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-charcoal-500">
              <span className="text-sm">🔒</span>
              <span>আপনার তথ্য ও গোপনীয়তা আমাদের কাছে আমানত।</span>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-charcoal-600">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link
                href="/login"
                className="font-black text-brand-800 hover:text-brand-900 underline underline-offset-4"
              >
                সাইন ইন করুন →
              </Link>
            </p>
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
