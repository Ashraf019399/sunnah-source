import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { AuthRecoveryRedirect } from "@/components/auth/auth-recovery-redirect";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";
import { LiveSalesNotification } from "@/components/ui/live-sales-notification";
import { getMarketingSettings } from "@/lib/actions/admin-marketing-actions";

const hindSiliguri = localFont({
  src: [
    {
      path: "./fonts/HindSiliguri Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/HindSiliguri Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/HindSiliguri Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/HindSiliguri SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/HindSiliguri Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sunnahsourcebd.com"),
  title: {
    default: "সুন্নাহ সোর্স | প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা",
    template: "%s | সুন্নাহ সোর্স - প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা",
  },
  description:
    "১০০% খাঁটি ও প্রাকৃতিক খাদ্যপণ্য। সুন্দরবনের কাঁচা মধু, প্রথাগত বিলোনা গাওয়া ঘি, ঘানি ভাঙা সরিষার তেল, কোল্ড প্রেসড কালোজিরা তেল ও মদিনার আজওয়া খেজুর। ল্যাব সার্টিফাইড ও সারা দেশে ক্যাশ অন ডেলিভারি।",
  keywords: [
    "সুন্নাহ সোর্স",
    "Sunnah Source",
    "খাঁটি মধু",
    "সুন্দরবনের মধু",
    "বিলোনা ঘি",
    "ঘানি ভাঙা সরিষার তেল",
    "কালোজিরা তেল",
    "আজওয়া খেজুর",
    "অর্গানিক ফুড",
    "প্রাকৃতিক খাদ্যপণ্য",
  ],
  authors: [{ name: "Sunnah Source", url: "https://sunnahsourcebd.com" }],
  creator: "Sunnah Source",
  publisher: "Sunnah Source",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://sunnahsourcebd.com",
  },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: "https://sunnahsourcebd.com",
    siteName: "সুন্নাহ সোর্স | Sunnah Source",
    title: "সুন্নাহ সোর্স | প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা",
    description:
      "১০০% খাঁটি ও প্রাকৃতিক খাদ্যপণ্য। সুন্দরবনের কাঁচা মধু, প্রথাগত বিলোনা গাওয়া ঘি, সরিষার তেল ও আজওয়া খেজুর।",
    images: [
      {
        url: "https://sunnahsourcebd.com/images/hero-honey.png",
        width: 1200,
        height: 630,
        alt: "সুন্নাহ সোর্স - প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "সুন্নাহ সোর্স | প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা",
    description:
      "১০০% খাঁটি ও প্রাকৃতিক খাদ্যপণ্য। সুন্দরবনের কাঁচা মধু, প্রথাগত বিলোনা গাওয়া ঘি, সরিষার তেল ও আজওয়া খেজুর।",
    images: ["https://sunnahsourcebd.com/images/hero-honey.png"],
  },
  icons: {
    icon: [
      { url: "/images/logo.svg", type: "image/svg+xml" },
    ],
  },
  verification: {
    google: "SMwCc2khzgf-lFQex5GDVB_Dk6KhcL1cEjfIS333wTc",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const marketingSettings = await getMarketingSettings();

  return (
    <html lang="bn">
      <body className={`${hindSiliguri.variable} ${hindSiliguri.className} font-bengali antialiased min-h-screen flex flex-col`}>
        <Suspense fallback={null}>
          <FacebookPixel
            pixelId={marketingSettings.pixelId}
            enabled={marketingSettings.isEnabled}
          />
        </Suspense>
        <AuthRecoveryRedirect />
        {children}
        <FloatingWhatsApp />
        <LiveSalesNotification />
      </body>
    </html>
  );
}

