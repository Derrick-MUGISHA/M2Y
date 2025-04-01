"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export interface UserProfile {
  _id: string
  name: string
  email: string
  image?: string
  lastActive: string
  location?: string
  theme: "light" | "dark" | "system"
  privacyAccepted: boolean
  contactCount: number
  createdAt: string
}

export function useProfile() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) return

      try {
        const response = await fetch("/api/user/profile")

        if (!response.ok) {
          throw new Error("Failed to fetch profile")
        }

        const data = await response.json()
        setProfile(data)
      } catch (err: any) {
        setError(err.message)
        console.error("Error fetching profile:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [session])

  const updateProfile = async (updates: {
    name?: string
    location?: string
    theme?: "light" | "dark" | "system"
  }) => {
    if (!session?.user) return null

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update profile")
      }

      const data = await response.json()

      // Update local state
      setProfile({
        ...profile!,
        ...updates,
        ...data.user,
      })

      return data.user
    } catch (err: any) {
      setError(err.message)
      console.error("Error updating profile:", err)
      return null
    }
  }

  const acceptPrivacyPolicy = async () => {
    if (!session?.user || !profile) return false

    try {
      const response = await fetch("/api/user/privacy", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to accept privacy policy")
      }

      // Update local state
      setProfile({
        ...profile,
        privacyAccepted: true,
      })

      return true
    } catch (err: any) {
      setError(err.message)
      console.error("Error accepting privacy policy:", err)
      return false
    }
  }

  return { profile, loading, error, updateProfile, acceptPrivacyPolicy }
}

