"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, User, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    email?: string;
    phone?: string;
    name?: string;
  } | null;
  onLogout?: () => void;
  wishlistCount?: number;
}

interface CategoryItem {
  icon: string;
  label: string;
  href: string;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    icon: "🍯",
    label: "প্রাকৃতিক মধু",
    href: "/category/honey",
  },
  {
    icon: "🧈",
    label: "গাওয়া ঘি ও তেল",
    href: "/category/ghee-oil",
  },
  {
    icon: "🌴",
    label: "প্রিমিয়াম খেজুর",
    href: "/category/dates",
  },
  {
    icon: "🌱",
    label: "অর্গানিক বীজ",
    href: "/category/organic-seeds",
  },
  {
    icon: "🎁",
    label: "সুন্নাহ কম্বো",
    href: "/combos",
  },
  {
    icon: "🔥",
    label: "অফার জোন",
    href: "/shop?filter=offer",
  },
];

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  wishlistCount = 0,
}) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const prevPathnameRef = useRef(pathname);

  // Avoid hydration mismatch between SSR and client mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle keyboard accessibility (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Automatically close drawer on route navigation
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  if (!mounted) return null;

  const drawerContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="মোবাইল নেভিগেশন ড্রয়ার"
      className="lg:hidden"
    >
      {/* 1. Backdrop: Smooth black blur backdrop */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="মেনু বন্ধ করুন"
        onClick={onClose}
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* 2. Slide-over Left Drawer Architecture */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-[82%] max-w-[340px] z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out font-bengali",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Branded User Header */}
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-5 text-white relative shrink-0 shadow-md">
          {/* Close (X) button with circular hover effect */}
          <button
            type="button"
            onClick={onClose}
            aria-label="মেনু বন্ধ করুন"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/90 hover:text-white flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            {/* Profile circle icon */}
            <div className="w-12 h-12 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-inner">
              <User className="w-6 h-6 text-emerald-100" />
            </div>

            {/* Greeting and user link */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white tracking-wide leading-tight">
                আসসালামু আলাইকুম!
              </p>
              {currentUser ? (
                <Link
                  href="/account"
                  prefetch={true}
                  onClick={onClose}
                  className="text-xs font-semibold text-emerald-200 hover:text-white transition-colors truncate max-w-[180px] inline-flex items-center gap-1 mt-1 group"
                >
                  <span className="truncate">
                    {currentUser.name || currentUser.phone || currentUser.email || "আমার অ্যাকাউন্ট"}
                  </span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  prefetch={true}
                  onClick={onClose}
                  className="text-xs font-medium text-emerald-200 hover:text-white transition-colors inline-flex items-center gap-1 mt-1 group"
                >
                  <span>সাইন ইন / রেজিস্টার করুন</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Body: Main Categories & Quick Links */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {/* Category Section Label */}
          <div className="px-5 pt-2 pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400 font-sans">
              ক্যাটাগরি সমূহ
            </span>
          </div>

          {/* 3. Main Category Section (Card Style with Micro-Interactions) */}
          <div className="bg-stone-50/70 border border-stone-200/60 rounded-2xl p-2 mx-4 my-1 space-y-0.5">
            {CATEGORY_ITEMS.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                prefetch={true}
                onClick={onClose}
                className="group flex items-center justify-between active:bg-brand-100/60 hover:bg-brand-50 transition-all rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white shadow-xs border border-stone-200/60 flex items-center justify-center text-base shrink-0 select-none">
                    {cat.icon}
                  </span>
                  <span className="text-[13px] font-bold text-charcoal-800 group-hover:text-brand-800 transition-colors">
                    {cat.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-brand-700 transition-colors shrink-0" />
              </Link>
            ))}
          </div>

          {/* Quick Links Section Label */}
          <div className="px-5 pt-3 pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400 font-sans">
              প্রয়োজনীয় লিংক
            </span>
          </div>

          {/* 4. Quick Links Section */}
          <div className="bg-stone-50/70 border border-stone-200/60 rounded-2xl p-2 mx-4 my-1 space-y-0.5">
            {/* 📦 অর্ডার ট্র্যাক করুন (Order Track) */}
            <Link
              href="/track-order"
              prefetch={true}
              onClick={onClose}
              className="group flex items-center justify-between active:bg-brand-100/60 hover:bg-brand-50 transition-all rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-white shadow-xs border border-stone-200/60 flex items-center justify-center text-base shrink-0 select-none">
                  📦
                </span>
                <span className="text-[13px] font-bold text-charcoal-800 group-hover:text-brand-800 transition-colors">
                  অর্ডার ট্র্যাক করুন
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-brand-700 transition-colors shrink-0" />
            </Link>

            {/* ❤️ পছন্দের তালিকা (Wishlist) */}
            <Link
              href="/wishlist"
              prefetch={true}
              onClick={onClose}
              className="group flex items-center justify-between active:bg-brand-100/60 hover:bg-brand-50 transition-all rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-white shadow-xs border border-stone-200/60 flex items-center justify-center text-base shrink-0 select-none">
                  ❤️
                </span>
                <span className="text-[13px] font-bold text-charcoal-800 group-hover:text-brand-800 transition-colors">
                  পছন্দের তালিকা
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {wishlistCount > 0 && (
                  <span className="bg-rose-100 text-rose-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {wishlistCount}টি
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-brand-700 transition-colors shrink-0" />
              </div>
            </Link>

            {/* ℹ️ আমাদের সম্পর্কে (About Us) */}
            <Link
              href="/about"
              prefetch={true}
              onClick={onClose}
              className="group flex items-center justify-between active:bg-brand-100/60 hover:bg-brand-50 transition-all rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-white shadow-xs border border-stone-200/60 flex items-center justify-center text-base shrink-0 select-none">
                  ℹ️
                </span>
                <span className="text-[13px] font-bold text-charcoal-800 group-hover:text-brand-800 transition-colors">
                  আমাদের সম্পর্কে
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-brand-700 transition-colors shrink-0" />
            </Link>

            {/* 📞 হটলাইন যোগাযোগ (Hotline: 01914-612007) */}
            <a
              href="tel:01914612007"
              onClick={onClose}
              className="group flex items-center justify-between active:bg-brand-100/60 hover:bg-brand-50 transition-all rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-white shadow-xs border border-stone-200/60 flex items-center justify-center text-base shrink-0 select-none">
                  📞
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-charcoal-800 group-hover:text-brand-800 transition-colors">
                    হটলাইন যোগাযোগ
                  </span>
                  <span className="text-[11px] font-mono text-brand-700 font-semibold sm:hidden">
                    01914-612007
                  </span>
                </div>
              </div>
              <span className="hidden sm:inline-flex text-[11px] font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-full shrink-0 group-hover:bg-brand-100 group-hover:border-brand-300 transition-colors">
                01914-612007
              </span>
            </a>
          </div>
        </div>

        {/* 5. Drawer Footer & Authenticated Actions */}
        <div className="mt-auto px-5 py-4 border-t border-stone-200/60 bg-stone-50/50 shrink-0">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <Link
                href="/account"
                prefetch={true}
                onClick={onClose}
                className="text-xs font-bold text-brand-800 hover:text-brand-900 transition-colors"
              >
                আমার ড্যাশবোর্ড →
              </Link>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold py-1 px-2.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগআউট</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[11px] text-stone-400 font-medium">
                সুন্নাহ সোর্স • প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

export default MobileNavDrawer;

