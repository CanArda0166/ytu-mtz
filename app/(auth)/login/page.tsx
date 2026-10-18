"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  const verified = searchParams.get("verified")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [loginEnabled, setLoginEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkConfig() {
      try {
        const res = await fetch("/api/config")
        const data = await res.json()
        setLoginEnabled(data.loginEnabled)
      } catch {
        setLoginEnabled(true)
      }
    }
    checkConfig()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      if (data.role === "ADMIN" || data.role === "OWNER") {
        router.push("/event")
      } else {
        router.push("/event")
      }
    } catch {
      setError("Bir hata oluştu, lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl p-8 shadow-2xl"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}>
      <h2 className="text-xl font-semibold text-white mb-6">Giriş Yap</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            placeholder="ornek@eposta.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            placeholder="••••••••"
            required
          />
        </div>

        {registered && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}>
            Kayıt başarılı! Lütfen e-postanızı doğrulayın.
          </div>
        )}

        {verified && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}>
            E-posta doğrulandı! Giriş yapabilirsiniz.
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(227,6,19,0.12)", border: "1px solid rgba(227,6,19,0.3)", color: "#ff8080" }}>
            {error}
          </div>
        )}

        {loginEnabled === false && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#fcd34d" }}>
            <span className="mt-0.5">⚠️</span>
            <p>Sistem şu anda ROOT tarafından kilitlendi. Sadece yetkili kullanıcılar giriş yapabilir.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full font-semibold py-3 rounded-xl transition-all duration-200 mt-2 text-white"
          style={{ background: loading ? "#8a0a10" : "#E30613" }}
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link href="/register" className="block text-sm transition" style={{ color: "#a0a8d0" }}>
          Hesabın yok mu? <span className="text-white underline">Kayıt ol</span>
        </Link>
        <Link href="/forgot-password" className="block text-sm transition" style={{ color: "rgba(255,255,255,0.3)" }}>
          Şifremi unuttum
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
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
          <LoginForm />
        </Suspense>

        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2025 T3 Vakfı — Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  )
}