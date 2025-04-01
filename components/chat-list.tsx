"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useContacts } from "@/lib/chat-service"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessagePreview } from "@/components/message-preview"

export function ChatList() {
  const { contacts, loading, error } = useContacts()
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({})

  // Fetch last messages and unread counts for each contact
  useEffect(() => {
    const fetchMessageData = async () => {
      const counts: Record<string, number> = {}
      const messages: Record<string, any> = {}

      for (const contact of contacts) {
        try {
          // Fetch unread count for this contact
          const countResponse = await fetch(`/api/messages/unread?contactId=${contact.contactDetails._id}`)
          if (countResponse.ok) {
            const countData = await countResponse.json()
            counts[contact.contactDetails._id] = countData.count
          }

          // Fetch last message for this contact
          const messageResponse = await fetch(`/api/messages/last?contactId=${contact.contactDetails._id}`)
          if (messageResponse.ok) {
            const messageData = await messageResponse.json()
            if (messageData) {
              messages[contact.contactDetails._id] = messageData
            }
          }
        } catch (err) {
          console.error(`Error fetching data for contact ${contact.contactDetails._id}:`, err)
        }
      }

      setUnreadCounts(counts)
      setLastMessages(messages)
    }

    if (contacts.length > 0) {
      fetchMessageData()

      // Poll for updates every 10 seconds
      const interval = setInterval(fetchMessageData, 10000)
      return () => clearInterval(interval)
    }
  }, [contacts])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No contacts found. Add some contacts to start chatting!
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {contacts.map((contact) => {
        const lastMessage = lastMessages[contact.contactDetails._id]
        const unreadCount = unreadCounts[contact.contactDetails._id] || 0

        return (
          <Link key={contact._id} href={`/dashboard/messages/${contact.contactDetails._id}`}>
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted cursor-pointer">
              <Avatar>
                <AvatarImage
                  src={contact.contactDetails.image || `/placeholder.svg?height=40&width=40`}
                  alt={contact.contactDetails.name}
                />
                <AvatarFallback>
                  {contact.contactDetails.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{contact.contactDetails.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {lastMessage ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true }) : ""}
                  </span>
                </div>
                {lastMessage ? (
                  <MessagePreview
                    content={lastMessage.content}
                    messageType={lastMessage.messageType}
                    fileName={lastMessage.fileName}
                    isMe={lastMessage.senderId !== contact.contactDetails._id}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                )}
              </div>
              {unreadCount > 0 && (
                <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  <span className="text-xs">{unreadCount}</span>
                </Badge>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

