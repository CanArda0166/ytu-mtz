"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

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
}

const emptyForm = {
  name: "", description: "", capacity: "", startTime: "", endTime: "", isActive: true,
}

export default function SeminarsPage() {
  const [seminars, setSeminars] = useState<Seminar[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function loadSeminars() {
    const res = await fetch("/api/admin/seminars")
    const data = await res.json()
    if (data.seminars) setSeminars(data.seminars)
    setLoading(false)
  }

  useEffect(() => { loadSeminars() }, [])

  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  function openEdit(s: Seminar) {
    setEditId(s.id)
    setForm({
      name: s.name,
      description: s.description || "",
      capacity: s.capacity?.toString() || "",
      startTime: s.startTime ? new Date(s.startTime).toISOString().slice(0, 16) : "",
      endTime: s.endTime ? new Date(s.endTime).toISOString().slice(0, 16) : "",
      isActive: s.isActive,
    })
    setError("")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError("Seminer adı zorunludur."); return }
    setSaving(true)
    setError("")

    const method = editId ? "PUT" : "POST"
    const body = editId ? { id: editId, ...form } : form

    const res = await fetch("/api/admin/seminars", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }

    setModalOpen(false)
    setSaving(false)
    loadSeminars()
  }

  async function handleDelete(id: string) {
    await fetch("/api/admin/seminars", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setDeleteConfirm(null)
    loadSeminars()
  }

  async function toggleActive(s: Seminar) {
    await fetch("/api/admin/seminars", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, name: s.name, isActive: !s.isActive }),
    })
    loadSeminars()
  }

  function formatDate(d: string | null) {
    if (!d) return "-"
    return new Date(d).toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
  }

  const [search, setSearch] = useState("")
  const [filterActive, setFilterActive] = useState("")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  const filtered = seminars.filter(s => {
    const q = search.toLowerCase()
    const matchesSearch = s.name.toLowerCase().includes(q) || (s.description?.toLowerCase().includes(q))
    const matchesActive = !filterActive || (filterActive === "true" ? s.isActive : !s.isActive)
    return matchesSearch && matchesActive
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Seminerler</h1>
          <p className="text-sm" style={{ color: "#a0a8d0" }}>{filtered.length} / {seminars.length} seminer gösteriliyor</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Seminer ara..."
            className="rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
          />
          <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-white text-sm bg-white/5 border border-white/10 outline-none focus:border-emerald-500/50"
            style={{ colorScheme: "dark" }}>
            <option value="">Tüm Durumlar</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
          <button onClick={openCreate}
            className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition shrink-0 shadow-lg shadow-red-500/20 active:scale-95"
            style={{ background: "#E30613" }}>
            + Yeni Seminer
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <div className="text-4xl mb-4">🎓</div>
          <p className="text-white font-medium mb-2">{search ? "Sonuç bulunamadı" : "Henüz seminer yok"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={cardStyle}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white font-semibold truncate">{s.name}</h3>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: s.isActive ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.08)",
                      color: s.isActive ? "#4ade80" : "#a0a8d0",
                    }}>
                    {s.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>
                {s.description && <p className="text-sm mb-2 truncate" style={{ color: "#a0a8d0" }}>{s.description}</p>}
                <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#a0a8d0" }}>
                  <span>📊 {s._count.entries} kayıt</span>
                  <span>👥 Kontenjan: {s.capacity ?? "∞"}</span>
                  <span>🕐 {formatDate(s.startTime)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(s)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#a0a8d0", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {s.isActive ? "Pasife Al" : "Aktif Et"}
                </button>
                <Link href={`/admin/seminars/${s.id}`}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition"
                  style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}>
                  🔍 Ayrıntılar
                </Link>
                <button onClick={() => openEdit(s)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition"
                  style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)" }}>
                  ✏️ Düzenle
                </button>
                {deleteConfirm === s.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(s.id)}
                      className="px-3 py-2 rounded-xl text-xs font-medium transition"
                      style={{ background: "rgba(227,6,19,0.3)", color: "#ff8080", border: "1px solid rgba(227,6,19,0.5)" }}>
                      Evet Sil
                    </button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-2 rounded-xl text-xs font-medium transition"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#a0a8d0" }}>
                      İptal
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(s.id)}
                    className="px-3 py-2 rounded-xl text-xs font-medium transition"
                    style={{ background: "rgba(227,6,19,0.15)", color: "#ff8080", border: "1px solid rgba(227,6,19,0.3)" }}>
                    🗑️ Sil
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative z-50 w-full max-w-lg rounded-2xl p-6"
            style={{ background: "#0f1340", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-semibold text-white mb-6">
              {editId ? "Seminer Düzenle" : "Yeni Seminer"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Seminer Adı *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                  style={inputStyle} placeholder="Seminer adı" />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Açıklama</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none"
                  style={inputStyle} rows={3} placeholder="Opsiyonel açıklama" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Kontenjan</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                    style={inputStyle} placeholder="Sınırsız" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer py-3">
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-5 h-5 rounded" />
                    <span className="text-sm text-white">Aktif</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Başlangıç</label>
                  <input type="datetime-local" value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                    style={{ ...inputStyle, colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Bitiş</label>
                  <input type="datetime-local" value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                    style={{ ...inputStyle, colorScheme: "dark" }} />
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(227,6,19,0.12)", border: "1px solid rgba(227,6,19,0.3)", color: "#ff8080" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm transition"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#a0a8d0", border: "1px solid rgba(255,255,255,0.1)" }}>
                  İptal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl font-semibold text-white text-sm transition"
                  style={{ background: saving ? "#8a0a10" : "#E30613" }}>
                  {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
