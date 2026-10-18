import fs from "fs"
import path from "path"

const CONFIG_FILE = path.join(process.cwd(), "system_config.json")

export interface SystemConfig {
  registrationEnabled: boolean
  loginEnabled: boolean
  qrScanningEnabled: boolean
  emailVerificationRequired: boolean
  profileEditingEnabled: boolean
  seminarOperationsEnabled: boolean
  statsVisibilityEnabled: boolean
  csvExportEnabled: boolean
  notificationsEnabled: boolean
}

const DEFAULT_CONFIG: SystemConfig = {
  registrationEnabled: true,
  loginEnabled: true,
  qrScanningEnabled: true,
  emailVerificationRequired: true,
  profileEditingEnabled: true,
  seminarOperationsEnabled: true,
  statsVisibilityEnabled: true,
  csvExportEnabled: true,
  notificationsEnabled: true,
}

export function loadSystemConfig(): SystemConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8")
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error("Error loading system config:", error)
  }
  return DEFAULT_CONFIG
}

export function saveSystemConfig(config: Partial<SystemConfig>) {
  try {
    const current = loadSystemConfig()
    const updated = { ...current, ...config }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2))
    return updated
  } catch (error) {
    console.error("Error saving system config:", error)
    throw error
  }
}
