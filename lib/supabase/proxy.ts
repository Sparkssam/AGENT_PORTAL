import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isSupabaseConfigured, requireSupabasePublicEnv } from "@/lib/backend/env"
import { dashboardPathFor, type UserRole } from "@/lib/auth"

function roleFromUser(user: { app_metadata?: Record<string, unknown> } | null): UserRole | null {
  const role = user?.app_metadata?.role
  if (role === "admin" || role === "super_admin") return "admin"
  if (role === "agent") return "agent"
  return null
}

function roleFromClaims(claims: Record<string, unknown> | undefined): UserRole | null {
  const meta = claims?.app_metadata
  const nested =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? (meta as Record<string, unknown>).role
      : undefined
  const role = nested ?? claims?.role ?? claims?.user_role
  if (role === "admin" || role === "super_admin") return "admin"
  if (role === "agent") return "agent"
  return null
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request })
  }

  const { url, anonKey } = requireSupabasePublicEnv()
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const claimsResult = await supabase.auth.getClaims().catch(() => null)
  const claims = claimsResult?.data?.claims as Record<string, unknown> | undefined
  let userId = typeof claims?.sub === "string" ? claims.sub : undefined
  let role = roleFromClaims(claims)

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userId = user?.id
    role = roleFromUser(user)
  }

  const path = request.nextUrl.pathname

  if ((path.startsWith("/agent") || path.startsWith("/admin")) && !userId) {
    const login = request.nextUrl.clone()
    login.pathname = "/login"
    login.searchParams.set("next", path)
    return NextResponse.redirect(login)
  }

  if (userId && role) {
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL(dashboardPathFor("agent"), request.url))
    }
    if (path.startsWith("/agent") && role !== "agent") {
      return NextResponse.redirect(new URL(dashboardPathFor("admin"), request.url))
    }
    if ((path === "/login" || path === "/register") && role) {
      return NextResponse.redirect(new URL(dashboardPathFor(role), request.url))
    }
  }

  return supabaseResponse
}
