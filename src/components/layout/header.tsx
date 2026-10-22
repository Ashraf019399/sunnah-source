"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Truck,
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
  HelpCircle,
  Info,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { formatBDT, toBanglaDigits } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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

export interface CustomerUser {
  email?: string;
  phone?: string;
  name?: string;
}

export const Header: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const desktopSearchRef = useRef<HTMLFormElement>(null);
  const mobileSearchRef = useRef<HTMLFormElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const openDrawer = useCartStore((state) => state.openDrawer);
  const cartCount = useCartStore((state) =>
    typeof state.getItemCount === "function"
      ? state.getItemCount()
      : state.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
  );

  const rawWishlistCount = useWishlistStore((state) => state.items?.length ?? 0);

  // Initialize and subscribe to Supabase Auth and localStorage phone session
  useEffect(() => {
    setMounted(true);
    const supabase = createClient();

    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUser({
            email: user.email,
            phone: user.phone || user.user_metadata?.phone,
            name: user.user_metadata?.full_name,
          });
          return;
        }
      } catch {
        // Ignore network / supabase error
      }

      if (typeof window !== "undefined") {
        const storedPhone =
          localStorage.getItem("sunnah_customer_phone") ||
          localStorage.getItem("customer_phone");
        const storedProfileRaw = localStorage.getItem("sunnah_customer_profile");
        let storedName: string | undefined = undefined;
        if (storedProfileRaw) {
          try {
            const parsed = JSON.parse(storedProfileRaw);
            storedName = parsed?.name;
          } catch {
            // ignore JSON parse error
          }
        }

        if (storedPhone) {
          setCurrentUser({
            phone: storedPhone,
            name: storedName,
          });
        } else {
          setCurrentUser(null);
        }
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          email: session.user.email,
          phone: session.user.phone || session.user.user_metadata?.phone,
          name: session.user.user_metadata?.full_name,
        });
      } else {
        const storedPhone =
          typeof window !== "undefined"
            ? localStorage.getItem("sunnah_customer_phone") ||
            localStorage.getItem("customer_phone")
            : null;
        if (storedPhone) {
          setCurrentUser({ phone: storedPhone });
        } else {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle Customer Logout
  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("sunnah_customer_phone");
        localStorage.removeItem("customer_phone");
        localStorage.removeItem("sunnah_customer_auth");
        localStorage.removeItem("sunnah_customer_profile");
      }
      setCurrentUser(null);
      setIsAccountOpen(false);
      setIsMobileMenuOpen(false);
      router.push("/login");
    }
  };

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

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktop = desktopSearchRef.current?.contains(target);
      const inMobile = mobileSearchRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setIsSearchOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setIsMoreOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setIsAccountOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsMoreOpen(false);
        setIsAccountOpen(false);
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
  const displayWishlistCount = mounted ? rawWishlistCount : 0;
  const totalItems = displayCartCount;
  const wishlistCount = displayWishlistCount;

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
        <div className="container mx-auto px-4 max-w-7xl py-3 sm:py-3.5 md:py-4 lg:py-5 min-h-[72px] sm:min-h-[78px] lg:min-h-[90px] flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
          {/* Left: Mobile Menu & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 text-charcoal-700 hover:text-brand-700 rounded-lg transition-colors"
              aria-label={isMobileMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="11" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
            <Link
              href="/"
              prefetch={true}
              className="flex items-center shrink-0 py-1 select-none group"
              aria-label="Sunnah Source"
            >
              <Image
                src="/images/logo.svg"
                alt="Sunnah Source"
                width={240}
                height={65}
                priority
                unoptimized
                className="h-11 sm:h-12 lg:h-14 w-auto min-w-[160px] sm:min-w-[180px] max-w-[220px] object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Center: Large Modern Search Bar */}
          <form
            ref={desktopSearchRef}
            role="search"
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl relative items-center w-full h-12 bg-[#F3F4F6] hover:bg-[#EEF0F3] focus-within:bg-white focus:bg-white rounded-full border border-stone-300 focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/20 transition-all shadow-xs"
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
              className="w-full h-full bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 text-sm text-charcoal-900 placeholder:text-stone-400 px-5 pl-11 pr-11 py-3 rounded-full"
              aria-label="পণ্য খুঁজুন"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="মুছে ফেলুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {renderSearchDropdown()}
          </form>

          {/* Desktop Actions - 100% Uniform Font, Weight & Pixel-Perfect Baseline */}
          <div className="hidden md:flex items-center gap-2 sm:gap-2.5 lg:gap-3.5 shrink-0">
            {/* Item 1: Order Track */}
            <Link
              href="/track-order"
              prefetch={true}
              className="flex flex-col items-center justify-center min-w-[46px] lg:min-w-[48px] text-charcoal-700 hover:text-brand-700 transition-colors group cursor-pointer"
              title="অর্ডার ট্র্যাক করুন"
            >
              <Truck className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap">
                Order Track
              </span>
            </Link>

            {/* Item 2: Wishlist */}
            <Link
              href="/wishlist"
              prefetch={true}
              className="flex flex-col items-center justify-center min-w-[46px] lg:min-w-[48px] text-charcoal-700 hover:text-brand-700 transition-colors group cursor-pointer relative"
              title="পছন্দের তালিকা"
            >
              <div className="relative">
                <Heart className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center leading-none shadow-sm">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap">
                Wishlist
              </span>
            </Link>

            {/* Item 3: Cart */}
            <button
              onClick={openDrawer}
              type="button"
              className="flex flex-col items-center justify-center min-w-[46px] lg:min-w-[48px] text-charcoal-700 hover:text-brand-700 transition-colors group cursor-pointer relative"
              title="শপিং কার্ট"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center leading-none shadow-sm">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap">
                Cart
              </span>
            </button>

            {/* Item 4: Dynamic Sign In ↔ Account */}
            {!currentUser ? (
              <Link
                href="/login?redirect=/account"
                prefetch={true}
                className="flex flex-col items-center justify-center min-w-[46px] lg:min-w-[48px] text-charcoal-700 hover:text-brand-700 transition-colors group cursor-pointer"
                title="সাইন ইন / অ্যাকাউন্ট"
              >
                <User className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap">
                  Sign In
                </span>
              </Link>
            ) : (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountOpen((prev) => !prev)}
                  className="flex flex-col items-center justify-center min-w-[46px] lg:min-w-[48px] text-charcoal-700 hover:text-brand-700 transition-colors group cursor-pointer"
                  title="আমার অ্যাকাউন্ট"
                  aria-expanded={isAccountOpen}
                >
                  <div className="relative">
                    <User className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                  </div>
                  <span className="text-[11px] font-normal mt-0.5 leading-none whitespace-nowrap">
                    Account
                  </span>
                </button>

                {/* Account Dropdown Menu */}
                {isAccountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-charcoal-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Customer Identifier Header */}
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
                        লগইন করা অ্যাকাউন্ট
                      </p>
                      {currentUser.name && (
                        <p className="text-xs font-bold text-charcoal-900 truncate mt-0.5">
                          {currentUser.name}
                        </p>
                      )}
                      <p className="text-xs font-medium text-brand-700 truncate mt-0.5 font-mono">
                        {currentUser.phone || currentUser.email || "গ্রাহক"}
                      </p>
                    </div>

                    {/* Navigation Links */}
                    <div className="py-1">
                      <Link
                        href="/account"
                        prefetch={true}
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:text-brand-900 hover:bg-brand-50/70 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand-700" />
                        <span>ড্যাশবোর্ড ওভারভিউ</span>
                      </Link>
                      <Link
                        href="/account/orders"
                        prefetch={true}
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:text-brand-700 hover:bg-brand-50/50 transition-colors"
                      >
                        <Package className="w-4 h-4 text-brand-600" />
                        <span>আমার অর্ডারসমূহ</span>
                      </Link>
                      <Link
                        href="/track-order"
                        prefetch={true}
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:text-brand-700 hover:bg-brand-50/50 transition-colors"
                      >
                        <Truck className="w-4 h-4 text-brand-600" />
                        <span>অর্ডার ট্র্যাক</span>
                      </Link>
                      <Link
                        href="/wishlist"
                        prefetch={true}
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:text-brand-700 hover:bg-brand-50/50 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>পছন্দের তালিকা</span>
                      </Link>
                    </div>

                    {/* Sign Out Action */}
                    <div className="pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 transition-colors text-left cursor-pointer font-medium"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>সাইন আউট / লগআউট</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Item 5: More Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreOpen((prev) => !prev)}
                type="button"
                className="flex flex-col items-center justify-center min-w-[46px] lg:min-w-[48px] text-charcoal-700 hover:text-brand-700 transition-colors group cursor-pointer"
                title="আরও লিঙ্ক"
                aria-expanded={isMoreOpen}
              >
                <svg
                  className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="11" y1="18" x2="21" y2="18" />
                </svg>
                <span className="text-[11px] font-medium tracking-tight mt-0.5 leading-none whitespace-nowrap">
                  More
                </span>
              </button>

              {/* Dropdown Menu */}
              {isMoreOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-charcoal-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href="/about"
                    prefetch={true}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:text-brand-700 hover:bg-brand-50/50 transition-colors"
                  >
                    <Info className="w-4 h-4 text-brand-600" />
                    <span>আমাদের সম্পর্কে</span>
                  </Link>
                  <Link
                    href="/faq"
                    prefetch={true}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:text-brand-700 hover:bg-brand-50/50 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-brand-600" />
                    <span>সাধারণ প্রশ্ন (FAQs)</span>
                  </Link>
                  <Link
                    href="/contact"
                    prefetch={true}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:text-brand-700 hover:bg-brand-50/50 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-brand-600" />
                    <span>যোগাযোগ</span>
                  </Link>
                  <Link
                    href="/track-order"
                    prefetch={true}
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:text-brand-700 hover:bg-brand-50/50 transition-colors border-t border-charcoal-100 mt-1 pt-2"
                  >
                    <Truck className="w-4 h-4 text-brand-600" />
                    <span>অর্ডার ট্র্যাক</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right: Quick Cart */}
          <div className="flex md:hidden items-center shrink-0">
            <button
              onClick={openDrawer}
              type="button"
              className="flex items-center justify-center p-2 text-charcoal-700 hover:text-brand-700 transition-colors relative"
              aria-label="শপিং কার্ট"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center leading-none shadow-sm">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Secondary Navigation Bar with Category Mega Menu */}
      <nav
        aria-label="Secondary Navigation"
        className="hidden lg:block bg-brand-900 border-b border-brand-800 text-stone-200 text-sm font-medium"
      >
        <div className="container mx-auto px-4 max-w-7xl py-3 lg:py-3.5 min-h-[48px] lg:min-h-[50px] flex items-center justify-between">
          <ul className="flex items-center gap-1 xl:gap-2">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-stone-200 hover:text-accent-amber hover:bg-brand-800/80 transition-colors whitespace-nowrap text-sm"
                  >
                    <span>{item.label}</span>
                    {item.hasMegaMenu && (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:rotate-180 group-hover:text-accent-amber transition-transform duration-200" />
                    )}
                  </Link>

                  {/* Desktop Hover Mega Menu Dropdown */}
                  {item.hasMegaMenu && category && (
                    <div
                      className={`absolute top-full ${item.alignRight ? "right-0" : "left-0"
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
          <span className="text-xs text-stone-300 font-sans tracking-wide shrink-0 select-none">
            হটলাইন: ০১৯১৪-৬১২০০৭
          </span>
        </div>
      </nav>

      {/* 3. Mobile Collapsible Navigation Menu with Category Accordion */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-border bg-white px-4 py-4 space-y-3 font-bengali">
          <form
            ref={mobileSearchRef}
            role="search"
            onSubmit={handleSearch}
            className="relative flex items-center w-full h-10 bg-[#F3F4F6] hover:bg-[#EEF0F3] focus-within:bg-white focus:bg-white rounded-full border border-stone-300 focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/20 transition-all shadow-xs"
          >
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="খাঁটি মধু, ঘি, তেল ও অর্গানিক খাদ্য খুঁজুন..."
              className="w-full h-full bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-sm text-charcoal-900 placeholder:text-stone-400 pl-10 pr-10 rounded-full"
              aria-label="মোবাইল সার্চ"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
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
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-brand-700" : ""
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
                href="/account"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-1 text-xs font-bold text-brand-800 hover:text-brand-900 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-700" />
                <span>আমার ড্যাশবোর্ড</span>
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
              <Link
                href="/about"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-1 text-xs font-bold text-charcoal-800 hover:text-brand-700 transition-colors"
              >
                <Info className="w-4 h-4 text-brand-700" />
                <span>About Us</span>
              </Link>
              <Link
                href="/faq"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-1 text-xs font-bold text-charcoal-800 hover:text-brand-700 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-brand-700" />
                <span>Faqs</span>
              </Link>
              <Link
                href="/contact"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-1 text-xs font-bold text-charcoal-800 hover:text-brand-700 transition-colors"
              >
                <Phone className="w-4 h-4 text-brand-700" />
                <span>যোগাযোগ</span>
              </Link>
              {currentUser ? (
                <div className="pt-2 mt-1 border-t border-surface-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-[10px] text-charcoal-400 block font-sans">লগইন করা অ্যাকাউন্ট</span>
                      <span className="font-bold text-brand-800 truncate block font-mono text-xs">
                        {currentUser.name || currentUser.phone || currentUser.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>লগআউট</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs font-normal text-charcoal-500 px-1">
                    <Link
                      href="/account"
                      prefetch={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="hover:text-brand-700 font-semibold text-brand-800"
                    >
                      আমার ড্যাশবোর্ড →
                    </Link>
                    <Link
                      href="/track-order"
                      prefetch={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="hover:text-brand-700"
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs font-normal text-charcoal-500 pt-2 mt-1 border-t border-surface-border/50">
                  <Link
                    href="/track-order"
                    prefetch={true}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:text-brand-700"
                  >
                    Track Order
                  </Link>
                  <Link
                    href="/login"
                    prefetch={true}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:text-brand-700 font-semibold text-brand-800"
                  >
                    সাইন ইন / রেজিস্টার →
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
