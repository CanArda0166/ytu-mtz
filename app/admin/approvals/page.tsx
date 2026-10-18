"use client"

import { useEffect, useState } from "react"

interface PendingAction {
  id: string
  type: string
  data: any
  status: string
  createdAt: string
  requester: {
    name: string
    surname: string
    email: string
  }
}

export default function ApprovalsPage() {
  const [actions, setActions] = useState<PendingAction[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filterType, setFilterType] = useState("")

  const filteredActions = actions.filter(act => !filterType || act.type === filterType)

  async function loadActions() {
    const res = await fetch("/api/admin/approvals")
    const data = await res.json()
    if (data.actions) setActions(data.actions)
    setLoading(false)
  }

  useEffect(() => {
    loadActions()
  }, [])

  async function handleAction(id: string, action: "APPROVE" | "REJECT") {
    setProcessing(id)
    const res = await fetch("/api/admin/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    })
    if (res.ok) {
      loadActions()
    }
    setProcessing(null)
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  if (loading) return <div className="text-white animate-pulse text-center py-20">Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Onay Merkezi</h1>
          <p className="text-sm" style={{ color: "#a0a8d0" }}>
            Diğer yöneticiler(OWNER) tarafından yapılan yetki değişikliklerini buradan inceleyip onaylayabilirsiniz.
          </p>
        </div>
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-white text-xs bg-white/5 border border-white/10 outline-none focus:border-emerald-500/50"
            style={{ colorScheme: "dark" }}>
            <option value="">Tüm İşlemler</option>
            <option value="USER_EDIT">Kullanıcı Düzenleme</option>
            <option value="USER_DELETE">Kullanıcı Silme</option>
            <option value="PERMISSION_UPDATE">Yetki Güncelleme</option>
          </select>
        </div>
      </div>

      {filteredActions.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <p className="text-white font-medium">Bekleyen işlem bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActions.map((act) => (
            <div key={act.id} className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6" style={cardStyle}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                    {act.type}
                  </span>
                  <span className="text-xs" style={{ color: "#a0a8d0" }}>
                    {new Date(act.createdAt).toLocaleString("tr-TR")}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">
                  {act.requester.name} {act.requester.surname} bir değişiklik talep etti
                </h3>
                <p className="text-xs mb-4" style={{ color: "#a0a8d0" }}>{act.requester.email}</p>
                
                <div className="bg-black/20 rounded-xl p-4 overflow-auto max-h-[400px] border border-white/5">
                  {act.type === "USER_EDIT" ? (
                    <div className="space-y-3">
                      <p className="text-xs text-emerald-400 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        👤 Kullanıcı Bilgileri Değişiklik Talebi
                      </p>
                      
                      {act.data.newValues ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-[10px] text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-tighter">
                                <th className="py-2 px-2">Alan</th>
                                <th className="py-2 px-2">Eski Değer</th>
                                <th className="py-2 px-2">Yeni Değer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(act.data.newValues).map(([key, newVal]) => {
                                const oldVal = act.data.oldValues?.[key]
                                const isChanged = String(oldVal) !== String(newVal)
                                if (!isChanged && key !== 'id') return null
                                
                                return (
                                  <tr key={key} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="py-2 px-2 text-slate-400 font-medium">{key}</td>
                                    <td className="py-2 px-2 line-through text-red-400/70">{String(oldVal ?? "-")}</td>
                                    <td className="py-2 px-2 text-emerald-400 font-bold">{String(newVal)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <pre className="text-[10px] text-blue-300">{JSON.stringify(act.data, null, 2)}</pre>
                      )}
                    </div>
                  ) : act.type === "USER_DELETE" ? (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <p className="text-xs text-red-400 font-bold mb-1">KULLANICI SİLİNECEK</p>
                        <p className="text-[10px] text-slate-400">Bu işlem geri alınamaz. Kullanıcının tüm kayıtları, girişleri ve yetkileri silinecektir.</p>
                        <p className="text-[10px] text-white mt-2 font-mono bg-white/5 p-1 rounded inline-block">ID: {act.data.id}</p>
                      </div>
                    </div>
                  ) : act.type === "PERMISSION_UPDATE" ? (
                    <div className="space-y-3">
                      <p className="text-xs text-blue-400 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        🔐 Yetki Planı Değişikliği
                      </p>
                      
                      {act.data.newValues ? (() => {
                        const entries = Object.entries(act.data.newValues as Record<string, boolean>)
                          .filter(([key, val]) => val !== act.data.oldValues?.[key]);
                        
                        if (entries.length === 0) return <p className="text-[10px] text-red-400">Değişiklik tespit edilemedi.</p>;

                        const grouped: Record<string, Array<{ key: string; feature: string; newVal: boolean; oldVal: boolean }>> = {};
                        entries.forEach(([key, newVal]) => {
                          const [role, feature] = key.split(".");
                          if (!grouped[role]) grouped[role] = [];
                          grouped[role].push({ key, feature, newVal, oldVal: act.data.oldValues?.[key] ?? false });
                        });

                        return (
                          <div className="space-y-4">
                            {Object.entries(grouped).map(([role, items]) => (
                                <div key={role} className="space-y-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    <span className="text-[10px] font-bold text-blue-300 uppercase letter tracking-widest">{role} ROLÜ İÇİN YETKİLER</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-1.5">
                                    {items.map(item => (
                                      <div key={item.key} className="flex items-center justify-between p-2 rounded bg-white/[0.03] border border-white/5">
                                        <span className="text-[10px] text-slate-300">{item.feature}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9px] text-slate-500 line-through">
                                            {item.oldVal ? "AÇIK" : "KAPALI"}
                                          </span>
                                          <span className="text-slate-600">→</span>
                                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${item.newVal ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}>
                                            {item.newVal ? "AÇILDI" : "KAPATILDI"}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                            ))}
                          </div>
                        );
                      })() : (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(act.data).map(([key, val]) => (
                            <span key={key} className={`text-[9px] px-1.5 py-0.5 rounded border ${val ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                              {key}: {val ? "AÇIK" : "KAPALI"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <pre className="text-[10px] text-blue-300">
                      {JSON.stringify(act.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleAction(act.id, "APPROVE")}
                  disabled={!!processing}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50"
                >
                  {processing === act.id ? "..." : "Onayla"}
                </button>
                <button
                  onClick={() => handleAction(act.id, "REJECT")}
                  disabled={!!processing}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50"
                >
                  Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
