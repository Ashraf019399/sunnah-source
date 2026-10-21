"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ChevronRight,
  ArrowRight,
  Sparkles,
  Package,
  Heart,
} from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { formatBDT, toBanglaDigits } from "@/lib/utils";
import Image from "next/image";

interface NavItem {
  label: string;
  labelBn?: string;
  href: string;
  categorySlug?: string;
  hasMegaMenu?: boolean;
  alignRight?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", labelBn: "হোম", href: "/" },
  { label: "Shop", labelBn: "সকল পণ্য", href: "/shop" },
  {
    label: "Raw Honey",
    labelBn: "খাঁটি মধু",
    href: "/category/honey",
    categorySlug: "honey",
    hasMegaMenu: true,
  },
  {
    label: "Ghee & Oils",
    labelBn: "ঘি ও তেল",
    href: "/category/ghee-oil",
    categorySlug: "ghee-oil",
    hasMegaMenu: true,
  },
  {
    label: "Dates",
    labelBn: "খেজুর",
    href: "/category/dates",
    categorySlug: "dates",
    hasMegaMenu: true,
  },
  {
    label: "Organic Seeds",
    labelBn: "বীজ ও সুপারফুড",
    href: "/category/organic-seeds",
    categorySlug: "organic-seeds",
    hasMegaMenu: true,
  },
  {
    label: "Combos",
    labelBn: "কম্বো অফার",
    href: "/combos",
    categorySlug: "combos",
    hasMegaMenu: true,
    alignRight: true,
  },
];

export const Header: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const desktopSearchRef = useRef<HTMLFormElement>(null);
  const mobileSearchRef = useRef<HTMLFormElement>(null);

  const openDrawer = useCartStore((state) => state.openDrawer);
  const cartCount = useCartStore((state) =>
    typeof state.getItemCount === "function"
      ? state.getItemCount()
      : state.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
  );

  const wishlistCount = useWishlistStore((state) => state.items?.length ?? 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter ALL_PRODUCTS in real-time
  const matchingProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return ALL_PRODUCTS.filter((product) => {
      const titleBn = (product.titleBn || "").toLowerCase();
      const titleEn = (product.titleEn || "").toLowerCase();
      const shortDesc = (product.shortDescriptionBn || "").toLowerCase();
      const catSlug = (product.categorySlug || "").toLowerCase();

      return (
        titleBn.includes(query) ||
        titleEn.includes(query) ||
        shortDesc.includes(query) ||
        catSlug.includes(query)
      );
    }).slice(0, 6);
  }, [searchQuery]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktop = desktopSearchRef.current?.contains(target);
      const inMobile = mobileSearchRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const displayCartCount = mounted ? cartCount : 0;
  const displayWishlistCount = mounted ? wishlistCount : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const renderSearchDropdown = () => {
    if (!isSearchOpen || !searchQuery.trim()) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-surface-border/80 ring-1 ring-black/5 overflow-hidden z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
        {matchingProducts.length > 0 ? (
          <div>
            <div className="text-xs font-bold text-charcoal-500 px-3 py-1.5 flex items-center justify-between border-b border-stone-100/90 pb-2">
              <span>পণ্যসমূহ ({toBanglaDigits(matchingProducts.length)}টি ফলাফল)</span>
              <div className="flex items-center gap-1.5 text-[10px] text-charcoal-400 font-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>তাৎক্ষণিক অনুসন্ধান</span>
              </div>
            </div>

            <div className="divide-y divide-stone-100/90 py-1">
              {matchingProducts.map((product) => {
                const defaultVariant =
                  product.variants?.find((v) => v.isDefault) || product.variants?.[0];
                const displayPrice = defaultVariant
                  ? defaultVariant.salePrice ?? defaultVariant.regularPrice
                  : 0;
                const mainImage = product.images?.[0] || "/images/hero-honey.png";
                const category = CATEGORIES_DATA.find((c) => c.slug === product.categorySlug);
                const subtitle = category?.nameBn || product.titleEn;

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    prefetch={true}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="group flex items-center justify-between p-2.5 hover:bg-brand-50/80 rounded-xl transition-all cursor-pointer"
                  >
                    {/* Left Section: Thumbnail + Titles */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <div className="w-11 h-11 rounded-xl object-cover border border-surface-border/60 bg-surface-canvas shrink-0 relative overflow-hidden">
                        <Image
                          src={mainImage}
                          alt={product.titleBn}
                          fill
                          sizes="44px"
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized={mainImage.startsWith("/")}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-charcoal-900 group-hover:text-brand-800 transition-colors truncate">
                          {product.titleBn}
                        </h4>
                        <p className="text-[10px] text-charcoal-400 font-medium truncate font-sans mt-0.5">
                          {subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Right Section: Price + Badges + Arrow Indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      {product.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200/50 shrink-0">
                          {product.badge}
                        </span>
                      )}
                      <span className="font-mono text-xs font-black text-brand-700 shrink-0">
                        {formatBDT(displayPrice)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-brand-700 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link
              href={`/shop?q=${encodeURIComponent(searchQuery.trim())}`}
              prefetch={true}
              onClick={() => {
                setIsSearchOpen(false);
                setIsMobileMenuOpen(false);
              }}
              className="group flex items-center justify-center gap-1 text-center py-2.5 px-3 mt-1 text-xs font-bold text-brand-800 hover:bg-stone-50 rounded-xl border-t border-surface-border/60 transition-colors"
            >
              <span>সব ফলাফল দেখুন (&apos;{searchQuery.trim()}&apos;)</span>
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        ) : (
          <div className="p-4 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 text-charcoal-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-charcoal-800">
                দুঃখিত, &ldquo;{searchQuery.trim()}&rdquo; সম্পর্কিত কোনো পণ্য পাওয়া যায়নি
              </p>
              <p className="text-[11px] text-charcoal-500">
                নিচের জনপ্রিয় পণ্যগুলো দেখতে পারেন:
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {["মধু", "গাওয়া ঘি", "আজওয়া খেজুর", "সরিষার তেল", "কালোজিরা"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    setIsSearchOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-semibold hover:bg-brand-100 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
            ref={desktopSearchRef}
            role="search"
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl relative items-center w-full h-11 bg-white hover:bg-stone-50/50 focus-within:bg-white rounded-full border border-stone-300 focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/20 transition-all shadow-xs"
          >
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="খাঁটি মধু, ঘি, তেল ও অর্গানিক খাদ্য খুঁজুন..."
              className="w-full h-full bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm text-charcoal-900 placeholder:text-stone-400 pl-11 pr-11 rounded-full"
              aria-label="পণ্য খুঁজুন"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="মুছে ফেলুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {renderSearchDropdown()}
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

            {/* Item 2: Wishlist */}
            <Link
              href="/wishlist"
              prefetch={true}
              className="flex flex-col items-center justify-center gap-0.5 text-charcoal-700 hover:text-rose-600 transition-colors"
              title="পছন্দের তালিকা"
              aria-label="Wishlist"
            >
              <div className="relative">
                <Heart className="w-5 h-5" />
                {displayWishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {displayWishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold tracking-tight">Wishlist</span>
            </Link>

            {/* Item 3: Shopping Cart */}
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
                    href="/account/orders"
                    prefetch={true}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-charcoal-700 hover:bg-brand-50 hover:text-brand-700 transition-colors font-medium"
                  >
                    <Package className="w-4 h-4 text-brand-700" />
                    <span>আমার অর্ডারসমূহ</span>
                  </Link>
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

      {/* 2. Secondary Navigation Bar with Category Mega Menu */}
      <nav
        aria-label="Secondary Navigation"
        className="hidden lg:block bg-brand-900 border-b border-brand-800 text-stone-200 text-xs font-semibold"
      >
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between">
          <ul className="flex items-center gap-1 xl:gap-2 py-1.5">
            {NAV_ITEMS.map((item) => {
              const category = item.categorySlug
                ? CATEGORIES_DATA.find((c) => c.slug === item.categorySlug)
                : null;
              const categoryProducts = item.categorySlug
                ? ALL_PRODUCTS.filter(
                    (p) =>
                      p.categorySlug === item.categorySlug ||
                      (item.categorySlug === "combos" && p.isCombo)
                  )
                : [];

              return (
                <li key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    prefetch={true}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-stone-200 hover:text-accent-amber hover:bg-brand-800/80 transition-colors whitespace-nowrap"
                  >
                    <span>{item.label}</span>
                    {item.hasMegaMenu && (
                      <ChevronDown className="w-3 h-3 text-stone-400 group-hover:rotate-180 group-hover:text-accent-amber transition-transform duration-200" />
                    )}
                  </Link>

                  {/* Desktop Hover Mega Menu Dropdown */}
                  {item.hasMegaMenu && category && (
                    <div
                      className={`absolute top-full ${
                        item.alignRight ? "right-0" : "left-0"
                      } pt-1.5 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto w-[460px] sm:w-[500px]`}
                    >
                      <div className="bg-white rounded-2xl shadow-2xl border border-surface-border p-4 text-charcoal-900 font-bengali">
                        {/* Header Bar */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-700" />
                            <h4 className="text-sm font-bold text-charcoal-900">
                              {category.nameBn}
                            </h4>
                            <span className="text-[11px] text-charcoal-400 font-sans">
                              ({category.nameEn})
                            </span>
                          </div>
                          <Link
                            href={item.href}
                            prefetch={true}
                            className="text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1 group/link"
                          >
                            <span>সব দেখুন</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                          </Link>
                        </div>

                        {/* Product Grid (2 Columns) */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {categoryProducts.slice(0, 4).map((product) => {
                            const defaultVariant =
                              product.variants.find((v) => v.isDefault) || product.variants[0];
                            const displayPrice = defaultVariant
                              ? defaultVariant.salePrice ?? defaultVariant.regularPrice
                              : 0;
                            const regularPrice = defaultVariant?.regularPrice;
                            const hasDiscount =
                              defaultVariant?.salePrice &&
                              defaultVariant.regularPrice > defaultVariant.salePrice;
                            const mainImage = product.images?.[0] || "/images/hero-honey.png";

                            return (
                              <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                prefetch={true}
                                className="flex items-center gap-2.5 p-2 rounded-xl border border-surface-border/60 hover:border-brand-300 hover:bg-brand-50/50 transition-all group/item bg-white"
                              >
                                <div className="w-13 h-13 rounded-lg overflow-hidden border border-surface-border shrink-0 bg-surface-canvas relative">
                                  <Image
                                    src={mainImage}
                                    alt={product.titleBn}
                                    width={52}
                                    height={52}
                                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                                    unoptimized={mainImage.startsWith("/")}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-bold text-charcoal-800 line-clamp-1 group-hover/item:text-brand-700 transition-colors">
                                    {product.titleBn}
                                  </h5>
                                  <p className="text-[10px] text-charcoal-400 font-sans mt-0.5 line-clamp-1">
                                    {defaultVariant?.displayName || product.badge || "১০০% খাঁটি"}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-xs font-bold text-brand-700 font-mono">
                                      ৳{displayPrice}
                                    </span>
                                    {hasDiscount && (
                                      <span className="text-[10px] text-charcoal-400 line-through font-mono">
                                        ৳{regularPrice}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>

                        {/* Category Purity Promise Strip */}
                        {category.purityPromiseBn && (
                          <div className="mt-3 pt-2.5 border-t border-surface-border/60 flex items-center gap-2 text-[11px] text-charcoal-600 bg-surface-canvas/60 px-3 py-1.5 rounded-lg">
                            <Sparkles className="w-3.5 h-3.5 text-accent-amber shrink-0" />
                            <span className="line-clamp-1 font-medium">{category.purityPromiseBn}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <span className="text-[11px] text-stone-300 font-sans">হটলাইন: ০১৯১৪-৬১২০০৭</span>
        </div>
      </nav>

      {/* 3. Mobile Collapsible Navigation Menu with Category Accordion */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-border bg-white px-4 py-4 space-y-3 font-bengali">
          <form
            ref={mobileSearchRef}
            role="search"
            onSubmit={handleSearch}
            className="relative flex items-center w-full h-11 bg-white hover:bg-stone-50/50 focus-within:bg-white rounded-full border border-stone-300 focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/20 transition-all shadow-xs"
          >
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="খাঁটি মধু, ঘি, তেল ও অর্গানিক খাদ্য খুঁজুন..."
              className="w-full h-full bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm text-charcoal-900 placeholder:text-stone-400 pl-11 pr-11 rounded-full"
              aria-label="মোবাইল সার্চ"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="মুছে ফেলুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {renderSearchDropdown()}
          </form>
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1 text-sm font-semibold text-charcoal-700 pt-2">
            {NAV_ITEMS.map((item) => {
              const category = item.categorySlug
                ? CATEGORIES_DATA.find((c) => c.slug === item.categorySlug)
                : null;
              const categoryProducts = item.categorySlug
                ? ALL_PRODUCTS.filter(
                    (p) =>
                      p.categorySlug === item.categorySlug ||
                      (item.categorySlug === "combos" && p.isCombo)
                  )
                : [];
              const isExpanded = expandedMobileCategory === item.categorySlug;

              if (item.hasMegaMenu && category && categoryProducts.length > 0) {
                return (
                  <div key={item.label} className="border-b border-surface-border/60 pb-1">
                    <div className="flex items-center justify-between">
                      <Link
                        href={item.href}
                        prefetch={true}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="py-2 px-2 text-sm font-bold text-charcoal-800 hover:text-brand-700 flex items-center gap-2 flex-1"
                      >
                        <span>{category.nameBn}</span>
                        <span className="text-[11px] text-charcoal-400 font-sans font-normal">
                          ({item.label})
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMobileCategory(isExpanded ? null : item.categorySlug!)
                        }
                        className="p-2 text-charcoal-500 hover:text-brand-700 transition-colors"
                        aria-label="ক্যাটাগরি পণ্য দেখুন"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-brand-700" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="pl-2 pr-1 py-2 space-y-2 bg-surface-canvas/50 rounded-xl mb-2">
                        {categoryProducts.slice(0, 3).map((prod) => {
                          const v = prod.variants.find((x) => x.isDefault) || prod.variants[0];
                          const price = v ? v.salePrice ?? v.regularPrice : 0;
                          const img = prod.images?.[0] || "/images/hero-honey.png";
                          return (
                            <Link
                              key={prod.id}
                              href={`/product/${prod.slug}`}
                              prefetch={true}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 p-1.5 rounded-lg bg-white border border-surface-border/70 hover:border-brand-300"
                            >
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-surface-canvas shrink-0">
                                <Image
                                  src={img}
                                  alt={prod.titleBn}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  unoptimized={img.startsWith("/")}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-charcoal-800 line-clamp-1">
                                  {prod.titleBn}
                                </p>
                                <span className="text-xs font-bold text-brand-700 font-mono">
                                  ৳{price}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                        <Link
                          href={item.href}
                          prefetch={true}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-brand-700 hover:underline pt-1"
                        >
                          <span>সব দেখুন ({category.nameBn})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 px-2 rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors text-sm font-bold text-charcoal-800"
                >
                  {item.labelBn || item.label}
                </Link>
              );
            })}
            <div className="pt-3 mt-1 border-t border-surface-border flex flex-col gap-2">
              <Link
                href="/wishlist"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between py-1 text-xs font-bold text-charcoal-800 hover:text-rose-600 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>আমার পছন্দের তালিকা</span>
                </div>
                {displayWishlistCount > 0 && (
                  <span className="bg-rose-100 text-rose-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {displayWishlistCount}টি
                  </span>
                )}
              </Link>
              <Link
                href="/account/orders"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-1 text-xs font-bold text-charcoal-800 hover:text-brand-700 transition-colors"
              >
                <Package className="w-4 h-4 text-brand-700" />
                <span>আমার অর্ডারসমূহ</span>
              </Link>
              <div className="flex gap-4 text-xs font-normal text-charcoal-500 pt-1 border-t border-surface-border/50">
                <Link href="/track-order" prefetch={true} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-700">
                  Track Order
                </Link>
                <Link href="/admin/login" prefetch={true} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-700">
                  Sign In
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
