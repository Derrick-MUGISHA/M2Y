"use client"

import React, { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, ArrowDown, Mic, Palette, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatMessage } from "@/components/chat-message"
import { useContacts, useMessages, markAsRead } from "@/lib/chat-service"
import { EmojiPicker } from "@/components/emoji-picker"
import { FileUpload } from "@/components/file-upload"
import { VoiceRecorder } from "@/components/voice-recorder"
import { UserStatus } from "@/components/user-status"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "@/hooks/use-profile"
import { LoadingScreen } from "@/components/loading-screen"
import { useParams } from "next/navigation"
import { useRealTimeEvent, sendEvent } from "@/lib/real-time-service"
import { useSession } from "next-auth/react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Background type definitions
type BackgroundType = "light" | "dark" | "gradient" | "animated" | "pattern"
type AnimationType = "waves" | "particles" | "bubbles" | "none"
type GradientType = "blue-purple" | "green-blue" | "orange-red" | "rainbow"
type PatternType = "dots" | "grid" | "lines" | "triangles"

interface BackgroundSettings {
  type: BackgroundType
  gradient?: GradientType
  animation?: AnimationType
  pattern?: PatternType
}

// Extend the existing Profile type from your profile hook
declare module "@/hooks/use-profile" {
  interface Profile {
    name?: string
    location?: string
    theme?: "light" | "dark" | "system"
    chatBackground?: BackgroundSettings | "light" | "dark" | "gradient"
  }
}

declare interface UserProfile {
  name?: string
  location?: string
  theme?: "light" | "dark" | "system"
  chatBackground?: BackgroundSettings | "light" | "dark" | "gradient"
}

// Background option component
function BackgroundOption({ 
  title, 
  className, 
  isSelected, 
  onClick, 
  decorativeOverlay
}: {
  title: string
  className: string
  isSelected: boolean
  onClick: () => void
  decorativeOverlay?: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={`relative h-24 rounded-lg border overflow-hidden ${className} hover:opacity-90 transition-opacity`}
      onClick={onClick}
    >
      {decorativeOverlay}
      <div className="absolute inset-0 flex flex-col justify-between p-2">
        <div className="text-xs font-medium">{title}</div>
        {isSelected && (
          <div className="self-end p-1 bg-black/10 rounded-full">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>
    </button>
  )
}

// Background picker component
function ChatBackgroundPicker({ 
  value, 
  onChange 
}: {
  value: BackgroundSettings
  onChange: (value: BackgroundSettings) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Change chat background</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <Tabs defaultValue="themes">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="gradients">Gradients</TabsTrigger>
            <TabsTrigger value="animated">Animated</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <BackgroundOption
                title="Light"
                className="bg-white border"
                isSelected={value.type === "light"}
                onClick={() => onChange({ type: "light" })}
              />
              <BackgroundOption
                title="Dark"
                className="bg-gray-900 border border-gray-800"
                isSelected={value.type === "dark"}
                onClick={() => onChange({ type: "dark" })}
              />
            </div>
          </TabsContent>

          <TabsContent value="gradients" className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <BackgroundOption
                title="Blue-Purple"
                className="bg-gradient-to-br from-blue-100 to-purple-100"
                isSelected={value.type === "gradient" && value.gradient === "blue-purple"}
                onClick={() => onChange({ type: "gradient", gradient: "blue-purple" })}
              />
              <BackgroundOption
                title="Green-Blue"
                className="bg-gradient-to-br from-green-100 to-blue-100"
                isSelected={value.type === "gradient" && value.gradient === "green-blue"}
                onClick={() => onChange({ type: "gradient", gradient: "green-blue" })}
              />
              <BackgroundOption
                title="Orange-Red"
                className="bg-gradient-to-br from-orange-100 to-red-100"
                isSelected={value.type === "gradient" && value.gradient === "orange-red"}
                onClick={() => onChange({ type: "gradient", gradient: "orange-red" })}
              />
              <BackgroundOption
                title="Rainbow"
                className="bg-gradient-to-r from-red-100 via-green-100 to-blue-100"
                isSelected={value.type === "gradient" && value.gradient === "rainbow"}
                onClick={() => onChange({ type: "gradient", gradient: "rainbow" })}
              />
            </div>
          </TabsContent>

          <TabsContent value="animated" className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <BackgroundOption
                title="Waves"
                className="bg-blue-50 overflow-hidden relative"
                isSelected={value.type === "animated" && value.animation === "waves"}
                onClick={() => onChange({ type: "animated", animation: "waves" })}
                decorativeOverlay={<div className="absolute inset-0 opacity-30 waves-animation" />}
              />
              <BackgroundOption
                title="Particles"
                className="bg-gray-50 overflow-hidden relative"
                isSelected={value.type === "animated" && value.animation === "particles"}
                onClick={() => onChange({ type: "animated", animation: "particles" })}
                decorativeOverlay={<div className="absolute inset-0 opacity-30 particles-animation" />}
              />
              <BackgroundOption
                title="Bubbles"
                className="bg-purple-50 overflow-hidden relative"
                isSelected={value.type === "animated" && value.animation === "bubbles"}
                onClick={() => onChange({ type: "animated", animation: "bubbles" })}
                decorativeOverlay={<div className="absolute inset-0 opacity-30 bubbles-animation" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <BackgroundOption
                title="Dots"
                className="bg-white bg-dots"
                isSelected={value.type === "pattern" && value.pattern === "dots"}
                onClick={() => onChange({ type: "pattern", pattern: "dots" })}
              />
              <BackgroundOption
                title="Grid"
                className="bg-white bg-grid"
                isSelected={value.type === "pattern" && value.pattern === "grid"}
                onClick={() => onChange({ type: "pattern", pattern: "grid" })}
              />
              <BackgroundOption
                title="Lines"
                className="bg-white bg-lines"
                isSelected={value.type === "pattern" && value.pattern === "lines"}
                onClick={() => onChange({ type: "pattern", pattern: "lines" })}
              />
              <BackgroundOption
                title="Triangles"
                className="bg-white bg-triangles"
                isSelected={value.type === "pattern" && value.pattern === "triangles"}
                onClick={() => onChange({ type: "pattern", pattern: "triangles" })}
              />
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default function ChatPage() {
  const params = useParams()
  const contactId = params.id as string
  const { data: session } = useSession()
  const { contacts, loading: contactsLoading } = useContacts()
  const { messages, sendMessage, loading: messagesLoading } = useMessages(contactId)
  const { profile, updateProfile } = useProfile()
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    fileName: string
    fileSize: number
    fileType: string
  } | null>(null)
  
  // Enhanced background settings
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>(() => {
    // Handle legacy background settings
    if (typeof profile?.chatBackground === "string") {
      return { 
        type: profile?.chatBackground as BackgroundType || "light",
        gradient: "blue-purple",
        animation: "waves",
        pattern: "dots"
      }
    }
    // Handle new background settings format
    return (profile?.chatBackground as BackgroundSettings) || { 
      type: "light",
      gradient: "blue-purple",
      animation: "waves",
      pattern: "dots"
    }
  })
  
  const [unreadMessageIds, setUnreadMessageIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const contact = contacts.find((c) => c.contactDetails._id === contactId)

  // Subscribe to real-time message events
  useRealTimeEvent("message_received", (data: any) => {
    if (data.senderId === contactId) {
      // Mark the message as unread initially
      setUnreadMessageIds((prev) => new Set(prev).add(data.id))

      // Scroll to bottom if already near bottom
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200

        if (isNearBottom) {
          setTimeout(() => {
            scrollToBottom()
          }, 100)
        }
      }
    }
  })

  // Subscribe to message read events
  useRealTimeEvent("message_read", (data: any) => {
    // Update UI to show message as read
    if (data.senderId === "current-user" && data.readBy === contactId) {
      // This would be handled by the useMessages hook
    }
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Mark messages as read when viewing the chat
  useEffect(() => {
    if (contactId && unreadMessageIds.size > 0) {
      markAsRead(contactId)

      // Notify the sender that messages have been read
      Array.from(unreadMessageIds).forEach((messageId) => {
        sendEvent("message_read", {
          messageId,
          senderId: contactId,
        })
      })

      // Clear unread messages
      setUnreadMessageIds(new Set())
    }
  }, [contactId, unreadMessageIds])

  // Save background settings when they change
  useEffect(() => {
    if (profile && updateProfile) {
      updateProfile({ chatBackground: backgroundSettings })
    }
  }, [backgroundSettings, profile, updateProfile])

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (uploadedFile) {
      // Send file message
      const messageType = uploadedFile.fileType as "image" | "video" | "file" | "gif"
      const sentMessage = await sendMessage(
        "",
        contactId,
        messageType,
        uploadedFile.url,
        uploadedFile.fileName,
        uploadedFile.fileSize,
      )

      // Notify the recipient about the new message
      if (sentMessage) {
        sendEvent("message_received", {
          id: sentMessage._id,
          senderId: "current-user",
          senderName: session?.user?.name || "You",
          senderImage: session?.user?.image,
          messageType,
          receiverId: contactId,
        })
      }

      setUploadedFile(null)
    } else if (newMessage.trim()) {
      // Send text message
      const sentMessage = await sendMessage(newMessage, contactId)

      // Notify the recipient about the new message
      if (sentMessage) {
        sendEvent("message_received", {
          id: sentMessage._id,
          senderId: "current-user",
          senderName: session?.user?.name || "You",
          senderImage: session?.user?.image,
          content: newMessage,
          messageType: "text",
          receiverId: contactId,
        })
      }

      setNewMessage("")
    }

    // Scroll to bottom after sending
    setTimeout(() => {
      scrollToBottom()
    }, 100)
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

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number, waveformData: number[]) => {
    try {
      // Create form data
      const formData = new FormData()
      formData.append("file", audioBlob, "voice-message.wav")

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
      const sentMessage = await sendMessage(
        "",
        contactId,
        "voice",
        data.url,
        "Voice message",
        data.fileSize,
        duration,
        waveformData,
      )

      // Notify the recipient about the new message
      if (sentMessage) {
        sendEvent("message_received", {
          id: sentMessage._id,
          senderId: "current-user",
          senderName: session?.user?.name || "You",
          senderImage: session?.user?.image,
          messageType: "voice",
          receiverId: contactId,
        })
      }

      // Scroll to bottom after sending
      setTimeout(() => {
        scrollToBottom()
      }, 100)
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

  // Enhanced background class function
  const getChatBackgroundClass = () => {
    switch (backgroundSettings.type) {
      case "dark":
        return "bg-gray-900"
      case "gradient":
        switch (backgroundSettings.gradient) {
          case "blue-purple":
            return "bg-gradient-blue-purple"
          case "green-blue":
            return "bg-gradient-green-blue"
          case "orange-red":
            return "bg-gradient-orange-red"
          case "rainbow":
            return "bg-gradient-rainbow"
          default:
            return "bg-gradient-blue-purple"
        }
      case "animated":
        return `relative bg-white dark:bg-gray-800 animated-background-${backgroundSettings.animation || "waves"}`
      case "pattern":
        return `bg-white dark:bg-gray-800 bg-${backgroundSettings.pattern || "dots"}`
      case "light":
      default:
        return "bg-white dark:bg-gray-800"
    }
  }

  // Render animated background overlay if needed
  const renderAnimatedBackground = () => {
    if (backgroundSettings.type !== "animated") return null
    
    switch (backgroundSettings.animation) {
      case "waves":
        return <div className="absolute inset-0 waves-animation pointer-events-none" />
      case "particles":
        return <div className="absolute inset-0 particles-animation pointer-events-none" />
      case "bubbles":
        return <div className="absolute inset-0 bubbles-animation pointer-events-none" />
      default:
        return null
    }
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

  if (contactsLoading || messagesLoading) {
    return <LoadingScreen />
  }

  if (!contact) {
    return <div className="flex items-center justify-center h-full">Contact not found</div>
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={contact.contactDetails.image || "/placeholder.svg?height=40&width=40"}
              alt={contact.contactDetails.name}
            />
            <AvatarFallback>{contact.contactDetails.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">{contact.contactDetails.name}</h2>
            <UserStatus
              userId={contact.contactDetails._id}
              isOnline={contact.contactDetails.isOnline || false}
              lastActive={contact.lastActive || new Date().toISOString()}
            />
          </div>
        </div>
        
        {/* Chat background picker */}
        <div className="flex items-center gap-2">
          <ChatBackgroundPicker 
            value={backgroundSettings}
            onChange={setBackgroundSettings}
          />
        </div>
      </div>

      {/* Chat messages with animated background */}
      <div 
        className={`flex-1 overflow-y-auto p-4 space-y-6 ${getChatBackgroundClass()}`} 
        ref={messagesContainerRef}
      >
        {renderAnimatedBackground()}
        
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
                key={`${message._id}-${message.senderId}`}
                  id={message._id}
                  content={message.content}
                  mediaUrl={message.mediaUrl}
                  fileName={message.fileName}
                  fileSize={message.fileSize}
                  duration={message.duration}
                  messageType={message.messageType}
                  isMe={message.senderId === session?.user?.id}
                  timestamp={message.createdAt}
                  read={message.read}
                  waveformData={message.waveformData}
                  isUnread={unreadMessageIds.has(message._id)}
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
              disabled={!!uploadedFile}
            />
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            {/* Voice recorder button - not nested inside another button */}
            {!uploadedFile && (
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
            <Button type="submit" variant="default" size="icon" disabled={!newMessage.trim() && !uploadedFile}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}