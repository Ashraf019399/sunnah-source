import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { CATEGORIES_DATA } from "@/lib/data/categories";
import { ProductDetailsContent } from "./product-details-content";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_PRODUCTS.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = ALL_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    return {
      title: "পণ্য পাওয়া যায়নি | Sunnah Source",
      description: "অনুরোধকৃত পণ্যটি পাওয়া যায়নি।",
    };
  }

  const title = `${product.titleBn} | Sunnah Source`;
  const description =
    product.shortDescriptionBn ||
    product.fullDescriptionBn ||
    `${product.titleBn} - ১০০% খাঁটি ও প্রাকৃতিক খাদ্যপণ্য। সান্নাহ সোর্স থেকে অর্ডার করুন।`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = ALL_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const category = CATEGORIES_DATA.find((c) => c.slug === product.categorySlug);

  // Filter related products (prioritize same category, excluding current product)
  const sameCategoryProducts = ALL_PRODUCTS.filter(
    (p) => p.id !== product.id && p.categorySlug === product.categorySlug
  );
  const otherProducts = ALL_PRODUCTS.filter(
    (p) => p.id !== product.id && p.categorySlug !== product.categorySlug
  );
  const relatedProducts = [...sameCategoryProducts, ...otherProducts].slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-bengali">
      {/* ১. টপ অ্যানাউন্সমেন্ট বার */}
      <AnnouncementBar />

      {/* ২. মূল হেডার ও সার্চ বার */}
      <Header />

      {/* ৩. প্রোডাক্ট বিস্তারিত মূল সেকশন */}
      <main className="flex-1 pb-16 lg:pb-12">
        <ProductDetailsContent
          product={product}
          category={category}
          relatedProducts={relatedProducts}
        />
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
