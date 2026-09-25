import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { CategoryContent } from "./category-content";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES_DATA.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES_DATA.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: "ক্যাটাগরি পাওয়া যায়নি | Sunnah Source",
      description: "অনুরোধকৃত ক্যাটাগরিটি পাওয়া যায়নি।",
    };
  }

  const title = `${category.nameBn} | Sunnah Source`;
  const description =
    category.descriptionBn ||
    category.taglineBn ||
    `${category.nameBn} - ১০০% খাঁটি ও প্রাকৃতিক পণ্যসমূহ। সান্নাহ সোর্স থেকে অর্ডার করুন।`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: category.imageUrl ? [{ url: category.imageUrl }] : [],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = CATEGORIES_DATA.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  // Filter products belonging to this category
  const categoryProducts = ALL_PRODUCTS.filter(
    (product) => product.categorySlug === category.slug
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      {/* ১. টপ অ্যানাউন্সমেন্ট বার */}
      <AnnouncementBar />

      {/* ২. মূল হেডার ও সার্চ বার */}
      <Header />

      {/* ৩. ক্যাটাগরি পেজের মূল কনটেন্ট */}
      <main className="flex-1 pb-16 lg:pb-12">
        <CategoryContent category={category} products={categoryProducts} />
      </main>

      {/* ৪. গ্লোবাল ফুটার */}
      <Footer />

      {/* ৫. মোবাইল বটম ন্যাভিগেশন বার */}
      <MobileBottomNav />

      {/* ৬. স্লাইড-ওভার শপিং কার্ট ড্রয়ার */}
      <CartDrawer />
    </div>
  );
}
