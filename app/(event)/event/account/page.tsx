"use client"

import { useEffect, useState } from "react"

interface User {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  birthDate: string
  university: string
  faculty: string
  department: string
  role: string
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.")
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setError("Yeni şifre en az 8 karakter olmalıdır.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }

      setSuccess("Şifreniz başarıyla güncellendi.")
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch {
      setError("Bir hata oluştu.")
    } finally {
      setSaving(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-white animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Hesabım</h1>
        <p style={{ color: "#a0a8d0" }} className="text-sm">
          Kişisel bilgilerinizi görüntüleyebilir ve şifrenizi değiştirebilirsiniz.
        </p>
      </div>

      {/* Kişisel bilgiler */}
      <div className="rounded-2xl p-6 space-y-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
        <h2 className="text-lg font-semibold text-white mb-4">Kişisel Bilgiler</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "İsim", value: user?.name },
            { label: "Soyisim", value: user?.surname },
            { label: "E-posta", value: user?.email },
            { label: "Telefon", value: user?.phone },
            { label: "Doğum Tarihi", value: user?.birthDate ? formatDate(user.birthDate) : "-" },
            { label: "Üniversite", value: user?.university || "-" },
            { label: "Fakülte", value: user?.faculty || "-" },
            { label: "Bölüm", value: user?.department || "-" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs mb-1" style={{ color: "#a0a8d0" }}>{item.label}</p>
              <p className="text-white font-medium text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Şifre değiştir */}
      <div className="rounded-2xl p-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
        <h2 className="text-lg font-semibold text-white mb-4">Şifre Değiştir</h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { label: "Mevcut Şifre", key: "currentPassword", placeholder: "Mevcut şifreniz" },
            { label: "Yeni Şifre", key: "newPassword", placeholder: "En az 8 karakter" },
            { label: "Yeni Şifre Tekrar", key: "confirmPassword", placeholder: "Yeni şifrenizi tekrar girin" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>{field.label}</label>
              <input
                type="password"
                value={passwordForm[field.key as keyof typeof passwordForm]}
                onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                required
                className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </div>
          ))}

          {error && (
            <div className="rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(227,6,19,0.12)", border: "1px solid rgba(227,6,19,0.3)", color: "#ff8080" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", color: "#86efac" }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full font-semibold py-3 rounded-xl transition-all duration-200 text-white"
            style={{ background: saving ? "#8a0a10" : "#E30613" }}>
            {saving ? "Güncelleniyor..." : "Şifremi Güncelle"}
          </button>
        </form>
      </div>
    </div>
  )
}