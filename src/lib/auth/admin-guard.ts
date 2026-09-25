import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { User, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side authorization check to verify if a user has admin privileges.
 * Inspects:
 * 1. user.app_metadata & user_metadata (role === 'admin' | 'superadmin' | is_admin === true)
 * 2. Database table (public.users) via authenticated session client
 * 3. Fallback database tables (users, admins, profiles, user_roles) if service-role is available
 */
export async function checkIsAdmin(user: User, client?: SupabaseClient | any): Promise<boolean> {
  if (!user) return false;

  // 1. Check user claims & metadata
  const appRole = (user.app_metadata?.role || "").toLowerCase();
  const userRole = (user.user_metadata?.role || "").toLowerCase();
  const appIsAdmin = Boolean(user.app_metadata?.is_admin);
  const userIsAdmin = Boolean(user.user_metadata?.is_admin);

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

  // 2. Primary check: Query public.users via authenticated session client
  try {
    const supabase = client || (await createClient());
    const { data: userRow } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (userRow) {
      const role = (userRow.role || "").toLowerCase();
      if (role === "admin" || role === "superadmin") {
        return true;
      }
    }
  } catch {
    // Continue to fallbacks if authenticated query fails or table is inaccessible
  }

  // 3. Fallback: Service-role inspection (if SUPABASE_SERVICE_ROLE_KEY is configured)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = await createAdminClient();

      // Check 'users' table via service client
      try {
        const { data: userRow } = await adminClient
          .from("users")
          .select("id, role")
          .eq("id", user.id)
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
          .eq("id", user.id)
          .maybeSingle();
        if (adminById) return true;
      } catch {}

      try {
        const { data: adminByUserId } = await adminClient
          .from("admins")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (adminByUserId) return true;
      } catch {}

      if (user.email) {
        try {
          const { data: adminByEmail } = await adminClient
            .from("admins")
            .select("id")
            .eq("email", user.email)
            .maybeSingle();
          if (adminByEmail) return true;
        } catch {}
      }

      // Check 'profiles' table
      try {
        const { data: profile } = await adminClient
          .from("profiles")
          .select("id, role, is_admin")
          .eq("id", user.id)
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
          .eq("user_id", user.id)
          .maybeSingle();

        if (userRoleRec) {
          const urRole = (userRoleRec.role || "").toLowerCase();
          if (urRole === "admin" || urRole === "superadmin") {
            return true;
          }
        }
      } catch {}
    } catch {
      // Gracefully fall back if database tables are unavailable
    }
  }

  return false;
}

/**
 * Server-side helper to fetch and verify the current session's admin status.
 */
export async function verifyAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const isAdmin = await checkIsAdmin(user, supabase);
  return { user, isAdmin };
}
