"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Truck,
  Menu,
  X,
  User,
  Phone,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
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
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCartCount = mounted ? cartCount : 0;

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
              prefetch={true}
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

          {/* Right: Actions (Vertical Stack Layout) */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Item 1: Order Track */}
            <Link
              href="/track-order"
              prefetch={true}
              className="flex flex-col items-center justify-center gap-0.5 text-charcoal-700 hover:text-brand-700 transition-colors"
              title="Order Track"
            >
              <Truck className="w-5 h-5" />
              <span className="text-[11px] font-semibold tracking-tight">Order Track</span>
            </Link>

            {/* Item 2: Shopping Cart */}
            <button
              type="button"
              onClick={openDrawer}
              className="flex flex-col items-center justify-center gap-0.5 text-charcoal-700 hover:text-brand-700 transition-colors cursor-pointer"
              aria-label="Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {displayCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-charcoal-900 font-mono text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {displayCartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold tracking-tight">Cart</span>
            </button>

            {/* Item 3: More (Dropdown) */}
            <div className="relative group">
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-0.5 text-charcoal-700 hover:text-brand-700 transition-colors cursor-pointer"
                aria-label="More"
              >
                <Menu className="w-5 h-5" />
                <span className="text-[11px] font-semibold tracking-tight">More</span>
              </button>
              <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-2 text-xs space-y-1">
                  <Link
                    href="/admin/login"
                    prefetch={true}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-charcoal-700 hover:bg-brand-50 hover:text-brand-700 transition-colors font-medium"
                  >
                    <User className="w-4 h-4 text-charcoal-500" />
                    <span>Sign In / Admin</span>
                  </Link>
                  <a
                    href="https://wa.me/8801914612007"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-charcoal-700 hover:bg-brand-50 hover:text-brand-700 transition-colors font-medium"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Support</span>
                  </a>
                  <a
                    href="tel:01914612007"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-charcoal-700 hover:bg-brand-50 hover:text-brand-700 transition-colors font-medium"
                  >
                    <Phone className="w-4 h-4 text-brand-700" />
                    <span>Call Us</span>
                  </a>
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
                  prefetch={true}
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
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-1 border-t border-surface-border flex gap-4 text-xs font-normal text-charcoal-500">
              <Link href="/track-order" prefetch={true} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-700">
                Track Order
              </Link>
              <Link href="/admin/login" prefetch={true} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-700">
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
