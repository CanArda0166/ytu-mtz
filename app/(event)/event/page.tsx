"use client"

import { useEffect, useState, useCallback } from "react"
import QRCode from "qrcode"

export default function QRPage() {
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [timeLeft, setTimeLeft] = useState(60)
  const [loading, setLoading] = useState(true)

  const generateQR = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/qr")
      const data = await res.json()

      const url = await QRCode.toDataURL(data.token, {
        width: 280,
        margin: 2,
        color: { dark: "#0a0d2e", light: "#ffffff" },
      })

      setQrDataUrl(url)
      setTimeLeft(60)
    } catch {
      console.error("QR oluşturulamadı")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    generateQR()
  }, [generateQR])

  useEffect(() => {
    if (timeLeft <= 0) {
      generateQR()
      return
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, generateQR])

  const circumference = 2 * Math.PI * 24
  const strokeDashoffset = circumference - (timeLeft / 60) * circumference

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">QR Kodum</h1>
        <p style={{ color: "#a0a8d0" }} className="text-sm">
          Bu kodu görevliye okutarak etkinliğe giriş yapabilirsiniz.
        </p>
      </div>

      <div className="relative flex items-center justify-center">
        {/* Yuvarlak sayacı kaldırdık, etrafını saran animasyonlu dive geçtik */}
        <div className="relative rounded-2xl p-5 shadow-2xl flex items-center justify-center overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}>
          
          {/* Arka plan kenarlık animasyonu (Kare çerçeve SVG'si) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ borderRadius: "1rem" }}>
            <rect
              x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="14" ry="14"
              fill="none"
              stroke={timeLeft <= 10 ? "#E30613" : "#4ade80"}
              strokeWidth="4"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - (timeLeft / 60) * 100}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>

          {loading ? (
            <div className="w-[280px] h-[280px] flex items-center justify-center">
              <div className="text-white text-sm animate-pulse">QR oluşturuluyor...</div>
            </div>
          ) : (
            <img src={qrDataUrl} alt="QR Kod" className="rounded-xl relative z-10" width={280} height={280} />
          )}

          {/* Alt kısım — saniye göstergesi */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full z-20"
            style={{ background: "rgba(10,13,46,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-[10px] font-mono text-center" style={{ color: timeLeft <= 10 ? "#ff8080" : "#a0a8d0" }}>
              {timeLeft}<span className="text-[8px] ml-0.5">sn</span>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2 mt-2">
        <p className="text-xs" style={{ color: "#a0a8d0" }}>
          QR kod her 60 saniyede bir otomatik yenilenir.
        </p>
        <button onClick={generateQR}
          className="text-sm underline transition"
          style={{ color: timeLeft <= 10 ? "#ff8080" : "#a0a8d0" }}>
          Manuel yenile
        </button>
      </div>
    </div>
  )
}