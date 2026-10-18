"use client"

import { useEffect, useState } from "react"

const featureDefinitions: Record<string, { label: string; description: string; category: string, req?: string[] }> = {
  "can_view_users": { label: "Kullanıcı Listesi Görme", description: "Sistemdeki tüm kullanıcıları görebilir", category: "Kullanıcılar" },
  "can_view_tc": { label: "TC Kimlik Görme", description: "Kullanıcıların TC kimlik numaralarını açıkça görebilir", category: "Kullanıcılar", req: ["can_view_users"] },
  "can_view_phone": { label: "Telefon Görme", description: "Kullanıcıların telefon numaralarını görebilir", category: "Kullanıcılar", req: ["can_view_users"] },
  "can_view_email": { label: "E-Posta Görme", description: "Kullanıcıların e-posta adreslerini görebilir", category: "Kullanıcılar", req: ["can_view_users"] },
  "can_view_birthdate": { label: "Doğum Tarihi Görme", description: "Kullanıcıların doğum tarihlerini görebilir", category: "Kullanıcılar", req: ["can_view_users"] },
  "can_view_university": { label: "Üniversite Bilgisi Görme", description: "Kullanıcıların üniversite bilgilerini görebilir", category: "Kullanıcılar", req: ["can_view_users"] },
  "can_view_active_users": { label: "Aktif Kullanıcı Takibi", description: "Şu an sistemde olan kullanıcıları görebilir", category: "Kullanıcılar", req: ["can_view_users"] },
  "can_edit_users": { label: "Kullanıcı Düzenleme", description: "Kullanıcı bilgilerini değiştirebilir", category: "Kullanıcılar", req: ["can_view_users"] },
  "can_delete_users": { label: "Kullanıcı Silme", description: "Kullanıcı hesaplarını sistemden tamamen silebilir", category: "Kullanıcılar", req: ["can_view_users"] },
  "can_reset_passwords": { label: "Şifre Sıfırlama", description: "Kullanıcıların şifrelerini değiştirebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_verify_emails_manually": { label: "E-Posta Manuel Doğrulama", description: "Doğrulama beklemeden e-postaları onaylayabilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_change_user_roles": { label: "Rol Değiştirme", description: "Kullanıcıların rollerini (Member, Staff, Admin) değiştirebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_name": { label: "İsim Değiştirme", description: "Kullanıcı ad/soyadını güncelleyebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_email": { label: "E-Posta Değiştirme", description: "Kullanıcının e-posta adresini güncelleyebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_phone": { label: "Telefon Değiştirme", description: "Kullanıcının telefon numarasını güncelleyebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_tc": { label: "TC No Değiştirme", description: "Kullanıcının TC kimlik numarasını güncelleyebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_role": { label: "Rolünü Değiştirme", description: "Kullanıcının statüsünü (Staff, Admin vb) değiştirebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_university": { label: "Üniversite Değiştirme", description: "Kullanıcının üniversite bilgisini güncelleyebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_faculty": { label: "Fakülte Değiştirme", description: "Kullanıcının fakülte bilgisini güncelleyebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_department": { label: "Bölüm Değiştirme", description: "Kullanıcının bölüm bilgisini güncelleyebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_gender": { label: "Cinsiyet Değiştirme", description: "Kullanıcının cinsiyet bilgisini güncelleyebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_edit_user_birthdate": { label: "Doğum Tarihi Değiştirme", description: "Kullanıcının doğum tarihini güncelleyebilir", category: "Kullanıcılar", req: ["can_edit_users"] },
  "can_view_surname": { label: "Soyadı Maskeleme Kaldır", description: "Kullanıcıların soyadlarını maskelenmemiş halde görebilir", category: "Kullanıcılar", req: ["can_view_users"] },

  
  "can_view_seminars": { label: "Seminerleri Görme", description: "Tüm seminerleri görebilir", category: "Seminerler" },
  "can_view_seminar_details": { label: "Seminer Analizi Gör", description: "Katılımcı listesi ve detaylı istatistikleri görebilir", category: "Seminerler", req: ["can_view_seminars"] },
  "can_export_seminar_participants": { label: "Katılımcı Listesini Dışa Aktar", description: "Seminere katılanları Excel/CSV olarak indirebilir", category: "Seminerler", req: ["can_view_seminar_details"] },
  "can_create_seminars": { label: "Seminer Oluşturma", description: "Yeni seminer kayıtları açabilir", category: "Seminerler", req: ["can_view_seminars"] },
  "can_edit_seminars": { label: "Seminer Düzenleme", description: "Seminer detaylarını güncelleyebilir", category: "Seminerler", req: ["can_view_seminars"] },
  "can_delete_seminars": { label: "Seminer Silme", description: "Mevcut seminerleri silebilir", category: "Seminerler", req: ["can_view_seminars"] },
  "can_toggle_seminar_active": { label: "Seminer Aktif/Pasif", description: "Seminerleri durdurup başlatabilir", category: "Seminerler", req: ["can_view_seminars"] },
  "can_export_seminar_stats": { label: "Detaylı CSV Export (Süre Dahil)", description: "Seminere katılanların tüm bilgilerini ve kalınan süreyi CSV olarak indirebilir", category: "Seminerler", req: ["can_view_seminar_details"] },

  
  "can_view_staff": { label: "Görevlileri Görme", description: "Sistem görevlilerini görebilir", category: "Görevliler" },
  "can_add_staff": { label: "Görevli Ekleme", description: "Normal bir üyeyi görevli(staff) yapabilir", category: "Görevliler", req: ["can_view_staff"] },
  "can_remove_staff": { label: "Görevli Çıkarma", description: "Görevli yetkisini geri alabilir", category: "Görevliler", req: ["can_view_staff"] },
  
  "can_view_entries": { label: "Tüm Kayıtları Görme", description: "Sistemdeki tüm giriş/çıkış hareketlerini görebilir", category: "Giriş/Çıkış" },
  "can_view_entry_details": { label: "Kayıt Detayları", description: "Hangi görevlinin taradığını görebilir", category: "Giriş/Çıkış", req: ["can_view_entries"] },
  "can_manual_entry": { label: "Manuel Giriş Kaydı", description: "QR taratmadan manuel giriş kaydı oluşturabilir", category: "Giriş/Çıkış", req: ["can_view_entries"] },
  "can_delete_entries": { label: "Kayıt Silme", description: "Gatalı giriş/çıkış kayıtlarını silebilir", category: "Giriş/Çıkış", req: ["can_view_entries"] },
  "can_filter_entries": { label: "Filtreleme", description: "Kayıtları seminer veya kullanıcı bazında filtreleyebilir", category: "Giriş/Çıkış", req: ["can_view_entries"] },
  "can_view_own_entries": { label: "Kendi Taramalarını/Kayıtlarını Görme", description: "Kendine ait özellikleri veya yaptığı taramaları görebilir", category: "Giriş/Çıkış" },
  
  "can_scan_qr": { label: "QR Okutma", description: "Kamera üzerinden kullanıcı QR kodlarını okutabilir", category: "Diğer Yetkiler" },
  "can_view_dashboard": { label: "Dashboard Erişimi", description: "Yönetim/Kullanıcı paneline genel erişim sağlar", category: "Diğer Yetkiler" },
  "can_view_stats": { label: "İstatistikleri Görme", description: "Genel sayısal analizleri görebilir", category: "Diğer Yetkiler", req: ["can_view_dashboard"] },
  "can_view_role_distribution": { label: "Rol Dağılımı Analizi", description: "Sistemdeki rollere göre kullanıcı dağılım istatistiklerini görebilir", category: "Diğer Yetkiler", req: ["can_view_stats"] },
  "can_export_data": { label: "Toplu Veri İndirme", description: "Veritabanını Excel/CSV olarak dışa aktarabilir", category: "Diğer Yetkiler" },

  "can_view_system_logs": { label: "Sistem Loglarını İzleme", description: "Tüm sistem hareketlerini ve hataları görebilir", category: "Sistem Ayarları" },
  "can_manage_owner_permissions": { label: "OWNER Yetkilerini Yönet", description: "Diğer OWNER'ların neleri yapabileceğini kısıtlayabilir", category: "Sistem Ayarları" },
  "can_view_pending_approvals": { label: "Onay Bekleyen İşlemleri Gör", description: "Yönetici taleplerini listeleyebilir", category: "Sistem Ayarları" },
  "can_approve_requests": { label: "İşlem Onaylama/Reddetme", description: "Gelen talepleri onaylayıp sisteme işleyebilir", category: "Sistem Ayarları" },
  "can_clear_logs": { label: "Logları Temizle", description: "Eski sistem loglarını silebilir", category: "Sistem Ayarları", req: ["can_view_system_logs"] },
  "can_backup_database": { label: "Veritabanı Yedeği Al", description: "Sistemin tam yedeğini JSON formatında indirebilir", category: "Sistem Ayarları" },
  "can_edit_permissions_of_admin": { label: "ADMIN Yetkilerini Yönet", description: "ADMIN rolünün yetkilerini üst yönetim onayı olmadan anında düzenleyebilir", category: "Sistem Ayarları" },
  "can_edit_permissions_of_staff": { label: "STAFF Yetkilerini Yönet", description: "STAFF rolünün yetkilerini üst yönetim onayı olmadan anında düzenleyebilir", category: "Sistem Ayarları" },
  "can_edit_permissions_of_member": { label: "MEMBER Yetkilerini Yönet", description: "MEMBER rolünün yetkilerini üst yönetim onayı olmadan anında düzenleyebilir", category: "Sistem Ayarları" },
  "can_view_system_config": { label: "Sistem Ayarlarını Görüntüle", description: "Global sistem anahtarlarını (Login, Register vb) görebilir", category: "Sistem Ayarları" },
  "can_manage_system_config": { label: "Sistem Ayarlarını Yönet", description: "Global sistem anahtarlarını değiştirebilir (Kritik yetki!)", category: "Sistem Ayarları" },
}


interface SystemConfig {
  registrationEnabled: boolean
  loginEnabled: boolean
  qrScanningEnabled: boolean
  emailVerificationRequired: boolean
  profileEditingEnabled: boolean
  seminarOperationsEnabled: boolean
  statsVisibilityEnabled: boolean
  csvExportEnabled: boolean
  notificationsEnabled: boolean
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [userRole, setUserRole] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState("ADMIN") // OWNER, ADMIN, STAFF, MEMBER, SISTEM
  const [message, setMessage] = useState("")

  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [systemLoading, setSystemLoading] = useState(false)

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    if (userRole === "ROOT" || (userRole && permissions[`${userRole.toLowerCase()}.can_view_system_config`])) {
      fetchSystemConfig()
    }
  }, [userRole, permissions])

  function fetchPermissions() {
    fetch("/api/owner/permissions")
      .then(r => r.json())
      .then(data => { 
        if (data.permissions) setPermissions(data.permissions) 
        if (data.userRole) setUserRole(data.userRole)
      })
      .finally(() => setLoading(false))
  }

  function fetchSystemConfig() {
    setSystemLoading(true)
    fetch("/api/root/config")
      .then(r => r.json())
      .then(data => {
        if (data.config) setSystemConfig(data.config)
      })
      .finally(() => setSystemLoading(false))
  }

  async function updateSystemConfig(key: keyof SystemConfig, val: boolean) {
    if (!systemConfig) return
    
    const canManage = userRole === "ROOT" || permissions[`${userRole.toLowerCase()}.can_manage_system_config`]
    if (!canManage) {
      setMessage("Hata: Bu ayarı değiştirmek için yetkiniz yok.")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    const updated = { ...systemConfig, [key]: val }
    setSaving(true)
    setSaved(false)
    setMessage("")
    
    try {
      const res = await fetch("/api/root/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSystemConfig(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setMessage("Hata: " + (data.error || "Sunucu hatası."))
      }
    } catch {
      setMessage("Hata: Bağlantı sorunu.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(key: string) {
    const isEnabling = !permissions[key];
    const rolePrefix = key.split('.')[0];
    const featureName = key.split('.')[1];
    let updated = { ...permissions, [key]: isEnabling };

    if (isEnabling) {
      const reqList = featureDefinitions[featureName]?.req || [];
      reqList.forEach(req => {
        updated[`${rolePrefix}.${req}`] = true;
      });
    } else {
      Object.keys(featureDefinitions).forEach(feat => {
        const featReqs = featureDefinitions[feat].req || [];
        if (featReqs.includes(featureName)) {
           updated[`${rolePrefix}.${feat}`] = false;
        }
      });
    }

    setPermissions(updated)
    setSaving(true)
    setSaved(false)
    setMessage("")

    const res = await fetch("/api/owner/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: updated }),
    })
    const data = await res.json()

    setSaving(false)
    if (data.message) {
      setMessage(data.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading) return <div className="text-white animate-pulse text-center py-20">Yükleniyor...</div>

  const categories = new Map<string, string[]>()
  
  Object.keys(featureDefinitions).forEach(featureName => {
    const meta = featureDefinitions[featureName]
    if (activeTab === "OWNER" && userRole !== "ROOT" && meta.category === "Sistem Ayarları") {
      return;
    }

    const fullKey = `${activeTab.toLowerCase()}.${featureName}`
    if (!categories.has(meta.category)) categories.set(meta.category, [])
    categories.get(meta.category)!.push(fullKey)
  })

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  const tabs = ["OWNER", "ADMIN", "STAFF", "MEMBER", "SİSTEM"].filter(t => {
    if (t === "OWNER") return userRole === "ROOT";
    if (t === "SİSTEM") return userRole === "ROOT" || permissions[`${userRole.toLowerCase()}.can_view_system_config`];
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Detaylı Yetki Kontrolü</h1>
          <p className="text-sm" style={{ color: "#a0a8d0" }}>
            Hangi rolün ne yapabileceğini en ince detayına kadar yönetin.
            <strong className="text-purple-400 ml-1">
              {userRole === "ROOT" ? "Özel yetkili hesap kısıtlamalardan muaftır." : "Değişiklikler üst yönetim onayına düşecektir."}
            </strong>
          </p>
        </div>
        {(saving || saved || message) && (
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${saved ? "text-green-400 bg-green-400/10" : message ? "text-yellow-400 bg-yellow-400/10" : "text-blue-400 bg-blue-400/10 animate-pulse"}`}>
            {saved ? "✓ Kaydedildi" : message ? message : "Kaydediliyor..."}
          </span>
        )}
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2`}
            style={{
              borderColor: activeTab === tab ? (tab === "ROOT" || tab === "OWNER" ? "#a855f7" : tab === "ADMIN" ? "#ff8080" : tab === "STAFF" ? "#fde047" : "#86efac") : "transparent",
              color: activeTab === tab ? "#white" : "#a0a8d0",
              background: activeTab === tab ? "rgba(255,255,255,0.05)" : "transparent"
            }}>
            {tab} Yetkileri
          </button>
        ))}
      </div>

      {activeTab === "SİSTEM" ? (
        <div className="rounded-2xl p-6" style={cardStyle}>
          <h2 className="text-base font-semibold text-white mb-4">Master Switch (Sistem Anahtarları)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    background: systemConfig?.registrationEnabled ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${systemConfig?.registrationEnabled ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}>
               <div className="pr-4">
                 <p className="text-white font-medium text-sm">Yeni Kayıt (Register)</p>
                 <p className="text-xs mt-1" style={{ color: "#a0a8d0" }}>İşlem kapalıyken yeni kullanıcılar sisteme üye olamazlar.</p>
               </div>
                <button onClick={() => updateSystemConfig("registrationEnabled", !systemConfig?.registrationEnabled)}
                        disabled={userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`]}
                        className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`] ? "opacity-30 cursor-not-allowed" : ""}`}
                        style={{ background: systemConfig?.registrationEnabled ? "#4ade80" : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                       style={{ left: systemConfig?.registrationEnabled ? "calc(100% - 1.5rem)" : "0.25rem" }} />
                </button>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    background: systemConfig?.loginEnabled ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${systemConfig?.loginEnabled ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}>
               <div className="pr-4">
                 <p className="text-white font-medium text-sm">Sistem Girişi (Login)</p>
                 <p className="text-xs mt-1" style={{ color: "#a0a8d0" }}>Girişler kapalıyken sadece ROOT erişim sağlayabilir.</p>
               </div>
                <button onClick={() => updateSystemConfig("loginEnabled", !systemConfig?.loginEnabled)}
                        disabled={userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`]}
                        className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`] ? "opacity-30 cursor-not-allowed" : ""}`}
                        style={{ background: systemConfig?.loginEnabled ? "#4ade80" : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                       style={{ left: systemConfig?.loginEnabled ? "calc(100% - 1.5rem)" : "0.25rem" }} />
                </button>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    background: systemConfig?.qrScanningEnabled ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${systemConfig?.qrScanningEnabled ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}>
               <div className="pr-4">
                 <p className="text-white font-medium text-sm">QR Sistemi (Check-in/Out)</p>
                 <p className="text-xs mt-1" style={{ color: "#a0a8d0" }}>QR sistemini tamamen durdurur veya başlatır.</p>
               </div>
                <button onClick={() => updateSystemConfig("qrScanningEnabled", !systemConfig?.qrScanningEnabled)}
                        disabled={userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`]}
                        className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`] ? "opacity-30 cursor-not-allowed" : ""}`}
                        style={{ background: systemConfig?.qrScanningEnabled ? "#4ade80" : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                       style={{ left: systemConfig?.qrScanningEnabled ? "calc(100% - 1.5rem)" : "0.25rem" }} />
                </button>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    background: systemConfig?.emailVerificationRequired ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${systemConfig?.emailVerificationRequired ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}>
               <div className="pr-4">
                 <p className="text-white font-medium text-sm">E-posta Doğrulama Zorunluluğu</p>
                 <p className="text-xs mt-1" style={{ color: "#a0a8d0" }}>Kullanıcıların login için e-posta onayı yapmalarını zorunlu kılar.</p>
               </div>
               <button onClick={() => updateSystemConfig("emailVerificationRequired", !systemConfig?.emailVerificationRequired)}
                       disabled={userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`]}
                       className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`] ? "opacity-30 cursor-not-allowed" : ""}`}
                       style={{ background: systemConfig?.emailVerificationRequired ? "#4ade80" : "rgba(255,255,255,0.1)" }}>
                 <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                      style={{ left: systemConfig?.emailVerificationRequired ? "calc(100% - 1.5rem)" : "0.25rem" }} />
               </button>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    background: systemConfig?.profileEditingEnabled ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${systemConfig?.profileEditingEnabled ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}>
               <div className="pr-4">
                 <p className="text-white font-medium text-sm">Profil Düzenleme (Profile Edit)</p>
                 <p className="text-xs mt-1" style={{ color: "#a0a8d0" }}>Hesap ayarları ve şifre değiştirme işlemlerini durdurur.</p>
               </div>
               <button onClick={() => updateSystemConfig("profileEditingEnabled", !systemConfig?.profileEditingEnabled)}
                       disabled={userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`]}
                       className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`] ? "opacity-30 cursor-not-allowed" : ""}`}
                       style={{ background: systemConfig?.profileEditingEnabled ? "#4ade80" : "rgba(255,255,255,0.1)" }}>
                 <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                      style={{ left: systemConfig?.profileEditingEnabled ? "calc(100% - 1.5rem)" : "0.25rem" }} />
               </button>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    background: systemConfig?.seminarOperationsEnabled ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${systemConfig?.seminarOperationsEnabled ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}>
               <div className="pr-4">
                 <p className="text-white font-medium text-sm">Seminer İşlemleri (Create/Edit)</p>
                 <p className="text-xs mt-1" style={{ color: "#a0a8d0" }}>Seminer oluşturma, düzenleme ve silme süreçlerini durdurur.</p>
               </div>
               <button onClick={() => updateSystemConfig("seminarOperationsEnabled", !systemConfig?.seminarOperationsEnabled)}
                       disabled={userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`]}
                       className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`] ? "opacity-30 cursor-not-allowed" : ""}`}
                       style={{ background: systemConfig?.seminarOperationsEnabled ? "#4ade80" : "rgba(255,255,255,0.1)" }}>
                 <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                      style={{ left: systemConfig?.seminarOperationsEnabled ? "calc(100% - 1.5rem)" : "0.25rem" }} />
               </button>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    background: systemConfig?.statsVisibilityEnabled ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${systemConfig?.statsVisibilityEnabled ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}>
               <div className="pr-4">
                 <p className="text-white font-medium text-sm">İstatistik Görünürlüğü (Stats)</p>
                 <p className="text-xs mt-1" style={{ color: "#a0a8d0" }}>Tüm panel grafiklerini ve sayısal raporları gizler.</p>
               </div>
               <button onClick={() => updateSystemConfig("statsVisibilityEnabled", !systemConfig?.statsVisibilityEnabled)}
                       disabled={userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`]}
                       className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`] ? "opacity-30 cursor-not-allowed" : ""}`}
                       style={{ background: systemConfig?.statsVisibilityEnabled ? "#4ade80" : "rgba(255,255,255,0.1)" }}>
                 <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                      style={{ left: systemConfig?.statsVisibilityEnabled ? "calc(100% - 1.5rem)" : "0.25rem" }} />
               </button>
             </div>

              <div className="flex items-center justify-between p-4 rounded-xl transition-all"
                   style={{
                     background: systemConfig?.csvExportEnabled ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                     border: `1px solid ${systemConfig?.csvExportEnabled ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                   }}>
                <div className="pr-4">
                  <p className="text-white font-medium text-sm">Veri Dışa Aktarma (Export)</p>
                  <p className="text-xs mt-1" style={{ color: "#a0a8d0" }}>CSV/Excel olarak veri indirilmesini kısıtlar.</p>
                </div>
                <button onClick={() => updateSystemConfig("csvExportEnabled", !systemConfig?.csvExportEnabled)}
                        disabled={userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`]}
                        className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`] ? "opacity-30 cursor-not-allowed" : ""}`}
                        style={{ background: systemConfig?.csvExportEnabled ? "#4ade80" : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                       style={{ left: systemConfig?.csvExportEnabled ? "calc(100% - 1.5rem)" : "0.25rem" }} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl transition-all"
                   style={{
                     background: systemConfig?.notificationsEnabled ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                     border: `1px solid ${systemConfig?.notificationsEnabled ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                   }}>
                <div className="pr-4">
                  <p className="text-white font-medium text-sm text-[#c084fc]">Sistem Duyuruları (Broadcast)</p>
                  <p className="text-xs mt-1" style={{ color: "#a0a8d0" }}>Yeni duyuru gönderimi ve görünürlüğünü kapatır. (ROOT her zaman aktiftir)</p>
                </div>
                <button onClick={() => updateSystemConfig("notificationsEnabled", !systemConfig?.notificationsEnabled)}
                        disabled={userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`]}
                        className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_manage_system_config`] ? "opacity-30 cursor-not-allowed" : ""}`}
                        style={{ background: systemConfig?.notificationsEnabled ? "#4ade80" : "rgba(255,255,255,0.1)" }}>
                  <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                       style={{ left: systemConfig?.notificationsEnabled ? "calc(100% - 1.5rem)" : "0.25rem" }} />
                </button>
              </div>
           </div>
        </div>
      ) : Array.from(categories.entries()).map(([category, keys]) => (
        <div key={category} className="rounded-2xl p-6 mb-6" style={cardStyle}>
          <h2 className="text-base font-semibold text-white mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keys.map(key => {
              const featureName = key.split('.')[1]
              const meta = featureDefinitions[featureName]
              const enabled = permissions[key] ?? false
              return (
                <div key={key}
                  className="flex items-center justify-between p-4 rounded-xl transition-all"
                  style={{
                    background: enabled ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${enabled ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}>
                  <div className="pr-4">
                    <p className="text-white font-medium text-sm flex items-center gap-2">
                       {meta.label}
                       {meta.req && meta.req.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400" title={`Gereksinim: ${meta.req.join(', ')}`}>
                            Bağımlı
                          </span>
                       )}
                    </p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "#a0a8d0" }}>{meta.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    disabled={(activeTab === "OWNER" && userRole !== "ROOT") || (activeTab !== "SİSTEM" && userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_edit_permissions_of_${activeTab.toLowerCase()}`])}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 shrink-0 ${((activeTab === "OWNER" && userRole !== "ROOT") || (activeTab !== "SİSTEM" && userRole !== "ROOT" && !permissions[`${userRole.toLowerCase()}.can_edit_permissions_of_${activeTab.toLowerCase()}`])) ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                    style={{
                      background: enabled ? "#4ade80" : "rgba(255,255,255,0.1)",
                    }}>
                    <div className="absolute top-1 transition-all duration-300 w-5 h-5 rounded-full bg-white shadow-md"
                      style={{ left: enabled ? "calc(100% - 1.5rem)" : "0.25rem" }} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

