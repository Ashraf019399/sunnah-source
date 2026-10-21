"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BannerSlide {
  id: string;
  image: string;
  alt: string;
  link: string;
}

const MAIN_BANNERS: BannerSlide[] = [
  {
    id: "honey",
    image: "/images/banners/banner-nature-honey.jpg",
    alt: "প্রকৃতির খাঁটি উপহার — সুন্নাহ সোর্স কাঁচা মধু",
    link: "/category/honey",
  },
  {
    id: "ghee-oil",
    image: "/images/banners/banner-ghee-oil.jpg",
    alt: "ঐতিহ্যবাহী বিলোনা গাওয়া ঘি ও কাঠের ঘানি ভাঙা সরিষার তেল - Bilona Cow Ghee & Cold-Pressed Mustard Oil",
    link: "/category/ghee-oil",
  },
  {
    id: "ajwa-dates",
    image: "/images/banners/banner-ajwa-dates.jpg",
    alt: "মদিনার প্রিমিয়াম ভিআইপি আজওয়া খেজুর - Premium Madinah VIP Ajwa Dates",
    link: "/category/dates",
  },
  {
    id: "combo-pack",
    image: "/images/banners/banner-combo-pack.jpg",
    alt: "সুন্নাহ স্পেশাল হেলথ কম্বো প্যাক - Sunnah Special Health Booster Combo Package",
    link: "/combos",
  },
];

const TWIN_PROMOS = [
  {
    id: "promo-combo",
    image: "/images/banners/promo-combo.jpg",
    alt: "সুন্নাহ স্পেশাল কম্বো অফার - Sunnah Special Combo Offer",
    link: "/combos",
  },
  {
    id: "promo-honey",
    image: "/images/banners/promo-honey.jpg",
    alt: "১০০% খাঁটি সুন্দরবনের কাঁচা মধু - 100% Pure Wild Raw Honey",
    link: "/category/honey",
  },
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Dragging & Swipe States
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [diffX, setDiffX] = useState(0);

  // Synchronous refs for drag tracking & link click prevention
  const isPointerDownRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? MAIN_BANNERS.length - 1 : prev - 1));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === MAIN_BANNERS.length - 1 ? 0 : prev + 1));
  }, []);

  // Auto-advance every 4.5 seconds (resets on slide change or manual drag)
  useEffect(() => {
    if (isPaused || isDragging) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isDragging, currentIndex, nextSlide]);

  // Mouse Drag Events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only main left click
    setIsPaused(true);
    isPointerDownRef.current = true;
    dragStartXRef.current = e.clientX;
    dragDistanceRef.current = 0;
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setDiffX(0);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPointerDownRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    dragDistanceRef.current = Math.abs(delta);
    setCurrentX(e.clientX);
    setDiffX(delta);
  };

  const handleMouseUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);
    setIsPaused(false);

    const delta = diffX;
    // Swipe threshold: 40px
    if (delta < -40) {
      nextSlide();
    } else if (delta > 40) {
      prevSlide();
    }

    setDiffX(0);

    // Keep distance briefly to prevent link navigation, then reset
    setTimeout(() => {
      dragDistanceRef.current = 0;
    }, 120);
  };

  const handleMouseLeave = () => {
    if (isPointerDownRef.current) {
      handleMouseUp();
    } else {
      setIsPaused(false);
    }
  };

  // Touch Swipe Events
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    const clientX = e.targetTouches[0].clientX;
    isPointerDownRef.current = true;
    dragStartXRef.current = clientX;
    dragDistanceRef.current = 0;
    setStartX(clientX);
    setCurrentX(clientX);
    setDiffX(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPointerDownRef.current) return;
    const clientX = e.targetTouches[0].clientX;
    const delta = clientX - dragStartXRef.current;
    dragDistanceRef.current = Math.abs(delta);
    setCurrentX(clientX);
    setDiffX(delta);
  };

  const handleTouchEnd = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);
    setIsPaused(false);

    const delta = diffX;
    // Swipe threshold: 40px
    if (delta < -40) {
      nextSlide();
    } else if (delta > 40) {
      prevSlide();
    }

    setDiffX(0);

    setTimeout(() => {
      dragDistanceRef.current = 0;
    }, 120);
  };

  return (
    <section
      aria-label="Sunnah Source Hero Graphic Banners"
      className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 sm:py-5 font-bengali"
    >
      {/* Sunnah Royal Split Grid: 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5 items-stretch">
        {/* Left Column: Pure Graphic Main Carousel (Takes lg:col-span-8 - 67% width) */}
        <div
          className="lg:col-span-8 relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md group h-[230px] xs:h-[260px] sm:h-[340px] md:h-[400px] lg:h-[430px] xl:h-[460px] select-none bg-stone-900 border border-charcoal-200/50 cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Horizontal Sliding Banner Track with Smooth Follow & Snap Animation */}
          <div
            className={`flex h-full will-change-transform ${
              isDragging
                ? "transition-none"
                : "transition-transform duration-700 ease-out"
            }`}
            style={{
              transform: isDragging
                ? `translateX(calc(-${currentIndex * 100}% + ${diffX}px))`
                : `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {MAIN_BANNERS.map((slide, idx) => (
              <Link
                key={slide.id}
                href={slide.link}
                prefetch={true}
                draggable={false}
                tabIndex={currentIndex === idx ? 0 : -1}
                aria-label={slide.alt}
                onClick={(e) => {
                  // Prevent accidental link navigation if user dragged more than 6px
                  if (dragDistanceRef.current > 6) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onDragStart={(e) => e.preventDefault()}
                className="w-full h-full shrink-0 relative block overflow-hidden"
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  draggable={false}
                  priority={idx === 0}
                  sizes="(max-width: 1024px) 100vw, 68vw"
                  className="object-cover rounded-2xl sm:rounded-3xl transition-transform duration-500 ease-out hover:scale-[1.01] pointer-events-none select-none"
                />
              </Link>
            ))}
          </div>

          {/* Sleek Circular Navigation Arrows with Glow */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous Banner"
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-md cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:shadow-emerald-500/30 hover:border-emerald-400"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next Banner"
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-md cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:shadow-emerald-500/30 hover:border-emerald-400"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Bottom Pagination Indicators (Smooth Active Pill Dot) */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm pointer-events-auto">
            {MAIN_BANNERS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? "w-6 sm:w-7 h-2 sm:h-2.5 bg-accent-amber shadow-xs"
                    : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Twin Pure Graphic Promo Cards (Takes lg:col-span-4 - 33% width) */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5 sm:gap-4 lg:gap-4 h-full justify-between">
          {TWIN_PROMOS.map((promo) => (
            <Link
              key={promo.id}
              href={promo.link}
              prefetch={true}
              draggable={false}
              aria-label={promo.alt}
              onDragStart={(e) => e.preventDefault()}
              className="group relative flex-1 w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-charcoal-200/60 hover:border-emerald-500/40 min-h-[155px] xs:min-h-[175px] sm:min-h-[195px] lg:min-h-0 block bg-stone-900"
            >
              <Image
                src={promo.image}
                alt={promo.alt}
                fill
                draggable={false}
                sizes="(max-width: 1024px) 100vw, 34vw"
                className="object-cover rounded-2xl sm:rounded-3xl transition-transform duration-300 group-hover:scale-[1.02] pointer-events-none select-none"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
