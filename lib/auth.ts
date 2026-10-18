import { NextRequest } from "next/server"
import { jwtVerify } from "jose"

export async function verifyAdminOrOwner(req: NextRequest): Promise<{ valid: boolean; role?: string; userId?: string }> {
  const token = req.cookies.get("token")?.value
  if (!token) return { valid: false }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    if (payload.role === "ROOT" || payload.role === "OWNER" || payload.role === "ADMIN") {
      return { valid: true, role: payload.role as string, userId: payload.id as string }
    }
    return { valid: false }
  } catch {
    return { valid: false }
  }
}
