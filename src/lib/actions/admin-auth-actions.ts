"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/auth/admin-guard";

export type AdminLoginResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * Handles admin authentication via Supabase Auth.
 * Rejects non-admin users even if their email/password is valid.
 */
export async function adminLoginAction(
  input: { email?: string; password?: string } | FormData
): Promise<AdminLoginResult> {
  let email = "";
  let password = "";

  if (input instanceof FormData) {
    email = String(input.get("email") || "").trim();
    password = String(input.get("password") || "");
  } else {
    email = String(input?.email || "").trim();
    password = String(input?.password || "");
  }

  if (!email || !password) {
    return {
      success: false,
      error: "অনুগ্রহ করে অ্যাডমিন ইমেইল ও পাসওয়ার্ড প্রদান করুন।",
    };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      return {
        success: false,
        error: "ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।",
      };
    }

    const isAdmin = await checkIsAdmin(data.user);

    if (!isAdmin) {
      // Security: Sign out unauthorized non-admin accounts immediately
      await supabase.auth.signOut();
      return {
        success: false,
        error: "অননুমোদিত প্রবেশাধিকার। এই অ্যাকাউন্টে অ্যাডমিন পারমিশন নেই।",
      };
    }

    return {
      success: true,
      message: "অ্যাডমিন ভেরিফিকেশন সম্পন্ন হয়েছে।",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "সার্ভার এরর ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    };
  }
}

/**
 * Signs out the admin user and redirects to the login route.
 */
export async function adminLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
