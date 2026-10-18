"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

const baseMenuItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/seminars", label: "Seminerler", icon: "🎓" },
  { href: "/admin/users", label: "Kullanıcılar", icon: "👥" },
  { href: "/admin/staff", label: "Görevliler", icon: "🛡️" },
  { href: "/admin/entries", label: "Giriş/Çıkış", icon: "📋" },
]

const ownerMenuItems = [
  { href: "/owner/permissions", label: "Yetki Yönetimi", icon: "🔐" },
  { href: "/owner/roles", label: "Rol Atamaları", icon: "💎" },
  { href: "/owner/logs", label: "Oturum Logları", icon: "🔍" },
]

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    setMounted(true)
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user?.role) setUserRole(d.user.role) })
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  if (!mounted) return null

  const isOwner = userRole === "OWNER" || userRole === "ROOT"
  const isRoot = userRole === "ROOT"

  const menuItems = isOwner ? [...baseMenuItems, ...ownerMenuItems] : baseMenuItems

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0d2e" }}>
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r"
        style={{ background: "rgba(10,13,46,0.98)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <img src="/teknofest.png" alt="Teknofest Logo" className="h-20 w-auto object-contain" />
            <div>
              <p className="text-white font-semibold text-sm">Yönetim Paneli</p>
              <p className="text-xs" style={{ color: "#a0a8d0" }}>
                {userRole === "ROOT" ? "ROOT Yetkisi" : userRole === "OWNER" ? "Owner Yetkisi" : "Admin Yetkisi"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isOwnerItem = item.href.startsWith("/owner")
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: pathname === item.href 
                    ? (isOwnerItem ? "rgba(168,85,247,0.15)" : "rgba(227,6,19,0.15)") 
                    : "transparent",
                  color: pathname === item.href 
                    ? (isOwnerItem ? "#c084fc" : "#ff6b6b") 
                    : "#a0a8d0",
                  border: pathname === item.href 
                    ? `1px solid ${isOwnerItem ? "rgba(168,85,247,0.3)" : "rgba(227,6,19,0.3)"}` 
                    : "1px solid transparent",
                }}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {/* Ana Ekran butonu */}
          <Link href="/event"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-white"
            style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)" }}>
            🏠 Ana Ekran
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-white"
            style={{ background: "rgba(227,6,19,0.2)", border: "1px solid rgba(227,6,19,0.3)" }}>
            🚪 Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-72 border-r"
            style={{ background: "rgba(10,13,46,0.99)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <img src="/teknofest.png" alt="Teknofest Logo" className="h-20 w-auto object-contain" />
                <p className="text-white font-semibold text-sm">Yönetim Paneli</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-white text-xl">✕</button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isOwnerItem = item.href.startsWith("/owner")
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: pathname === item.href 
                        ? (isOwnerItem ? "rgba(168,85,247,0.15)" : "rgba(227,6,19,0.15)") 
                        : "transparent",
                      color: pathname === item.href 
                        ? (isOwnerItem ? "#c084fc" : "#ff6b6b") 
                        : "#a0a8d0",
                    }}>
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Link href="/event" onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-white"
                style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)" }}>
                🏠 Ana Ekran
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition text-white"
                style={{ background: "rgba(227,6,19,0.2)", border: "1px solid rgba(227,6,19,0.3)" }}>
                🚪 Çıkış Yap
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar - mobile */}
        <header className="lg:hidden sticky top-0 z-40 border-b px-4 h-16 flex items-center justify-between"
          style={{ background: "rgba(10,13,46,0.95)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          <button onClick={() => setSidebarOpen(true)} className="text-white text-xl p-2">☰</button>
          <span className="text-white font-semibold text-sm">Admin Panel</span>
          <div className="flex gap-2">
            <Link href="/event"
              className="px-3 py-2 rounded-xl text-sm text-white transition"
              style={{ background: "rgba(96,165,250,0.2)", border: "1px solid rgba(96,165,250,0.3)" }}>
              🏠
            </Link>
            <button onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-sm text-white transition"
              style={{ background: "rgba(227,6,19,0.2)", border: "1px solid rgba(227,6,19,0.3)" }}>
              Çıkış
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
