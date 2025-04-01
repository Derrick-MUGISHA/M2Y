"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export interface Notification {
  _id: string
  type: "message" | "story" | "contact_request" | "contact_accepted"
  content: string
  read: boolean
  relatedId: string
  createdAt: string
  sender: {
    _id: string
    name: string
    image?: string
  }
}

export function useNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user) return

      try {
        const response = await fetch("/api/notifications")

        if (!response.ok) {
          throw new Error("Failed to fetch notifications")
        }

        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.read).length)
      } catch (err: any) {
        setError(err.message)
        console.error("Error fetching notifications:", err)
      } finally {
        setLoading(false)
      }
    }

    const fetchUnreadCount = async () => {
      if (!session?.user) return

      try {
        const response = await fetch("/api/notifications/count")

        if (!response.ok) {
          throw new Error("Failed to fetch notification count")
        }

        const data = await response.json()
        setUnreadCount(data.count)
      } catch (err: any) {
        console.error("Error fetching notification count:", err)
      }
    }

    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [session])

  const markAsRead = async (notificationIds: string[]) => {
    if (!session?.user || notificationIds.length === 0) return

    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read")
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notificationIds.includes(notification._id) ? { ...notification, read: true } : notification,
        ),
      )

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))
    } catch (err: any) {
      setError(err.message)
      console.error("Error marking notifications as read:", err)
    }
  }

  return { notifications, unreadCount, loading, error, markAsRead }
}

