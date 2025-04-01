"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Settings, ArrowDown, Mic } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatMessage } from "@/components/chat-message"
import { EmojiPicker } from "@/components/emoji-picker"
import { FileUpload } from "@/components/file-upload"
import { VoiceRecorder } from "@/components/voice-recorder"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { LoadingScreen } from "@/components/loading-screen"

interface GroupChatProps {
  groupId: string
}

export function GroupChat({ groupId }: GroupChatProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [group, setGroup] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    fileName: string
    fileSize: number
    fileType: string
  } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fetch group details
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch group")
        }

        const data = await response.json()
        setGroup(data)
      } catch (error) {
        console.error("Error fetching group:", error)
        toast({
          title: "Error",
          description: "Failed to load group information",
          variant: "destructive",
        })
      }
    }

    fetchGroup()
  }, [groupId, toast])

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}/messages`)

        if (!response.ok) {
          throw new Error("Failed to fetch messages")
        }

        const data = await response.json()
        setMessages(data)
        setLoading(false)

        // Scroll to bottom on initial load
        setTimeout(() => {
          scrollToBottom()
        }, 100)
      } catch (error) {
        console.error("Error fetching messages:", error)
        setLoading(false)
      }
    }

    fetchMessages()

    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [groupId])

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    if (isNearBottom) {
      scrollToBottom()
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!newMessage.trim() && !uploadedFile) || sending) return

    setSending(true)

    try {
      let messageData: any = {}

      if (uploadedFile) {
        // Send file message
        messageData = {
          messageType: uploadedFile.fileType,
          mediaUrl: uploadedFile.url,
          fileName: uploadedFile.fileName,
          fileSize: uploadedFile.fileSize,
        }
      } else {
        // Send text message
        messageData = {
          messageType: "text",
          content: newMessage,
        }
      }

      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      // Clear input
      setNewMessage("")
      setUploadedFile(null)

      // Scroll to bottom
      scrollToBottom()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  const handleFileUpload = (fileData: {
    url: string
    fileName: string
    fileSize: number
    fileType: string
  }) => {
    setUploadedFile(fileData)
  }

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    try {
      // Create form data
      const formData = new FormData()
      formData.append("file", audioBlob, "voice-message.webm")

      // Upload the audio file
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload voice message")
      }

      const data = await response.json()

      // Send voice message
      await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageType: "voice",
          mediaUrl: data.url,
          fileName: "Voice message",
          fileSize: data.fileSize,
          duration,
        }),
      })

      // Scroll to bottom
      scrollToBottom()
    } catch (error) {
      console.error("Error sending voice message:", error)
      toast({
        title: "Error",
        description: "Failed to send voice message",
        variant: "destructive",
      })
    } finally {
      setIsRecording(false)
    }
  }

  const cancelFileUpload = () => {
    setUploadedFile(null)
  }

  const cancelVoiceRecording = () => {
    setIsRecording(false)
  }

  const startRecording = () => {
    setIsRecording(true)
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups: Record<string, typeof messages>, message) => {
    const date = format(new Date(message.createdAt), "yyyy-MM-dd")
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  if (loading) {
    return <LoadingScreen />
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Group not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Group header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={group.image || "/placeholder.svg?height=40&width=40"} alt={group.name} />
            <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">{group.name}</h2>
            <p className="text-xs text-muted-foreground">{group.memberCount} members</p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-gray-800" ref={messagesContainerRef}>
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                {format(new Date(date), "MMMM d, yyyy")}
              </div>
            </div>
            <div className="space-y-2">
              {dateMessages.map((message) => (
                <ChatMessage
                  key={`${message._id}-${message.sender._id}`} // Ensure unique keys
                  id={message._id}
                  content={message.content}
                  mediaUrl={message.mediaUrl}
                  fileName={message.fileName}
                  fileSize={message.fileSize}
                  duration={message.duration}
                  messageType={message.messageType}
                  isMe={message.sender._id === "current-user"}
                  timestamp={message.createdAt}
                  read={message.readBy?.some((reader: any) => reader.userId !== "current-user")}
                  sender={message.sender}
                  isGroup={true}
                />
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-24 right-6 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}

      {/* File preview */}
      {uploadedFile && (
        <div className="border-t p-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm truncate max-w-[200px]">{uploadedFile.fileName}</span>
            <Button variant="ghost" size="sm" onClick={cancelFileUpload}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Voice recorder */}
      {isRecording && (
        <div className="border-t p-2 bg-muted/30">
          <VoiceRecorder onVoiceRecorded={handleVoiceRecorded} onCancel={cancelVoiceRecording} />
        </div>
      )}

      {/* Message input */}
      {!isRecording && (
        <form onSubmit={handleSendMessage} className="border-t p-4 bg-background">
          <div className="flex items-center gap-2">
            <FileUpload onFileUpload={handleFileUpload} />
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              disabled={!!uploadedFile || sending}
            />
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            {/* Voice recorder button - not nested inside another button */}
            {!uploadedFile && !sending && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={startRecording}
              >
                <Mic className="h-5 w-5" />
                <span className="sr-only">Record voice message</span>
              </Button>
            )}
            <Button
              type="submit"
              variant="default"
              size="icon"
              disabled={(!newMessage.trim() && !uploadedFile) || sending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

