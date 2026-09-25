"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Detects Supabase Auth recovery tokens or errors in the URL hash/search query
 * when landing on customer pages (e.g. homepage) and smoothly forwards them
 * to /admin/reset-password with the full token hash preserved.
 */
export function AuthRecoveryRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already on the reset password page; let it handle the tokens
    if (pathname === "/admin/reset-password") return;

    const hash = window.location.hash || "";
    const search = window.location.search || "";

    const isRecoveryHash =
      hash.includes("type=recovery") ||
      (hash.includes("access_token=") && !hash.includes("type=signup"));

    const isRecoverySearch =
      search.includes("type=recovery") ||
      search.includes("code=");

    const isRecoveryError =
      (hash.includes("error=") && (hash.includes("otp_expired") || hash.includes("access_denied"))) ||
      (search.includes("error=") && (search.includes("otp_expired") || search.includes("access_denied")));

    if (isRecoveryHash || isRecoverySearch || isRecoveryError) {
      // Preserve both search and hash so the browser client on /admin/reset-password can process the session
      window.location.replace(`/admin/reset-password${search}${hash}`);
    }
  }, [pathname]);

  return null;
}
