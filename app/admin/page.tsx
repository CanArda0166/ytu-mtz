"use client"

import { useEffect, useState } from "react"

interface Stats {
  totalUsers: number
  totalSeminars: number
  activeSeminars: number
  totalEntries: number
  roleCounts?: { OWNER: number, ADMIN: number, STAFF: number, MEMBER: number }
}

interface ActiveUser {
  id: string
  name: string
  surname: string
  role: string
  lastIp: string | null
  lastSeen: string
}

interface RecentEntry {
  id: string
  type: "CHECKIN" | "CHECKOUT"
  createdAt: string
  user: { name: string; surname: string; email: string }
  seminar: { name: string }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats)
        if (data.recentEntries) setRecentEntries(data.recentEntries)
        if (data.activeUsers) setActiveUsers(data.activeUsers)
      })
      .finally(() => setLoading(false))
  }, [])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white animate-pulse text-lg">Yükleniyor...</div>
      </div>
    )
  }

  const statCards = [
    { label: "Toplam Kullanıcı", value: stats?.totalUsers ?? 0, icon: "👥", color: "#60a5fa" },
    { label: "Toplam Seminer", value: stats?.totalSeminars ?? 0, icon: "🎓", color: "#a78bfa" },
    { label: "Aktif Seminer", value: stats?.activeSeminars ?? 0, icon: "✅", color: "#4ade80" },
    { label: "Toplam Giriş/Çıkış", value: stats?.totalEntries ?? 0, icon: "📋", color: "#fb923c" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p style={{ color: "#a0a8d0" }} className="text-sm">
          Sistem istatistikleri ve son hareketler
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl p-6" style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-3xl font-bold" style={{ color: card.color }}>
                {card.value}
              </span>
            </div>
            <p className="text-sm font-medium" style={{ color: "#a0a8d0" }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Rol Dağılımı (Sadece Owner Görür) */}
      {stats?.roleCounts && (
        <div className="rounded-2xl p-6" style={cardStyle}>
          <h2 className="text-lg font-semibold text-white mb-4">Rol Dağılımı</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Owner", count: stats.roleCounts.OWNER ?? 0, color: "#c084fc", bg: "rgba(168,85,247,0.15)" },
              { label: "Admin", count: stats.roleCounts.ADMIN ?? 0, color: "#ff8080", bg: "rgba(227,6,19,0.15)" },
              { label: "Staff", count: stats.roleCounts.STAFF ?? 0, color: "#fde047", bg: "rgba(234,179,8,0.15)" },
              { label: "Member", count: stats.roleCounts.MEMBER ?? 0, color: "#86efac", bg: "rgba(74,222,128,0.15)" },
            ].map(r => (
              <div key={r.label} className="rounded-xl px-4 py-3 text-center" style={{ background: r.bg }}>
                <p className="text-2xl font-bold" style={{ color: r.color }}>{r.count}</p>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: r.color }}>{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aktif Kullanıcılar (Sadece Owner Görür) */}
      {activeUsers && activeUsers.length > 0 && (
        <div className="rounded-2xl p-6" style={{ ...cardStyle, borderColor: "rgba(74,222,128,0.3)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Aktif Kullanıcılar (Son 5 dk)
            </h2>
            <span className="text-xs text-green-400 font-semibold px-2 py-1 bg-green-400/10 rounded-full">
              {activeUsers.length} Çevrimiçi
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeUsers.map(u => (
              <div key={u.id} className="p-3 rounded-xl flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p className="text-white text-sm font-medium leading-none">{u.name} {u.surname}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#a0a8d0" }}>Rol: {u.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-blue-400">{u.lastIp || "Gizli IP"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Son Hareketler */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <h2 className="text-lg font-semibold text-white mb-4">Son Hareketler</h2>

        {recentEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "#a0a8d0" }}>Henüz kayıt yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "#a0a8d0" }}>Kullanıcı</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "#a0a8d0" }}>Seminer</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "#a0a8d0" }}>İşlem</th>
                  {stats?.roleCounts && <th className="text-left py-3 px-4 font-medium" style={{ color: "#a0a8d0" }}>Tarayan</th>}
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "#a0a8d0" }}>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry: any) => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="py-3 px-4">
                      <p className="text-white font-medium">{entry.user.name} {entry.user.surname}</p>
                      <p className="text-xs" style={{ color: "#a0a8d0" }}>{entry.user.email}</p>
                    </td>
                    <td className="py-3 px-4 text-white">{entry.seminar.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: entry.type === "CHECKIN" ? "rgba(74,222,128,0.15)" : "rgba(227,6,19,0.15)",
                          color: entry.type === "CHECKIN" ? "#4ade80" : "#ff8080",
                        }}>
                        {entry.type === "CHECKIN" ? "Giriş" : "Çıkış"}
                      </span>
                    </td>
                    {stats?.roleCounts && (
                      <td className="py-3 px-4 text-xs" style={{ color: "#c084fc" }}>
                        {entry.scannedByName || "-"}
                      </td>
                    )}
                    <td className="py-3 px-4" style={{ color: "#a0a8d0" }}>{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}