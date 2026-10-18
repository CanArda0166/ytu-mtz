"use client"

import { useEffect, useState } from "react"

interface Session {
  id: string
  seminarName: string
  checkIn: string | null
  checkOut: string | null
}

export default function MovementsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    fetch("/api/user/movements")
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) setSessions(data.sessions)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const hasActiveSession = sessions.some((s) => s.checkIn && !s.checkOut)
    if (!hasActiveSession) return

    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [sessions])

  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  }

  function formatFullDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function getDurationText(checkIn: string | null, checkOut: string | null) {
    if (!checkIn) return "Giriş kaydı yok"
    
    let diffMs = 0;
    if (checkOut) {
      diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    } else {
      diffMs = now - new Date(checkIn).getTime()
    }

    if (diffMs < 0) return "Süre Hesaplanamadı"

    const totalSeconds = Math.floor(diffMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) return `${hours}sa ${mins}dk ${checkOut ? "" : secs + "sn"}`
    if (mins > 0) return `${mins}dk ${checkOut ? "" : secs + "sn"}`
    return `${secs} saniye`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Oturum Geçmişi</h1>
        <p style={{ color: "#a0a8d0" }} className="text-sm">
          Katıldığınız seminerler ve içeride geçirdiğiniz süreler listelenmektedir.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-white animate-pulse">Yükleniyor...</div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl p-12 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
          <div className="text-4xl mb-4">⏱️</div>
          <p className="text-white font-medium mb-2">Henüz kayıt yok</p>
          <p className="text-sm" style={{ color: "#a0a8d0" }}>
            Etkinliklere giriş yaptığınızda oturumlarınız burada görüntülenecek.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isActive = session.checkIn && !session.checkOut;
            const primaryColor = isActive ? "#4ade80" : "#E30613";
            const bgHover = isActive ? "rgba(74,222,128,0.05)" : "rgba(227,6,19,0.05)";

            return (
              <div key={session.id}
                className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between transition-all"
                style={{
                  background: "rgba(15, 15, 17, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${isActive ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
                  boxShadow: isActive ? "0 0 15px rgba(74,222,128,0.1)" : "none"
                }}>
                
                <div className="mb-4 sm:mb-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'animate-pulse' : ''}`} style={{ backgroundColor: primaryColor }}></div>
                    <p className="text-white font-bold text-lg">{session.seminarName}</p>
                  </div>
                  <p className="text-sm ml-6" style={{ color: "#a0a8d0" }}>
                    {session.checkIn ? formatFullDate(session.checkIn) : "-"}
                  </p>
                </div>

                <div className="flex items-center gap-6 sm:ml-auto pl-6 sm:pl-0 border-l sm:border-l-0 border-white/10">
                  <div className="text-sm">
                    <p className="text-gray-400 mb-1 text-xs uppercase tracking-wider">Giriş / Çıkış</p>
                    <p className="text-white font-mono">
                      {session.checkIn ? formatTime(session.checkIn) : "--:--"}
                      <span className="mx-2 text-gray-500">-</span>
                      {session.checkOut ? formatTime(session.checkOut) : <span className="text-[#4ade80] animate-pulse">Devam Ediyor</span>}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-gray-400 mb-1 text-xs uppercase tracking-wider">Süre</p>
                    <p className={`font-mono font-bold ${isActive ? 'text-[#4ade80]' : 'text-white'}`}>
                      {getDurationText(session.checkIn, session.checkOut)}
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