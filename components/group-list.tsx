"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Users } from "lucide-react"

export function GroupList() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch("/api/groups")

        if (!response.ok) {
          throw new Error("Failed to fetch groups")
        }

        const data = await response.json()
        setGroups(data)
      } catch (error) {
        console.error("Error fetching groups:", error)
        toast({
          title: "Error",
          description: "Failed to load groups",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [toast])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="text-center p-8">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Groups Yet</h3>
        <p className="text-muted-foreground">Create a group to start chatting with multiple people at once.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <Link key={group._id} href={`/dashboard/groups/${group._id}`}>
          <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={group.image || "/placeholder.svg?height=48&width=48"} alt={group.name} />
                    <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                    </p>
                  </div>
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{group.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Created {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

