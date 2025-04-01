"use client"

import { MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"

interface LoadingScreenProps {
  fullScreen?: boolean
  message?: string
}

export function LoadingScreen({ fullScreen = true, message = "Loading..." }: LoadingScreenProps) {
  const [dots, setDots] = useState(".")

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "."
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="rounded-full bg-primary/10 p-4 animate-pulse">
        <MessageSquare className="h-12 w-12 text-primary animate-bounce" />
      </div>
      <h2 className="text-xl font-bold">Me2You</h2>
      <p className="text-sm text-muted-foreground">
        {message}
        {dots}
      </p>
      <div className="flex gap-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center min-h-[200px] w-full">{content}</div>
}

