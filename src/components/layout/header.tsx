"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Heart, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";

export const Header: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openDrawer = useCartStore((state) => state.openDrawer);
  const cartCount = useCartStore((state) =>
    typeof state.getItemCount === "function"
      ? state.getItemCount()
      : state.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
  );
  const wishlistCount = useWishlistStore((state) => state.items?.length ?? 0);

  // Avoid hydration mismatch between server HTML and localStorage-backed client stores
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCartCount = mounted ? cartCount : 0;
  const displayWishlistCount = mounted ? wishlistCount : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Routes safely to the existing homepage with query param and anchor
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}#products`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-border shadow-subtle font-bengali">
      <div className="container mx-auto px-4 max-w-7xl h-18 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger & Typographic Brand Mark */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-charcoal-700 hover:text-brand-700 rounded-lg transition-colors"
            aria-label={isMobileMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link
            href="/"
            className="flex flex-col text-left group shrink-0"
            aria-label="SUNNAH SOURCE Homepage"
          >
            <span className="font-extrabold text-lg sm:text-xl tracking-tight leading-none text-charcoal-900 font-sans group-hover:text-brand-800 transition-colors">
              SUNNAH SOURCE
            </span>
            <span className="text-[9px] tracking-widest uppercase font-semibold font-sans text-brand-700 mt-0.5">
              Pure & Natural
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation (Only verified, existing routes) */}
        <nav
          aria-label="Main Navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-semibold text-charcoal-700"
        >
          <Link href="/" className="hover:text-brand-700 transition-colors">
            হোম
          </Link>
          <Link href="/#products" className="hover:text-brand-700 transition-colors">
            পণ্যসমূহ
          </Link>
          <Link href="/#categories" className="hover:text-brand-700 transition-colors">
            ক্যাটাগরি
          </Link>
        </nav>

        {/* Center-Right: Desktop Search Input */}
        <form
          role="search"
          onSubmit={handleSearch}
          className="hidden md:flex relative flex-1 max-w-xs"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="খাঁটি মধু, ঘি, তেল দিয়ে খুঁজুন..."
            className="w-full h-10 pl-9 pr-3 text-xs bg-surface-canvas rounded-xl border border-surface-border focus:bg-white focus:border-brand-700 focus:outline-none transition-colors"
            aria-label="পণ্য খুঁজুন"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-charcoal-500 pointer-events-none" />
        </form>

        {/* Right: User Actions (Wishlist Counter & Cart Drawer Trigger) */}
        <div className="flex items-center gap-2">
          {/* Wishlist Indicator (Directs to products on the verified root route) */}
          <Link
            href="/#products"
            className="relative p-2 text-charcoal-700 hover:text-brand-700 rounded-lg transition-colors"
            aria-label="পছন্দের তালিকা"
            title="পছন্দের তালিকা"
          >
            <Heart className="w-5 h-5" />
            {displayWishlistCount > 0 && (
              <span className="absolute top-1 right-1 bg-accent-amber text-white font-mono text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-xs">
                {displayWishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Drawer Trigger (Interactive button; triggers drawer component without page route) */}
          <button
            type="button"
            onClick={openDrawer}
            className="relative p-2 text-charcoal-700 hover:text-brand-700 rounded-lg flex items-center gap-2 transition-colors"
            aria-label="কার্ট খুলুন"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-brand-700" />
              {displayCartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-700 text-white font-mono text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                  {displayCartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:block text-xs font-bold text-brand-700">কার্ট</span>
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu (Only verified, existing routes) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-border bg-white px-4 py-4 space-y-3 font-bengali">
          <form role="search" onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              className="w-full h-10 pl-9 pr-3 text-xs bg-surface-canvas rounded-xl border border-surface-border focus:bg-white focus:border-brand-700 focus:outline-none"
              aria-label="মোবাইল সার্চ"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-charcoal-500 pointer-events-none" />
          </form>
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-2 text-sm font-semibold text-charcoal-700 pt-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-brand-700 transition-colors"
            >
              হোম
            </Link>
            <Link
              href="/#products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-brand-700 transition-colors"
            >
              পণ্যসমূহ
            </Link>
            <Link
              href="/#categories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-brand-700 transition-colors"
            >
              ক্যাটাগরি
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
