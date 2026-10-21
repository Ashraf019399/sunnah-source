"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flame,
} from "lucide-react";

interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  link: string;
  image: string;
  gradientClass: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "honey",
    badge: "১০০% খাঁটি ও প্রাকৃতিক",
    title: "সুন্দরবনের প্রাকৃতিক চাকের কাঁচা মধু",
    subtitle: "মৌয়ালদের চাকভাঙা অপরিশোধিত ও এনজাইমসমৃদ্ধ",
    description:
      "সুন্দরবনের গহীন অরণ্য থেকে সরাসরি সংগৃহীত খলিসা ও গরান ফুলের খাঁটি কাঁচা মধু। কোনো হিটিং বা ভেজাল ছাড়াই শতভাগ প্রাকৃতিক পুষ্টি।",
    ctaText: "এখনই কিনুন",
    link: "/category/honey",
    image: "/images/hero-honey.png",
    gradientClass: "from-brand-950 via-brand-900/90 to-amber-950/40",
  },
  {
    id: "ghee",
    badge: "মাটির হাঁড়িতে মন্থনকৃত",
    title: "ঐতিহ্যবাহী বিলোনা গাওয়া ঘি",
    subtitle: "পাবনার দেশি গরুর খাঁটি দানাদার গাওয়া ঘি",
    description:
      "প্রথাগতভাবে দই মন্থন করে মাখন তুলে মাটির পাত্রে মৃদু তাপে জ্বালানো শতভাগ বিশুদ্ধ বিলোনা ঘি। স্বাদ, ঘ্রাণ ও পুষ্টিগুণে অতুলনীয়।",
    ctaText: "অর্ডার করুন",
    link: "/category/ghee-oil",
    image:
      "https://images.unsplash.com/photo-1631379578550-7038263db699?auto=format&fit=crop&w=1200&q=85",
    gradientClass: "from-brand-950 via-amber-950/80 to-brand-900/60",
  },
  {
    id: "dates",
    badge: "রাসূলুল্লাহ ﷺ-এর পছন্দের বরকতময় খেজুর",
    title: "মদিনার প্রিমিয়াম ভিআইপি আজওয়া খেজুর",
    subtitle: "সরাসরি মদিনা মুনাওয়ারা থেকে আমদানিকৃত",
    description:
      "আকারে বড়, নরম, রসালো এবং রোগ প্রতিরোধক মহা বরকতময় আসল আজওয়া খেজুর। প্রাকৃতিক মিষ্টতা ও অগণিত স্বাস্থ্য উপকারিতা সমৃদ্ধ।",
    ctaText: "সংগ্রহ করুন",
    link: "/category/dates",
    image:
      "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1200&q=85",
    gradientClass: "from-emerald-950 via-brand-950/90 to-stone-900/70",
  },
  {
    id: "oils",
    badge: "কোল্ড-প্রেসড ও ঝাঁঝালো",
    title: "কাঠের ঘানি ভাঙা খাঁটি সরিষা ও কালোজিরা তেল",
    subtitle: "দেশি নাটোরের মাঘী সরিষা ও প্রিমিয়াম কালোজিরা",
    description:
      "ঐতিহ্যবাহী কাঠের ঘানিতে কম তাপমাত্রায় কোল্ড-প্রেসড শতভাগ খাঁটি সরিষার তেল ও মৃত্যু ব্যতীত সর্বরোগের মহৌষধ কালোজিরার তেল।",
    ctaText: "পণ্য দেখুন",
    link: "/category/ghee-oil",
    image:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=85",
    gradientClass: "from-stone-950 via-brand-950/95 to-emerald-950/70",
  },
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch and drag coordinates
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
  }, []);

  // Auto-advance every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Touch swipe handling
  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  return (
    <section
      aria-label="Sunnah Source Hero Showcase"
      className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 sm:py-5 font-bengali"
    >
      {/* Sunnah Royal Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
        {/* Left Column: Main Hero Slider (Takes lg:col-span-8) */}
        <div
          className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-brand-800/20 bg-brand-950 shadow-xl group h-[420px] sm:h-[460px] lg:h-[480px] select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Horizontal Sliding Carousel Track */}
          <div
            className="flex h-full transition-transform duration-700 ease-out will-change-transform"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {HERO_SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                className="w-full h-full shrink-0 relative flex items-center"
              >
                {/* Background Image Layer with Depth Gradients */}
                <div className="absolute inset-0 overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 1024px) 100vw, 68vw"
                    className="object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                  />
                  {/* Luxury Multi-Stop Dark Gradient for Pristine Bengali Legibility */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${slide.gradientClass} sm:w-4/5 lg:w-3/4`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent" />
                  <div className="absolute inset-0 bg-black/25" />
                  {/* Subtle Ambient Warm Glow */}
                  <div className="absolute -top-12 right-1/4 w-80 h-80 bg-accent-amber/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Slide Text Content & Call-To-Action */}
                <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-8 max-w-xl text-left space-y-3.5 sm:space-y-4">
                  {/* Pill Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-amber/20 border border-accent-amber/40 text-accent-amber text-xs font-bold w-fit backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                    <span>{slide.badge}</span>
                  </div>

                  {/* Main Title */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-black text-white leading-tight sm:leading-tight lg:leading-[1.18] tracking-tight drop-shadow-md">
                    {slide.title}
                  </h1>

                  {/* Subtitle / Description */}
                  <p className="text-stone-300 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-lg font-light">
                    {slide.description}
                  </p>

                  {/* Primary Action Button */}
                  <div className="pt-2 sm:pt-3 flex items-center gap-3">
                    <Link
                      href={slide.link}
                      prefetch={true}
                      className="inline-flex items-center gap-2 bg-accent-amber hover:bg-amber-400 text-charcoal-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 shadow-lg hover:shadow-amber-500/20 active:scale-95 group/btn"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                    <Link
                      href="/shop"
                      prefetch={true}
                      className="inline-flex items-center gap-1.5 text-white/90 hover:text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <span>সকল পণ্য</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows (Circular, Backdrop Blur, Emerald Hover) */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Bottom Pagination Dots with Expanding Active Emerald Pill */}
          <div className="absolute bottom-4 sm:bottom-6 left-6 sm:left-10 z-20 flex items-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? "w-8 h-2.5 bg-accent-amber shadow-sm"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Twin Artisan Promo Cards (Takes lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4 lg:gap-5 h-full justify-between">
          {/* Promo Card 1 (Top): সুন্নাহ স্পেশাল কম্বো প্যাক */}
          <Link
            href="/combos"
            prefetch={true}
            className="group relative flex-1 rounded-3xl overflow-hidden border border-brand-800/40 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:border-emerald-500/50 min-h-[195px] sm:min-h-[220px] lg:min-h-0 bg-gradient-to-br from-[#0a2318] via-[#0e3323] to-[#071911]"
          >
            {/* Background Texture & Photo with Zoom on Hover */}
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80"
                alt="সুন্নাহ স্পেশাল কম্বো প্যাক"
                fill
                sizes="(max-width: 1024px) 100vw, 34vw"
                className="object-cover object-right opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a2318] via-[#0a2318]/90 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Content Top */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[11px] font-bold">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>সীমিত স্টক</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-300">
                  সেভিংস অফার
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-accent-amber transition-colors leading-snug">
                সুন্নাহ স্পেশাল কম্বো প্যাক
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed max-w-[250px]">
                মধু, ঘি ও তেলের স্বাস্থ্যকর কম্বিনেশন — সেরা ছাড়ে আজই অর্ডার করুন।
              </p>
            </div>

            {/* Content Bottom CTA */}
            <div className="relative z-10 pt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-amber group-hover:text-amber-300 transition-colors">
                <span>কম্বো দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400/90 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Combo Offer
              </span>
            </div>
          </Link>

          {/* Promo Card 2 (Bottom): খাঁটি সুন্দরবনের কাঁচা মধু */}
          <Link
            href="/category/honey"
            prefetch={true}
            className="group relative flex-1 rounded-3xl overflow-hidden border border-amber-500/30 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:border-amber-400/60 min-h-[195px] sm:min-h-[220px] lg:min-h-0 bg-gradient-to-br from-[#1a1405] via-[#241a08] to-[#120e03]"
          >
            {/* Background Texture & Photo with Zoom on Hover */}
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src="/images/hero-honey.png"
                alt="খাঁটি সুন্দরবনের কাঁচা মধু"
                fill
                sizes="(max-width: 1024px) 100vw, 34vw"
                className="object-cover object-right opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a1405] via-[#1a1405]/90 to-transparent" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Content Top */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>১০০% ক্যাশব্যাক গ্যারান্টি</span>
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-accent-amber transition-colors leading-snug">
                খাঁটি সুন্দরবনের কাঁচা মধু
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed max-w-[250px]">
                মাওয়ালদের চাকভাঙা তাজা মধু • ল্যাব টেস্টেড ও শতভাগ অপরিশোধিত।
              </p>
            </div>

            {/* Content Bottom CTA */}
            <div className="relative z-10 pt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-amber group-hover:text-amber-300 transition-colors">
                <span>মধু অর্ডার করুন</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="font-mono text-xs font-bold text-amber-400/90 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                Raw Honey
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
