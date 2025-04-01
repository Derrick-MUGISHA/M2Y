"use client"

import { useState, useEffect } from "react"
import { useRealTimeEvent } from "@/lib/real-time-service"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface MessageNotification {
  id: string
  senderId: string
  senderName: string
  senderImage?: string
  content: string
  timestamp: string
  chatId: string
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<MessageNotification[]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Subscribe to new message notifications
  useRealTimeEvent("message_received", (data: any) => {
    // Only show notification if not from current user
    if (data.senderId !== "current-user") {
      const newNotification: MessageNotification = {
        id: data.id,
        senderId: data.senderId,
        senderName: data.senderName,
        senderImage: data.senderImage,
        content: data.content || getContentPreview(data.messageType),
        timestamp: new Date().toISOString(),
        chatId: data.senderId, // For direct messages, chatId is the senderId
      }

      // Add to notifications (limit to 5 most recent)
      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, 5)
        return updated
      })

      // Play notification sound
      playNotificationSound()
    }
  })

  // Helper function to get content preview based on message type
  const getContentPreview = (messageType: string) => {
    switch (messageType) {
      case "image":
        return "Sent an image"
      case "video":
        return "Sent a video"
      case "file":
        return "Sent a file"
      case "voice":
        return "Sent a voice message"
      case "gif":
        return "Sent a GIF"
      default:
        return "Sent a message"
    }
  }

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification-sound.mp3")
      audio.volume = 0.5
      audio.play()
    } catch (error) {
      console.error("Error playing notification sound:", error)
    }
  }

  // Handle notification click
  const handleNotificationClick = (chatId: string) => {
    router.push(`/dashboard/messages/${chatId}`)

    // Remove this notification
    setNotifications((prev) => prev.filter((n) => n.chatId !== chatId))
  }

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        removeNotification(notification.id)
      }, 5000)

      timers.push(timer)
    })

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [notifications])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="bg-card border shadow-lg rounded-lg p-4 cursor-pointer"
            onClick={() => handleNotificationClick(notification.chatId)}
          >
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarImage src={notification.senderImage || "/placeholder.svg?height=40&width=40"} />
                <AvatarFallback>{notification.senderName.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{notification.senderName}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mr-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(notification.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{notification.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

