"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotifications } from "@/hooks/use-notifications"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const [showBadge, setShowBadge] = useState(false)

  // Animate badge when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setShowBadge(true)
    }
  }, [unreadCount])

  // Mark notifications as read when popover is opened
  useEffect(() => {
    if (open && unreadCount > 0) {
      const unreadIds = notifications
        .filter((notification) => !notification.read)
        .map((notification) => notification._id)

      if (unreadIds.length > 0) {
        markAsRead(unreadIds)
      }
    }
  }, [open, unreadCount, notifications, markAsRead])

  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case "message":
        return `/dashboard/messages/${notification.sender._id}`
      case "story":
        return `/dashboard/stories`
      case "contact_request":
        return `/dashboard/connections?tab=requests`
      case "contact_accepted":
        return `/dashboard/connections`
      case "group_invite":
      case "group_message":
        return `/dashboard/groups/${notification.relatedId}`
      default:
        return "#"
    }
  }

  const getNotificationContent = (notification: any) => {
    const name = notification.sender.name

    switch (notification.type) {
      case "message":
        return `${name} sent you a message`
      case "story":
        return `${name} ${notification.content}`
      case "contact_request":
        return `${name} sent you a contact request`
      case "contact_accepted":
        return `${name} accepted your contact request`
      case "group_invite":
        return `${name} ${notification.content}`
      case "group_message":
        return `${name} ${notification.content}`
      default:
        return notification.content
    }
  }

  const getNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true })
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  <span className="text-xs">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          <Link href="/dashboard/notifications" className="text-xs text-blue-500 hover:underline">
            See all
          </Link>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => (
                <Link
                  key={notification._id}
                  href={getNotificationLink(notification)}
                  className={`flex items-start gap-3 p-3 hover:bg-muted transition-colors ${!notification.read ? "bg-muted/50" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={notification.sender.image || "/placeholder.svg?height=32&width=32"} />
                    <AvatarFallback>{notification.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                        {getNotificationContent(notification)}
                      </p>
                      {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 ml-1"></div>}
                    </div>
                    <p className="text-xs text-muted-foreground">{getNotificationTime(notification.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
              <p>No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

