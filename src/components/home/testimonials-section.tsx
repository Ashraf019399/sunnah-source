"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  Quote,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Heart,
  Users,
  Award,
  ArrowRight,
  MapPin,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { getFeaturedTestimonials, ALL_REVIEWS } from "@/lib/data/reviews";
import { Review } from "@/types/commerce.types";

export function TestimonialsSection() {
  const testimonials = getFeaturedTestimonials();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  const categories = [
    { id: "all", label: "সকল মতামত" },
    { id: "honey", label: "সুন্দরবনের মধু" },
    { id: "ghee", label: "বিলোনা ঘি" },
    { id: "dates", label: "মদিনার খেজুর" },
    { id: "oil-combo", label: "ঘানি ভাঙা তেল ও কম্বো" },
  ];

  const filteredTestimonials: Review[] = testimonials.filter((t) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "honey") return t.productSlug.includes("honey");
    if (activeCategory === "ghee") return t.productSlug.includes("ghee");
    if (activeCategory === "dates") return t.productSlug.includes("dates");
    if (activeCategory === "oil-combo")
      return t.productSlug.includes("oil") || t.productSlug.includes("combo") || t.productSlug.includes("gift");
    return true;
  });

  const displayList = filteredTestimonials.length > 0 ? filteredTestimonials : testimonials;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, displayList.length - 1) : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= displayList.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="container mx-auto max-w-7xl px-4 py-8 lg:py-12 space-y-10">
      {/* 1. Header & Social Proof Eyebrow */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-1 rounded-full text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>প্রমাণিত বিশুদ্ধতা ও গ্রাহক সন্তুষ্টি</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-charcoal-900 tracking-tight leading-tight">
          গ্রাহকদের সন্তুষ্টি ও মতামত
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-charcoal-600 leading-relaxed">
          দেশজুড়ে হাজারো সচেতন পরিবারের আস্থার প্রতীক সান্নাহ সোর্স। যাচাইকৃত ক্রেতাদের মুখ থেকেই শুনুন শতভাগ বিশুদ্ধ খাদ্যের বাস্তব অভিজ্ঞতা।
        </p>
        <div className="w-20 h-1 bg-amber-500 rounded-full mx-auto mt-2" />
      </div>

      {/* 2. Top Trust Proof Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-xs flex items-center gap-3.5 hover:border-brand-700/50 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-100">
            <Users className="w-5 h-5 text-brand-700" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight font-mono block">
              ১০,০০০+
            </span>
            <span className="text-[11px] sm:text-xs text-charcoal-500 font-semibold">
              সন্তুষ্ট পরিবার
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-xs flex items-center gap-3.5 hover:border-brand-700/50 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight font-mono block">
              ৪.৯ / ৫.০
            </span>
            <span className="text-[11px] sm:text-xs text-charcoal-500 font-semibold">
              গড় কাস্টমার রেটিং
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-xs flex items-center gap-3.5 hover:border-brand-700/50 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight font-mono block">
              ৯৯.২%
            </span>
            <span className="text-[11px] sm:text-xs text-charcoal-500 font-semibold">
              পজিটিভ রিভিউ
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-surface-border shadow-xs flex items-center gap-3.5 hover:border-brand-700/50 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-100">
            <ShieldCheck className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight font-mono block">
              ১০০%
            </span>
            <span className="text-[11px] sm:text-xs text-charcoal-500 font-semibold">
              মানি-ব্যাক নিশ্চয়তা
            </span>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Tabs & Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setCurrentIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-brand-700 text-white border-brand-700 shadow-xs"
                  : "bg-white text-charcoal-700 border-surface-border hover:border-brand-700 hover:text-brand-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="w-9 h-9 rounded-full bg-white border border-surface-border flex items-center justify-center text-charcoal-700 hover:bg-stone-50 hover:border-brand-700 transition-colors shadow-xs cursor-pointer"
            aria-label="পূর্ববর্তী রিভিউ"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 rounded-full bg-white border border-surface-border flex items-center justify-center text-charcoal-700 hover:bg-stone-50 hover:border-brand-700 transition-colors shadow-xs cursor-pointer"
            aria-label="পরবর্তী রিভিউ"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Responsive Testimonial Cards Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {displayList.slice(0, 6).map((review) => (
          <div
            key={review.id}
            className="group relative bg-white rounded-3xl border border-surface-border p-6 sm:p-7 shadow-subtle hover:shadow-card hover:border-brand-700/60 transition-all duration-300 flex flex-col justify-between space-y-5"
          >
            {/* Top Row: Stars & Quote Icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-stone-100 text-stone-300"
                    }`}
                  />
                ))}
              </div>
              <Quote className="w-8 h-8 text-brand-700/15 group-hover:text-brand-700/30 transition-colors" />
            </div>

            {/* Comment Body */}
            <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed font-normal italic flex-1">
              &ldquo;{review.comment}&rdquo;
            </p>

            {/* Purchased Product Tag */}
            {review.productSlug && review.productTitleBn && (
              <div className="pt-2">
                <Link
                  href={`/product/${review.productSlug}`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-800 bg-brand-50/80 hover:bg-brand-100 px-3 py-1.5 rounded-xl border border-brand-200/60 transition-colors max-w-full truncate group/prod"
                >
                  <span className="truncate">পণ্য: {review.productTitleBn}</span>
                  <ArrowRight className="w-3 h-3 text-brand-700 shrink-0 group-hover/prod:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}

            {/* Customer Profile & Verification */}
            <div className="pt-4 border-t border-surface-border/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-brand-900 font-bold flex items-center justify-center text-sm border border-brand-300 shrink-0 shadow-xs">
                  {review.avatarText || review.userName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-charcoal-900 text-xs sm:text-sm truncate">
                    {review.userName}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-charcoal-500 mt-0.5">
                    <MapPin className="w-3 h-3 text-charcoal-400 shrink-0" />
                    <span className="truncate">{review.userLocation}</span>
                  </div>
                </div>
              </div>

              {review.verifiedBuyer && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  যাচাইকৃত ক্রেতা
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 5. High-Converting Bottom Trust & Action Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white rounded-3xl p-6 sm:p-10 border border-brand-700 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left max-w-xl">
          <span className="inline-block bg-accent-amber/20 text-accent-amber border border-accent-amber/40 text-xs font-bold px-3 py-1 rounded-full">
            ১০০% নিরাপদ ও ঝুঁকিমুক্ত কেনাকাটা
          </span>
          <h3 className="text-xl sm:text-2xl font-black leading-snug">
            আপনিও কি পরিবারের জন্য খাঁটি সুন্নাহ খাবারের স্বাদ নিতে চান?
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            ক্যাশ অন ডেলিভারিতে সারাদেশে ঘরে বসেই গ্রহণ করুন নির্ভেজাল খাদ্যপণ্য। কোনো কারণে অসন্তুষ্ট হলে রয়েছে তাৎক্ষণিক রিটার্ন নিশ্চয়তা।
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
          <Link
            href="/shop"
            className="w-full sm:w-auto text-center px-6 py-3 rounded-xl bg-accent-amber hover:bg-accent-dark text-charcoal-900 font-extrabold text-xs sm:text-sm transition-all shadow-card"
          >
            সব পণ্য দেখুন
          </Link>
          <a
            href="https://wa.me/8801914612007"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপে অর্ডার</span>
          </a>
        </div>
      </div>
    </section>
  );
}
