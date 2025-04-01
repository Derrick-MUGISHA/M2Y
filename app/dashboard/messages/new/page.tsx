"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search } from "lucide-react"
import { useContacts } from "@/lib/chat-service"

interface Contact {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

export default function NewChatPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { contacts } = useContacts()
  const router = useRouter()

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectContact = (contactId: string) => {
    router.push(`/dashboard/messages/${contactId}`)
  }

  return (
    <div className="container p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Conversation</CardTitle>
          <CardDescription>Select a contact to start a new conversation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-1 mt-4">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => handleSelectContact(contact.id)}
                >
                  <Avatar>
                    <AvatarImage src={contact.avatar || `/placeholder.svg?height=40&width=40`} alt={contact.name} />
                    <AvatarFallback>
                      {contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                  <div className="ml-auto">
                    <Button variant="ghost" size="sm">
                      Message
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No contacts found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

