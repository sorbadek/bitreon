import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require subscription
const protectedRoutes = ["/creator/*/content/*", "/creator/*/premium/*", "/creator/*/exclusive/*"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current path matches any protected route pattern
  const isProtectedRoute = protectedRoutes.some((route) => {
    const pattern = route.replace(/\*/g, "[^/]+")
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(pathname)
  })

  if (isProtectedRoute) {
    // Add headers to indicate this is premium content
    const response = NextResponse.next()
    response.headers.set("X-Content-Type", "premium")
    response.headers.set("X-Requires-Subscription", "true")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/creator/:bnsName*/content/:path*",
    "/creator/:bnsName*/premium/:path*",
    "/creator/:bnsName*/exclusive/:path*",
  ],
}
