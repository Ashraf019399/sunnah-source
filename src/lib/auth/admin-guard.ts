import { cache } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { User, SupabaseClient } from "@supabase/supabase-js";

/**
 * Internal memoized admin authorization check by user ID.
 * Wrapped in React cache() so within a single request cycle it runs once.
 */
const checkIsAdminMemoized = cache(
  async (
    userId: string,
    appRole: string,
    userRole: string,
    appIsAdmin: boolean,
    userIsAdmin: boolean,
    userEmail?: string
  ): Promise<boolean> => {
    // 1. Check user claims & metadata
    if (
      appRole === "admin" ||
      appRole === "superadmin" ||
      userRole === "admin" ||
      userRole === "superadmin" ||
      appIsAdmin ||
      userIsAdmin
    ) {
      return true;
    }

    // 2. Primary check: Query public.users via service-role or session client
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminClient = await createAdminClient();

        // Check 'users' table via service client
        try {
          const { data: userRow } = await adminClient
            .from("users")
            .select("id, role")
            .eq("id", userId)
            .maybeSingle();

          if (userRow) {
            const role = (userRow.role || "").toLowerCase();
            if (role === "admin" || role === "superadmin") {
              return true;
            }
          }
        } catch {}

        // Check 'admins' table by id, user_id, or email
        try {
          const { data: adminById } = await adminClient
            .from("admins")
            .select("id")
            .eq("id", userId)
            .maybeSingle();
          if (adminById) return true;
        } catch {}

        try {
          const { data: adminByUserId } = await adminClient
            .from("admins")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
          if (adminByUserId) return true;
        } catch {}

        if (userEmail) {
          try {
            const { data: adminByEmail } = await adminClient
              .from("admins")
              .select("id")
              .eq("email", userEmail)
              .maybeSingle();
            if (adminByEmail) return true;
          } catch {}
        }

        // Check 'profiles' table
        try {
          const { data: profile } = await adminClient
            .from("profiles")
            .select("id, role, is_admin")
            .eq("id", userId)
            .maybeSingle();

          if (profile) {
            const pRole = (profile.role || "").toLowerCase();
            if (pRole === "admin" || pRole === "superadmin" || profile.is_admin === true) {
              return true;
            }
          }
        } catch {}

        // Check 'user_roles' table
        try {
          const { data: userRoleRec } = await adminClient
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();

          if (userRoleRec) {
            const urRole = (userRoleRec.role || "").toLowerCase();
            if (urRole === "admin" || urRole === "superadmin") {
              return true;
            }
          }
        } catch {}
      } catch {
        // Fallback
      }
    }

    // 3. Authenticated session client fallback
    try {
      const supabase = await createClient();
      const { data: userRow } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

      if (userRow) {
        const role = (userRow.role || "").toLowerCase();
        if (role === "admin" || role === "superadmin") {
          return true;
        }
      }
    } catch {}

    return false;
  }
);

/**
 * Server-side authorization check to verify if a user has admin privileges.
 */
export async function checkIsAdmin(user: User, client?: SupabaseClient | any): Promise<boolean> {
  if (!user || !user.id) return false;

  const appRole = (user.app_metadata?.role || "").toLowerCase();
  const userRole = (user.user_metadata?.role || "").toLowerCase();
  const appIsAdmin = Boolean(user.app_metadata?.is_admin);
  const userIsAdmin = Boolean(user.user_metadata?.is_admin);

  return checkIsAdminMemoized(
    user.id,
    appRole,
    userRole,
    appIsAdmin,
    userIsAdmin,
    user.email
  );
}

/**
 * Server-side helper to fetch and verify the current session's admin status.
 * Wrapped in React cache() so layout and child components share 1 single network call.
 */
export const verifyAdminSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const isAdmin = await checkIsAdmin(user, supabase);
  return { user, isAdmin };
});
