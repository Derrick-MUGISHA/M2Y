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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useContacts } from "@/lib/chat-service"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CreateGroupProps {
  onGroupCreated?: (groupId: string) => void
}

export function CreateGroup({ onGroupCreated }: CreateGroupProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { contacts } = useContacts()
  const { toast } = useToast()

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive",
      })
      return
    }

    if (selectedContacts.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select at least one contact to add to the group",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          members: selectedContacts,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create group")
      }

      const data = await response.json()

      toast({
        title: "Group created",
        description: `${name} has been created successfully`,
      })

      setName("")
      setDescription("")
      setSelectedContacts([])
      setOpen(false)

      if (onGroupCreated) {
        onGroupCreated(data.group._id)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          <span>Create Group</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
          <DialogDescription>
            Create a group chat with your contacts. Groups make it easy to stay in touch with multiple people at once.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-description">Description (Optional)</Label>
            <Textarea
              id="group-description"
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Select Contacts</Label>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`contact-${contact._id}`}
                        checked={selectedContacts.includes(contact.contactDetails._id)}
                        onCheckedChange={() => toggleContactSelection(contact.contactDetails._id)}
                      />
                      <Label
                        htmlFor={`contact-${contact._id}`}
                        className="flex items-center gap-2 cursor-pointer flex-1 p-2 hover:bg-muted rounded-md"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={contact.contactDetails.image || "/placeholder.svg?height=24&width=24"} />
                          <AvatarFallback>{contact.contactDetails.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{contact.contactDetails.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No contacts found</p>
              )}
            </ScrollArea>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedContacts.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedContacts.length} contact{selectedContacts.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateGroup} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Group</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

