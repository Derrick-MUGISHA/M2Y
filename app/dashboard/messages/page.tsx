import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, MessageSquare } from "lucide-react"
import Link from "next/link"
import { ChatList } from "@/components/chat-list"
import { AddContactDialog } from "@/components/add-contact-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MessagesPage() {
  return (
    <div className="flex h-full">
      {/* Left side - Controls */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className="flex items-center gap-2">
            <AddContactDialog />
            <Link href="/dashboard/messages/new">
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>

        <Tabs defaultValue="all" className="mb-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto">
          <ChatList />
        </div>
      </div>

      {/* Right side - Content */}
      <div className="w-2/3 flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-6">
        <Card className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md">
          <CardHeader className="text-center">
            <CardTitle>Select a conversation</CardTitle>
            <CardDescription>Choose a contact from the list or start a new conversation</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <MessageSquare className="h-12 w-12 text-gray-400" />
            </div>
            <Link href="/dashboard/messages/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

