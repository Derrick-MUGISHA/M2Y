"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Send, Loader2, Trash, Pause, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDuration } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { useLoading } from "@/contexts/loading-context"

interface VoiceRecorderProps {
  onVoiceRecorded: (audioBlob: Blob, duration: number, waveformData: number[]) => void
  onCancel: () => void
  standalone?: boolean
  maxDuration?: number // in seconds
}

export function VoiceRecorder({
  onVoiceRecorded,
  onCancel,
  standalone = false,
  maxDuration = 120, // 2 minutes default
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [visualizerData, setVisualizerData] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()

  // Start recording automatically if not standalone
  useEffect(() => {
    if (!standalone && !isRecording && !audioBlob) {
      startRecording()
    }
  }, [standalone, isRecording, audioBlob])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [audioUrl])

  // Handle audio playback
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => setIsPlaying(false)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Initialize audio context for visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()

      // Connect the stream to the analyser
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Configure analyser
      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)

      // Start visualization
      visualize()

      // Use WAV format for better quality
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setWaveformData([])
      setVisualizerData([])

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)

          // Sample the audio data for waveform
          if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current)

            // Calculate average amplitude for this chunk
            const average =
              Array.from(dataArrayRef.current).reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length

            // Normalize to 0-1 range
            const normalizedValue = average / 255

            setWaveformData((prev) => [...prev, normalizedValue])
          }
        }
      }

      mediaRecorder.onstop = () => {
        // Stop visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
        })
        setAudioBlob(audioBlob)

        // Create URL for playback
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        if (timerRef.current) {
          clearInterval(timerRef.current)
        }

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
      }

      // Start recording
      mediaRecorder.start(100) // Collect data every 100ms for better streaming
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Auto-stop after max duration
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice messages",
        variant: "destructive",
      })
      onCancel()
    }
  }

  const visualize = () => {
    if (!analyserRef.current || !dataArrayRef.current) return

    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    // Calculate average amplitude
    const average =
      Array.from(dataArrayRef.current).reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length

    // Normalize to 0-1 range
    const normalizedValue = average / 255

    // Update visualizer data (keep last 50 values)
    setVisualizerData((prev) => {
      const newData = [...prev, normalizedValue]
      if (newData.length > 50) {
        return newData.slice(-50)
      }
      return newData
    })

    // Continue visualization
    animationFrameRef.current = requestAnimationFrame(visualize)
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
      setIsPaused(true)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      // Resume visualization
      visualize()
    }
  }

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const cancelRecording = () => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop()
    }

    setIsRecording(false)
    setIsPaused(false)
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setWaveformData([])
    setVisualizerData([])

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    onCancel()
  }

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err)
        toast({
          title: "Playback error",
          description: "Could not play the recorded audio",
          variant: "destructive",
        })
      })
      setIsPlaying(true)
    }
  }

  const simulateUploadProgress = () => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setUploadProgress(progress)
      if (progress >= 95) {
        clearInterval(interval)
      }
    }, 100)
    return interval
  }

  const sendVoiceMessage = async () => {
    if (!audioBlob) return

    setIsUploading(true)
    setUploadProgress(0)
    showLoading("Sending voice message...")

    // Simulate upload progress
    const progressInterval = simulateUploadProgress()

    try {
      onVoiceRecorded(audioBlob, recordingTime, waveformData)

      // Complete the progress
      clearInterval(progressInterval)
      setUploadProgress(100)

      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingTime(0)
      setWaveformData([])
      setVisualizerData([])
    } catch (error) {
      console.error("Error sending voice message:", error)
      toast({
        title: "Error",
        description: "Failed to send voice message",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      hideLoading()
    }
  }

  if (isRecording) {
    return (
      <div className="flex flex-col gap-2 p-2 bg-muted/30 rounded-md w-full">
        <div className="flex items-center gap-2">
          {!isPaused ? (
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          ) : (
            <div className="h-3 w-3 rounded-full bg-amber-500" />
          )}
          <span className="text-sm font-medium">{formatDuration(recordingTime)}</span>
          <div className="flex-1 h-8 bg-black/10 rounded-md overflow-hidden">
            {/* Live waveform visualization */}
            <div className="h-full flex items-center justify-center">
              {visualizerData.map((value, index) => (
                <div
                  key={index}
                  className="w-1 mx-[1px] bg-green-500"
                  style={{ height: `${Math.max(10, value * 100)}%` }}
                />
              ))}
            </div>
          </div>
          <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={cancelRecording}>
            <Trash className="h-4 w-4" />
          </Button>
          {isPaused ? (
            <Button variant="default" size="icon" className="h-8 w-8 rounded-full" onClick={resumeRecording}>
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="default" size="icon" className="h-8 w-8 rounded-full" onClick={pauseRecording}>
              <Pause className="h-4 w-4" />
            </Button>
          )}
          <Button variant="default" size="icon" className="h-8 w-8 rounded-full" onClick={stopRecording}>
            <Square className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={(recordingTime / maxDuration) * 100} className="h-1" />
      </div>
    )
  }

  if (audioBlob && audioUrl) {
    return (
      <div className="flex flex-col gap-2 p-2 bg-muted/30 rounded-md w-full">
        <audio ref={audioRef} src={audioUrl} className="hidden" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={togglePlayback}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <div className="flex-1 h-8 bg-black/10 rounded-md overflow-hidden">
            <div className="h-full flex items-center justify-center">
              {waveformData.map((value, index) => (
                <div
                  key={index}
                  className="w-1 mx-[1px] bg-blue-500"
                  style={{ height: `${Math.max(10, value * 100)}%` }}
                />
              ))}
            </div>
          </div>

          <span className="text-xs text-muted-foreground">{formatDuration(recordingTime)}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="destructive" size="sm" onClick={cancelRecording}>
            <Trash className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={sendVoiceMessage} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Send
              </>
            )}
          </Button>
        </div>

        {isUploading && <Progress value={uploadProgress} className="h-1" />}
      </div>
    )
  }

  // Only render the button if this is a standalone component
  if (standalone) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={startRecording}>
        <Mic className="h-5 w-5" />
        <span className="sr-only">Record voice message</span>
      </Button>
    )
  }

  // For non-standalone use, return null as the parent will handle the button
  return null
}

