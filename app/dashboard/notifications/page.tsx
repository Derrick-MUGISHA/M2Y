"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Check } from "lucide-react"

export default function NotificationsPage() {
  const { notifications, loading, markAsRead } = useNotifications()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(notifications.map((n) => n._id))
    }
  }

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleMarkAsRead = async () => {
    if (selectedIds.length === 0) return
    await markAsRead(selectedIds)
    setSelectedIds([])
  }

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
      default:
        return notification.content
    }
  }

  return (
    <div className="container p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with messages, stories, and contact requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSelectAll}>
            {selectedIds.length === notifications.length && notifications.length > 0 ? "Deselect All" : "Select All"}
          </Button>
          <Button onClick={handleMarkAsRead} disabled={selectedIds.length === 0}>
            <Check className="mr-2 h-4 w-4" />
            Mark as Read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Your recent activity and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-3 border-b">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`flex items-start gap-4 p-3 ${!notification.read ? "bg-muted/50" : ""}`}
                >
                  <div className="flex items-center h-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification._id)}
                      onChange={() => handleSelect(notification._id)}
                      className="mr-2"
                    />
                    <Avatar>
                      <AvatarImage src={notification.sender.image || "/placeholder.svg?height=40&width=40"} />
                      <AvatarFallback>{notification.sender.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Link href={getNotificationLink(notification)} className="hover:underline">
                      <p className="font-medium">{getNotificationContent(notification)}</p>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">No notifications yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

