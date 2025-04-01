"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserX } from "lucide-react"

export default function PrivacyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="container p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Privacy & Security</h1>
          <p className="text-muted-foreground">Manage your privacy settings and security preferences</p>
        </div>
      </div>

      <Tabs defaultValue="privacy">
        <TabsList>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="blocking">Blocking</TabsTrigger>
        </TabsList>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control who can see your information and activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="online-status">Online Status</Label>
                  <p className="text-sm text-muted-foreground">Show when you're active on the platform</p>
                </div>
                <Switch id="online-status" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="read-receipts">Read Receipts</Label>
                  <p className="text-sm text-muted-foreground">Let others know when you've read their messages</p>
                </div>
                <Switch id="read-receipts" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="typing-indicators">Typing Indicators</Label>
                  <p className="text-sm text-muted-foreground">Show when you're typing a message</p>
                </div>
                <Switch id="typing-indicators" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="last-seen">Last Seen</Label>
                  <p className="text-sm text-muted-foreground">Allow others to see when you were last active</p>
                </div>
                <Switch id="last-seen" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Privacy</CardTitle>
              <CardDescription>Control who can see your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-photo">Profile Photo</Label>
                  <p className="text-sm text-muted-foreground">Who can see your profile photo</p>
                </div>
                <select
                  className="p-2 rounded-md border"
                  aria-label="Profile photo visibility"
                >
                  <option>Everyone</option>
                  <option>Contacts Only</option>
                  <option>Nobody</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Status</Label>
                  <p className="text-sm text-muted-foreground">Who can see your status updates</p>
                </div>
                <select className="p-2 rounded-md border" aria-label="Status visibility">
                  <option>Everyone</option>
                  <option>Contacts Only</option>
                  <option>Nobody</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Switch id="two-factor" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="login-alerts">Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified of new logins to your account</p>
                </div>
                <Switch id="login-alerts" defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  <Button variant="outline">Change Password</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Active Sessions</Label>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">1 active session</p>
                  <Button variant="outline">Manage Sessions</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blocked Users</CardTitle>
              <CardDescription>Manage users you've blocked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>You haven't blocked any users yet</p>
                <p className="text-sm mt-1">Blocked users won't be able to message you or see your status</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

