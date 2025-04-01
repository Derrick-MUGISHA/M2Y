"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRealTimeEvent } from "./real-time-service"

export interface Message {
  _id: string
  content?: string
  mediaUrl?: string
  fileName?: string
  fileSize?: number
  duration?: number
  messageType: "text" | "image" | "video" | "file" | "voice" | "gif"
  senderId: string
  receiverId: string
  read: boolean
  createdAt: string
  waveformData?: number[]
  isViewOnce?: boolean
  viewedAt?: string
}

export interface Contact {
  _id: string
  status: string
  createdAt: string
  lastActive?: string
  contactDetails: {
    _id: string
    name: string
    email: string
    image?: string
    isOnline?: boolean
  }
}

export function useContacts() {
  const { data: session } = useSession()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to user status changes
  useRealTimeEvent("user_status_changed", (data: { userId: string; status: string }) => {
    setContacts((prevContacts) =>
      prevContacts.map((contact) => {
        if (contact.contactDetails._id === data.userId) {
          return {
            ...contact,
            contactDetails: {
              ...contact.contactDetails,
              isOnline: data.status === "online",
            },
            lastActive: data.status === "offline" ? new Date().toISOString() : contact.lastActive,
          }
        }
        return contact
      }),
    )
  })

  useEffect(() => {
    const fetchContacts = async () => {
      if (!session?.user) return

      try {
        const response = await fetch("/api/contacts")

        if (!response.ok) {
          throw new Error("Failed to fetch contacts")
        }

        const data = await response.json()
        setContacts(data)
      } catch (err: any) {
        setError(err.message)
        console.error("Error fetching contacts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()

    // Poll for new contacts every 30 seconds
    const interval = setInterval(fetchContacts, 30000)
    return () => clearInterval(interval)
  }, [session])

  const addContact = async (email: string) => {
    if (!session?.user) return null

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add contact")
      }

      // Refresh contacts
      const contactsResponse = await fetch("/api/contacts")
      const contactsData = await contactsResponse.json()
      setContacts(contactsData)

      return true
    } catch (err: any) {
      setError(err.message)
      console.error("Error adding contact:", err)
      return false
    }
  }

  return { contacts, loading, error, addContact }
}

export function useMessages(contactId?: string) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to real-time message events
  useRealTimeEvent("message_received", (data: any) => {
    if (data.senderId === contactId || data.receiverId === contactId) {
      // Add the new message to the list
      const newMessage: Message = {
        _id: data.id,
        content: data.content,
        mediaUrl: data.mediaUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        duration: data.duration,
        messageType: data.messageType || "text",
        senderId: data.senderId,
        receiverId: data.receiverId || contactId,
        read: false,
        createdAt: new Date().toISOString(),
        waveformData: data.waveformData,
        isViewOnce: data.isViewOnce,
      }

      setMessages((prev) => [...prev, newMessage])
    }
  })

  // Subscribe to message read events
  useRealTimeEvent("message_read", (data: any) => {
    if (data.readBy === contactId) {
      // Update message read status
      setMessages((prev) =>
        prev.map((message) => (message._id === data.messageId ? { ...message, read: true } : message)),
      )
    }
  })

  useEffect(() => {
    if (!session?.user || !contactId) return

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?contactId=${contactId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch messages")
        }

        const data = await response.json()
        setMessages(data)
      } catch (err: any) {
        setError(err.message)
        console.error("Error fetching messages:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [session, contactId])

  const sendMessage = async (
    content: string,
    receiverId: string,
    messageType: "text" | "image" | "video" | "file" | "voice" | "gif" = "text",
    mediaUrl?: string,
    fileName?: string,
    fileSize?: number,
    duration?: number,
    waveformData?: number[],
    isViewOnce?: boolean,
  ) => {
    if (!session?.user) return false

    try {
      const messageData: any = {
        receiverId,
        messageType,
        isViewOnce,
      }

      if (messageType === "text") {
        messageData.content = content
      } else {
        messageData.mediaUrl = mediaUrl
        messageData.fileName = fileName
        messageData.fileSize = fileSize
        if (messageType === "voice") {
          messageData.duration = duration
          messageData.waveformData = waveformData
        }
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send message")
      }

      const data = await response.json()

      // Update messages state with the new message
      setMessages((prev) => [...prev, data.data])

      return data.data
    } catch (err: any) {
      setError(err.message)
      console.error("Error sending message:", err)
      return false
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!session?.user) return false

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete message")
      }

      // Remove the message from the state
      setMessages((prev) => prev.filter((message) => message._id !== messageId))

      return true
    } catch (err: any) {
      setError(err.message)
      console.error("Error deleting message:", err)
      return false
    }
  }

  return { messages, loading, error, sendMessage, deleteMessage }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const response = await fetch("/api/messages/unread/count")

    if (!response.ok) {
      throw new Error("Failed to fetch unread count")
    }

    const data = await response.json()
    return data.count
  } catch (err) {
    console.error("Error fetching unread count:", err)
    return 0
  }
}

export async function getLastMessage(contactId: string): Promise<Message | null> {
  try {
    const response = await fetch(`/api/messages/last?contactId=${contactId}`)
    if (!response.ok) {
      throw new Error("Failed to fetch last message")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching last message:", error)
    return null
  }
}

export async function markAsRead(contactId: string): Promise<void> {
  try {
    await fetch(`/api/messages?contactId=${contactId}`)
  } catch (error) {
    console.error("Error marking messages as read:", error)
  }
}

export async function updateOnlineStatus(isOnline: boolean): Promise<void> {
  try {
    await fetch("/api/user/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isOnline }),
    })
  } catch (error) {
    console.error("Error updating online status:", error)
  }
}

