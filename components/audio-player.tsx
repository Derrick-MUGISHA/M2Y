"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface AudioPlayerProps {
  audioUrl: string
  duration?: number
}

export function AudioPlayer({ audioUrl, duration = 0 }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Handle audio playback and time updates
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err)
      })

      // Use setInterval for more consistent updates
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      }, 100)
    }

    setIsPlaying(!isPlaying)
  }

  // Calculate progress percentage
  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  return (
    <div className="flex items-center gap-2 w-full">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0" onClick={togglePlayback}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <div className="flex-1">
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <span className="text-xs text-muted-foreground flex-shrink-0">
        {formatDuration(currentTime)} / {formatDuration(audioDuration)}
      </span>
    </div>
  )
}

