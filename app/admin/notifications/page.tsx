"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface Notification {
  id: string
  message: string
  type: string
  targetRole: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [message, setMessage] = useState("")
  const [type, setType] = useState("INFO")
  const [targetRole, setTargetRole] = useState("ALL")
  const [expiresAt, setExpiresAt] = useState("")

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    const res = await fetch("/api/notifications") // Bu GET normalde sadece aktif olanları döner ama admin için genişletebiliriz.
    const data = await res.json()
    if (data.notifications) setNotifications(data.notifications)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, type, targetRole, expiresAt: expiresAt || null }),
      })
      if (res.ok) {
        setMessage("")
        setExpiresAt("")
        fetchNotifications()
      } else {
        const d = await res.json()
        alert("Hata: " + d.error)
      }
    } catch {
      alert("Hata: Duyuru gönderilemedi.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteNotification(id: string) {
    if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return
    const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" })
    if (res.ok) fetchNotifications()
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Duyuru Merkezi</h1>
        <p style={{ color: "#a0a8d0" }} className="text-sm">Tüm aktif kullanıcıların ekranına anlık bildirim gönderin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-5 sticky top-8" style={cardStyle}>
            <h2 className="text-lg font-semibold text-white mb-4">Yeni Duyuru</h2>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mesaj</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Duyuru metni..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500/50 outline-none transition-all h-32"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duyuru Tipi / Renk</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50">
                <option value="INFO">Bilgi (Mavi)</option>
                <option value="SUCCESS">Başarılı (Yeşil)</option>
                <option value="WARNING">Uyarı (Sarı)</option>
                <option value="URGENT">ACİL / KRİTİK (Kırmızı)</option>
              </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hedef Rol</label>
                <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50">
                  <option value="ALL">Herkes</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OWNER">OWNER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="MEMBER">MEMBER</option>
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bitiş Tarihi (Opsiyonel)</label>
                <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500/50" />
            </div>

            <button
               type="submit"
               disabled={saving || !message}
               className={`w-full py-4 rounded-xl text-sm font-semibold transition-all ${saving ? 'opacity-50 grayscale' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
               style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", boxShadow: "0 4px 15px rgba(37,99,235,0.3)" }}>
               {saving ? "Gönderiliyor..." : "📣 Yayınla / Gönder"}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
           <h2 className="text-lg font-semibold text-white mb-4">Aktif Duyurular</h2>
           {loading ? (
             <div className="text-center py-12 text-slate-500 animate-pulse">Yükleniyor...</div>
           ) : notifications.length === 0 ? (
             <div className="rounded-2xl p-12 text-center text-slate-500 italic" style={cardStyle}>Henüz aktif bir duyuru yok.</div>
           ) : (
             notifications.map((n) => (
               <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 className="p-5 rounded-2xl flex items-start gap-5 group" style={cardStyle}>
                 <div className="text-2xl pt-1">
                   {n.type === "URGENT" ? "🚨" : n.type === "WARNING" ? "⚠️" : n.type === "SUCCESS" ? "✅" : "ℹ️"}
                 </div>
                 <div className="flex-1 space-y-2">
                    <p className="text-white text-sm leading-relaxed">{n.message}</p>
                    <div className="flex flex-wrap items-center gap-3">
                       <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 bg-white/5 rounded">
                         HEDEF: {n.targetRole || "HERKES"}
                       </span>
                       <span className="text-[10px] text-slate-500">
                         {new Date(n.createdAt).toLocaleString("tr-TR")}
                       </span>
                       {n.expiresAt && (
                         <span className="text-[10px] text-red-400 font-medium">
                           ⏳ Bitiş: {new Date(n.expiresAt).toLocaleString("tr-TR")}
                         </span>
                       )}
                    </div>
                 </div>
                 <button onClick={() => deleteNotification(n.id)}
                   className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                   🗑️
                 </button>
               </motion.div>
             ))
           )}
        </div>
      </div>
    </div>
  )
}
