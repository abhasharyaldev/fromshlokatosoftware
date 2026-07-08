import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/session"

// Routes that require an authenticated session.
// /learn is intentionally public (catalog). /learn/[slug] is gated in the page
// itself via requireSession(). All routes below redirect to /login if no cookie.
//
// NOTE: /admin is included here for defense-in-depth. The real authorization
// check (role === ADMIN) happens inside app/admin/layout.tsx and every
// /api/admin/* route handler. Middleware only checks cookie presence.
const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/leaderboard",
  "/progress",
  "/achievements",
  "/battle",
  "/profile",
  "/settings",
]

// Auth pages that logged-in users should be redirected away from
const AUTH_PAGES = ["/login", "/signup"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = req.cookies.get(SESSION_COOKIE.name)?.value

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage  = AUTH_PAGES.includes(pathname)

  // Unauthenticated user hitting a protected route → redirect to login
  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user hitting login/signup → redirect to dashboard
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

// NOTE: Middleware only checks for the cookie's existence — it cannot hit
// the database at the edge. requireSession() in Server Components and
// requireAdmin() in admin route handlers perform the real DB validation.
export const config = {
  matcher: [
    // Skip Next.js internals, static files, and public assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
