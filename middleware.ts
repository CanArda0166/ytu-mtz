import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  const { pathname } = req.nextUrl

  const publicPaths = ["/", "/login", "/register"]
  const isPublic = publicPaths.some((path) => pathname === path)

  if (isPublic) {
    if (token) {
      try {
        await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
        return NextResponse.redirect(new URL("/event", req.url))
      } catch {
        return NextResponse.next()
      }
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    if (pathname.startsWith("/admin") && !["ADMIN", "OWNER", "ROOT"].includes(payload.role as string)) {
      return NextResponse.redirect(new URL("/event", req.url))
    }

    if (pathname.startsWith("/owner") && !["OWNER", "ROOT"].includes(payload.role as string)) {
      return NextResponse.redirect(new URL("/event", req.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/login", req.url))
  }
}

export const config = {
  matcher: ["/login", "/register", "/event/:path*", "/admin/:path*", "/owner/:path*"],
}
