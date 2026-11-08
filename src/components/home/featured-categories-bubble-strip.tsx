"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export interface FeaturedCategoryBubble {
  id: string;
  nameBn: string;
  nameEn: string;
  slug: string;
  link: string;
  imageUrl: string;
}

export const FEATURED_CATEGORY_BUBBLES: FeaturedCategoryBubble[] = [
  {
    id: "bubble-honey",
    nameBn: "প্রাকৃতিক মধু",
    nameEn: "Raw Honey",
    slug: "honey",
    link: "/category/honey",
    imageUrl: "/images/products/sundarbans-raw-honey.png",
  },
  {
    id: "bubble-ghee-oil",
    nameBn: "গাওয়া ঘি ও তেল",
    nameEn: "Ghee & Oils",
    slug: "ghee-oil",
    link: "/category/ghee-oil",
    imageUrl: "/images/products/golden-ghee.png",
  },
  {
    id: "bubble-dates",
    nameBn: "প্রিমিয়াম খেজুর",
    nameEn: "Premium Dates",
    slug: "dates",
    link: "/category/dates",
    imageUrl: "/images/products/premium-ajwa-dates.png",
  },
  {
    id: "bubble-organic-seeds",
    nameBn: "অর্গানিক বীজ",
    nameEn: "Organic Seeds",
    slug: "organic-seeds",
    link: "/category/organic-seeds",
    imageUrl: "/images/products/chia-seeds.png",
  },
  {
    id: "bubble-combos",
    nameBn: "সুন্নাহ কম্বো",
    nameEn: "Sunnah Combos",
    slug: "combos",
    link: "/combos",
    imageUrl: "/images/products/sunnah-health-booster-combo.png",
  },
];

export function FeaturedCategoriesBubbleStrip() {
  return (
    <section
      aria-label="জনপ্রিয় ক্যাটাগরি"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:hidden font-bengali w-full"
    >
      {/* ক্যাটাগরি সেকশন হেডার */}
      <div className="flex items-center justify-between px-4 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-3.5 bg-brand-700 rounded-full" />
          <h2 className="text-xs sm:text-sm font-bold text-charcoal-900 tracking-tight">
            জনপ্রিয় ক্যাটাগরি
          </h2>
        </div>
        <Link
          href="/shop"
          prefetch={true}
          className="text-[11px] font-semibold text-brand-700 hover:text-accent-dark inline-flex items-center gap-0.5 group transition-colors"
        >
          <span>সব দেখুন</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* হরিজন্টাল স্ক্রোল বাবল কন্টেইনার */}
      <div className="flex overflow-x-auto no-scrollbar gap-4 py-2 px-4 sm:justify-center">
        {FEATURED_CATEGORY_BUBBLES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.link}
            prefetch={true}
            className="group flex flex-col items-center gap-1.5 shrink-0 w-[72px] sm:w-[80px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 rounded-2xl"
          >
            {/* সফট এমারেল্ড সার্কুলার বাবল উইথ অথেনটিক প্রোডাক্ট ট্রান্সপারেন্ট মকআপ */}
            <div className="relative w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full bg-brand-50/80 border border-brand-200/60 shadow-xs flex items-center justify-center p-2 group-hover:border-brand-600/60 group-hover:bg-brand-100/90 group-hover:scale-105 group-active:scale-95 transition-all duration-200">
              <div className="relative w-full h-full">
                <Image
                  src={cat.imageUrl}
                  alt={cat.nameBn}
                  fill
                  sizes="68px"
                  className="object-contain drop-shadow-xs group-hover:scale-110 transition-transform duration-300 pointer-events-none select-none"
                />
              </div>
            </div>

            {/* ক্যাটাগরি শিরোনাম */}
            <div className="flex flex-col items-center text-center w-full">
              <span className="text-[11px] font-bold text-charcoal-900 group-hover:text-brand-700 transition-colors leading-tight line-clamp-1 w-full text-center">
                {cat.nameBn}
              </span>
              <span className="text-[9.5px] text-charcoal-500 font-sans tracking-tight leading-tight line-clamp-1 mt-0.5 w-full text-center">
                {cat.nameEn}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

