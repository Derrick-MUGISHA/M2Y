"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

interface AudioWaveformProps {
  audioUrl: string
  duration?: number
  waveformData?: number[] // Pre-computed waveform data if available
  compact?: boolean
}

export function AudioWaveform({ audioUrl, duration = 0, waveformData, compact = false }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const [waveform, setWaveform] = useState<number[]>(waveformData || [])
  const animationRef = useRef<number | undefined>(undefined)
  const [isLoaded, setIsLoaded] = useState(false)

  // Generate waveform data from audio file if not provided
  useEffect(() => {
    if (waveformData && waveformData.length > 0) {
      setWaveform(waveformData)
      return
    }

    if (!audioUrl) return

    const generateWaveform = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const response = await fetch(audioUrl)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Get the audio data
        const channelData = audioBuffer.getChannelData(0)
        const samples = 100 // Number of samples to take
        const blockSize = Math.floor(channelData.length / samples)
        const dataPoints: number[] = []

        // Calculate the amplitude for each block
        for (let i = 0; i < samples; i++) {
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j])
          }
          dataPoints.push(sum / blockSize)
        }

        // Normalize the data to values between 0 and 1
        const maxValue = Math.max(...dataPoints)
        const normalizedData = dataPoints.map((point) => point / maxValue)

        setWaveform(normalizedData)
      } catch (error) {
        console.error("Error generating waveform:", error)
      }
    }

    generateWaveform()
  }, [audioUrl, waveformData])

  // Handle audio element events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration)
      setIsLoaded(true)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      cancelAnimationFrame(animationRef.current!)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      cancelAnimationFrame(animationRef.current!)
    }
  }, [])

  // Draw the waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveform.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    // Set canvas dimensions accounting for device pixel ratio
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    const barWidth = rect.width / waveform.length
    const barGap = 2
    const barWidthWithGap = barWidth - barGap

    // Calculate progress for playback position
    const progress = audioRef.current ? currentTime / (audioRef.current.duration || audioDuration) : 0

    const progressPosition = progress * rect.width

    // Draw each bar
    waveform.forEach((amplitude, index) => {
      const x = index * barWidth
      const barHeight = Math.max(2, amplitude * (rect.height - 10))
      const y = (rect.height - barHeight) / 2

      // Determine if this bar is before or after the playback position
      const isPlayed = x < progressPosition

      // Set color based on playback position
      ctx.fillStyle = isPlayed ? "#22c55e" : "#94a3b8"

      // Draw rounded bar
      ctx.beginPath()
      ctx.roundRect(x, y, barWidthWithGap, barHeight, 2)
      ctx.fill()
    })
  }, [waveform, currentTime, audioDuration])

  // Handle canvas click for seeking
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickPosition = e.clientX - rect.left
    const seekPercentage = clickPosition / rect.width

    // Set the current time based on click position
    audioRef.current.currentTime = seekPercentage * (audioRef.current.duration || audioDuration)
  }

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      cancelAnimationFrame(animationRef.current!)
    } else {
      audioRef.current.play()
      // Use requestAnimationFrame for smoother updates
      const updateTime = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
        animationRef.current = requestAnimationFrame(updateTime)
      }

      animationRef.current = requestAnimationFrame(updateTime)
    }

    setIsPlaying(!isPlaying)
  }

  const handleSliderChange = (values: number[]) => {
    if (!audioRef.current) return

    const newTime = values[0]
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 w-full">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0" onClick={togglePlayback}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="flex-1 relative h-8">
          <canvas ref={canvasRef} className="w-full h-full cursor-pointer" onClick={handleCanvasClick} />
        </div>

        <span className="text-xs text-muted-foreground flex-shrink-0">{formatDuration(currentTime)}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0" onClick={togglePlayback}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="flex-1 relative">
          <canvas ref={canvasRef} className="w-full h-12 cursor-pointer" onClick={handleCanvasClick} />
        </div>

        <span className="text-xs text-muted-foreground flex-shrink-0">
          {formatDuration(currentTime)} / {formatDuration(audioDuration)}
        </span>
      </div>

      {isLoaded && (
        <Slider value={[currentTime]} min={0} max={audioDuration || 0} step={0.1} onValueChange={handleSliderChange} />
      )}
    </div>
  )
}

