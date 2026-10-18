"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface User {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  tcNo: string
  university: string | null
  faculty: string | null
  department: string | null
}

interface Entry {
  id: string
  userId: string
  type: string
  scannedByName: string | null
  createdAt: string
  user: User
}

interface Seminar {
  id: string
  name: string
  description: string | null
  capacity: number | null
  startTime: string | null
  endTime: string | null
  isActive: boolean
  createdAt: string
  _count: { entries: number }
  entries: Entry[]
}

export default function SeminarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [seminar, setSeminar] = useState<Seminar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [hourlyStats, setHourlyStats] = useState<{hour: number, count: number}[]>([])
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [userRole, setUserRole] = useState("")


  async function loadDetails() {
    try {
      const res = await fetch(`/api/admin/seminars/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Bir hata oluştu")
      setSeminar(data.seminar)

      const sRes = await fetch(`/api/admin/seminars/${id}/hourly-stats`)
      const sData = await sRes.json()
      if (sData.stats) setHourlyStats(sData.stats)

      const pRes = await fetch("/api/owner/permissions")
      const pData = await pRes.json()
      if (pData.permissions) setPermissions(pData.permissions)
      if (pData.userRole) setUserRole(pData.userRole)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetails()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white animate-pulse">Seminer detayları yükleniyor...</div>
      </div>
    )
  }

  if (error || !seminar) {
    return (
      <div className="text-center p-12">
        <div className="text-red-400 text-lg mb-4">❌ {error || "Seminer bulunamadı"}</div>
        <Link href="/admin/seminars" className="text-white underline">Seminerlere Dön</Link>
      </div>
    )
  }

  const filteredEntries = seminar.entries.filter(e => 
    `${e.user.name} ${e.user.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.user.tcNo.includes(searchTerm)
  )

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  const attendancePercent = seminar.capacity 
    ? Math.min(Math.round((seminar._count.entries / seminar.capacity) * 100), 100)
    : 100

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/seminars" className="text-sm p-1.5 rounded-lg hover:bg-white/10 transition" style={{ color: "#a0a8d0" }}>
              ← Geri
            </Link>
            <h1 className="text-2xl font-bold text-white">{seminar.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${seminar.isActive ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-gray-400 border border-white/10"}`}>
              {seminar.isActive ? "Aktif" : "Pasif"}
            </span>
          </div>
          {seminar.description && <p className="text-sm" style={{ color: "#a0a8d0" }}>{seminar.description}</p>}
        </div>
        <div className="flex gap-2">
          {(userRole === "ROOT" || permissions[`${userRole.toLowerCase()}.can_export_seminar_stats`]) && (
            <a 
              href={`/api/admin/seminars/${id}/export/csv`}
              download
              className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
              style={{ background: "#10b981", color: "white" }}
            >
              📊 CSV İstatistiklerini İndir
            </a>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6 shadow-lg" style={cardStyle}>
          <p className="text-sm font-medium mb-1" style={{ color: "#a0a8d0" }}>Toplam Katılımcı</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{seminar._count.entries}</span>
            <span className="text-sm" style={{ color: "#a0a8d0" }}>Kişi</span>
          </div>
        </div>

        <div className="rounded-2xl p-6 shadow-lg" style={cardStyle}>
          <p className="text-sm font-medium mb-1" style={{ color: "#a0a8d0" }}>Kontenjan Durumu</p>
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{seminar.capacity ?? "∞"}</span>
              <span className="text-sm" style={{ color: "#a0a8d0" }}>{seminar.capacity ? "limit" : "Sınırsız"}</span>
            </div>
            {seminar.capacity && (
              <span className="text-xs font-semibold" style={{ color: attendancePercent > 90 ? "#ff8080" : "#4ade80" }}>
                %{attendancePercent} Dolu
              </span>
            )}
          </div>
          {seminar.capacity && (
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-1000" 
                style={{ 
                  width: `${attendancePercent}%`, 
                  background: attendancePercent > 90 ? "#E30613" : "#4ade80" 
                }} 
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6 shadow-lg" style={cardStyle}>
          <p className="text-sm font-medium mb-1" style={{ color: "#a0a8d0" }}>Zaman Aralığı</p>
          <div className="space-y-1">
            <p className="text-sm text-white flex items-center gap-2">
              <span className="w-4">🏁</span> {seminar.startTime ? new Date(seminar.startTime).toLocaleString("tr-TR") : "Belirtilmedi"}
            </p>
            <p className="text-sm text-white flex items-center gap-2">
              <span className="w-4">🏁</span> {seminar.endTime ? new Date(seminar.endTime).toLocaleString("tr-TR") : "Belirtilmedi"}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Chart Section */}
      <div className="rounded-2xl p-6 shadow-xl" style={cardStyle}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Giriş Yoğunluğu (Saatlik)</h2>
          <p className="text-xs" style={{ color: "#a0a8d0" }}>Peak saatleri analiz edin</p>
        </div>
        
        <div className="flex items-end gap-1 sm:gap-2 h-40 group">
          {hourlyStats.map((stat, i) => {
            const maxVal = Math.max(...hourlyStats.map(s => s.count), 1);
            const heightPerc = (stat.count / maxVal) * 100;
            const isWorkingHour = stat.hour >= 8 && stat.hour <= 22; // Genel çalışma saatleri
            
            return (
              <div key={stat.hour} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 relative flex items-end">
                   {/* Tooltip */}
                   {stat.count > 0 && (
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                       {stat.hour}:00 - {stat.count} kişi
                     </div>
                   )}
                   <div 
                    className={`w-full rounded-t-sm transition-all duration-700 bg-gradient-to-t ${isWorkingHour ? 'from-blue-600/40 to-blue-400/80 shadow-[0_0_15px_rgba(96,165,250,0.3)]' : 'from-white/5 to-white/10'}`}
                    style={{ height: `${heightPerc}%`, opacity: stat.count === 0 ? 0.3 : 1 }}
                   />
                </div>
                {/* Saat alt yazısı (Sadece çift saatler veya veri olanlar gösterilebilir yer darlığından) */}
                {(stat.hour % 2 === 0) && (
                  <span className="text-[10px] sm:text-[11px]" style={{ color: stat.count > 0 ? "white" : "#4a5568" }}>
                    {stat.hour}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Participants Section */}
      <div className="rounded-2xl shadow-xl overflow-hidden" style={cardStyle}>
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-lg font-semibold text-white">Katılımcı Listesi</h2>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="İsim, email veya TC ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl px-4 py-2 text-sm text-white focus:outline-none transition pl-10"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center">
              <p style={{ color: "#a0a8d0" }}>Herhangi bir katılımcı bulunamadı.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.02)", color: "#a0a8d0" }}>
                  <th className="px-6 py-4 font-semibold">Katılımcı</th>
                  <th className="px-6 py-4 font-semibold">İletişim & TC</th>
                  <th className="px-6 py-4 font-semibold">Eğitim</th>
                  <th className="px-6 py-4 font-semibold">Giriş Kaydı</th>
                </tr>
              </thead>
              <tbody className="text-sm border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{entry.user.name} {entry.user.surname}</p>
                      <p className="text-xs" style={{ color: "#a0a8d0" }}>ID: {entry.user.id.slice(0,8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-xs mb-1">📧 {entry.user.email}</p>
                      <p className="text-white text-xs">🆔 {entry.user.tcNo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-xs truncate max-w-[150px]">{entry.user.university || "-"}</p>
                      <p className="text-[10px]" style={{ color: "#a0a8d0" }}>{entry.user.department || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-xs mb-1">📅 {new Date(entry.createdAt).toLocaleString("tr-TR")}</p>
                      <p className="text-[10px]" style={{ color: "#a0a8d0" }}>
                        👤 {entry.scannedByName ? `Okutan: ${entry.scannedByName}` : "Kayıt"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
