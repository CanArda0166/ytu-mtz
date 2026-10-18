"use client"

import { useEffect, useState } from "react"

interface Staff {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  tcNo: string
  createdAt: string
}

const emptyForm = { name: "", surname: "", email: "", phone: "", tcNo: "", password: "" }

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [addMode, setAddMode] = useState<"NEW" | "EXIST">("NEW")
  const [existingEmail, setExistingEmail] = useState("")
  const [error, setError] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function loadStaff() {
    const res = await fetch("/api/admin/staff")
    const data = await res.json()
    if (data.staff) setStaff(data.staff)
    setLoading(false)
  }

  useEffect(() => { loadStaff() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (addMode === "NEW") {
      if (!form.name || !form.surname || !form.email || !form.phone || !form.tcNo || !form.password) {
        setError("Tüm alanlar zorunludur.")
        return
      }
    } else {
      if (!existingEmail) {
        setError("Lütfen geçerli bir e-posta adresi girin.")
        return
      }
    }

    setSaving(true)
    setError("")

    const payload = addMode === "NEW" ? form : { existingEmail }

    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }

    setModalOpen(false)
    setSaving(false)
    setForm(emptyForm)
    setExistingEmail("")
    loadStaff()
  }

  async function handleDelete(id: string) {
    await fetch("/api/admin/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setDeleteConfirm(null)
    loadStaff()
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Görevliler</h1>
          <p className="text-sm" style={{ color: "#a0a8d0" }}>{staff.length} görevli</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setError(""); setModalOpen(true) }}
          className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition"
          style={{ background: "#E30613" }}>
          + Yeni Görevli
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <div className="text-4xl mb-4">🛡️</div>
          <p className="text-white font-medium mb-2">Henüz görevli yok</p>
          <p className="text-sm" style={{ color: "#a0a8d0" }}>Yeni bir görevli ekleyin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => (
            <div key={s.id} className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={cardStyle}>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">{s.name} {s.surname}</p>
                <div className="flex flex-wrap gap-4 text-xs mt-1" style={{ color: "#a0a8d0" }}>
                  <span>📧 {s.email}</span>
                  <span>📱 {s.phone}</span>
                  <span>📅 {formatDate(s.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deleteConfirm === s.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(s.id)}
                      className="px-3 py-2 rounded-xl text-xs font-medium"
                      style={{ background: "rgba(227,6,19,0.3)", color: "#ff8080" }}>Evet Sil</button>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-2 rounded-xl text-xs font-medium"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#a0a8d0" }}>İptal</button>
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

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative z-50 w-full max-w-lg rounded-2xl p-6"
            style={{ background: "#0f1340", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-semibold text-white mb-4">Yeni Görevli Ekle</h2>

            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => { setAddMode("NEW"); setError(""); }} 
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${addMode === "NEW" ? "bg-[#E30613] text-white" : "bg-white/5 text-[#a0a8d0]"}`}>
                Yeni Kişi Ekle
              </button>
              <button 
                onClick={() => { setAddMode("EXIST"); setError(""); }} 
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${addMode === "EXIST" ? "bg-[#E30613] text-white" : "bg-white/5 text-[#a0a8d0]"}`}>
                Mevcut Üye Seç
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {addMode === "NEW" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Ad *</label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none" style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Soyad *</label>
                      <input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none" style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>E-posta *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none" style={inputStyle} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Telefon *</label>
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none" style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>TC No *</label>
                      <input value={form.tcNo} onChange={(e) => setForm({ ...form, tcNo: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none" style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Şifre *</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none" style={inputStyle} />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Kullanıcı E-posta Adresi *</label>
                  <input type="email" value={existingEmail} onChange={(e) => setExistingEmail(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500" 
                    style={inputStyle} placeholder="ornek@eposta.com" />
                  <p className="text-xs mt-2 text-slate-400">Belirttiğiniz e-posta adresi kayıtlarda varsa, kullanıcının rolü anında STAFF (Görevli) olarak değiştirilir.</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(227,6,19,0.12)", border: "1px solid rgba(227,6,19,0.3)", color: "#ff8080" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#a0a8d0", border: "1px solid rgba(255,255,255,0.1)" }}>
                  İptal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl font-semibold text-white text-sm transition"
                  style={{ background: saving ? "#8a0a10" : "#E30613" }}>
                  {saving ? "Ekleniyor..." : "Görevli Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
