"use client"

import { useEffect, useState } from "react"

interface User {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  birthDate: string
  tcNo: string
  gender: string | null
  university: string | null
  faculty: string | null
  department: string | null
  role: string
  emailVerified: boolean
  createdAt: string
}

const RolePriority = {
  ROOT: 4,
  OWNER: 3,
  ADMIN: 2,
  STAFF: 1,
  MEMBER: 0
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [perms, setPerms] = useState<Record<string, boolean>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const renderField = (label: string, value: any, permKey: string, onChange: (v: string) => void, type: string = "text") => {
    const roleStr = userRole.toLowerCase()
    const canEdit = userRole === "ROOT" || perms[`${roleStr}.${permKey}`]

    return (
      <div className="flex flex-col gap-1.5 group">
        <label className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${canEdit ? "text-emerald-400" : "text-slate-500/60"}`}>
          {label} {canEdit && <span className="ml-1 text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Editlenebilir</span>}
        </label>
        {canEdit ? (
          <div className="relative">
            <input 
              type={type} 
              value={value || ""} 
              onChange={(e) => onChange(e.target.value)} 
              className="w-full bg-emerald-500/[0.03] border border-emerald-500/20 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all placeholder:text-emerald-500/10 shadow-inner" 
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">✏️</div>
          </div>
        ) : (
          <div className="px-4 py-2.5 rounded-xl bg-slate-500/[0.03] border border-slate-500/5 text-slate-400 font-medium text-sm truncate select-none cursor-not-allowed italic">
            {value || "Veri Yok"}
          </div>
        )}
      </div>
    )
  }

  async function loadUsers() {
    const res = await fetch("/api/admin/users")
    const data = await res.json()
    if (data.users) setUsers(data.users)
    setLoading(false)
  }

  async function loadPerms() {
    const res = await fetch("/api/owner/permissions")
    const data = await res.json()
    if (data.permissions) setPerms(data.permissions)
  }

  useEffect(() => {
    loadUsers()
    loadPerms()
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { 
        if (d.user) {
          setUserRole(d.user.role)
          setCurrentUserId(d.user.id)
        } 
      })
  }, [])

  function enableEditMode() {
    if (!detailUser) return
    setEditForm({
      id: detailUser.id,
      name: detailUser.name,
      surname: detailUser.surname,
      email: detailUser.email,
      phone: detailUser.phone,
      tcNo: detailUser.tcNo,
      birthDate: detailUser.birthDate ? detailUser.birthDate.split("T")[0] : "",
      university: detailUser.university || "",
      faculty: detailUser.faculty || "",
      department: detailUser.department || "",
      gender: detailUser.gender || "",
      role: detailUser.role,
      emailVerified: detailUser.emailVerified,
      password: "",
      password_actual: (detailUser as any).password || ""
    })
    setEditMode(true)
  }

  async function handleEditSubmit() {
    if (!editForm) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setEditMode(false)
        await loadUsers()
        setDetailUser(null) // Modal'ı doğrudan kapat veya detailUser statesini yenile. Burada kapatıyoruz.
      } else {
        const errorData = await res.json()
        alert("Hata: " + errorData.error)
      }
    } catch {
      alert("Sunucu hatası.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setDeleteConfirm(null)
    setDetailUser(null)
    loadUsers()
  }

  const [filterRole, setFilterRole] = useState("")
  const [filterGender, setFilterGender] = useState("")
  const [filterUniversity, setFilterUniversity] = useState("")
  const [filterVerified, setFilterVerified] = useState("")

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = u.name.toLowerCase().includes(q) || u.surname.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q) || u.phone.includes(q)
    
    const matchRole = !filterRole || u.role === filterRole
    const matchGender = !filterGender || u.gender === filterGender
    const matchUni = !filterUniversity || u.university?.toLowerCase().includes(filterUniversity.toLowerCase())
    const matchVerified = !filterVerified || (filterVerified === "true" ? u.emailVerified : !u.emailVerified)

    return matchSearch && matchRole && matchGender && matchUni && matchVerified
  })

  function formatDate(d: string) {
    return new Date(d).toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Kullanıcılar</h1>
          <p className="text-sm" style={{ color: "#a0a8d0" }}>{filtered.length} / {users.length} kullanıcı gösteriliyor</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsim, e-posta veya telefon ara..."
          className="w-full sm:w-72 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-white text-xs bg-white/5 border border-white/10 outline-none focus:border-emerald-500/50"
          style={{ colorScheme: "dark" }}>
          <option value="">Tüm Roller</option>
          <option value="OWNER">OWNER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="STAFF">STAFF</option>
          <option value="MEMBER">MEMBER</option>
        </select>
        <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-white text-xs bg-white/5 border border-white/10 outline-none focus:border-emerald-500/50"
          style={{ colorScheme: "dark" }}>
          <option value="">Tüm Cinsiyetler</option>
          <option value="Erkek">Erkek</option>
          <option value="Kadın">Kadın</option>
        </select>
        <input value={filterUniversity} onChange={e => setFilterUniversity(e.target.value)}
          placeholder="Üniversite Filtrele"
          className="rounded-xl px-4 py-2.5 text-white text-xs bg-white/5 border border-white/10 outline-none focus:border-emerald-500/50 placeholder:text-slate-500" />
        <select value={filterVerified} onChange={e => setFilterVerified(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-white text-xs bg-white/5 border border-white/10 outline-none focus:border-emerald-500/50"
          style={{ colorScheme: "dark" }}>
          <option value="">Tüm Durumlar</option>
          <option value="true">Doğrulanmış</option>
          <option value="false">Bekliyor</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <div className="text-4xl mb-4">👥</div>
          <p className="text-white font-medium mb-2">{search ? "Sonuç bulunamadı" : "Henüz kullanıcı yok"}</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "#a0a8d0" }}>Ad Soyad</th>
                  <th className="text-left py-3 px-4 font-medium hidden sm:table-cell" style={{ color: "#a0a8d0" }}>E-posta</th>
                  <th className="text-left py-3 px-4 font-medium hidden md:table-cell" style={{ color: "#a0a8d0" }}>Telefon</th>
                  <th className="text-left py-3 px-4 font-medium hidden lg:table-cell" style={{ color: "#a0a8d0" }}>Rol</th>
                  <th className="text-left py-3 px-4 font-medium hidden lg:table-cell" style={{ color: "#a0a8d0" }}>Doğrulama</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: "#a0a8d0" }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-white font-medium">{u.name} {u.surname}</p>
                      <p className="text-xs sm:hidden" style={{ color: "#a0a8d0" }}>{u.email}</p>
                    </td>
                    <td className="py-3 px-4 text-white hidden sm:table-cell">{u.email}</td>
                    <td className="py-3 px-4 hidden md:table-cell" style={{ color: "#a0a8d0" }}>{u.phone}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase"
                        style={{
                          background: u.role === "ROOT" ? "rgba(255,255,255,0.05)" : u.role === "OWNER" ? "rgba(227,6,19,0.15)" : u.role === "ADMIN" ? "rgba(96,165,250,0.15)" : "rgba(167,139,250,0.15)",
                          color: u.role === "ROOT" ? "#a0a8d0" : u.role === "OWNER" ? "#ff8080" : u.role === "ADMIN" ? "#60a5fa" : "#a78bfa",
                        }}>
                        {u.role === "ROOT" ? "MEMBER" : u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: u.emailVerified ? "rgba(74,222,128,0.15)" : "rgba(251,146,60,0.15)",
                          color: u.emailVerified ? "#4ade80" : "#fb923c",
                        }}>
                        {u.emailVerified ? "✓ Doğrulandı" : "Bekliyor"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setDetailUser(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                          style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                          Detay
                        </button>
                        { (userRole === "ROOT" || (perms[`${userRole.toLowerCase()}.can_delete_users`] && (RolePriority[userRole as keyof typeof RolePriority] || 0) > (RolePriority[u.role as keyof typeof RolePriority] || 0))) && (
                          deleteConfirm === u.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(u.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                style={{ background: "rgba(227,6,19,0.3)", color: "#ff8080" }}>Sil</button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                style={{ background: "rgba(255,255,255,0.06)", color: "#a0a8d0" }}>İptal</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(u.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                              style={{ background: "rgba(227,6,19,0.15)", color: "#ff8080" }}>
                              Sil
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDetailUser(null)} />
          <div className="relative z-50 w-full max-w-lg rounded-2xl p-6"
            style={{ background: "#0f1340", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Kullanıcı Detay {(userRole === "OWNER" || userRole === "ROOT") && (editMode ? " (Düzenleme)" : "")}</h2>
              <button onClick={() => { setDetailUser(null); setEditMode(false) }} className="text-white text-xl">✕</button>
            </div>

            {editMode && editForm ? (
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                {renderField("İsim", editForm.name, "can_edit_user_name", (v) => setEditForm({...editForm, name: v}))}
                {renderField("Soyisim", editForm.surname, "can_edit_user_name", (v) => setEditForm({...editForm, surname: v}))}
                {renderField("E-posta", editForm.email, "can_edit_user_email", (v) => setEditForm({...editForm, email: v}), "email")}
                {renderField("Telefon", editForm.phone, "can_edit_user_phone", (v) => setEditForm({...editForm, phone: v}), "tel")}
                {renderField("TC No", editForm.tcNo, "can_edit_user_tc", (v) => setEditForm({...editForm, tcNo: v}))}
                {renderField("Doğum Tarihi", editForm.birthDate, "can_edit_user_birthdate", (v) => setEditForm({...editForm, birthDate: v}), "date")}
                {renderField("Üniversite", editForm.university || "", "can_edit_user_university", (v) => setEditForm({...editForm, university: v}))}
                {renderField("Fakülte", editForm.faculty || "", "can_edit_user_faculty", (v) => setEditForm({...editForm, faculty: v}))}
                {renderField("Bölüm", editForm.department || "", "can_edit_user_department", (v) => setEditForm({...editForm, department: v}))}
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: (userRole === "ROOT" || perms[`${userRole.toLowerCase()}.can_edit_user_gender`]) ? "#10b981" : "#64748b" }}>
                    Cinsiyet {(userRole === "ROOT" || perms[`${userRole.toLowerCase()}.can_edit_user_gender`]) && "• Düzenlenebilir"}
                  </label>
                  {(userRole === "ROOT" || perms[`${userRole.toLowerCase()}.can_edit_user_gender`]) ? (
                    <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} 
                      className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all">
                      <option value="">Seçilmedi</option>
                      <option value="Erkek">Erkek</option>
                      <option value="Kadın">Kadın</option>
                    </select>
                  ) : (
                    <div className="px-1 py-1 text-slate-500 font-medium text-sm opacity-60">
                      {editForm.gender || "Belirtilmemiş"}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: (userRole === "ROOT" || perms[`${userRole.toLowerCase()}.can_edit_user_role`]) ? "#10b981" : "#64748b" }}>
                    Rol {(userRole === "ROOT" || perms[`${userRole.toLowerCase()}.can_edit_user_role`]) && "• Düzenlenebilir"}
                  </label>
                  {(userRole === "ROOT" || perms[`${userRole.toLowerCase()}.can_edit_user_role`]) ? (
                    <select value={editForm.role} 
                      onChange={e => setEditForm({...editForm, role: e.target.value})} 
                      className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all">
                      {["MEMBER", "STAFF", "ADMIN", "OWNER"].filter(r => (RolePriority[r as keyof typeof RolePriority] || 0) < (RolePriority[userRole as keyof typeof RolePriority] || 0)).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      {userRole === "ROOT" && <option value="ROOT">ROOT</option>}
                    </select>
                  ) : (
                    <div className="px-1 py-1 text-slate-500 font-medium text-sm opacity-60">
                      {editForm.role === "ROOT" ? "MEMBER" : editForm.role}
                    </div>
                  )}
                </div>
                { userRole === "ROOT" && (
                  <div className="col-span-2 mt-2 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-purple-400">Şifre Yönetimi (Sadece ROOT)</label>
                    <div className="flex gap-3 mt-2">
                      <div className="flex-1">
                         <p className="text-[10px] text-slate-400">Mevcut Şifre</p>
                         <p className="text-sm text-white font-mono bg-white/5 px-2 py-1 rounded mt-1">{(editForm as any).password_actual || "Gizli"}</p>
                      </div>
                      <div className="flex-[2]">
                         <p className="text-[10px] text-slate-400">Yeni Şifre</p>
                         <input type="text" placeholder="Yeni şifre belirle..." value={editForm.password || ""} 
                           onChange={e => setEditForm({...editForm, password: e.target.value})} 
                           className="w-full bg-slate-800 border border-white/10 rounded px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-purple-500" 
                         />
                      </div>
                    </div>
                    <p className="text-[9px] text-purple-300/60 mt-2 italic">* Şifreler veritabanında açık metin olarak tutulur.</p>
                  </div>
                )}
                <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">E-posta Doğrulanmış</p>
                    <p className="text-[10px]" style={{ color: "#a0a8d0" }}>Manuel olarak onaylayabilirsiniz</p>
                  </div>
                  <button 
                    type="button"
                    disabled={!(userRole === "OWNER" || userRole === "ROOT" || perms[`${userRole.toLowerCase()}.can_verify_emails_manually`])}
                    onClick={() => setEditForm({...editForm, emailVerified: !editForm.emailVerified})}
                    className={`w-12 h-6 rounded-full relative transition-all ${editForm.emailVerified ? 'bg-green-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editForm.emailVerified ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                {[
                  { label: "İsim", value: detailUser.name },
                  { label: "Soyisim", value: detailUser.surname },
                  { label: "E-posta", value: detailUser.email },
                  { label: "Telefon", value: detailUser.phone },
                  { label: "TC No", value: detailUser.tcNo },
                  { label: "Doğum Tarihi", value: formatDate(detailUser.birthDate) },
                  { label: "Üniversite", value: detailUser.university || "-" },
                  { label: "Fakülte", value: detailUser.faculty || "-" },
                  { label: "Bölüm", value: detailUser.department || "-" },
                  { label: "Cinsiyet", value: detailUser.gender || "-" },
                  { label: "Rol", value: detailUser.role === "ROOT" ? "MEMBER" : detailUser.role },
                  ...(userRole === "ROOT" ? [{ label: "Şifre", value: (detailUser as any).password || "Gizli" }] : []),
                  { label: "Kayıt Tarihi", value: formatDate(detailUser.createdAt) },
                  { label: "E-posta Doğrulama", value: detailUser.emailVerified ? "Doğrulandı" : "Bekliyor" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs mb-0.5" style={{ color: "#a0a8d0" }}>{item.label}</p>
                    <p className="text-white text-sm font-medium truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <div className="flex gap-3">
                <button onClick={() => { setDetailUser(null); setEditMode(false); }}
                  className="flex-1 py-3 rounded-xl font-medium text-sm"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#a0a8d0", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Kapat
                </button>
                { detailUser && (
                  userRole === "ROOT" || 
                  (perms[`${userRole.toLowerCase()}.can_edit_users`] && (
                    (RolePriority[userRole as keyof typeof RolePriority] || 0) > (RolePriority[detailUser.role as keyof typeof RolePriority] || 0) ||
                    detailUser.id === currentUserId
                  ))
                ) && (
                  editMode ? (
                    <button onClick={handleEditSubmit} disabled={isSaving}
                      className="flex-1 py-3 rounded-xl font-medium text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                      {isSaving ? "Kaydediliyor..." : "💾 Kaydet"}
                    </button>
                  ) : (
                    <button onClick={enableEditMode}
                      className="flex-1 py-3 rounded-xl font-medium text-sm text-white"
                      style={{ background: "rgba(168,85,247,0.3)", border: "1px solid rgba(168,85,247,0.5)" }}>
                      ✏️ Düzenle
                    </button>
                  )
                )}
                { detailUser && (userRole === "ROOT" || (perms[`${userRole.toLowerCase()}.can_delete_users`] && (RolePriority[userRole as keyof typeof RolePriority] || 0) > (RolePriority[detailUser.role as keyof typeof RolePriority] || 0))) && (
                  <button onClick={() => { if(detailUser && confirm("Emin misiniz?")) { handleDelete(detailUser.id); setDetailUser(null); } }}
                    className="py-3 px-6 rounded-xl font-semibold text-sm transition"
                    style={{ background: "rgba(227,6,19,0.3)", color: "#ff8080", border: "1px solid rgba(227,6,19,0.4)" }}>
                    🗑️ Sil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
