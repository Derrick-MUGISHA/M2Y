"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Check, CheckCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ChatMessageProps {
  id: string
  content?: string
  mediaUrl?: string
  messageType: "text" | "image" | "video" | "file" | "voice" | "gif"
  isMe: boolean
  timestamp: string | number
  read?: boolean
  sender?: {
    name: string
    image?: string
  }
  isGroup?: boolean
}

export function ChatMessage({
  id,
  content,
  mediaUrl,
  messageType,
  isMe,
  timestamp,
  read,
  sender,
  isGroup,
}: ChatMessageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const renderMessageContent = () => {
    switch (messageType) {
      case "text":
        return <p className="whitespace-pre-wrap break-words">{content}</p>

      case "image":
        return (
          <div className="relative">
            {!imageLoaded && <div className="h-48 w-48 bg-muted animate-pulse rounded-md" />}
            <img
              src={mediaUrl || "/placeholder.svg"}
              alt="Image"
              className={cn("max-h-[200px] max-w-[200px] rounded-md object-contain", !imageLoaded && "hidden")}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        )
        
      // Other message types could be implemented here
      default:
        return <p className="whitespace-pre-wrap break-words">{content}</p>
    }
  }

  return (
<div className={cn("flex mb-2", isMe ? "justify-end" : "justify-start")}>
  {!isMe && isGroup && (
    <div className="mr-2 mt-1">
      <Avatar className="h-6 w-6">
        <AvatarImage src={sender?.image} />
        <AvatarFallback>{sender?.name?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
    </div>
  )}
     <div
    className={cn(
      "max-w-[70%] rounded-lg px-3 py-2 relative",
      isMe
        ? "bg-green-500 text-white rounded-tr-none ml-auto"  // Added ml-auto for right alignment
        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-none mr-auto"  // Added mr-auto for left alignment
    )}
      >
        {!isMe && isGroup && <p className="text-xs font-medium mb-1 text-blue-500">{sender?.name}</p>}
        {renderMessageContent()}
        <div
          className={cn(
            "text-xs mt-1 flex items-center justify-end gap-1",
            isMe ? "text-white/70" : "text-gray-500"
          )}
        >
          <span>{typeof timestamp === "string" ? timestamp : format(new Date(timestamp), "HH:mm")}</span>
          {isMe && (read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  )
}