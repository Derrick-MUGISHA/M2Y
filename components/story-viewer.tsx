"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Progress } from "@/components/ui/progress"
import type { StoryGroup } from "@/hooks/use-stories"

interface StoryViewerProps {
  storyGroups: StoryGroup[]
  initialGroupIndex?: number
  initialStoryIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onView: (storyId: string) => void
}

export function StoryViewer({
  storyGroups,
  initialGroupIndex = 0,
  initialStoryIndex = 0,
  open,
  onOpenChange,
  onView,
}: StoryViewerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentGroup = storyGroups[currentGroupIndex]
  const currentStory = currentGroup?.stories[currentStoryIndex]

  // Reset progress when story changes
  useEffect(() => {
    if (!open) return

    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    // Mark story as viewed
    if (currentStory) {
      onView(currentStory._id)
    }

    setProgress(0)
    setPaused(false)

    // Set up progress interval
    const duration = currentStory?.mediaType === "video" ? 0 : 5000 // 5 seconds for images, videos control their own duration

    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / duration) * 100
          if (newProgress >= 100) {
            clearInterval(interval)
            goToNextStory()
            return 0
          }
          return newProgress
        })
      }, 100)

      progressInterval.current = interval
      return () => clearInterval(interval)
    }
  }, [currentGroupIndex, currentStoryIndex, open, currentStory])

  // Handle video playback
  useEffect(() => {
    if (currentStory?.mediaType === "video" && videoRef.current) {
      videoRef.current.currentTime = 0

      if (!paused) {
        videoRef.current.play().catch((err) => console.error("Error playing video:", err))
      } else {
        videoRef.current.pause()
      }
    }
  }, [currentStory, paused])

  const goToNextStory = () => {
    // If there are more stories in the current group
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1)
    }
    // If there are more groups
    else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1)
      setCurrentStoryIndex(0)
    }
    // If we're at the end, close the viewer
    else {
      onOpenChange(false)
    }
  }

  const goToPrevStory = () => {
    // If we're not at the first story in the group
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1)
    }
    // If we're at the first story but not the first group
    else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1)
      setCurrentStoryIndex(storyGroups[currentGroupIndex - 1].stories.length - 1)
    }
  }

  const handleVideoEnded = () => {
    goToNextStory()
  }

  const togglePause = () => {
    setPaused(!paused)
  }

  if (!currentGroup || !currentStory) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-md h-[80vh] p-0 gap-0 bg-black text-white">
        <DialogTitle className="sr-only">Story Viewer</DialogTitle>
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage
                  src={currentGroup.user.image || "/placeholder.svg?height=40&width=40"}
                  alt={currentGroup.user.name}
                />
                <AvatarFallback>{currentGroup.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{currentGroup.user.name}</p>
                <p className="text-xs opacity-70">
                  {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress bars */}
          <div className="absolute top-16 left-0 right-0 z-10 flex gap-1 px-4">
            {currentGroup.stories.map((story, index) => (
              <Progress
                key={story._id}
                value={index === currentStoryIndex ? progress : index < currentStoryIndex ? 100 : 0}
                className="h-1 flex-1"
              />
            ))}
          </div>

          {/* Story content */}
          <div className="flex-1 flex items-center justify-center bg-black" onClick={togglePause}>
            {currentStory.mediaUrl ? (
              currentStory.mediaType === "video" ? (
                <video
                  ref={videoRef}
                  src={currentStory.mediaUrl}
                  className="max-h-full max-w-full object-contain"
                  controls={false}
                  onEnded={handleVideoEnded}
                />
              ) : (
                <img
                  src={currentStory.mediaUrl || "/placeholder.svg"}
                  alt="Story"
                  className="max-h-full max-w-full object-contain"
                />
              )
            ) : (
              <div className="p-8 max-w-md text-center">
                <p className="text-xl">{currentStory.content}</p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1/4"
            onClick={(e) => {
              e.stopPropagation()
              goToPrevStory()
            }}
          >
            <ChevronLeft className="h-8 w-8 opacity-0" />
          </button>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-1/4"
            onClick={(e) => {
              e.stopPropagation()
              goToNextStory()
            }}
          >
            <ChevronRight className="h-8 w-8 opacity-0" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

