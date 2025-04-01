"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Check, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ContactRequest {
  _id: string
  createdAt: string
  requester: {
    _id: string
    name: string
    email: string
    image?: string
  }
}

export function ContactRequests() {
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch("/api/contacts/requests")

        if (!response.ok) {
          throw new Error("Failed to fetch contact requests")
        }

        const data = await response.json()
        setRequests(data)
      } catch (error) {
        console.error("Error fetching contact requests:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()

    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRequest = async (requestId: string, action: "accept" | "reject") => {
    setProcessingIds((prev) => [...prev, requestId])

    try {
      const response = await fetch("/api/contacts/requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} contact request`)
      }

      // Remove the request from the list
      setRequests((prev) => prev.filter((req) => req._id !== requestId))

      toast({
        title: `Request ${action === "accept" ? "accepted" : "rejected"}`,
        description: action === "accept" ? "You are now connected with this user" : "Contact request has been rejected",
      })
    } catch (error) {
      console.error(`Error ${action}ing contact request:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} the contact request`,
        variant: "destructive",
      })
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== requestId))
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return <div className="text-center p-4 text-muted-foreground">No pending contact requests</div>
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const isProcessing = processingIds.includes(request._id)

        return (
          <div key={request._id} className="flex items-center gap-4 p-3 border rounded-lg">
            <Avatar>
              <AvatarImage
                src={request.requester.image || `/placeholder.svg?height=40&width=40`}
                alt={request.requester.name}
              />
              <AvatarFallback>
                {request.requester.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{request.requester.name}</p>
              <p className="text-sm text-muted-foreground truncate">{request.requester.email}</p>
              <p className="text-xs text-muted-foreground">
                Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={isProcessing}
                onClick={() => handleRequest(request._id, "reject")}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </Button>
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={isProcessing}
                onClick={() => handleRequest(request._id, "accept")}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

