"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const UNIVERSITIES = [
  "Abant İzzet Baysal Üniversitesi", "Abdullah Gül Üniversitesi", "Acıbadem Mehmet Ali Aydınlar Üniversitesi",
  "Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi", "Adıyaman Üniversitesi", "Afyon Kocatepe Üniversitesi",
  "Ağrı İbrahim Çeçen Üniversitesi", "Akdeniz Üniversitesi", "Aksaray Üniversitesi",
  "Alanya Alaaddin Keykubat Üniversitesi", "Altınbaş Üniversitesi", "Amasya Üniversitesi",
  "Anadolu Üniversitesi", "Ankara Bilim Üniversitesi", "Ankara Hacı Bayram Veli Üniversitesi",
  "Ankara Medipol Üniversitesi", "Ankara Müzik ve Güzel Sanatlar Üniversitesi", "Ankara Sosyal Bilimler Üniversitesi",
  "Ankara Üniversitesi", "Ankara Yıldırım Beyazıt Üniversitesi", "Antalya Bilim Üniversitesi",
  "Ardahan Üniversitesi", "Artvin Çoruh Üniversitesi", "Atatürk Üniversitesi",
  "Atılım Üniversitesi", "Avrasya Üniversitesi", "Bahçeşehir Üniversitesi",
  "Balıkesir Üniversitesi", "Bandırma Onyedi Eylül Üniversitesi", "Bartın Üniversitesi",
  "Başkent Üniversitesi", "Batman Üniversitesi", "Bayburt Üniversitesi",
  "Beykent Üniversitesi", "Beykoz Üniversitesi", "Bezmiâlem Vakıf Üniversitesi",
  "Bilecik Şeyh Edebali Üniversitesi", "Bingöl Üniversitesi", "Biruni Üniversitesi",
  "Bitlis Eren Üniversitesi", "Boğaziçi Üniversitesi", "Bolu Abant İzzet Baysal Üniversitesi",
  "Burdur Mehmet Akif Ersoy Üniversitesi", "Bursa Teknik Üniversitesi", "Bursa Uludağ Üniversitesi",
  "Çağ Üniversitesi", "Çanakkale Onsekiz Mart Üniversitesi", "Çankaya Üniversitesi",
  "Çankırı Karatekin Üniversitesi", "Çukurova Üniversitesi", "Demiroğlu Bilim Üniversitesi",
  "Dicle Üniversitesi", "Doğuş Üniversitesi", "Dokuz Eylül Üniversitesi",
  "Düzce Üniversitesi", "Ege Üniversitesi", "Erciyes Üniversitesi",
  "Erzincan Binali Yıldırım Üniversitesi", "Erzurum Teknik Üniversitesi", "Eskişehir Osmangazi Üniversitesi",
  "Eskişehir Teknik Üniversitesi", "Fatih Sultan Mehmet Vakıf Üniversitesi", "Fırat Üniversitesi",
  "Galatasaray Üniversitesi", "Gazi Üniversitesi", "Gaziantep Üniversitesi",
  "Gaziantep İslam Bilim ve Teknoloji Üniversitesi", "Gebze Teknik Üniversitesi", "Giresun Üniversitesi",
  "Gümüşhane Üniversitesi", "Hacettepe Üniversitesi", "Hakkari Üniversitesi",
  "Haliç Üniversitesi", "Harran Üniversitesi", "Hasan Kalyoncu Üniversitesi",
  "Hatay Mustafa Kemal Üniversitesi", "Hitit Üniversitesi", "Iğdır Üniversitesi",
  "Isparta Uygulamalı Bilimler Üniversitesi", "İbn Haldun Üniversitesi", "İhsan Doğramacı Bilkent Üniversitesi",
  "İnönü Üniversitesi", "İskenderun Teknik Üniversitesi", "İstanbul Arel Üniversitesi",
  "İstanbul Atlas Üniversitesi", "İstanbul Aydın Üniversitesi", "İstanbul Bilgi Üniversitesi",
  "İstanbul Esenyurt Üniversitesi", "İstanbul Galata Üniversitesi", "İstanbul Gedik Üniversitesi",
  "İstanbul Gelişim Üniversitesi", "İstanbul Kent Üniversitesi", "İstanbul Kültür Üniversitesi",
  "İstanbul Medeniyet Üniversitesi", "İstanbul Medipol Üniversitesi", "İstanbul Nişantaşı Üniversitesi",
  "İstanbul Okan Üniversitesi", "İstanbul Rumeli Üniversitesi", "İstanbul Sabahattin Zaim Üniversitesi",
  "İstanbul Teknik Üniversitesi", "İstanbul Ticaret Üniversitesi", "İstanbul Topkapı Üniversitesi",
  "İstanbul Üniversitesi", "İstanbul Üniversitesi-Cerrahpaşa", "İstanbul Yeni Yüzyıl Üniversitesi",
  "İstinye Üniversitesi", "İzmir Bakırçay Üniversitesi", "İzmir Demokrasi Üniversitesi",
  "İzmir Ekonomi Üniversitesi", "İzmir Kâtip Çelebi Üniversitesi", "İzmir Yüksek Teknoloji Enstitüsü",
  "Kafkas Üniversitesi", "Kahramanmaraş İstiklal Üniversitesi", "Kahramanmaraş Sütçü İmam Üniversitesi",
  "Kapadokya Üniversitesi", "Karabük Üniversitesi", "Karadeniz Teknik Üniversitesi",
  "Karamanoğlu Mehmetbey Üniversitesi", "Kastamonu Üniversitesi", "Kayseri Üniversitesi",
  "Kırıkkale Üniversitesi", "Kırklareli Üniversitesi", "Kırşehir Ahi Evran Üniversitesi",
  "Kilis 7 Aralık Üniversitesi", "Kocaeli Üniversitesi", "Koç Üniversitesi",
  "Konya Gıda ve Tarım Üniversitesi", "Konya Teknik Üniversitesi", "KTO Karatay Üniversitesi",
  "Kütahya Dumlupınar Üniversitesi", "Kütahya Sağlık Bilimleri Üniversitesi", "Lokman Hekim Üniversitesi",
  "Malatya Turgut Özal Üniversitesi", "Maltepe Üniversitesi", "Manisa Celâl Bayar Üniversitesi",
  "Marmara Üniversitesi", "Mardin Artuklu Üniversitesi", "MEF Üniversitesi",
  "Mersin Üniversitesi", "Mimar Sinan Güzel Sanatlar Üniversitesi", "Muğla Sıtkı Koçman Üniversitesi",
  "Munzur Üniversitesi", "Muş Alparslan Üniversitesi", "Necmettin Erbakan Üniversitesi",
  "Nevşehir Hacı Bektaş Veli Üniversitesi", "Niğde Ömer Halisdemir Üniversitesi", "Nuh Naci Yazgan Üniversitesi",
  "Ondokuz Mayıs Üniversitesi", "Ordu Üniversitesi", "Orta Doğu Teknik Üniversitesi",
  "Osmaniye Korkut Ata Üniversitesi", "Özyeğin Üniversitesi", "Pamukkale Üniversitesi",
  "Pîrî Reis Üniversitesi", "Recep Tayyip Erdoğan Üniversitesi", "Sabancı Üniversitesi",
  "Sakarya Uygulamalı Bilimler Üniversitesi", "Sakarya Üniversitesi", "Samsun Üniversitesi",
  "Sanko Üniversitesi", "Selçuk Üniversitesi", "Siirt Üniversitesi",
  "Sinop Üniversitesi", "Sivas Bilim ve Teknoloji Üniversitesi", "Sivas Cumhuriyet Üniversitesi",
  "Süleyman Demirel Üniversitesi", "Şırnak Üniversitesi", "Tarsus Üniversitesi",
  "Ted Üniversitesi", "Tekirdağ Namık Kemal Üniversitesi", "TOBB Ekonomi ve Teknoloji Üniversitesi",
  "Tokat Gaziosmanpaşa Üniversitesi", "Trabzon Üniversitesi", "Trakya Üniversitesi",
  "Türk-Alman Üniversitesi", "Türk Hava Kurumu Üniversitesi", "Uşak Üniversitesi",
  "Üsküdar Üniversitesi", "Van Yüzüncü Yıl Üniversitesi", "Yalova Üniversitesi",
  "Yaşar Üniversitesi", "Yeditepe Üniversitesi", "Yıldız Teknik Üniversitesi",
  "Yozgat Bozok Üniversitesi", "Yüksek İhtisas Üniversitesi", "Zonguldak Bülent Ecevit Üniversitesi",
]

const FACULTIES = [
  "Bilgisayar ve Bilişim Bilimleri Fakültesi", "Diş Hekimliği Fakültesi", "Eczacılık Fakültesi",
  "Eğitim Fakültesi", "Fen Fakültesi", "Edebiyat Fakültesi", "Fen-Edebiyat Fakültesi",
  "Güzel Sanatlar Fakültesi", "Havacılık ve Uzay Bilimleri Fakültesi", "Hukuk Fakültesi",
  "İktisadi ve İdari Bilimler Fakültesi", "İlahiyat Fakültesi", "İletişim Fakültesi",
  "Gemi İnşaatı ve Deniz Bilimleri Fakültesi", "Mimarlık Fakültesi", "Mühendislik Fakültesi",
  "Mühendislik ve Doğa Bilimleri Fakültesi", "Sağlık Bilimleri Fakültesi",
  "Spor Bilimleri Fakültesi", "Tasarım Fakültesi", "Teknoloji Fakültesi",
  "Tıp Fakültesi", "Uygulamalı Bilimler Fakültesi", "Veteriner Fakültesi",
  "Ziraat Fakültesi"
]

const DEPARTMENTS = [
  "Adalet", "Aşçılık", "Bilgisayar Mühendisliği", "Bilgisayar Programcılığı",
  "Bilişim Sistemleri Mühendisliği", "Biyomedikal Mühendisliği", "Biyomühendislik",
  "Çevre Mühendisliği", "Çocuk Gelişimi", "Diş Hekimliği", "Eczacılık", "Elektrik Mühendisliği",
  "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Felsefe",
  "Fizik", "Gemi İnşaatı ve Gemi Makineleri Mühendisliği", "Gıda Mühendisliği",
  "Görsel İletişim Tasarımı", "Grafik Tasarımı", "Halkla İlişkiler ve Tanıtım",
  "Havacılık ve Uzay Mühendisliği", "Hemşirelik", "Hukuk", "İç Mimarlık",
  "İç Mimarlık ve Çevre Tasarımı", "İktisat", "İletişim Tasarımı ve Yönetimi", "İlk ve Acil Yardım",
  "İngiliz Dili ve Edebiyatı", "İnşaat Mühendisliği", "İşletme", "Kimya", "Kimya Mühendisliği",
  "Lojistik", "Makine Mühendisliği", "Matematik", "Mekatronik Mühendisliği",
  "Metalurji ve Malzeme Mühendisliği", "Mimarlık", "Moleküler Biyoloji ve Genetik",
  "Okul Öncesi Öğretmenliği", "Psikoloji", "Rehberlik ve Psikolojik Danışmanlık",
  "Sağlık Yönetimi", "Sınıf Öğretmenliği", "Siyaset Bilimi ve Kamu Yönetimi", "Sosyoloji",
  "Tarih", "Tıbbi Dokümantasyon ve Sekreterlik", "Tıbbi Laboratuvar Teknikleri",
  "Tıp", "Türk Dili ve Edebiyatı", "Uluslararası Ticaret ve Lojistik", "Uluslararası İlişkiler",
  "Veterinerlik", "Yapay Zeka ve Veri Mühendisliği", "Yazılım Mühendisliği",
  "Yeni Medya ve İletişim", "Yönetim Bilişim Sistemleri"
]

function validateTcNo(tc: string): boolean {
  if (tc.length !== 11) return false
  if (tc[0] === "0") return false
  if (!/^\d{11}$/.test(tc)) return false

  const digits = tc.split("").map(Number)

  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7]

  const check10 = (oddSum * 7 - evenSum) % 10
  if (check10 !== digits[9]) return false

  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0)
  if (sumFirst10 % 10 !== digits[10]) return false

  return true
}

function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return re.test(email)
}

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, "").replace(/[()-]/g, "")
  return /^(05\d{9}|5\d{9})$/.test(cleaned)
}

function validateBirthDate(dateStr: string): { valid: boolean; message?: string } {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (isNaN(date.getTime())) return { valid: false, message: "Geçersiz tarih." }
  if (date >= today) return { valid: false, message: "Doğum tarihi bugünden önce olmalıdır." }

  const age = today.getFullYear() - date.getFullYear()
  if (age > 120) return { valid: false, message: "Geçersiz doğum tarihi." }
  if (age < 10) return { valid: false, message: "Kayıt olmak için en az 10 yaşında olmalısınız." }

  return { valid: true }
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: "", surname: "", email: "", phone: "",
    birthDate: "", tcNo: "", gender: "", university: "", faculty: "",
    department: "", password: "", passwordConfirm: "",
  })
  const [kvkk, setKvkk] = useState(false)
  const [terms, setTerms] = useState(false)
  const [showKvkkModal, setShowKvkkModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null)

  const [uniSuggestions, setUniSuggestions] = useState<string[]>([])
  const [showUniDropdown, setShowUniDropdown] = useState(false)
  const uniRef = useRef<HTMLDivElement>(null)

  const [facSuggestions, setFacSuggestions] = useState<string[]>([])
  const [showFacDropdown, setShowFacDropdown] = useState(false)
  const facRef = useRef<HTMLDivElement>(null)

  const [deptSuggestions, setDeptSuggestions] = useState<string[]>([])
  const [showDeptDropdown, setShowDeptDropdown] = useState(false)
  const deptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function checkConfig() {
      try {
        const res = await fetch("/api/config")
        const data = await res.json()
        setRegistrationEnabled(data.registrationEnabled)
      } catch {
        setRegistrationEnabled(true)
      }
    }
    checkConfig()

    function handleClickOutside(e: MouseEvent) {
      if (uniRef.current && !uniRef.current.contains(e.target as Node)) {
        setShowUniDropdown(false)
      }
      if (facRef.current && !facRef.current.contains(e.target as Node)) {
        setShowFacDropdown(false)
      }
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setShowDeptDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })

    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" })
    }

    if (name === "university") {
      if (value.length >= 2) {
        const filtered = UNIVERSITIES.filter((u) =>
          u.toLowerCase().includes(value.toLowerCase().toLocaleLowerCase("tr-TR"))
        ).slice(0, 8)
        setUniSuggestions(filtered)
        setShowUniDropdown(filtered.length > 0)
      } else {
        setShowUniDropdown(false)
      }
    }

    if (name === "faculty") {
      if (value.length >= 2) {
        const filtered = FACULTIES.filter((u) =>
          u.toLowerCase().includes(value.toLowerCase().toLocaleLowerCase("tr-TR"))
        ).slice(0, 8)
        setFacSuggestions(filtered)
        setShowFacDropdown(filtered.length > 0)
      } else {
        setShowFacDropdown(false)
      }
    }

    if (name === "department") {
      if (value.length >= 2) {
        const filtered = DEPARTMENTS.filter((u) =>
          u.toLowerCase().includes(value.toLowerCase().toLocaleLowerCase("tr-TR"))
        ).slice(0, 8)
        setDeptSuggestions(filtered)
        setShowDeptDropdown(filtered.length > 0)
      } else {
        setShowDeptDropdown(false)
      }
    }
  }

  function selectUniversity(uni: string) {
    setForm({ ...form, university: uni })
    setShowUniDropdown(false)
  }

  function selectFaculty(fac: string) {
    setForm({ ...form, faculty: fac })
    setShowFacDropdown(false)
  }

  function selectDepartment(dept: string) {
    setForm({ ...form, department: dept })
    setShowDeptDropdown(false)
  }

  function validateField(name: string, value: string): string {
    switch (name) {
      case "tcNo":
        if (!value) return ""
        return validateTcNo(value) ? "" : "Geçersiz TC Kimlik No."
      case "email":
        if (!value) return ""
        return validateEmail(value) ? "" : "Geçersiz e-posta adresi."
      case "phone":
        if (!value) return ""
        return validatePhone(value) ? "" : "Geçersiz telefon numarası. (05xx xxx xx xx)"
      case "birthDate": {
        if (!value) return ""
        const result = validateBirthDate(value)
        return result.valid ? "" : result.message || "Geçersiz tarih."
      }
      default:
        return ""
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target
    const err = validateField(name, value)
    if (err) {
      setFieldErrors({ ...fieldErrors, [name]: err })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const errors: Record<string, string> = {}

    if (!validateTcNo(form.tcNo)) errors.tcNo = "Geçersiz TC Kimlik No."
    if (!form.gender) errors.gender = "Cinsiyet seçimi zorunludur."
    if (!validateEmail(form.email)) errors.email = "Geçersiz e-posta adresi."
    if (!validatePhone(form.phone)) errors.phone = "Geçersiz telefon numarası."

    const birthResult = validateBirthDate(form.birthDate)
    if (!birthResult.valid) errors.birthDate = birthResult.message || "Geçersiz tarih."

    if (form.password !== form.passwordConfirm) {
      setError("Şifreler eşleşmiyor.")
      setFieldErrors(errors)
      return
    }
    if (form.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.")
      setFieldErrors(errors)
      return
    }
    if (!kvkk || !terms) {
      setError("Devam etmek için sözleşmeleri onaylamanız gerekmektedir.")
      setFieldErrors(errors)
      return
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError("Lütfen formdaki hataları düzeltin.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          surname: form.surname,
          email: form.email,
          phone: form.phone.replace(/\s+/g, "").replace(/[()-]/g, ""),
          birthDate: form.birthDate,
          tcNo: form.tcNo,
          gender: form.gender,
          university: form.university,
          faculty: form.faculty,
          department: form.department,
          password: form.password,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }

      router.push("/login?registered=true")
    } catch {
      setError("Bir hata oluştu, lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  const inputBaseClass = "w-full rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition"

  function getInputStyle(fieldName: string) {
    const hasError = !!fieldErrors[fieldName]
    return {
      background: "rgba(255,255,255,0.08)",
      border: hasError ? "1px solid rgba(227,6,19,0.6)" : "1px solid rgba(255,255,255,0.15)",
      colorScheme: "dark" as const,
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0a0d2e 0%, #1a1f5e 40%, #2a0a0a 100%)" }}>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(227,6,19,0.15) 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/teknofest.png" alt="Teknofest Logo" className="h-40 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Türkiye Teknoloji Takımı Vakfı</h1>
          <p className="mt-2 text-sm tracking-widest uppercase" style={{ color: "#a0a8d0" }}>
            Zirve Yönetim Sistemi
          </p>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}>
          <h2 className="text-xl font-semibold text-white mb-6">Kayıt Ol</h2>

          {registrationEnabled === false ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
               <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-red-500/50 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <span className="text-4xl">🔒</span>
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-bold text-white">Sistem Kilitlendi</h3>
                 <p className="text-sm max-w-xs mx-auto" style={{ color: "#a0a8d0" }}>
                   Yeni kayıt işlemleri şu anda ROOT admin tarafından geçici olarak durdurulmuştur.
                 </p>
               </div>
               <Link href="/login" className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition text-sm font-medium text-white">
                  Giriş Sayfasına Dön
               </Link>
            </div>
          ) : registrationEnabled === null ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ad */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>İsim</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Adınız" required className={inputBaseClass} style={getInputStyle("name")} />
                </div>
  
                {/* Soyad */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Soyisim</label>
                  <input type="text" name="surname" value={form.surname} onChange={handleChange}
                    placeholder="Soyadınız" required className={inputBaseClass} style={getInputStyle("surname")} />
                </div>
  
                {/* E-posta */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>E-posta</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur}
                    placeholder="ornek@eposta.com" required className={inputBaseClass} style={getInputStyle("email")} />
                  {fieldErrors.email && <p className="text-xs mt-1" style={{ color: "#ff8080" }}>{fieldErrors.email}</p>}
                </div>
  
                {/* Telefon */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Telefon</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur}
                    placeholder="05xx xxx xx xx" required className={inputBaseClass} style={getInputStyle("phone")} />
                  {fieldErrors.phone && <p className="text-xs mt-1" style={{ color: "#ff8080" }}>{fieldErrors.phone}</p>}
                </div>
  
                {/* Doğum Tarihi */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Doğum Tarihi</label>
                  <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} onBlur={handleBlur}
                    required className={inputBaseClass} style={getInputStyle("birthDate")} />
                  {fieldErrors.birthDate && <p className="text-xs mt-1" style={{ color: "#ff8080" }}>{fieldErrors.birthDate}</p>}
                </div>
  
                {/* TC No */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>TC Kimlik No</label>
                  <input type="text" name="tcNo" value={form.tcNo} onChange={handleChange} onBlur={handleBlur}
                    placeholder="xxxxxxxxxxx" maxLength={11} required className={inputBaseClass} style={getInputStyle("tcNo")} />
                  {fieldErrors.tcNo && <p className="text-xs mt-1" style={{ color: "#ff8080" }}>{fieldErrors.tcNo}</p>}
                </div>
                
                {/* Cinsiyet */}
                <div className="md:col-span-2">
                  <label className="block text-sm mb-2" style={{ color: "#a0a8d0" }}>Cinsiyet</label>
                  <div className="flex gap-4">
                    {["Erkek", "Kadın"].map((g) => (
                      <label key={g} 
                        className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${form.gender === g ? 'bg-red-600/20 border-red-600/50 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                        <input type="radio" name="gender" value={g} checked={form.gender === g} 
                          onChange={handleChange} className="hidden" />
                        <span className="text-sm font-medium">{g}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.gender && <p className="text-xs mt-1" style={{ color: "#ff8080" }}>{fieldErrors.gender}</p>}
                </div>
  
                {/* Üniversite - autocomplete */}
                <div ref={uniRef} className="relative">
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Üniversite</label>
                  <input type="text" name="university" value={form.university} onChange={handleChange}
                    onFocus={() => { if (form.university.length >= 2) setShowUniDropdown(uniSuggestions.length > 0) }}
                    placeholder="Üniversitenizi yazın..." autoComplete="off"
                    className={inputBaseClass} style={getInputStyle("university")} />
                  {showUniDropdown && (
                    <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto"
                      style={{ background: "#1a1f4e", border: "1px solid rgba(255,255,255,0.15)" }}>
                      {uniSuggestions.map((uni) => (
                        <button key={uni} type="button" onClick={() => selectUniversity(uni)}
                          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition">
                          {uni}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
  
                {/* Fakülte */}
                <div ref={facRef} className="relative">
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Fakülte</label>
                  <input type="text" name="faculty" value={form.faculty} onChange={handleChange}
                    onFocus={() => { if (form.faculty.length >= 2) setShowFacDropdown(facSuggestions.length > 0) }}
                    placeholder="Fakülteniz" autoComplete="off"
                    className={inputBaseClass} style={getInputStyle("faculty")} />
                  {showFacDropdown && (
                    <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto"
                      style={{ background: "#1a1f4e", border: "1px solid rgba(255,255,255,0.15)" }}>
                      {facSuggestions.map((fac) => (
                        <button key={fac} type="button" onClick={() => selectFaculty(fac)}
                          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition">
                          {fac}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
  
                {/* Bölüm */}
                <div ref={deptRef} className="relative md:col-span-2">
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Bölüm</label>
                  <input type="text" name="department" value={form.department} onChange={handleChange}
                    onFocus={() => { if (form.department.length >= 2) setShowDeptDropdown(deptSuggestions.length > 0) }}
                    placeholder="Bölümünüz" autoComplete="off"
                    className={inputBaseClass} style={getInputStyle("department")} />
                  {showDeptDropdown && (
                    <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto"
                      style={{ background: "#1a1f4e", border: "1px solid rgba(255,255,255,0.15)" }}>
                      {deptSuggestions.map((dept) => (
                        <button key={dept} type="button" onClick={() => selectDepartment(dept)}
                          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition">
                          {dept}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
  
                {/* Şifre */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Şifre</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange}
                    placeholder="En az 8 karakter" required className={inputBaseClass}
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
                </div>
  
                {/* Şifre Tekrar */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#a0a8d0" }}>Şifre Tekrar</label>
                  <input type="password" name="passwordConfirm" value={form.passwordConfirm} onChange={handleChange}
                    placeholder="Şifrenizi tekrar girin" required className={inputBaseClass}
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
                </div>
              </div>
  
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-1 accent-red-600" />
                  <span className="text-sm" style={{ color: "#a0a8d0" }}>
                    <span className="text-white underline cursor-pointer" onClick={(e) => { e.preventDefault(); setShowKvkkModal(true); }}>KVKK Aydınlatma Metni</span>&apos;ni okudum ve kabul ediyorum. Kişisel verilerimin güvenlik amaçlı kimlik tespiti ve yetkili kurumlara aktarım amacıyla işlenebileceğini anlıyorum.
                  </span>
                </label>
  
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 accent-red-600" />
                  <span className="text-sm" style={{ color: "#a0a8d0" }}>
                    <span className="text-white underline cursor-pointer" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}>Kullanım Koşulları</span>&apos;nı okudum ve kabul ediyorum.
                  </span>
                </label>
              </div>
  
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(227,6,19,0.12)", border: "1px solid rgba(227,6,19,0.3)", color: "#ff8080" }}>
                  {error}
                </div>
              )}
  
              <button type="submit" disabled={loading}
                className="w-full font-semibold py-3 rounded-xl transition-all duration-200 mt-2 text-white"
                style={{ background: loading ? "#8a0a10" : "#E30613" }}>
                {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm transition" style={{ color: "#a0a8d0" }}>
              Zaten hesabın var mı? <span className="text-white underline">Giriş yap</span>
            </Link>
          </div>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2025 T3 Vakfı — Tüm hakları saklıdır.
        </p>
      </div>

      {/* KVKK Modal */}
      {showKvkkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1f4e] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">KVKK Aydınlatma Metni</h2>
              <button onClick={() => setShowKvkkModal(false)} className="text-white/50 hover:text-white text-3xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 text-sm text-[#a0a8d0] space-y-4">
              <p><strong className="text-white">1. Veri Sorumlusu</strong><br/>
              Kişisel verileriniz, Türkiye Teknoloji Takımı Vakfı (T3 Vakfı) tarafından veri sorumlusu sıfatıyla işlenmektedir.</p>
              <p><strong className="text-white">2. İşlenen Kişisel Veriler ve İşleme Amaçları</strong><br/>
              Kayıt formunda paylaştığınız Kimlik verisi (Ad, Soyad, TC Kimlik Numarası, Doğum Tarihi), İletişim verisi (Telefon, E-posta), Eğitim bilgileri (Üniversite, vb.) ve dijital izler, "Zirve Yönetim Sistemi" kapsamında güvenliğin sağlanması, platforma erişiminizin yönetilmesi, giriş/çıkış kayıtlarınızın tutulması ve kanuni zorunlulukların yerine getirilmesi amaçlarıyla işlenmektedir.</p>
              <p><strong className="text-white">3. Verilerin Aktarımı</strong><br/>
              Kişisel verileriniz yalnızca hukuki uyuşmazlıklarda ilgili adli makamlara veya yasal zorunluluklar kapsamında kanunen yetkili kamu kurumlarına aktarılabilecektir.</p>
              <p><strong className="text-white">4. Veri Sahibinin Hakları</strong><br/>
              6698 sayılı Kanun'un 11. maddesi kapsamındaki haklarınızı kullanmak ve kişisel verilerinizle ilgili bilgi almak için kurumumuzla iletişime geçebilirsiniz.</p>
            </div>
            <div className="mt-6 text-right">
              <button 
                type="button"
                onClick={() => { setShowKvkkModal(false); setKvkk(true); }} 
                className="px-5 py-2.5 rounded-xl bg-[#E30613] text-white font-medium hover:bg-red-700 transition">
                Okudum, Onaylıyorum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1f4e] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Kullanıcı Sözleşmesi (Kullanım Koşulları)</h2>
              <button onClick={() => setShowTermsModal(false)} className="text-white/50 hover:text-white text-3xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 pr-2 text-sm text-[#a0a8d0] space-y-4">
              <p><strong className="text-white">1. Taraflar</strong><br/>
              İşbu sözleşme, T3 Vakfı Zirve Yönetim Sistemi'ne kayıt olan "Kullanıcı" ile sistemi sağlayan "Vakıf" arasında düzenlenmiştir.</p>
              <p><strong className="text-white">2. Sözleşmenin Konusu</strong><br/>
              Bu sözleşmenin konusu, sistem üzerinden sunulan seminer, kayıt, QR tarama ve yetki süreçlerinin kullanımına ilişkin şartların belirlenmesidir.</p>
              <p><strong className="text-white">3. Kullanıcının Yükümlülükleri</strong><br/>
              - Kullanıcı, kayıt esnasında verdiği tüm bilgilerin doğru ve eksiksiz olduğunu beyan eder.<br/>
              - Sistemde oluşturulan şifrenin güvenliğinden tamamen kullanıcı sorumludur.<br/>
              - Kullanıcı, kendi hesabı üzerinden yapılan tüm işlemlerin kendi iradesi ile gerçekleştiğini kabul eder.<br/>
              - Başka bir kişinin veya kurumun bilgilerini kullanarak hesabı haksız yollarla işletmek yasaktır.</p>
              <p><strong className="text-white">4. Vakfın Yükümlülükleri ve Hakları</strong><br/>
              Vakıf, altyapının işleyişi ve güvenliği konusunda makul çabayı gösterir. Sistem ihlali tespit edildiğinde veya şüpheli hareketler algılandığında kullanıcının hesabını askıya alma veya kalıcı olarak kapatma hakkını saklı tutar.</p>
            </div>
            <div className="mt-6 text-right">
              <button 
                type="button"
                onClick={() => { setShowTermsModal(false); setTerms(true); }} 
                className="px-5 py-2.5 rounded-xl bg-[#E30613] text-white font-medium hover:bg-red-700 transition">
                Kabul Ediyorum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}