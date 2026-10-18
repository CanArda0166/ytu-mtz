"use client"

import { useState, useEffect, useRef } from "react"

interface HelpButtonProps {
  user?: {
    id: string
    name: string
    surname: string
    role: string
  } | null
}

interface HelpMessage {
  id: string
  message: string
  senderRole: string
  createdAt: string
}

interface UserTicket {
  id: string
  subject: string
  status: string
  createdAt: string
  messages: HelpMessage[]
}

export default function HelpButton({ user }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"new" | "history">("new")
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", priority: "NORMAL" })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [tickets, setTickets] = useState<UserTicket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null)
  const [userReply, setUserReply] = useState("")

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && activeTab === "history" && user) {
      fetchTickets()
    }
  }, [isOpen, activeTab, user])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedTicket])

  const fetchTickets = async () => {
    setTicketsLoading(true)
    try {
      const res = await fetch("/api/help/me")
      const data = await res.json()
      if (data.requests) setTickets(data.requests)
    } catch (err) {
      console.error("Fetch tickets error:", err)
    } finally {
      setTicketsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // For logged in users, subject defaults if not set
    const submissionData = user ? {
      ...form,
      subject: form.subject || "Destek Talebi"
    } : form

    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData)
      })
      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          setForm({ name: "", email: "", subject: "", message: "", priority: "NORMAL" })
          if (user) {
            setActiveTab("history")
            fetchTickets()
          } else {
            setIsOpen(false)
          }
        }, 3000)
      }
    } catch (err) {
      alert("Hata oluştu, lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !userReply.trim()) return
    const currentTicketId = selectedTicket.id

    try {
      const res = await fetch("/api/help/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: currentTicketId, message: userReply })
      })
      if (res.ok) {
        setUserReply("")
        const refreshed = await fetch("/api/help/me").then(r => r.json())
        if (refreshed.requests) {
          setTickets(refreshed.requests)
          const updated = refreshed.requests.find((t: any) => t.id === currentTicketId)
          if (updated) setSelectedTicket(updated)
        }
      }
    } catch (err) {
      alert("Yanıt gönderilemedi.")
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#E30613] text-white shadow-2xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all z-[9999]"
        style={{ boxShadow: "0 0 30px rgba(227, 6, 19, 0.4)" }}
      >
        <span className="mb-0.5 relative">
          💬
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0a0d2e]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 min-h-[500px] flex flex-col">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              ✕
            </button>

            {user && !selectedTicket && (
              <div className="flex gap-4 border-b border-white/5 mb-6">
                <button 
                  onClick={() => setActiveTab("new")}
                  className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-white/30 hover:text-white/60'}`}
                >
                  Yeni Talep
                </button>
                <button 
                  onClick={() => setActiveTab("history")}
                  className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-white/30 hover:text-white/60'}`}
                >
                  Taleplerim
                </button>
              </div>
            )}

            {selectedTicket ? (
              <div className="flex flex-col h-full flex-1">
                 <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                    <button onClick={() => setSelectedTicket(null)} className="text-white/40 hover:text-white">←</button>
                    <div>
                       <h3 className="text-sm font-bold text-white leading-none">{selectedTicket.subject}</h3>
                       <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-black">
                         DURUM: {selectedTicket.status === 'OPEN' ? 'AÇIK' : 'ÇÖZÜLDÜ'}
                       </p>
                    </div>
                 </div>

                 <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                    {selectedTicket.messages.map((msg, idx) => (
                      <div key={msg.id || idx} className={`flex flex-col ${msg.senderRole === 'ADMIN' ? 'items-start' : 'items-end'}`}>
                         <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${msg.senderRole === 'ADMIN' ? 'bg-[#E30613]/10 border border-[#E30613]/20 rounded-tl-none' : 'bg-white/5 border border-white/10 rounded-tr-none text-white/90'}`}>
                            {msg.message}
                         </div>
                         <span className="text-[8px] text-white/20 mt-1 uppercase font-bold">{formatDate(msg.createdAt)}</span>
                      </div>
                    ))}
                 </div>

                 {selectedTicket.status === 'OPEN' && (
                    <form onSubmit={handleReply} className="relative">
                       <input 
                         type="text" 
                         placeholder="Yanıtınızı yazın..."
                         value={userReply}
                         onChange={e => setUserReply(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 ring-[#E30613]/50 pr-12"
                       />
                       <button 
                         type="submit"
                         className="absolute right-2 top-1.5 w-9 h-9 bg-[#E30613] rounded-lg flex items-center justify-center text-white active:scale-90 transition-transform"
                       >
                         →
                       </button>
                    </form>
                 )}
              </div>
            ) : activeTab === "new" ? (
              submitted ? (
                <div className="text-center py-10 space-y-4 flex-1 flex flex-col justify-center">
                  <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
                  <h3 className="text-xl font-bold text-white">Talep Alındı!</h3>
                  <p className="text-sm text-white/50">Yardım talebiniz başarıyla iletildi. En kısa sürede ilgileneceğiz.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 flex-1 p-1">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Destek Talebi</h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest font-black">Millî Teknoloji Hamlesi</p>
                  </div>

                  <div className="space-y-3">
                    {!user && (
                      <>
                        <input 
                          type="text" 
                          placeholder="Adınız Soyadınız"
                          value={form.name}
                          onChange={e => setForm({...form, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm focus:outline-none focus:ring-1 ring-[#E30613]/50 transition-all"
                        />
                        <input 
                          type="email" 
                          placeholder="E-posta Adresiniz"
                          value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm focus:outline-none focus:ring-1 ring-[#E30613]/50 transition-all"
                        />
                        <input 
                          type="text" 
                          placeholder="Konu"
                          required
                          value={form.subject}
                          onChange={e => setForm({...form, subject: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm focus:outline-none focus:ring-1 ring-[#E30613]/50 transition-all"
                        />
                      </>
                    )}
                    
                    <textarea 
                      placeholder="Sorununuz veya mesajınız..."
                      required
                      rows={user ? 8 : 4}
                      value={form.message}
                      onChange={e => setForm({...form, message: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-sm focus:outline-none focus:ring-1 ring-[#E30613]/50 transition-all resize-none shadow-inner"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#E30613] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? "GÖNDERİLİYOR..." : "GÖNDER"}
                  </button>
                </form>
              )
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="text-lg font-bold text-white mb-4">Girişimlerin</h3>
                {ticketsLoading ? (
                   <div className="text-center py-10 text-white/30 italic">Yükleniyor...</div>
                ) : tickets.length === 0 ? (
                   <div className="text-center py-10 text-white/20">Henüz bir talebiniz bulunmuyor.</div>
                ) : (
                   tickets.map(ticket => (
                     <div 
                       key={ticket.id} 
                       onClick={() => setSelectedTicket(ticket)}
                       className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 hover:bg-white/10 cursor-pointer transition-all active:scale-[0.98]"
                     >
                        <div className="flex justify-between items-start">
                           <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{ticket.subject}</span>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${ticket.status === 'OPEN' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                             {ticket.status === 'OPEN' ? 'AÇIK' : 'ÇÖZÜLDÜ'}
                           </span>
                        </div>
                        <p className="text-xs text-white/80 line-clamp-2">{ticket.messages[0]?.message}</p>
                        
                        <div className="flex justify-between items-center pt-2">
                           <span className="text-[9px] text-blue-400 font-bold uppercase">{ticket.messages.length} Mesaj</span>
                           <span className="text-[8px] text-white/20 uppercase font-bold">
                              {formatDate(ticket.createdAt)}
                           </span>
                        </div>
                     </div>
                   ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
