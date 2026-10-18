"use client"

import { useEffect, useState } from "react"

interface User {
  id: string
  name: string
  surname: string
  email: string
  role: "MEMBER" | "STAFF" | "ADMIN" | "OWNER" | "ROOT"
  university: string | null
}

export default function RolesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [userRole, setUserRole] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [perms, setPerms] = useState<Record<string, boolean>>({})

  const RolePriority: Record<string, number> = {
    ROOT: 4,
    OWNER: 3,
    ADMIN: 2,
    STAFF: 1,
    MEMBER: 0
  }

  useEffect(() => { 
    fetchUsers() 
    fetch("/api/admin/users") // roles page can reuse fetching mechanism or owner/users is same, but I will get permissions first.
    fetch("/api/owner/permissions")
      .then(r => r.json())
      .then(d => { if (d.permissions) setPerms(d.permissions) })

    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUserRole(d.user.role)
          setCurrentUserId(d.user.id)
        }
      })
  }, [])

  async function fetchUsers() {
    const res = await fetch("/api/owner/users")
    const data = await res.json()
    if (data.users) setUsers(data.users)
    setLoading(false)
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (newRole === "OWNER") {
      if (!confirm("⚠️ DİKKAT: Bu kullanıcıya OWNER yetkisi veriyorsunuz. Emin misiniz?")) return
    }
    setSavingId(userId)
    const res = await fetch("/api/owner/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole })
    })
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u))
    } else {
      alert("Yetki değiştirilemedi.")
    }
    setSavingId(null)
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !search || u.name.toLowerCase().includes(q) || u.surname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchRole = !filterRole || u.role === filterRole
    return matchSearch && matchRole
  })

  const roleColors: Record<string, { bg: string; color: string }> = {
    OWNER: { bg: "rgba(168,85,247,0.2)", color: "#c084fc" },
    ADMIN: { bg: "rgba(227,6,19,0.2)", color: "#ff8080" },
    STAFF: { bg: "rgba(234,179,8,0.2)", color: "#fde047" },
    MEMBER: { bg: "rgba(74,222,128,0.2)", color: "#86efac" },
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  if (loading) return <div className="text-white animate-pulse text-center py-20">Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Rol Atamaları</h1>
        <p className="text-sm" style={{ color: "#a0a8d0" }}>
          Kullanıcıların rollerini değiştirin. {users.length} kullanıcı kayıtlı.
        </p>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="İsim veya e-posta ara..."
          className="flex-1 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="sm:w-48 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", colorScheme: "dark" }}>
          <option value="">Tüm Roller</option>
          <option value="OWNER">OWNER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="STAFF">STAFF</option>
          <option value="MEMBER">MEMBER</option>
        </select>
      </div>

      {/* Kullanıcı Listesi */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left py-3 px-4 font-medium text-[#a0a8d0]">Kullanıcı</th>
                <th className="text-left py-3 px-4 font-medium text-[#a0a8d0] hidden sm:table-cell">Üniversite</th>
                <th className="text-left py-3 px-4 font-medium text-[#a0a8d0]">Mevcut Rol</th>
                <th className="text-left py-3 px-4 font-medium text-[#a0a8d0]">Yetki Değiştir</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const rc = roleColors[user.role] || roleColors.MEMBER
                return (
                  <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-white font-medium">{user.name} {user.surname}</p>
                      <p className="text-xs" style={{ color: "#a0a8d0" }}>{user.email}</p>
                    </td>
                    <td className="py-3 px-4 text-xs hidden sm:table-cell" style={{ color: "#a0a8d0" }}>
                      {user.university || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                        style={{ background: rc.bg, color: rc.color }}>
                        {user.role === "ROOT" ? "MEMBER" : user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      { (() => {
                        const targetPriority = RolePriority[user.role] || 0;
                        const authPriority = RolePriority[userRole] || 0;
                        const canChangeRole = userRole === "ROOT" || (perms[`${userRole.toLowerCase()}.can_change_user_roles`] && authPriority > targetPriority && user.id !== currentUserId);

                        return canChangeRole ? (
                          <select
                            value={user.role}
                            disabled={savingId === user.id}
                            onChange={e => handleRoleChange(user.id, e.target.value)}
                            className="rounded-lg px-3 py-2 text-white text-xs bg-black/40 border border-white/20 focus:outline-none focus:border-purple-500"
                            style={{ colorScheme: "dark" }}>
                            {["MEMBER", "STAFF", "ADMIN", "OWNER"].filter(r => (RolePriority[r] || 0) < authPriority || userRole === "ROOT").map(r => (
                               <option key={r} value={r}>{r}</option>
                            ))}
                            {userRole === "ROOT" && <option value="ROOT">ROOT</option>}
                          </select>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 italic opacity-60">Düzenleme Yetkisi Yok</span>
                            {user.id === currentUserId && <span className="text-[8px] text-purple-400 font-bold uppercase mt-0.5">Siz</span>}
                          </div>
                        )
                      })()}
                      {savingId === user.id && <span className="ml-2 text-xs text-purple-400 animate-pulse">...</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
