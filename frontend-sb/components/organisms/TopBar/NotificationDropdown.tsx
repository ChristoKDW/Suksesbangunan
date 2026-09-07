"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, Clock } from "lucide-react"
import { notificationApi, NotificationItem } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getMyNotifications()
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.isRead).length)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkAsRead = async (idNotification: number) => {
    try {
      await notificationApi.markAsRead(idNotification)
      setNotifications(prev => 
        prev.map(n => n.idNotification === idNotification ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 ${isOpen ? 'bg-slate-100 dark:bg-white/10' : ''}`}
        style={{
          width: "2.25rem",
          height: "2.25rem",
        }}
        aria-label="Notifications"
      >
        <Bell style={{ width: "1.125rem", height: "1.125rem" }} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500 animate-pulse"
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1E293B] rounded-xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden z-50 transform origin-top-right transition-all">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Notifikasi</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline flex items-center gap-1"
              >
                <Check size={14} /> Tandai semua dibaca
              </button>
            )}
          </div>
          
          <div className="max-h-[28rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <Bell className="mx-auto h-8 w-8 opacity-20 mb-2" />
                <p className="text-sm">Belum ada notifikasi saat ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {notifications.map((notif) => (
                  <div 
                    key={notif.idNotification} 
                    className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${!notif.isRead ? 'bg-red-50/50 dark:bg-red-500/5' : ''}`}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif.idNotification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {!notif.isRead ? (
                          <div className="h-2 w-2 mt-1.5 rounded-full bg-red-500"></div>
                        ) : (
                          <div className="h-2 w-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm mb-1 ${!notif.isRead ? 'font-semibold text-slate-900 dark:text-slate-50' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <Clock size={12} />
                          <span>
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
