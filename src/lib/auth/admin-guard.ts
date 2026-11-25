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

    // 2. Primary check: Query role tables in parallel via service-role client
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const adminClient = await createAdminClient();

        const checks: Array<Promise<boolean>> = [
          Promise.resolve(
            adminClient
              .from("users")
              .select("id, role")
              .eq("id", userId)
              .maybeSingle()
          )
            .then(({ data }) => {
              const role = String(data?.role || "").toLowerCase();
              return role === "admin" || role === "superadmin";
            })
            .catch(() => false),
          Promise.resolve(
            adminClient
              .from("admins")
              .select("id")
              .eq("id", userId)
              .maybeSingle()
          )
            .then(({ data }) => Boolean(data))
            .catch(() => false),
          Promise.resolve(
            adminClient
              .from("admins")
              .select("id")
              .eq("user_id", userId)
              .maybeSingle()
          )
            .then(({ data }) => Boolean(data))
            .catch(() => false),
          Promise.resolve(
            adminClient
              .from("profiles")
              .select("id, role, is_admin")
              .eq("id", userId)
              .maybeSingle()
          )
            .then(({ data }) => {
              if (!data) return false;
              const pRole = String(data.role || "").toLowerCase();
              return pRole === "admin" || pRole === "superadmin" || data.is_admin === true;
            })
            .catch(() => false),
          Promise.resolve(
            adminClient
              .from("user_roles")
              .select("role")
              .eq("user_id", userId)
              .maybeSingle()
          )
            .then(({ data }) => {
              const urRole = String(data?.role || "").toLowerCase();
              return urRole === "admin" || urRole === "superadmin";
            })
            .catch(() => false),
        ];

        if (userEmail) {
          checks.push(
            Promise.resolve(
              adminClient
                .from("admins")
                .select("id")
                .eq("email", userEmail)
                .maybeSingle()
            )
              .then(({ data }) => Boolean(data))
              .catch(() => false)
          );
        }

        const results = await Promise.all(checks);
        if (results.some(Boolean)) {
          return true;
        }
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
