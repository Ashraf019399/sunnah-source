"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { formatBDT, toBanglaDigits } from "@/lib/utils";

/**
 * FloatingSideCart
 *
 * A premium, sticky floating tab anchored to the right edge of the viewport.
 * Inspired by Ghorer Bazar / Naturo BD cart tabs — shows item count and total
 * in BDT, and triggers the cart drawer on click.
 *
 * Hidden on: /checkout, /admin/** (keeps those flows clean)
 * Hidden on: mobile screens (lg:hidden mirror) — the mobile bottom nav already handles it
 */
export const FloatingSideCart: React.FC = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Selectors from Zustand cart store
  const items = useCartStore((state) => state.items ?? []);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const getSubtotal = useCartStore((state) => state.getSubtotal);

  // Prevent SSR hydration mismatch — only render after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive counts safely after mount
  const itemCount = mounted
    ? typeof getItemCount === "function"
      ? getItemCount()
      : items.reduce((sum, i) => sum + i.quantity, 0)
    : 0;

  const subtotal = mounted
    ? typeof getSubtotal === "function"
      ? getSubtotal()
      : items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    : 0;

  // Route-based visibility guard
  if (!mounted) return null;
  if (pathname?.startsWith("/checkout")) return null;
  if (pathname?.startsWith("/admin")) return null;

  const hasItems = itemCount > 0;
  const displayCount = itemCount > 99 ? "৯৯+" : toBanglaDigits(itemCount);

  return (
    <>
      {/* Keyframe animations — scoped inline to avoid global CSS pollution */}
      <style>{`
        @keyframes floatingSideCartSlideIn {
          from { opacity: 0; transform: translateY(-50%) translateX(110%); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes floatingSideCartIconPulse {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 0px rgba(212,139,40,0)); }
          50%       { transform: scale(1.18); filter: drop-shadow(0 0 6px rgba(212,139,40,0.7)); }
        }
      `}</style>

      {/* Only visible on large screens — mobile bottom nav handles mobile */}
      <div
        role="complementary"
        aria-label="ভাসমান কার্ট ট্যাব"
        className="hidden lg:flex fixed right-0 top-1/2 z-40 flex-col items-center"
        style={{ transform: "translateY(-50%)" }}
      >
        <button
          type="button"
          id="floating-side-cart-btn"
          onClick={openDrawer}
          aria-label={`কার্ট খুলুন — ${itemCount} টি পণ্য, মোট ${formatBDT(subtotal)}`}
          className="relative group flex flex-col items-center gap-2 px-3 py-5 rounded-l-2xl rounded-r-none cursor-pointer select-none border border-r-0 border-amber-600/30 transition-all duration-300 ease-out hover:-translate-x-1 active:scale-[0.97]"
          style={{
            background: "linear-gradient(180deg, #D48B28 0%, #B2711C 45%, #1B4D2E 100%)",
            boxShadow:
              "-4px 0 24px 0 rgba(0,0,0,0.22), 0 2px 8px 0 rgba(212,139,40,0.18), inset 1px 0 0 rgba(255,255,255,0.10)",
            animation: "floatingSideCartSlideIn 0.45s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          {/* Shopping bag icon with optional pulse when cart has items */}
          <span className="relative flex items-center justify-center">
            <ShoppingBag
              className="w-6 h-6 text-white"
              strokeWidth={2}
              style={
                hasItems
                  ? { animation: "floatingSideCartIconPulse 2.8s ease-in-out infinite" }
                  : undefined
              }
            />

            {/* Item count badge bubble */}
            {hasItems && (
              <span
                className="absolute -top-2.5 -right-3 h-5 min-w-5 px-1 rounded-full bg-white text-[#1B4D2E] font-mono font-black text-[10px] flex items-center justify-center shadow ring-1 ring-amber-400/70 leading-none"
                aria-hidden="true"
              >
                {displayCount}
              </span>
            )}
          </span>

          {/* Hairline divider */}
          <span className="w-7 h-px rounded-full bg-white/20" aria-hidden="true" />

          {/* Vertical item label (Bangla) */}
          <span
            className="font-bengali text-white font-semibold text-[11px] leading-tight tracking-wide"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            aria-hidden="true"
          >
            {hasItems ? `${displayCount} আইটেম` : "০ আইটেম"}
          </span>

          {/* Hairline divider */}
          <span className="w-7 h-px rounded-full bg-white/20" aria-hidden="true" />

          {/* BDT total — vertical */}
          <span
            className="font-mono font-bold text-[11px] leading-tight"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              color: hasItems ? "#FDE68A" : "rgba(255,255,255,0.55)",
            }}
            aria-hidden="true"
          >
            {formatBDT(subtotal)}
          </span>

          {/* Bottom glow accent when items present */}
          {hasItems && (
            <span
              className="absolute inset-0 rounded-l-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, transparent 60%, rgba(212,139,40,0.12) 100%)",
              }}
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </>
  );
};
