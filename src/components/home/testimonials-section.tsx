"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  Quote,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users,
  MessageCircle,
  Sparkles,
} from "lucide-react";

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  comment: string;
  rating: number;
  product?: string;
  avatarText: string;
  avatarBg: string;
  verifiedBuyer: boolean;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "rev-1",
    name: "ফারজানা চৌধুরী",
    title: "শিক্ষিকা, ধানমন্ডি, ঢাকা",
    comment:
      "এই অবিশ্বাসের বাজারে সান্নাহ সোর্স এক টুকরো স্বস্তি। সুন্দরবনের চাকের কাঁচা মধু আর গাওয়া ঘিয়ের সুবাস ও দানাদার গঠন অসাধারণ।",
    rating: 5,
    product: "সুন্দরবনের চাকের কাঁচা মধু ও গাওয়া ঘি",
    avatarText: "ফা",
    avatarBg: "bg-rose-50 text-rose-700 border-rose-200",
    verifiedBuyer: true,
  },
  {
    id: "rev-2",
    name: "প্রকৌশলী তানভীর আহমেদ",
    title: "উত্তরা, ঢাকা",
    comment:
      "২য় বার সান্নাহ সোর্স থেকে অর্ডার করলাম। আগের মতো এবারও খাঁটি কালোজিরা তেল ও প্রথাগত গাওয়া ঘি পেয়েছি। কোয়ালিটি ও দ্রুত হোম ডেলিভারিতে আমি পুরোপুরি সন্তুষ্ট।",
    rating: 5,
    product: "খাঁটি কালোজিরা তেল ও গাওয়া ঘি",
    avatarText: "তা",
    avatarBg: "bg-brand-50 text-brand-800 border-brand-200",
    verifiedBuyer: true,
  },
  {
    id: "rev-3",
    name: "ডা: সাজিদ হাসান",
    title: "চিকিৎসক, চট্টগ্রাম",
    comment:
      "মদিনার ভিআইপি আজওয়া খেজুর ও সরিষার তেল নিয়েছিলাম। ১০০% নির্ভেজাল ও আসল স্বাদ। তাদের প্যাকেজিং এবং কুরিয়ার সার্ভিস সত্যিই দারুণ।",
    rating: 5,
    product: "মদিনার ভিআইপি আজওয়া খেজুর",
    avatarText: "সা",
    avatarBg: "bg-amber-50 text-amber-800 border-amber-200",
    verifiedBuyer: true,
  },
  {
    id: "rev-4",
    name: "আয়েশা বেগম",
    title: "গৃহিণী, সিলেট",
    comment:
      "খাঁটি খলিসা ফুলের মধু একদম প্রাকৃতিক। টেস্ট করলেই বোঝা যায় কোনো ভেজাল নেই। পরিবারের সবার জন্য নিয়মিত নিচ্ছি।",
    rating: 5,
    product: "খাঁটি খলিসা ফুলের মধু",
    avatarText: "আ",
    avatarBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    verifiedBuyer: true,
  },
  {
    id: "rev-5",
    name: "মাহফুজুর রহমান",
    title: "ব্যবসায়ী, রাজশাহী",
    comment:
      "সরাসরি কাঠের ঘানি ভাঙা সরিষার তেল ও সুন্দরবনের মধুর কম্বো নিয়েছিলাম। সান্নাহ সোর্সের সততা ও সেবায় মুগ্ধ।",
    rating: 5,
    product: "ঘানি ভাঙা সরিষার তেল ও মধু কম্বো",
    avatarText: "মা",
    avatarBg: "bg-blue-50 text-blue-800 border-blue-200",
    verifiedBuyer: true,
  },
];

export function TestimonialsSection() {
  const [mounted, setMounted] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateCardsPerView = () => {
      if (window.innerWidth >= 1024) {
        setCardsPerView(3);
      } else if (window.innerWidth >= 640) {
        setCardsPerView(2);
      } else {
        setCardsPerView(1);
      }
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  const maxIndex = Math.max(0, TESTIMONIALS.length - cardsPerView);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  useEffect(() => {
    if (!mounted || isPaused || maxIndex <= 0) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => clearInterval(timer);
  }, [mounted, isPaused, maxIndex, nextSlide]);

  return (
    <section className="container mx-auto max-w-7xl px-4 py-8 lg:py-12 space-y-10 font-bengali">
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

      {/* 3. Auto-Playing Horizontal Review Slider (Ghorer Bazar Style) */}
      <div className="space-y-6">
        {/* Slider Viewport with Pause on Hover / Touch */}
        <div
          className="relative overflow-hidden py-2"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / (mounted ? cardsPerView : 1))}%)`,
            }}
          >
            {TESTIMONIALS.map((review) => (
              <div
                key={review.id}
                className="w-full min-w-full sm:w-1/2 sm:min-w-[50%] lg:w-1/3 lg:min-w-[33.333333%] px-2.5 sm:px-3 shrink-0 flex"
              >
                <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs hover:shadow-md transition-all font-bengali text-left flex flex-col justify-between w-full h-full space-y-4">
                  {/* Top: Stars & Quote Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <Quote className="w-7 h-7 text-brand-700/20 shrink-0" />
                  </div>

                  {/* Review Quote Body */}
                  <p className="text-xs sm:text-sm text-charcoal-800 leading-relaxed font-normal flex-1">
                    &ldquo;{review.comment}&rdquo;
                  </p>

                  {/* Product Tag */}
                  {review.product && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200/70 truncate max-w-full">
                        পণ্য: {review.product}
                      </span>
                    </div>
                  )}

                  {/* Bottom: Customer Avatar, Name, Verified Badge, Designation/Location */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full ${review.avatarBg} font-extrabold flex items-center justify-center text-sm border shadow-2xs shrink-0`}
                      >
                        {review.avatarText}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-charcoal-900 text-xs sm:text-sm truncate">
                          {review.name}
                        </h4>
                        <p className="text-[11px] text-charcoal-500 truncate mt-0.5">
                          {review.title}
                        </p>
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
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Pagination Dots & Arrows Controls */}
        <div className="flex items-center justify-between pt-2">
          {/* Previous Arrow Button */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="পূর্ববর্তী রিভিউ"
            className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-xs hover:border-brand-700 hover:text-brand-700 flex items-center justify-center text-charcoal-700 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Styled Pagination Dots with Expansion */}
          <div className="flex items-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? "w-6 bg-brand-700 shadow-xs"
                    : "w-2 bg-stone-300 hover:bg-stone-400"
                }`}
                aria-label={`রিভিউ স্লাইড ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next Arrow Button */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="পরবর্তী রিভিউ"
            className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-xs hover:border-brand-700 hover:text-brand-700 flex items-center justify-center text-charcoal-700 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. High-Converting Bottom Trust & Action Banner */}
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

export default TestimonialsSection;
