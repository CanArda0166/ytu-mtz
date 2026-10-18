"use client"

import { useEffect, useState } from "react"

interface Entry {
  id: string
  type: "CHECKIN" | "CHECKOUT"
  createdAt: string
  user: { name: string; surname: string; email: string }
  seminar: { name: string }
}

interface Seminar {
  id: string
  name: string
}

interface Session {
  id: string
  userName: string
  userEmail: string
  seminarName: string
  checkIn: string | null
  checkOut: string | null
}

export default function EntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [seminars, setSeminars] = useState<Seminar[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSeminar, setFilterSeminar] = useState("")
  const [search, setSearch] = useState("")
  const [now, setNow] = useState(Date.now())

  async function loadEntries(seminarId?: string) {
    setLoading(true)
    const url = seminarId ? `/api/admin/entries?seminarId=${seminarId}` : "/api/admin/entries"
    const res = await fetch(url)
    const data = await res.json()
    if (data.entries) setEntries(data.entries)
    setLoading(false)
  }

  async function loadSeminars() {
    const res = await fetch("/api/admin/seminars")
    const data = await res.json()
    if (data.seminars) setSeminars(data.seminars)
  }

  useEffect(() => {
    loadSeminars()
    loadEntries()
  }, [])

  useEffect(() => {
    loadEntries(filterSeminar || undefined)
  }, [filterSeminar])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const sessions: Session[] = (() => {
    const sorted = [...entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    const result: Session[] = []
    const activeMap = new Map<string, Session>() // key: `userId-seminarId` approx via name+seminar

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
        }
        result.push(session)
        activeMap.set(key, session)
      } else {
        const active = activeMap.get(key)
        if (active) {
          active.checkOut = entry.createdAt
          activeMap.delete(key)
        } else {
          result.push({
            id: entry.id,
            userName: `${entry.user.name} ${entry.user.surname}`,
            userEmail: entry.user.email,
            seminarName: entry.seminar.name,
            checkIn: null,
            checkOut: entry.createdAt,
          })
        }
      }
    }

    return result.reverse() // En yeniler üstte
  })()

  const filtered = sessions.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.userName.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q) || s.seminarName.toLowerCase().includes(q)
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

  const activeCount = filtered.filter(s => s.checkIn && !s.checkOut).length
  const closedCount = filtered.filter(s => s.checkOut).length

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Oturum Kayıtları</h1>
        <p className="text-sm" style={{ color: "#a0a8d0" }}>
          {filtered.length} oturum ({activeCount} aktif, {closedCount} tamamlanmış)
        </p>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterSeminar}
          onChange={(e) => setFilterSeminar(e.target.value)}
          className="sm:w-64 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", colorScheme: "dark" }}>
          <option value="">Tüm Seminerler</option>
          {seminars.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsim, e-posta veya seminer ara..."
          className="flex-1 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white animate-pulse">Yükleniyor...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <div className="text-4xl mb-4">📋</div>
          <p className="text-white font-medium mb-2">Kayıt bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const isActive = session.checkIn && !session.checkOut
            return (
              <div key={session.id}
                className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{
                  ...cardStyle,
                  borderColor: isActive ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)",
                  boxShadow: isActive ? "0 0 12px rgba(74,222,128,0.08)" : "none",
                }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${isActive ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: isActive ? "#4ade80" : "#E30613" }} />
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{session.userName}</p>
                    <p className="text-xs truncate" style={{ color: "#a0a8d0" }}>{session.userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 ml-6 sm:ml-0">
                  <div className="text-sm">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Seminer</p>
                    <p className="text-white font-medium">{session.seminarName}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Giriş / Çıkış</p>
                    <p className="text-white font-mono text-xs">
                      {session.checkIn ? formatTime(session.checkIn) : "--:--"}
                      <span className="mx-1 text-gray-600">→</span>
                      {session.checkOut ? formatTime(session.checkOut) : <span className="text-[#4ade80] animate-pulse text-xs">Aktif</span>}
                    </p>
                  </div>
                  <div className="text-sm text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Süre</p>
                    <p className={`font-mono font-bold text-xs ${isActive ? "text-[#4ade80]" : "text-white"}`}>
                      {getDuration(session.checkIn, session.checkOut)}
                    </p>
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
