"use client"

import { useEffect, useState } from "react"

interface EntryLog {
  id: string
  type: "CHECKIN" | "CHECKOUT"
  scannedByName: string | null
  createdAt: string
  user: { name: string; surname: string; email: string }
  seminar: { name: string }
}

interface Session {
  id: string
  userName: string
  userEmail: string
  seminarName: string
  checkIn: string | null
  checkOut: string | null
  scannedByIn: string | null
  scannedByOut: string | null
}

export default function LogsPage() {
  const [entries, setEntries] = useState<EntryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    fetch("/api/owner/dashboard")
      .then(r => r.json())
      .then(data => { if (data.entries) setEntries(data.entries) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const sessions: Session[] = (() => {
    const sorted = [...entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const result: Session[] = []
    const activeMap = new Map<string, Session>()

    for (const entry of sorted) {
      const key = `${entry.user.email}-${entry.seminar.name}`
      if (entry.type === "CHECKIN") {
        const session: Session = {
          id: entry.id,
          userName: `${entry.user.name} ${entry.user.surname}`,
          userEmail: entry.user.email,
          seminarName: entry.seminar.name,
          checkIn: entry.createdAt,
          checkOut: null,
          scannedByIn: entry.scannedByName,
          scannedByOut: null,
        }
        result.push(session)
        activeMap.set(key, session)
      } else {
        const active = activeMap.get(key)
        if (active) {
          active.checkOut = entry.createdAt
          active.scannedByOut = entry.scannedByName
          activeMap.delete(key)
        } else {
          result.push({
            id: entry.id,
            userName: `${entry.user.name} ${entry.user.surname}`,
            userEmail: entry.user.email,
            seminarName: entry.seminar.name,
            checkIn: null,
            checkOut: entry.createdAt,
            scannedByIn: null,
            scannedByOut: entry.scannedByName,
          })
        }
      }
    }

    return result.reverse()
  })()

  const filtered = sessions.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.userName.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q) ||
      s.seminarName.toLowerCase().includes(q) || (s.scannedByIn || "").toLowerCase().includes(q) ||
      (s.scannedByOut || "").toLowerCase().includes(q)
  })

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function getDuration(checkIn: string | null, checkOut: string | null) {
    if (!checkIn) return "-"
    const start = new Date(checkIn).getTime()
    const end = checkOut ? new Date(checkOut).getTime() : now
    const diffMs = end - start
    if (diffMs < 0) return "-"
    const totalSec = Math.floor(diffMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}sa ${m}dk${checkOut ? "" : ` ${s}sn`}`
    if (m > 0) return `${m}dk${checkOut ? "" : ` ${s}sn`}`
    return `${s}sn`
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  if (loading) return <div className="text-white animate-pulse text-center py-20">Yükleniyor...</div>

  const activeCount = filtered.filter(s => s.checkIn && !s.checkOut).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Oturum Logları</h1>
        <p className="text-sm" style={{ color: "#a0a8d0" }}>
          Hangi kullanıcı, hangi seminerden, kim tarafından alındı — tam detay.
          {activeCount > 0 && <span className="text-green-400 ml-2 font-semibold">{activeCount} aktif oturum</span>}
        </p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Kullanıcı, seminer veya tarayan kişi ara..."
        className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <div className="text-4xl mb-4">📋</div>
          <p className="text-white font-medium">Kayıt bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const isActive = session.checkIn && !session.checkOut
            return (
              <div key={session.id} className="rounded-2xl p-5" style={{
                ...cardStyle,
                borderColor: isActive ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)",
                boxShadow: isActive ? "0 0 12px rgba(74,222,128,0.08)" : "none",
              }}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Sol: Kullanıcı & Seminer */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${isActive ? "animate-pulse" : ""}`}
                      style={{ backgroundColor: isActive ? "#4ade80" : "#E30613" }} />
                    <div className="min-w-0">
                      <p className="text-white font-bold">{session.userName}</p>
                      <p className="text-xs" style={{ color: "#a0a8d0" }}>{session.userEmail}</p>
                    </div>
                  </div>

                  {/* Orta: Detaylar */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Seminer</p>
                      <p className="text-white text-sm font-medium">{session.seminarName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Tarih</p>
                      <p className="text-white text-xs font-mono">{session.checkIn ? formatDate(session.checkIn) : "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Giriş / Çıkış</p>
                      <p className="text-white text-xs font-mono">
                        {session.checkIn ? formatTime(session.checkIn) : "--:--"}
                        <span className="mx-1 text-gray-600">→</span>
                        {session.checkOut ? formatTime(session.checkOut) : <span className="text-green-400 animate-pulse">Aktif</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Süre</p>
                      <p className={`text-xs font-mono font-bold ${isActive ? "text-green-400" : "text-white"}`}>
                        {getDuration(session.checkIn, session.checkOut)}
                      </p>
                    </div>
                  </div>

                  {/* Sağ: Kim taramış */}
                  <div className="flex flex-col gap-1">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Giriş Tarayan</p>
                      <p className="text-xs text-purple-400 font-medium">{session.scannedByIn || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Çıkış Tarayan</p>
                      <p className="text-xs text-purple-400 font-medium">{session.scannedByOut || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
