"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  const previousStoryId = useRef<string | null>(null)

  const currentGroup = storyGroups[currentGroupIndex]
  const currentStory = currentGroup?.stories[currentStoryIndex]

  // Navigation handlers declared first using useCallback
  const goToNextStory = useCallback(() => {
    if (!currentGroup) return

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1)
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1)
      setCurrentStoryIndex(0)
    } else {
      onOpenChange(false)
    }
    setProgress(0)
  }, [currentGroup, currentStoryIndex, currentGroupIndex, storyGroups.length, onOpenChange])

  const goToPrevStory = useCallback(() => {
    if (!currentGroup) return

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1)
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1)
      setCurrentStoryIndex(storyGroups[currentGroupIndex - 1].stories.length - 1)
    }
    setProgress(0)
  }, [currentGroupIndex, currentStoryIndex, storyGroups, currentGroup])

  // Track viewed stories
  useEffect(() => {
    if (currentStory && currentStory._id !== previousStoryId.current) {
      onView(currentStory._id)
      previousStoryId.current = currentStory._id
    }
  }, [currentStory, onView])

  // Handle progress updates
  useEffect(() => {
    if (!open || !currentStory || paused) return

    const handleProgress = () => {
      setProgress(prev => {
        const newProgress = prev + 1
        if (newProgress >= 100) {
          goToNextStory()
          return 0
        }
        return newProgress
      })
    }

    const duration = currentStory.mediaType === "video" 
      ? (videoRef.current?.duration || 10) * 1000 
      : 5000

    progressInterval.current = setInterval(handleProgress, duration / 100)

    return () => {
      progressInterval.current && clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }, [open, currentStory, paused, goToNextStory])

  // Handle video playback
  useEffect(() => {
    if (!videoRef.current || !currentStory) return

    const video = videoRef.current
    if (currentStory.mediaType === "video") {
      video.currentTime = 0
      paused ? video.pause() : video.play().catch(console.error)
    }

    const handleEnd = () => goToNextStory()
    video.addEventListener('ended', handleEnd)

    return () => {
      video.removeEventListener('ended', handleEnd)
      video.pause()
    }
  }, [currentStory, paused, goToNextStory])

  const togglePause = () => setPaused(!paused)

  if (!currentGroup || !currentStory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-md h-[80vh] p-0 gap-0 bg-black text-white">
        <DialogTitle className="sr-only">Story Viewer</DialogTitle>
        <div className="relative flex flex-col h-full">
          {/* Header Section */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage
                  src={currentGroup.user.image || "/placeholder.svg"}
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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Bars */}
          <div className="absolute top-16 left-0 right-0 z-10 flex gap-1 px-4">
            {currentGroup.stories.map((story, index) => (
              <Progress
                key={story._id}
                value={index === currentStoryIndex ? progress : index < currentStoryIndex ? 100 : 0}
                className="h-1 flex-1 bg-gray-700/50 [&>div]:bg-white"
              />
            ))}
          </div>

          {/* Story Content */}
          <div 
            className="flex-1 flex items-center justify-center bg-black cursor-pointer" 
            onClick={togglePause}
          >
            {currentStory.mediaUrl ? (
              currentStory.mediaType === "video" ? (
                <video
                  ref={videoRef}
                  src={currentStory.mediaUrl}
                  className="max-h-full max-w-full object-contain"
                  controls={false}
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={currentStory.mediaUrl}
                  alt="Story content"
                  className="max-h-full max-w-full object-contain"
                />
              )
            ) : (
              <div className="p-8 max-w-md text-center">
                <p className="text-xl">{currentStory.content}</p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="absolute inset-0 flex justify-between items-center">
            <button
              className="h-full w-1/4 flex items-center justify-start pl-4"
              onClick={(e) => {
                e.stopPropagation()
                goToPrevStory()
              }}
            >
              <ChevronLeft className="h-8 w-8 text-white/80 hover:text-white" />
            </button>
            <button
              className="h-full w-1/4 flex items-center justify-end pr-4"
              onClick={(e) => {
                e.stopPropagation()
                goToNextStory()
              }}
            >
              <ChevronRight className="h-8 w-8 text-white/80 hover:text-white" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}