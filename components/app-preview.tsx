"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, Smile, Paperclip } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Message {
  id: number
  content: string
  sender: "app" | "user"
  timestamp: string
}

export function AppPreview() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Welcome to Me 2 You! How can I help you today?",
      sender: "app",
      timestamp: "Just now",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Auto-respond to user messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.sender === "user") {
      setIsTyping(true)
      const timer = setTimeout(() => {
        setIsTyping(false)
        const responses = [
          "That's great! Me 2 You keeps all your conversations secure with end-to-end encryption.",
          "Your privacy is our priority. Want to try our social features too?",
          "You can share photos securely with friends and family!",
          "Need anything else? I'm here to help!",
        ]
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            content: randomResponse,
            sender: "app",
            timestamp: "Just now",
          },
        ])
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        content: inputValue,
        sender: "user",
        timestamp: "Just now",
      },
    ])

    setInputValue("")
  }

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden border shadow-lg bg-background">
      {/* Chat header */}
      <div className="border-b p-3 flex items-center gap-3 bg-muted/30">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Me 2 You" />
          <AvatarFallback className="bg-primary/10 text-primary">M2Y</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-sm">Me 2 You Assistant</h3>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background/80">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}>
            {message.sender === "app" && (
              <Avatar className="h-6 w-6 mr-2 mt-1 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">M2Y</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <p>{message.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <Avatar className="h-6 w-6 mr-2 mt-1 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">M2Y</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="border-t p-3 bg-background">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-muted/30"
          />
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
            <Smile className="h-4 w-4" />
          </Button>
          <Button type="submit" variant="default" size="icon" disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

