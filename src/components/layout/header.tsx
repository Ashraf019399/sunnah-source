"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  Truck,
  User,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/#products", hasChevron: true },
  { label: "Raw Honey", href: "/?q=honey#products", hasChevron: true },
  { label: "Ghee", href: "/?q=ghee#products" },
  { label: "Oil", href: "/?q=oil#products" },
  { label: "Dates", href: "/?q=dates#products" },
  { label: "Nuts & Seeds", href: "/?q=seeds#products" },
  { label: "Spices", href: "/?q=spices#products" },
  { label: "Combos", href: "/?q=combos#products", hasChevron: true },
  { label: "Offers", href: "/#products" },
];

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
  const subtotal = useCartStore((state) =>
    typeof state.getSubtotal === "function"
      ? state.getSubtotal()
      : state.items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) ?? 0
  );
  const wishlistCount = useWishlistStore((state) => state.items?.length ?? 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCartCount = mounted ? cartCount : 0;
  const displaySubtotal = mounted ? subtotal : 0;
  const displayWishlistCount = mounted ? wishlistCount : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}#products`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full font-bengali shadow-subtle">
      {/* 1. Main Header */}
      <div className="bg-white border-b border-surface-border">
        <div className="container mx-auto px-4 max-w-7xl h-18 flex items-center justify-between gap-4 lg:gap-8">
          {/* Left: Mobile Menu & Logo */}
          <div className="flex items-center gap-3 shrink-0">
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
              className="inline-flex items-center shrink-0 group"
              aria-label="Sunnah Source"
            >
              <Image
                src="/images/logo.svg"
                alt="Sunnah Source"
                width={145}
                height={148}
                priority
                unoptimized
                className="w-28 sm:w-32 md:w-[145px] h-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Center: Large Modern Search Bar */}
          <form
            role="search"
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="খাঁটি মধু, ঘি, তেল ও অর্গানিক খাদ্য খুঁজুন..."
              className="w-full h-11 pl-10 pr-4 text-xs xl:text-sm bg-surface-canvas rounded-full border border-surface-border focus:bg-white focus:border-brand-700 focus:outline-none transition-colors"
              aria-label="পণ্য খুঁজুন"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-charcoal-500 pointer-events-none" />
          </form>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              href="/#track-order"
              className="hidden lg:flex items-center gap-1.5 text-xs text-charcoal-700 hover:text-brand-700 transition-colors"
              title="অর্ডার ট্র্যাক"
            >
              <Truck className="w-4 h-4" />
              <span className="hidden xl:inline">Track Order</span>
            </Link>

            <Link
              href="/#account"
              className="hidden lg:flex items-center gap-1.5 text-xs text-charcoal-700 hover:text-brand-700 transition-colors"
              title="লগইন / অ্যাকাউন্ট"
            >
              <User className="w-4 h-4" />
              <span className="hidden xl:inline">Sign In</span>
            </Link>

            <Link
              href="/#products"
              className="relative p-2 text-charcoal-700 hover:text-brand-700 transition-colors"
              title="পছন্দের তালিকা"
            >
              <Heart className="w-5 h-5" />
              {displayWishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-accent-amber text-white font-mono text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {displayWishlistCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={openDrawer}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100/80 border border-brand-200/80 rounded-xl text-brand-700 transition-all cursor-pointer"
              aria-label="কার্ট খুলুন"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {displayCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-700 text-white font-mono text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                    {displayCartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left text-xs leading-none">
                <span className="text-[10px] text-charcoal-500 block">কার্ট</span>
                <span className="font-bold text-brand-700 font-mono">৳{displaySubtotal}</span>
              </div>
            </button>

            <div className="hidden lg:block relative group">
              <button
                type="button"
                className="p-2 text-charcoal-700 hover:text-brand-700 rounded-lg transition-colors"
                aria-label="আরও মেনু"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              <div className="hidden group-hover:block absolute right-0 top-full pt-1 w-44 z-50">
                <div className="bg-white rounded-xl shadow-card border border-surface-border p-2 text-xs space-y-1">
                  <Link href="/#track-order" className="block px-2.5 py-1.5 rounded hover:bg-brand-50 hover:text-brand-700">
                    ট্র্যাক অর্ডার
                  </Link>
                  <Link href="/#categories" className="block px-2.5 py-1.5 rounded hover:bg-brand-50 hover:text-brand-700">
                    ক্যাটাগরি
                  </Link>
                  <div className="px-2.5 py-1 text-charcoal-500 border-t border-surface-border text-[11px]">
                    হেল্প: ০১৯১৪-৬১২০০৭
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Secondary Navigation Bar */}
      <nav
        aria-label="Secondary Navigation"
        className="hidden lg:block bg-brand-900 border-b border-brand-800 text-stone-200 text-xs font-semibold"
      >
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between">
          <ul className="flex items-center gap-1 xl:gap-2 py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-stone-200 hover:text-accent-amber hover:bg-brand-800/80 transition-colors whitespace-nowrap"
                >
                  <span>{item.label}</span>
                  {item.hasChevron && <ChevronDown className="w-3 h-3 text-stone-400" />}
                </Link>
              </li>
            ))}
          </ul>
          <span className="text-[11px] text-stone-300 font-sans">হটলাইন: ০১৯১৪-৬১২০০৭</span>
        </div>
      </nav>

      {/* 3. Mobile Collapsible Navigation Menu */}
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
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1 text-sm font-semibold text-charcoal-700 pt-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-1 border-t border-surface-border flex gap-4 text-xs font-normal text-charcoal-500">
              <Link href="/#track-order" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-700">
                Track Order
              </Link>
              <Link href="/#account" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-700">
                Sign In
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
