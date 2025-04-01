"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, UserPlus, Users, UserCheck } from "lucide-react"
import { AddContactDialog } from "@/components/add-contact-dialog"
import { ContactRequests } from "@/components/contact-requests"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useContacts } from "@/lib/chat-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface User {
  _id: string
  name: string
  email: string
  image?: string
  lastActive?: string
}

export default function ConnectionsPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "contacts"

  const { contacts, loading, addContact } = useContacts()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState(initialTab)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [addingContactId, setAddingContactId] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.contactDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.contactDetails.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab !== "discover") return

      setUsersLoading(true)
      try {
        const response = await fetch(`/api/users?page=${page}&limit=20&search=${encodeURIComponent(searchQuery)}`)

        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }

        const data = await response.json()
        setUsers(data.users)
        setTotalPages(data.pagination.pages)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [activeTab, page, searchQuery])

  const handleAddContact = async (email: string, userId: string) => {
    setAddingContactId(userId)

    try {
      const success = await addContact(email)

      if (success) {
        toast({
          title: "Contact request sent",
          description: "Your request has been sent successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send contact request",
        variant: "destructive",
      })
    } finally {
      setAddingContactId(null)
    }
  }

  return (
    <div className="flex h-full">
      {/* Left side - Controls */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Connections</h2>
          <div className="flex items-center gap-2">
            <AddContactDialog />
            <Button size="sm" className="gap-1">
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="contacts">
              <Users className="h-4 w-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UserCheck className="h-4 w-4 mr-2" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="discover">
              <Search className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
          </TabsList>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === "contacts" ? "contacts" : activeTab === "requests" ? "requests" : "people"}...`}
              className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="contacts" className="h-full">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredContacts.length > 0 ? (
                <div className="space-y-1">
                  {filteredContacts.map((contact) => (
                    <Link key={contact._id} href={`/dashboard/messages/${contact.contactDetails._id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                        <Avatar>
                          <AvatarImage
                            src={contact.contactDetails.image || `/placeholder.svg?height=40&width=40`}
                            alt={contact.contactDetails.name}
                          />
                          <AvatarFallback>
                            {contact.contactDetails.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{contact.contactDetails.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{contact.contactDetails.email}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          Message
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  {searchQuery
                    ? "No contacts match your search"
                    : "No contacts found. Add some contacts to start chatting!"}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="h-full">
              <ContactRequests />
            </TabsContent>

            <TabsContent value="discover" className="h-full">
              {usersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  ))}
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-1">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Avatar>
                        <AvatarImage src={user.image || `/placeholder.svg?height=40&width=40`} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        {user.lastActive && (
                          <p className="text-xs text-muted-foreground">
                            Active {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddContact(user.email, user._id)}
                        disabled={addingContactId === user._id}
                      >
                        {addingContactId === user._id ? "Sending..." : "Add Contact"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  {searchQuery ? "No users match your search" : "No users found"}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right side - Content */}
      <div className="w-2/3 flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-6">
        <Card className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md">
          <CardHeader className="text-center">
            <CardTitle>Manage Your Network</CardTitle>
            <CardDescription>
              {activeTab === "contacts" && "View and interact with your contacts"}
              {activeTab === "requests" && "Accept or decline contact requests"}
              {activeTab === "discover" && "Find and connect with new people"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {activeTab === "contacts" && <Users className="h-12 w-12 text-gray-400" />}
              {activeTab === "requests" && <UserCheck className="h-12 w-12 text-gray-400" />}
              {activeTab === "discover" && <UserPlus className="h-12 w-12 text-gray-400" />}
            </div>
            <div className="text-center text-muted-foreground">
              {activeTab === "contacts" && "Select a contact to view their profile or start a conversation"}
              {activeTab === "requests" && "Manage your pending contact requests"}
              {activeTab === "discover" && "Discover new people and expand your network"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

