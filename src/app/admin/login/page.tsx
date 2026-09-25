import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Login | Sunnah Source",
  description: "Sunnah Source administration portal login.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-b from-brand-900 via-brand-800 to-brand-950 font-bengali">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl p-8 flex flex-col items-center justify-center gap-3 shadow-xl">
            <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
            <p className="text-charcoal-700 text-xs font-semibold">লোড হচ্ছে...</p>
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
