"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Search, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserSearchResult {
  _id: string
  name: string
  email: string
  image?: string
}

export function AddContactDialog() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!email.trim()) return

    setIsSearching(true)
    setSearchResult(null)

    try {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`)

      if (response.status === 404) {
        toast({
          title: "User not found",
          description: "No user found with that email address",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        throw new Error("Failed to search for user")
      }

      const data = await response.json()
      setSearchResult(data)
    } catch (error) {
      toast({
        title: "Search failed",
        description: "An error occurred while searching for the user",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddContact = async () => {
    if (!searchResult) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: searchResult.email }),
      })

      const data = await response.json()

      if (response.status === 409) {
        toast({
          title: "Contact already exists",
          description:
            data.status === "pending"
              ? "A contact request is already pending"
              : "This user is already in your contacts",
        })
        setOpen(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to add contact")
      }

      toast({
        title: "Contact request sent",
        description: `A friend request has been sent to ${searchResult.name}`,
      })

      setEmail("")
      setSearchResult(null)
      setOpen(false)
    } catch (error: any) {
      toast({
        title: "Failed to add contact",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <UserPlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>Search for a user by email address to connect with them.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={handleSearch} disabled={isSearching || !email.trim()}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {searchResult && (
            <div className="border rounded-lg p-4 mt-2">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage
                    src={searchResult.image || "/placeholder.svg?height=40&width=40"}
                    alt={searchResult.name}
                  />
                  <AvatarFallback>
                    {searchResult.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{searchResult.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{searchResult.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleAddContact} disabled={isLoading || !searchResult}>
            {isLoading ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

