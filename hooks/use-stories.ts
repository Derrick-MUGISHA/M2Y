"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export interface Story {
  _id: string
  content?: string
  mediaUrl?: string
  mediaType?: "image" | "video"
  viewedBy: {
    userId: string
    viewedAt: string
  }[]
  createdAt: string
  user: {
    _id: string
    name: string
    image?: string
  }
}

export interface StoryGroup {
  user: {
    _id: string
    name: string
    image?: string
  }
  stories: Story[]
  hasUnviewed: boolean
}

export function useStories() {
  const { data: session } = useSession()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStories = async () => {
      if (!session?.user) return

      try {
        const response = await fetch("/api/stories")

        if (!response.ok) {
          throw new Error("Failed to fetch stories")
        }

        const data = await response.json()
        setStories(data)
      } catch (err: any) {
        setError(err.message)
        console.error("Error fetching stories:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()

    // Poll for new stories every 5 minutes
    const interval = setInterval(fetchStories, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [session])

  const createStory = async (content?: string, mediaUrl?: string, mediaType?: "image" | "video") => {
    if (!session?.user) return null

    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, mediaUrl, mediaType }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create story")
      }

      const data = await response.json()

      // Add new story to state
      setStories((prev) => [data.data, ...prev])

      return data.data
    } catch (err: any) {
      setError(err.message)
      console.error("Error creating story:", err)
      return null
    }
  }

  const viewStory = async (storyId: string) => {
    if (!session?.user) return

    try {
      await fetch(`/api/stories/${storyId}/view`, {
        method: "POST",
      })

      // Update local state
      setStories((prev) =>
        prev.map((story) =>
          story._id === storyId
            ? {
                ...story,
                viewedBy: [
                  ...story.viewedBy,
                  { userId: session.user.id as string, viewedAt: new Date().toISOString() },
                ],
              }
            : story,
        ),
      )
    } catch (err: any) {
      console.error("Error marking story as viewed:", err)
    }
  }

  // Group stories by user
  const storyGroups = stories.reduce((groups: StoryGroup[], story) => {
    const existingGroup = groups.find((group) => group.user._id === story.user._id)

    if (existingGroup) {
      existingGroup.stories.push(story)
      // Check if this story is unviewed
      if (!story.viewedBy.some((view) => view.userId === session?.user?.id)) {
        existingGroup.hasUnviewed = true
      }
    } else {
      groups.push({
        user: story.user,
        stories: [story],
        hasUnviewed: !story.viewedBy.some((view) => view.userId === session?.user?.id),
      })
    }

    return groups
  }, [])

  // Sort groups: first by hasUnviewed (true first), then by latest story
  storyGroups.sort((a, b) => {
    if (a.hasUnviewed !== b.hasUnviewed) {
      return a.hasUnviewed ? -1 : 1
    }

    const aLatest = new Date(a.stories[0].createdAt).getTime()
    const bLatest = new Date(b.stories[0].createdAt).getTime()
    return bLatest - aLatest
  })

  return { stories, storyGroups, loading, error, createStory, viewStory }
}

