"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface Seminar {
  id: string
  name: string
  capacity: number | null
  isActive: boolean
}

type ScanType = "CHECKIN" | "CHECKOUT"

export default function ScanPage() {
  const [seminars, setSeminars] = useState<Seminar[]>([])
  const [selectedSeminar, setSelectedSeminar] = useState("")
  const [scanType, setScanType] = useState<ScanType>("CHECKIN")
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; name?: string; durationText?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScannedRef = useRef<string>("")
  const cooldownRef = useRef<boolean>(false)

  useEffect(() => {
    fetch("/api/seminars")
      .then((res) => res.json())
      .then((data) => { if (data.seminars) setSeminars(data.seminars) })
  }, [])

  async function startScanner() {
    if (!selectedSeminar) {
      setResult({ success: false, message: "Lütfen önce bir seminer seçin." })
      return
    }

    setScanning(true)
    await new Promise(resolve => setTimeout(resolve, 50))

    const scanner = new Html5Qrcode("qr-reader", { verbose: false })
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          disableFlip: true,
          videoConstraints: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "environment"
          }
        },
        async (decodedText) => {
          if (cooldownRef.current || decodedText === lastScannedRef.current) return
          lastScannedRef.current = decodedText
          cooldownRef.current = true
          await handleScan(decodedText)
          setTimeout(() => {
            cooldownRef.current = false
            lastScannedRef.current = ""
          }, 2000)
        },
        (error) => {
          if (!error?.startsWith("QR code parse error")) {
            console.warn("Scan:", error)
          }
        }
      )
    } catch (err: unknown) {
      console.error("Kamera hatası:", err)
      setScanning(false)
      setResult({ 
        success: false, 
        message: "Kamera başlatılamadı. Sayfayı yenileyip tekrar deneyin." 
      })
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch (e) {
        console.warn(e)
      }
      scannerRef.current = null
    }
    setScanning(false)
  }

  async function handleScan(qrToken: string) {
    setLoading(true)
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken, seminarId: selectedSeminar, type: scanType }),
      })
      const data = await res.json()

      if (!res.ok) {
        setResult({ success: false, message: data.error || "İşlem başarısız" })
      } else {
        setResult({
          success: true,
          message: data.message,
          name: `${data.user?.name || ''} ${data.user?.surname || ''}`.trim() || undefined,
          durationText: data.durationText,
        })
      }
    } catch {
      setResult({ success: false, message: "Sunucu hatası." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  const cardStyle = {
    background: "rgba(15, 15, 17, 0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(227, 6, 19, 0.3)",
    boxShadow: "0 0 20px rgba(227, 6, 19, 0.1)",
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 p-4 relative z-10 mt-4 flex flex-col">
      {/* 1. Üst Kısım: Giriş Yapan Kişinin Bilgisi (Sonuç) */}
      {result && !loading && (
        <div className="rounded-2xl p-6 text-center space-y-3 relative overflow-hidden order-1"
          style={{
            background: result.success ? "rgba(74,222,128,0.05)" : "rgba(227,6,19,0.05)",
            border: result.success ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(227,6,19,0.3)",
            backdropFilter: "blur(12px)",
            boxShadow: result.success ? "0 0 30px rgba(74,222,128,0.1)" : "0 0 30px rgba(227,6,19,0.1)"
          }}>
          <div className="text-4xl drop-shadow-md">{result.success ? "✅" : "❌"}</div>
          {result.name && <p className="text-white font-bold text-xl tracking-tight">{result.name}</p>}
          <p className="text-sm font-medium" style={{ color: result.success ? "#86efac" : "#ff8080" }}>
            {result.message}
          </p>
          {result.durationText && (
            <div className="mt-4 p-4 rounded-xl text-left border" style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Oturum Süresi</p>
              <p className="text-sm text-gray-200 font-mono">{result.durationText}</p>
            </div>
          )}
        </div>
      )}

      {/* Yükleniyor Göstergesi */}
      {loading && (
        <div className="rounded-2xl p-6 text-center order-1" style={cardStyle}>
          <div className="text-white animate-pulse">İşleniyor...</div>
        </div>
      )}

      {/* 2. Logolar Alanı (Başlık yerine) */}
      <div className="flex justify-center items-center gap-4 mb-2 order-2 mt-6">
        <a href="https://t3vakfi.org/" target="_blank" rel="noopener noreferrer">
          <img 
            src="/t3.png" 
            alt="T3 Vakfı Logo" 
            className="h-14 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] p-1 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </a>
        <a href="https://yildiz.edu.tr/" target="_blank" rel="noopener noreferrer">
          <img 
            src="/ytu.png" 
            alt="YTU Logo" 
            className="h-16 object-contain contrast-125 brightness-110 drop-shadow-md p-1 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </a>
        <a href="https://teknofest.org/" target="_blank" rel="noopener noreferrer">
          <img 
            src="/teknofest.png" 
            alt="Teknofest Logo" 
            className="h-14 object-contain drop-shadow-[0_0_8px_rgba(227,6,19,0.4)] p-1 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </a>
      </div>

      <div className="text-center mb-4 order-3">
        <p className="text-[#E30613] text-sm font-medium tracking-widest uppercase">
          Giriş - Çıkış Kontrol Sistemi
        </p>
      </div>

      {/* 3. Kamera Alanı */}
      <div 
        className="rounded-2xl overflow-hidden shadow-2xl relative order-4 border-2" 
        style={{ 
          ...cardStyle, 
          display: scanning ? "block" : "none",
          minHeight: "360px", // Kamera daha kompakt dursun
          borderColor: scanType === "CHECKIN" ? "rgba(74,222,128,0.5)" : "rgba(227,6,19,0.5)",
          boxShadow: scanType === "CHECKIN" ? "0 0 30px rgba(74,222,128,0.2)" : "0 0 30px rgba(227,6,19,0.2)"
        }}
      >
        <div 
          id="qr-reader" 
          style={{ width: "100%", height: "360px", backgroundColor: "#000" }} 
        />
      </div>

      {/* 4. Diğer Seçenekler (Seminer, Tür, Başlat) */}
      <div className="rounded-2xl p-6 space-y-4 order-5 mt-4" style={cardStyle}>
        <div>
          <label className="block text-sm mb-2" style={{ color: "#a0a8d0" }}>Seminer Seç</label>
          <select
            value={selectedSeminar}
            onChange={(e) => setSelectedSeminar(e.target.value)}
            disabled={scanning}
            className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", colorScheme: "dark" }}
          >
            <option value="">-- Seminer seçin --</option>
            {seminars.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: "#E30613" }}>İşlem Türü</label>
          <div className="grid grid-cols-2 gap-3">
            {(["CHECKIN", "CHECKOUT"] as ScanType[]).map((type) => (
              <button
                key={type}
                onClick={() => setScanType(type)}
                disabled={scanning}
                className="py-3 rounded-xl font-bold text-sm transition-all uppercase tracking-wide"
                style={{
                  background: scanType === type
                    ? type === "CHECKIN" ? "rgba(74,222,128,0.15)" : "rgba(227,6,19,0.15)"
                    : "rgba(255,255,255,0.03)",
                  border: scanType === type
                    ? type === "CHECKIN" ? "1px solid rgba(74,222,128,0.5)" : "1px solid rgba(227,6,19,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                  color: scanType === type
                    ? type === "CHECKIN" ? "#4ade80" : "#ff8080"
                    : "#6b7280",
                  textShadow: scanType === type ? "0 0 10px currentColor" : "none"
                }}
              >
                {type === "CHECKIN" ? "GİRİŞ YAP" : "ÇIKIŞ YAP"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={scanning ? stopScanner : startScanner}
          disabled={!selectedSeminar}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: scanning ? "rgba(227,6,19,0.3)" : "#E30613" }}
        >
          {scanning ? "⏹ Kamerayı Durdur" : "📷 Kamerayı Başlat"}
        </button>
      </div>

      {/* Move original camera area to old location but it's removed and reordered above */}
    </div>
  )
}