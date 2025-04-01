"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GroupList } from "@/components/group-list"
import { CreateGroup } from "@/components/create-group"
import { useRouter } from "next/navigation"

export default function GroupsPage() {
  const [activeTab, setActiveTab] = useState("my-groups")
  const router = useRouter()

  const handleGroupCreated = (groupId: string) => {
    router.push(`/dashboard/groups/${groupId}`)
  }

  return (
    <div className="container p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">Create and manage group conversations</p>
        </div>
        <CreateGroup onGroupCreated={handleGroupCreated} />
      </div>

      <Tabs defaultValue="my-groups" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="space-y-4">
          <GroupList />
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Group Invitations</CardTitle>
              <CardDescription>Groups you've been invited to join</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-4">No pending invitations</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

