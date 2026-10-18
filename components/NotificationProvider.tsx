"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string
  message: string
  type: string
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("dismissed_notifications")
    if (saved) setDismissedIds(JSON.parse(saved))

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications")
        const data = await res.json()
        if (data.notifications) {
          setNotifications(data.notifications)
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // Poll every 60s
    return () => clearInterval(interval)
  }, [])

  const dismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem("dismissed_notifications", JSON.stringify(newDismissed))
  }

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id))

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "URGENT":
        return { bg: "rgba(227,6,19,0.95)", border: "#ff6b6b", icon: "🚨" }
      case "WARNING":
        return { bg: "rgba(245,158,11,0.95)", border: "#fcd34d", icon: "⚠️" }
      case "SUCCESS":
        return { bg: "rgba(16,185,129,0.95)", border: "#6ee7b7", icon: "✅" }
      default:
        return { bg: "rgba(59,130,246,0.95)", border: "#93c5fd", icon: "ℹ️" }
    }
  }

  return (
    <>
      <div className="fixed top-20 left-0 right-0 z-[100] flex flex-col items-center gap-3 pointer-events-none px-4">
        <AnimatePresence>
          {activeNotifications.map((n) => {
            const styles = getTypeStyles(n.type)
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl pointer-events-auto rounded-2xl p-4 shadow-2xl flex items-center gap-4 border backdrop-blur-sm"
                style={{ 
                  background: styles.bg, 
                  borderColor: styles.border,
                  boxShadow: `0 10px 30px -5px ${styles.bg.replace('0.95', '0.3')}`
                }}
              >
                <div className="text-2xl shrink-0">{styles.icon}</div>
                <div className="flex-1 text-white font-medium text-sm lg:text-base leading-snug">
                  {n.message}
                </div>
                <button
                  onClick={() => dismiss(n.id)}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white/80"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      {children}
    </>
  )
}
