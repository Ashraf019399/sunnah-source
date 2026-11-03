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
  PhoneCall,
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
import { useMobileMenuStore } from "@/store/use-mobile-menu-store";
import { useMobileSearchStore } from "@/store/use-mobile-search-store";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { formatBDT, toBanglaDigits } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { MobileNavDrawer } from "./mobile-nav-drawer";

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
    label: "Dry Fruits",
    labelBn: "ড্রাই ফ্রুটস",
    href: "/category/dry-fruits",
    categorySlug: "dry-fruits",
    hasMegaMenu: true,
  },
  {
    label: "Organic Seeds",
    labelBn: "বীজ ও সুপারফুড",
    href: "/category/organic-seeds",
    categorySlug: "organic-seeds",
    hasMegaMenu: true,
    alignRight: true,
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
  const isMobileMenuOpen = useMobileMenuStore((state) => state.isOpen);
  const openMobileMenu = useMobileMenuStore((state) => state.openMenu);
  const closeMobileMenu = useMobileMenuStore((state) => state.closeMenu);
  const openMobileSearch = useMobileSearchStore((state) => state.openSearch);
  const setIsMobileMenuOpen = (val: boolean) => (val ? openMobileMenu() : closeMobileMenu());
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);

  const [mounted, setMounted] = useState(false);

  const desktopSearchRef = useRef<HTMLFormElement>(null);

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

      if (!inDesktop) {
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
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-charcoal-700 hover:text-brand-700 rounded-lg transition-colors"
              aria-label="মেনু খুলুন"
            >
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
                title="More"
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
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-charcoal-100/80 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="py-0.5 space-y-0.5">
                    <Link
                      href="/wishlist"
                      prefetch={true}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-charcoal-700 hover:text-rose-600 hover:bg-rose-50/70 rounded-xl transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Wishlist</span>
                    </Link>
                    <Link
                      href="/faq"
                      prefetch={true}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-charcoal-700 hover:text-brand-700 hover:bg-brand-50/70 rounded-xl transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>FAQs</span>
                    </Link>
                    <Link
                      href="/about"
                      prefetch={true}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-charcoal-700 hover:text-brand-700 hover:bg-brand-50/70 rounded-xl transition-colors"
                    >
                      <Info className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>About Us</span>
                    </Link>
                    <div className="pt-1 mt-1 border-t border-stone-100 space-y-0.5">
                      <a
                        href="tel:01914612007"
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-charcoal-700 hover:text-emerald-700 hover:bg-emerald-50/70 rounded-xl transition-colors"
                      >
                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Call Us</span>
                      </a>
                      <a
                        href="https://wa.me/8801914612007"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-charcoal-700 hover:text-emerald-700 hover:bg-emerald-50/70 rounded-xl transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>WhatsApp Chat</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right: Quick Actions (Search Icon beside Cart) */}
          <div className="flex md:hidden items-center gap-0.5 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => openMobileSearch()}
              className="flex items-center justify-center p-2 text-charcoal-700 hover:text-brand-700 active:scale-95 transition-all cursor-pointer"
              aria-label="পণ্য খুঁজুন"
            >
              <Search className="w-5 h-5" />
            </button>
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
          <ul className="flex items-center gap-5 lg:gap-7">
            {/* Offer Zone */}
            <li>
              <Link
                href="/shop?filter=offer"
                className="flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap text-[13.5px] lg:text-sm"
              >
                <span>🔥</span>
                <span>Offer Zone</span>
              </Link>
            </li>

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
                    className="flex items-center gap-1.5 py-1.5 text-stone-200 hover:text-accent-amber transition-colors whitespace-nowrap text-[13.5px] lg:text-sm font-medium"
                  >
                    <span>{item.label}</span>
                    {item.hasMegaMenu && (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:rotate-180 group-hover:text-accent-amber transition-transform duration-200" />
                    )}
                  </Link>

                  {/* Desktop Hover Mega Menu Dropdown */}
                  {item.hasMegaMenu && category && (
                    <div
                      className={`absolute top-full ${item.alignRight ? "right-0" : "left-0"} pt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto w-[480px] max-w-[480px]`}
                    >
                      <div className="w-[480px] max-w-[480px] overflow-hidden rounded-2xl shadow-xl bg-white border border-gray-100 p-4 text-charcoal-900 font-bengali">
                        {/* Header Bar */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
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

                        {/* Product Grid (Exactly 2 Columns, 1 Row) */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {categoryProducts.slice(0, 2).map((product) => {
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
                                className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-100 hover:border-brand-400 hover:bg-brand-50/40 transition-all group/item bg-white shadow-2xs"
                              >
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
                                  <Image
                                    src={mainImage}
                                    alt={product.titleBn}
                                    fill
                                    sizes="56px"
                                    className="object-contain p-1 group-hover/item:scale-105 transition-transform duration-300"
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
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-2 text-[11px] text-charcoal-600 bg-surface-canvas/60 px-3 py-1.5 rounded-lg">
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
          <a
            href="tel:01914612007"
            className="group flex items-center gap-1.5 text-xs lg:text-[13px] font-semibold text-emerald-100 py-1 px-3 rounded-full bg-emerald-900/50 border border-emerald-700/60 hover:border-emerald-500/60 whitespace-nowrap transition-colors"
            title="Call our hotline"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            <span className="text-emerald-100 group-hover:text-white transition-colors">Hotline: 01914-612007</span>
          </a>
        </div>
      </nav>

      {/* 3. Mobile Navigation Drawer (Luxury Slide-over Left Drawer) */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        wishlistCount={displayWishlistCount}
      />
    </header>
  );
};

export default Header;
