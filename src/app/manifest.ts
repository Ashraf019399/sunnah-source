import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "সুন্নাহ সোর্স | Sunnah Source",
    short_name: "Sunnah Source",
    description: "১০০% খাঁটি ও প্রাকৃতিক খাদ্যপণ্য। সুন্দরবনের কাঁচা মধু, বিলোনা গাওয়া ঘি, সরিষার তেল ও আজওয়া খেজুর।",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#15803d",
    icons: [
      {
        src: "/images/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
