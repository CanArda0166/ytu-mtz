"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

interface User {
  id: string
  name: string
  surname: string
  email: string
  role: string
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user)
      })
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const baseLinks = [
    { href: "/event", label: "QR Kodum", icon: "🎫" },
    { href: "/event/movements", label: "Hareketlerim", icon: "📋" },
    { href: "/event/account", label: "Hesabım", icon: "👤" },
  ]

  const links = (user?.role && ["STAFF", "ADMIN", "OWNER", "ROOT"].includes(user.role))
    ? [...baseLinks, { href: "/event/scan", label: "QR Oku", icon: "📷" }]
    : baseLinks

  const panelLink = (user?.role && ["OWNER", "ADMIN", "ROOT"].includes(user.role))
    ? { href: "/admin", label: "Panel", icon: (user.role === "OWNER" || user.role === "ROOT") ? "👑" : "⚙️" }
    : null

  const displayRole = (role: string) => {
    switch (role) {
      case "ROOT": return "Üye";
      case "OWNER": return "OWNER";
      case "ADMIN": return "ADMIN";
      case "STAFF": return "STAFF";
      case "MEMBER": return "MEMBER";
      default: return role;
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0d2e" }}>
      {/* Üst navbar */}
      <nav className="sticky top-0 z-50 border-b"
        style={{ background: "rgba(10,13,46,0.95)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          {/* Sol: Logo */}
          <Link href="/event" className="shrink-0">
            <img src="/teknofest.png" alt="Teknofest Logo" className="h-20 w-auto object-contain" />
          </Link>

          {/* Orta: Desktop nav — scroll yapılabilir */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 justify-center mx-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0"
                style={{
                  background: pathname === link.href ? "rgba(227,6,19,0.15)" : "transparent",
                  color: pathname === link.href ? "#ff6b6b" : "#a0a8d0",
                  border: pathname === link.href ? "1px solid rgba(227,6,19,0.3)" : "1px solid transparent",
                }}>
                {link.icon} {link.label}
              </Link>
            ))}
            {panelLink && (
              <Link href={panelLink.href}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0"
                style={{
                  background: "rgba(168,85,247,0.15)",
                  color: "#c084fc",
                  border: "1px solid rgba(168,85,247,0.3)",
                }}>
                {panelLink.icon} {panelLink.label}
              </Link>
            )}
          </div>

          {/* Sağ: İsim + Çıkış + Mobil hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs hidden lg:block truncate max-w-[150px]" style={{ color: "#a0a8d0" }}>
              {user?.name} {user?.role ? <span className="font-semibold text-purple-400">({displayRole(user.role)})</span> : null}
            </span>
            <button onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-white shrink-0"
              style={{ background: "rgba(227,6,19,0.2)", border: "1px solid rgba(227,6,19,0.3)" }}>
              Çıkış
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white p-1.5 text-lg shrink-0">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-1"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {links.map((link) => (
              <Link key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium transition"
                style={{
                  background: pathname === link.href ? "rgba(227,6,19,0.15)" : "transparent",
                  color: pathname === link.href ? "#ff6b6b" : "#a0a8d0",
                }}>
                {link.icon} {link.label}
              </Link>
            ))}
            {panelLink && (
              <Link href={panelLink.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-bold transition"
                style={{
                  background: "rgba(168,85,247,0.15)",
                  color: "#c084fc",
                }}>
                {panelLink.icon} {panelLink.label}
              </Link>
            )}
          </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}