"use client"

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function AuthStatus() {
  const { data: session, status } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({ redirect: true, callbackUrl: "/" })
    } catch (error) {
      console.error("Sign out error:", error)
      setIsSigningOut(false)
    }
  }

  // Handle loading state
  if (status === "loading") {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-24 rounded" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    )
  }

  // Handle authenticated state
  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="hidden md:inline-block text-sm font-medium">{session.user.name || session.user.email}</span>
          <Avatar>
            <AvatarImage
              src={session.user.image || "/placeholder.svg?height=32&width=32"}
              alt={session.user.name || "User"}
            />
            <AvatarFallback>{session.user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    )
  }

  // Handle unauthenticated state
  return (
    <div className="flex items-center gap-4">
      <Link href="/login">
        <Button variant="ghost">Login</Button>
      </Link>
      <Link href="/register">
        <Button>Sign Up</Button>
      </Link>
    </div>
  )
}

