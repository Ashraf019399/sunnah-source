import type { Metadata } from "next";
import "./globals.css";
import { AuthRecoveryRedirect } from "@/components/auth/auth-recovery-redirect";

export const metadata: Metadata = {
  title: "SUNNAH SOURCE | Pure & Natural Organic Foods",
  description: "১০০% খাঁটি ও প্রাকৃতিক খাদ্যপণ্য। সুন্দরবনের কাঁচা মধু, গাওয়া ঘি, সরিষার তেল ও আজওয়া খেজুর।"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className="min-h-screen flex flex-col font-sans">
        <AuthRecoveryRedirect />
        {children}
      </body>
    </html>
  );
}