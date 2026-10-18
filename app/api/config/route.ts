import { NextResponse } from "next/server"
import { loadSystemConfig } from "@/lib/system-config"

export async function GET() {
  try {
    const config = loadSystemConfig()
    return NextResponse.json({
      registrationEnabled: config.registrationEnabled,
      loginEnabled: config.loginEnabled,
      qrScanningEnabled: config.qrScanningEnabled,
      notificationsEnabled: config.notificationsEnabled,
    })
  } catch {
    return NextResponse.json({ error: "Config error" }, { status: 500 })
  }
}
