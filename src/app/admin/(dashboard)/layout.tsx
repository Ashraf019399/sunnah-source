import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | Sunnah Source",
  description: "Sunnah Source e-commerce administrative control panel.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await verifyAdminSession();

  // 1. Guard: Check authentication
  if (!user) {
    redirect("/admin/login");
  }

  // 2. Guard: Check admin authorization
  if (!isAdmin) {
    // Logged-in non-admin user must NOT receive admin access
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  return (
    <AdminShell userEmail={user.email || ""}>
      {children}
    </AdminShell>
  );
}
