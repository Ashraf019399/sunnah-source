import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "সুন্নাহ সোর্স",
    short_name: "Sunnah Source",
    description: "১০০% খাঁটি, প্রাকৃতিক ও সুন্নাহ সম্মত খাদ্যপণ্য",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#1B4D2E",
    theme_color: "#1B4D2E",
    orientation: "portrait",
    categories: ["shopping", "food"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

