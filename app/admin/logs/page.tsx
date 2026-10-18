"use client"

import { useEffect, useState } from "react"

interface SystemLog {
  id: string
  userId: string
  action: string
  severity: string
  details: any
  role: string | null
  createdAt: string
  user: {
    name: string
    surname: string
    email: string
    role: string
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    userId: "",
    severity: "",
    role: "",
    action: ""
  })
  const [userRole, setUserRole] = useState("")

  async function loadLogs() {
    setLoading(true)
    const [logsRes, meRes] = await Promise.all([
      fetch(`/api/admin/logs?${new URLSearchParams(filters).toString()}`),
      fetch("/api/auth/me")
    ])
    
    const logsData = await logsRes.json()
    const meData = await meRes.json()

    if (logsData.logs) setLogs(logsData.logs)
    if (meData.user?.role) setUserRole(meData.user.role)
    setLoading(false)
  }

  async function handleClearLogs() {
    if (!confirm("⚠️ TÜM SİSTEM LOGLARINI SİLMEK ÜZERESİNİZ. Bu işlem geri alınamaz! Emin misiniz?")) return
    
    const res = await fetch("/api/admin/system/clear-logs", { method: "POST" })
    if (res.ok) {
      alert("Loglar temizlendi.")
      loadLogs()
    } else {
      alert("Hata oluştu.")
    }
  }

  useEffect(() => {
    loadLogs()
  }, []) // Initial load

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Sistem Logları</h1>
          <p className="text-sm" style={{ color: "#a0a8d0" }}>Sistemdeki tüm kritik eylemlerin kaydı.</p>
        </div>
        <div className="flex gap-2">
          {userRole === "ROOT" && (
            <button 
              onClick={handleClearLogs}
              className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30">
              🗑️ Tümünü Temizle
            </button>
          )}
          <button 
            onClick={loadLogs}
            className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition bg-blue-600 hover:bg-blue-700">
            🔄 Yenile
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4" style={cardStyle}>
        <div>
          <label className="block text-xs mb-2" style={{ color: "#a0a8d0" }}>Önem Derecesi</label>
          <select 
            name="severity" 
            value={filters.severity} 
            onChange={handleFilterChange}
            className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
            style={inputStyle}>
            <option value="">Hepsi</option>
            <option value="INFO">Düşük (INFO)</option>
            <option value="WARNING">Orta (WARNING)</option>
            <option value="CRITICAL">Yüksek (CRITICAL)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-2" style={{ color: "#a0a8d0" }}>Rol</label>
          <select 
            name="role" 
            value={filters.role} 
            onChange={handleFilterChange}
            className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
            style={inputStyle}>
            <option value="">Hepsi</option>
            <option value="ROOT">ROOT</option>
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-2" style={{ color: "#a0a8d0" }}>Eylem</label>
          <input 
            type="text" 
            name="action" 
            placeholder="Ara..." 
            value={filters.action}
            onChange={handleFilterChange}
            className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={loadLogs}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm bg-white/10 hover:bg-white/20 transition">
            Filtrele
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-white animate-pulse text-center py-20">Loglar yükleniyor...</div>
      ) : (
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th className="p-4 text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Zaman</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Kullanıcı / Rol</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Eylem</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Önem</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Detaylar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-4 text-sm text-white whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-white">{log.user.name} {log.user.surname}</div>
                    <div className="text-[10px] text-blue-400 font-bold">{log.role || log.user.role}</div>
                  </td>
                  <td className="p-4 text-sm text-white font-medium">
                    {log.action}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                      log.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    {log.details ? (
                      <button 
                        onClick={() => alert(JSON.stringify(log.details, null, 2))}
                        className="text-[10px] text-blue-400 hover:underline">
                        JSON Gör
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-12 text-center text-sm text-gray-400" style={{ background: "rgba(255,255,255,0.02)" }}>
              Kayıt bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
