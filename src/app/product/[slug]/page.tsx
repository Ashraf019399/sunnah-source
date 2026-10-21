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
import { FrequentlyBoughtTogether } from "@/components/product/frequently-bought-together";

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

  const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
  const price = defaultVariant
    ? typeof defaultVariant.salePrice === "number" && defaultVariant.salePrice > 0
      ? defaultVariant.salePrice
      : defaultVariant.regularPrice
    : 0;

  const title = `${product.titleBn} | খাঁটি ও প্রাকৃতিক - সুন্নাহ সোর্স`;
  const description = `${product.titleBn} - ১০০% প্রাকৃতিক, ল্যাব-টেস্টেড খাঁটি খাদ্যপণ্য। মূল্য মাত্র ৳${price}। ${
    product.shortDescriptionBn || product.fullDescriptionBn || ""
  } সান্নাহ সোর্স থেকে ক্যাশ অন ডেলিভারিতে অর্ডার করুন।`;

  const canonicalUrl = `https://sunnahsourcebd.com/product/${slug}`;
  const imageUrl = product.images?.[0]
    ? product.images[0].startsWith("http")
      ? product.images[0]
      : `https://sunnahsourcebd.com${product.images[0]}`
    : "https://sunnahsourcebd.com/images/hero-honey.png";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "সুন্নাহ সোর্স | Sunnah Source",
      locale: "bn_BD",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.titleBn,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
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

  const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
  const price = defaultVariant
    ? typeof defaultVariant.salePrice === "number" && defaultVariant.salePrice > 0
      ? defaultVariant.salePrice
      : defaultVariant.regularPrice
    : 0;

  const canonicalUrl = `https://sunnahsourcebd.com/product/${slug}`;
  const imageUrl = product.images?.[0]
    ? product.images[0].startsWith("http")
      ? product.images[0]
      : `https://sunnahsourcebd.com${product.images[0]}`
    : "https://sunnahsourcebd.com/images/hero-honey.png";

  const productDescription =
    product.shortDescriptionBn ||
    product.fullDescriptionBn ||
    `${product.titleBn} - ১০০% প্রাকৃতিক, ল্যাব-টেস্টেড খাঁটি খাদ্যপণ্য।`;

  // Google JSON-LD Structured Data Schema for Rich Product Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.titleBn,
    description: productDescription,
    image: imageUrl,
    sku: defaultVariant?.sku || product.id,
    brand: {
      "@type": "Brand",
      name: "সুন্নাহ সোর্স",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: price,
      availability:
        defaultVariant && defaultVariant.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: canonicalUrl,
      seller: {
        "@type": "Organization",
        name: "সুন্নাহ সোর্স | Sunnah Source",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: (product.ratingAverage || 5.0).toFixed(1),
      reviewCount: String(product.reviewCount || 48),
      bestRating: "5",
      worstRating: "1",
    },
  };

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
      {/* Google JSON-LD Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          frequentlyBoughtTogether={<FrequentlyBoughtTogether mainProduct={product} />}
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
