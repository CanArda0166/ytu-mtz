"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.")
      return
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      setError("Bir hata oluştu, lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p style={{ color: "#ff8080" }}>Geçersiz bağlantı.</p>
        <Link href="/login" className="text-white underline text-sm">Giriş sayfasına dön</Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-8 shadow-2xl"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}>

      {success ? (
        <div className="text-center space-y-4">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-white">Şifre Güncellendi</h2>
          <p style={{ color: "#a0a8d0" }} className="text-sm">
            Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-white mb-2">Yeni Şifre Belirle</h2>
          <p className="text-sm mb-6" style={{ color: "#a0a8d0" }}>
            En az 8 karakter içeren güçlü bir şifre belirleyin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Yeni Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                placeholder="En az 8 karakter"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Şifre Tekrar</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                placeholder="Şifrenizi tekrar girin"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(227,6,19,0.12)", border: "1px solid rgba(227,6,19,0.3)", color: "#ff8080" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3 rounded-xl transition-all duration-200 text-white"
              style={{ background: loading ? "#8a0a10" : "#E30613" }}
            >
              {loading ? "Güncelleniyor..." : "Şifremi Güncelle"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm" style={{ color: "#a0a8d0" }}>
              <span className="text-white underline">Giriş sayfasına dön</span>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0a0d2e 0%, #1a1f5e 40%, #2a0a0a 100%)" }}>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(227,6,19,0.15) 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/teknofest.png" alt="Teknofest Logo" className="h-48 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Türkiye Teknoloji Takımı Vakfı</h1>
          <p className="mt-2 text-sm tracking-widest uppercase" style={{ color: "#a0a8d0" }}>
            Zirve Yönetim Sistemi
          </p>
        </div>

        <Suspense fallback={<div className="text-white text-center">Yükleniyor...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2025 T3 Vakfı — Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  )
}