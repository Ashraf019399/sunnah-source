"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import { adminLogoutAction } from "@/lib/actions/admin-auth-actions";

export interface AdminShellProps {
  children: React.ReactNode;
  userEmail: string;
}

interface NavItem {
  nameBn: string;
  nameEn: string;
  href: string;
  icon: React.ElementType;
  isPlaceholder?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    nameBn: "ড্যাশবোর্ড",
    nameEn: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    nameBn: "অর্ডারসমূহ",
    nameEn: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    nameBn: "পণ্যসমূহ",
    nameEn: "Products",
    href: "/admin#products",
    icon: Package,
    isPlaceholder: true,
  },
  {
    nameBn: "ক্যাটাগরি",
    nameEn: "Categories",
    href: "/admin#categories",
    icon: FolderTree,
    isPlaceholder: true,
  },
  {
    nameBn: "কুপন ও অফার",
    nameEn: "Coupons",
    href: "/admin#coupons",
    icon: Tag,
    isPlaceholder: true,
  },
  {
    nameBn: "সেটিংস",
    nameEn: "Settings",
    href: "/admin#settings",
    icon: Settings,
    isPlaceholder: true,
  },
];

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await adminLogoutAction();
    });
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6]/40 flex font-bengali text-charcoal-900">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar: Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-brand-900 text-stone-200 flex flex-col justify-between border-r border-brand-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div>
          <div className="p-5 flex items-center justify-between border-b border-brand-800">
            <Link
              href="/admin"
              className="flex items-center gap-2 group"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="bg-white/95 px-2.5 py-1.5 rounded-xl shadow-xs transition-transform group-hover:scale-102">
                <Image
                  src="/images/logo.svg"
                  alt="Sunnah Source"
                  width={130}
                  height={32}
                  unoptimized
                  className="h-7 w-auto object-contain"
                />
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg lg:hidden hover:bg-brand-800 transition-colors"
              aria-label="মেনু বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-3 bg-brand-800/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-accent-amber font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>এডমিন প্যানেল</span>
            </div>
            <span className="text-[10px] font-mono bg-brand-700/80 text-stone-300 px-2 py-0.5 rounded-full">
              v1.0
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" aria-label="অ্যাডমিন ন্যাভিগেশন">
            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              মূল মেনু
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.nameEn}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-brand-700 text-white shadow-md border-l-4 border-accent-amber"
                      : "text-stone-300 hover:bg-brand-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-accent-amber" : "text-stone-400"
                      }`}
                    />
                    <span>{item.nameBn}</span>
                  </div>

                  {item.isPlaceholder && (
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-brand-800 text-stone-300 border border-brand-700">
                      শীঘ্রই
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User Info & Logout */}
        <div className="p-4 border-t border-brand-800 bg-brand-950/40 space-y-3">
          {/* Admin User Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-800/60 border border-brand-700/60">
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-accent-amber font-bold text-xs shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">
                অ্যাডমিনিস্ট্রেটর
              </span>
              <span className="text-[11px] text-stone-400 block truncate font-sans">
                {userEmail || "admin@sunnahsourcebd.com"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-800 hover:bg-brand-700 text-stone-200 text-xs font-semibold transition-colors"
              title="নতুন ট্যাবে স্টোরফ্রন্ট দেখুন"
            >
              <span>স্টোরফ্রন্ট</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-200 text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
              aria-label="লগআউট করুন"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-300" />
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগআউট</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-surface-border px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-charcoal-700 hover:text-brand-700 hover:bg-surface-canvas rounded-xl lg:hidden transition-colors"
              aria-label="মেনু খুলুন"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-charcoal-900 tracking-tight leading-tight">
                Admin Dashboard
              </h1>
              <p className="text-[11px] text-charcoal-500 hidden sm:block">
                সুন্নাহ সোর্স ই-কমার্স কন্ট্রোল প্যানেল
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100/80 border border-brand-200/80 rounded-xl transition-colors"
            >
              <span>ওয়েবসাইট দেখুন</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">লগআউট</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
