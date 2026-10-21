import type { MetadataRoute } from "next";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { CATEGORIES_DATA } from "@/lib/data/categories";

const BASE_URL = "https://sunnahsourcebd.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  // 1. Core static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/combos`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/track-order`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/account/orders`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/checkout`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // 2. Dynamic Product routes
  const productRoutes: MetadataRoute.Sitemap = ALL_PRODUCTS.filter(
    (product) => product.isActive !== false
  ).map((product) => ({
    url: `${BASE_URL}/product/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : currentDate,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // 3. Category routes (including categories and aliases)
  const categorySlugs = Array.from(
    new Set([
      ...CATEGORIES_DATA.map((c) => c.slug),
      "raw-honey",
      "ghee-oils",
      "dates",
      "organic-seeds",
      "combos",
    ])
  );

  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${BASE_URL}/category/${slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
