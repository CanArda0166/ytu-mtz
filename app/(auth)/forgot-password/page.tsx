"use client"

import { useState, Suspense } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }

      setSent(true)
    } catch {
      setError("Bir hata oluştu, lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-[#050505]">
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mb-10">
          <div className="flex justify-center mb-6">
            <img 
              src="/teknofest.png" 
              alt="Teknofest" 
              className="h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest italic">T3 VAKFI</h1>
          <div className="h-0.5 w-16 bg-[#E30613] mx-auto my-2" />
        </div>

        <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 text-left">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Sinyal Gönderildi</h2>
              <p className="text-sm font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Sistemde kayıtlı bir hesap bulunursa, şifre sıfırlama veri paketi e-posta adresinize iletilecektir.
              </p>
              <Link href="/login"
                className="block w-full font-bold py-4 rounded-xl text-center text-white mt-6 transition shadow-lg"
                style={{ 
                  background: "#E30613",
                }}>
                GİRİŞ MERKEZİNE DÖN
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight text-center">Şifre Sıfırlama</h2>
              <p className="text-xs mb-8 font-medium uppercase tracking-widest text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                Sıfırlama bağlantısı için e-posta adresinizi girin.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-white/40">E-posta Adresi</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl px-5 py-4 text-white placeholder-white/10 focus:outline-none transition ring-1 ring-white/10 focus:ring-[#E30613]/50"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                    placeholder="ornek@eposta.com"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-xs text-center font-bold tracking-widest bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-bold py-4 rounded-xl transition mt-2 text-white shadow-lg"
                  style={{ 
                    background: loading ? "#8a0a10" : "#E30613",
                  }}
                >
                  {loading ? "GÖNDERİLİYOR..." : "BAĞLANTI GÖNDER"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-white/20 hover:text-white transition">
                  Geri Dön
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}