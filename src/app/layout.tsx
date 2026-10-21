import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthRecoveryRedirect } from "@/components/auth/auth-recovery-redirect";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";

export const metadata: Metadata = {
  metadataBase: new URL("https://sunnahsourcebd.com"),
  title: "SUNNAH SOURCE | Pure & Natural Organic Foods",
  description: "১০০% খাঁটি ও প্রাকৃতিক খাদ্যপণ্য। সুন্দরবনের কাঁচা মধু, গাওয়া ঘি, সরিষার তেল ও আজওয়া খেজুর।"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className="min-h-screen flex flex-col font-sans">
        <Suspense fallback={null}>
          <FacebookPixel />
        </Suspense>
        <AuthRecoveryRedirect />
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
