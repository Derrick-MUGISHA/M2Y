"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProfile } from "@/hooks/use-profile"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function SettingsPage() {
  const { profile, updateProfile } = useProfile()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleThemeChange = async (theme: "light" | "dark" | "system") => {
    setIsSubmitting(true)

    try {
      await updateProfile({ theme })

      toast({
        title: "Theme updated",
        description: `Theme changed to ${theme}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update theme",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences</p>
        </div>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the appearance of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                defaultValue={profile?.theme || "system"}
                onValueChange={(value) => handleThemeChange(value as "light" | "dark" | "system")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system">System</Label>
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter>
              {isSubmitting && (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Saving...</span>
                </div>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat Appearance</CardTitle>
              <CardDescription>Customize how your chats look</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="chat-bubbles">Chat Bubbles</Label>
                <Switch id="chat-bubbles" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="large-text">Large Text</Label>
                <Switch id="large-text" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="message-timestamps">Show Message Timestamps</Label>
                <Switch id="message-timestamps" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="message-notifications">Message Notifications</Label>
                <Switch id="message-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="story-notifications">Story Notifications</Label>
                <Switch id="story-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="contact-notifications">Contact Request Notifications</Label>
                <Switch id="contact-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="online-status">Show Online Status</Label>
                <Switch id="online-status" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="read-receipts">Send Read Receipts</Label>
                <Switch id="read-receipts" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="location-sharing">Location Sharing</Label>
                <Switch id="location-sharing" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View Privacy Policy
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

