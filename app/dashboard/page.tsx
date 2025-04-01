"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Clock, Activity } from "lucide-react"
import Link from "next/link"
import { useContacts, getLastMessage, getUnreadCount } from "@/lib/chat-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfile } from "@/hooks/use-profile"
import { formatDistanceToNow } from "date-fns"

export default function DashboardPage() {
  const { contacts, loading: contactsLoading } = useContacts()
  const { profile } = useProfile()
  const [totalUnread, setTotalUnread] = useState(0)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [onlineContacts, setOnlineContacts] = useState(0)
  const [activityStats, setActivityStats] = useState({
    messagesLast7Days: 0,
    storiesViewed: 0,
    newConnections: 0,
  })

  useEffect(() => {
    // Get total unread count
    const fetchUnreadCount = async () => {
      const count = await getUnreadCount()
      setTotalUnread(count)
    }
    fetchUnreadCount()

    // Count online contacts
    const online = contacts.filter((c) => c.contactDetails.isOnline).length
    setOnlineContacts(online)

    // Get recent messages
    const messages: any[] = []
    const fetchMessages = async () => {
      for (const contact of contacts) {
        const lastMessage = await getLastMessage(contact.contactDetails._id)
        if (lastMessage) {
          messages.push({
            id: lastMessage._id,
            content: lastMessage.content,
            timestamp: lastMessage.createdAt,
            contact: contact.contactDetails,
            isMe: lastMessage.senderId === "current-user",
            messageType: lastMessage.messageType || "text",
          })
        }
      }
      
      // Sort by timestamp (newest first) and take top 5
      messages.sort((a, b) => {
        // First convert both values to numbers safely
        const dateA = new Date(a.timestamp).getTime() || 0
        const dateB = new Date(b.timestamp).getTime() || 0
        return dateB - dateA
      })
      setRecentMessages(messages.slice(0, 5))
    }
    
    fetchMessages()

    // Generate some activity stats
    setActivityStats({
      messagesLast7Days: Math.floor(Math.random() * 100) + 50,
      storiesViewed: Math.floor(Math.random() * 20) + 5,
      newConnections: Math.floor(Math.random() * 5),
    })

    // Poll for updates
    const interval = setInterval(async () => {
      const newCount = await getUnreadCount()
      setTotalUnread(newCount)
    }, 5000)

    return () => clearInterval(interval)
  }, [contacts])

  // Function to safely format a date string, returning a fallback if invalid
  const formatTimeSafely = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Recently"
      }
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return "Recently"
    }
  }

  return (
    <div className="container p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.name || "User"}! Here's what's happening in your Me 2 You network.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/messages/new">
            <Button className="gap-2">
              <MessageSquare className="h-4 w-4" />
              New Message
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnread}</div>
            <p className="text-xs text-muted-foreground">{totalUnread} unread messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">{onlineContacts} online now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.messagesLast7Days}</div>
            <p className="text-xs text-muted-foreground">Messages in the last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
            <p className="text-xs text-muted-foreground">Last active: Just now</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Your latest conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMessages.length > 0 ? (
              recentMessages.map((message) => (
                <Link key={message.id} href={`/dashboard/messages/${message.contact._id}`}>
                  <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage
                          src={message.contact.image || "/placeholder.svg?height=40&width=40"}
                          alt={message.contact.name}
                        />
                        <AvatarFallback>
                          {message.contact.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {message.contact.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{message.contact.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeSafely(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.isMe
                          ? `You: ${message.messageType === "text" ? message.content : `Sent a ${message.messageType}`}`
                          : message.messageType === "text"
                            ? message.content
                            : `Sent you a ${message.messageType}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent messages</p>
            )}
            <div className="pt-2">
              <Link href="/dashboard/messages">
                <Button variant="ghost" className="w-full">
                  View all messages
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Online Contacts</CardTitle>
            <CardDescription>Friends currently available to chat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contacts
              .filter((c) => c.contactDetails.isOnline)
              .slice(0, 5)
              .map((contact) => (
                <Link key={contact._id} href={`/dashboard/messages/${contact.contactDetails._id}`}>
                  <div className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage
                          src={contact.contactDetails.image || "/placeholder.svg?height=40&width=40"}
                          alt={contact.contactDetails.name}
                        />
                        <AvatarFallback>
                          {contact.contactDetails.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{contact.contactDetails.name}</p>
                      <p className="text-xs text-muted-foreground">Active now</p>
                    </div>
                  </div>
                </Link>
              ))}
            {contacts.filter((c) => c.contactDetails.isOnline).length === 0 && (
              <p className="text-center text-muted-foreground py-4">No contacts online</p>
            )}
            <div className="pt-2">
              <Link href="/dashboard/connections">
                <Button variant="ghost" className="w-full">
                  View all contacts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}