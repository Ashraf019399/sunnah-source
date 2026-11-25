import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname.startsWith("/account");

  // Skip middleware session overhead completely for public Storefront routes & assets
  if (!isAdminRoute && !isAccountRoute) {
    return response;
  }

  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("auth-token"));

  const isAdminAuthRoute =
    pathname === "/admin/login" || pathname === "/admin/reset-password";

  // Fast-path unauthenticated /admin access when no Supabase session cookie is present
  if (isAdminRoute && !isAdminAuthRoute && !hasSupabaseSessionCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  // Skip Supabase Auth roundtrip on auth/account routes if user has no session cookie
  if (!hasSupabaseSessionCookie) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Guard: Unauthenticated access to /admin routes redirected to /admin/login
    if (isAdminRoute && !isAdminAuthRoute && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users off /admin/login unless displaying an auth/unauthorized error
    if (
      pathname === "/admin/login" &&
      user &&
      !request.nextUrl.searchParams.has("error")
    ) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      return NextResponse.redirect(adminUrl);
    }
  } else if (isAdminRoute && !isAdminAuthRoute) {
    // If Supabase environment variables are not yet loaded, protect /admin by default
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|sw\\.js|images/|.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico|css|js|map|woff|woff2|ttf|eot|txt|xml|json)$).*)",
  ],
};
