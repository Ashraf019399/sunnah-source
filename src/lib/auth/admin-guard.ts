import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side authorization check to verify if a user has admin privileges.
 * Inspects:
 * 1. user.app_metadata (role === 'admin' | 'superadmin' | is_admin === true)
 * 2. user.user_metadata (role === 'admin' | 'superadmin' | is_admin === true)
 * 3. Database tables (admins, profiles, user_roles) if service-role is available
 */
export async function checkIsAdmin(user: User): Promise<boolean> {
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

  // 2. Server-side database tables inspection
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const adminClient = await createAdminClient();

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

  const isAdmin = await checkIsAdmin(user);
  return { user, isAdmin };
}
