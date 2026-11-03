"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

interface ScrollToTopProps {
  /** Optional custom Tailwind classes to override or augment positioning */
  className?: string;
  /** Scroll distance in pixels before the button appears (default: 300) */
  threshold?: number;
}

/**
 * ScrollToTop - Elegant, smooth "Back to Top" floating button for Sunnah Source.
 * Inspired by top Bangladeshi e-commerce stores (e.g. Ghorer Bazar).
 *
 * Features:
 * - Throttled passive scroll listener using requestAnimationFrame for 60/120fps performance.
 * - Smooth fade-and-scale entrance when scrollY >= 300px.
 * - Sunnah Source luxury emerald (#1B4D2E) with warm amber (#D48B28) hover glow accents.
 * - Modern squircle shape with crisp upward arrow micro-interaction.
 * - Mobile-safe non-colliding positioning above Floating WhatsApp and mobile bottom nav.
 * - Hidden automatically on print / invoice media.
 */
export function ScrollToTop({
  className = "",
  threshold = 300,
}: ScrollToTopProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY =
            window.scrollY || document.documentElement.scrollTop || 0;
          setIsVisible(currentScrollY >= threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Passive listener for maximum smooth scrolling performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial scroll position on mount
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  // Suppress on invoice print view
  if (pathname?.startsWith("/admin/invoice")) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-36 right-5 sm:bottom-24 sm:right-6 md:bottom-28 md:right-7 z-40 print:hidden transition-all duration-300 ease-out ${
        isVisible
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto visible"
          : "opacity-0 scale-75 translate-y-3 pointer-events-none invisible"
      } ${className}`}
      aria-hidden={!isVisible}
    >
      <button
        type="button"
        onClick={scrollToTop}
        tabIndex={isVisible ? 0 : -1}
        aria-label="পৃষ্ঠার শুরুতে ফিরে যান (Scroll to top)"
        title="উপরে যান"
        className="group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1B4D2E] hover:bg-[#143C23] text-white border border-brand-600/40 hover:border-[#D48B28] shadow-lg shadow-brand-950/25 hover:shadow-xl hover:shadow-[#D48B28]/25 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D48B28] focus-visible:ring-offset-2"
      >
        {/* Subtle glass reflection highlight */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/5 to-white/15 pointer-events-none"
        />

        {/* Warm amber micro-interaction glow on hover */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl bg-[#D48B28]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        />

        {/* Crisp upward arrow icon with subtle hover lift */}
        <ArrowUp
          className="w-5 h-5 sm:w-6 sm:h-6 text-brand-50 group-hover:text-amber-200 group-hover:-translate-y-0.5 transition-all duration-200 stroke-[2.5]"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export default ScrollToTop;

