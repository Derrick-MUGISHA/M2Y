"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useStories } from "@/hooks/use-stories"
import { CreateStory } from "@/components/create-story"
import { StoryViewer } from "@/components/story-viewer"
import { PlusCircle } from "lucide-react"
import { useSession } from "next-auth/react"

export default function StoriesPage() {
  const { data: session } = useSession()
  const { storyGroups, loading, viewStory } = useStories()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)

  const handleStoryClick = (groupIndex: number, storyIndex = 0) => {
    setSelectedGroupIndex(groupIndex)
    setSelectedStoryIndex(storyIndex)
    setViewerOpen(true)
  }

  return (
    <div className="container p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stories</h1>
          <p className="text-muted-foreground">View and share stories with your contacts</p>
        </div>
        <CreateStory />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Create story card */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-0 aspect-[3/4] flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center h-full space-y-2 p-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={session?.user?.image || "/placeholder.svg?height=64&width=64"} />
                  <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                  <PlusCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-sm font-medium text-center">Create Story</p>
            </div>
          </CardContent>
        </Card>

        {/* Story cards */}
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0 aspect-[3/4]">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
          ))
        ) : storyGroups.length > 0 ? (
          storyGroups.map((group, groupIndex) => (
            <Card
              key={group.user._id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleStoryClick(groupIndex)}
            >
              <CardContent className="p-0 aspect-[3/4] relative">
                {/* Preview image or gradient background */}
                {group.stories[0].mediaUrl ? (
                  <div className="h-full w-full">
                    {group.stories[0].mediaType === "image" ? (
                      <img
                        src={group.stories[0].mediaUrl || "/placeholder.svg"}
                        alt="Story preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    )}
                  </div>
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                )}

                {/* User info overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                  <Avatar className={`ring-2 ${group.hasUnviewed ? "ring-primary" : "ring-muted"}`}>
                    <AvatarImage src={group.user.image || "/placeholder.svg?height=40&width=40"} />
                    <AvatarFallback>{group.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-white mt-2 truncate">{group.user.name}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center p-8 text-muted-foreground">
            No stories available. Be the first to create a story!
          </div>
        )}
      </div>

      {/* Story viewer */}
      <StoryViewer
        storyGroups={storyGroups}
        initialGroupIndex={selectedGroupIndex}
        initialStoryIndex={selectedStoryIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onView={viewStory}
      />
    </div>
  )
}

