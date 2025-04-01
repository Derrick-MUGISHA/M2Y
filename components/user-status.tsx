"use client"

import { formatDistanceToNow } from "date-fns"

interface UserStatusProps {
  userId?: string
  isOnline: boolean
  lastActive: string
}

export function UserStatus({ isOnline, lastActive }: UserStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
      <p className="text-xs text-muted-foreground">
        {isOnline ? "Online" : `Last seen ${formatDistanceToNow(new Date(lastActive), { addSuffix: true })}`}
      </p>
    </div>
  )
}

