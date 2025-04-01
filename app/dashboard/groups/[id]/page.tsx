"use client"

import { useState, useEffect } from "react"
import { GroupChat } from "@/components/group-chat"
import { LoadingScreen } from "@/components/loading-screen"
import { useToast } from "@/hooks/use-toast"
import { useParams } from "next/navigation"

export default function GroupChatPage() {
  // Use the useParams hook instead of directly accessing params
  const params = useParams()
  const groupId = params.id as string

  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<any>(null)
  const { toast } = useToast()

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
      } finally {
        setLoading(false)
      }
    }

    fetchGroup()
  }, [groupId, toast])

  if (loading) {
    return <LoadingScreen />
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Group not found or you don't have access</p>
      </div>
    )
  }

  return <GroupChat groupId={groupId} />
}

