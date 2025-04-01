"use client"

import type React from "react"
import { useState } from "react"
import { Paperclip, X, Image, FileText, Film, GiftIcon as Gif } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { useLoading } from "@/contexts/loading-context"

interface FileUploadProps {
  onFileUpload: (fileData: {
    url: string
    fileName: string
    fileSize: number
    fileType: string
  }) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()

  const simulateProgress = () => {
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

  const uploadFile = async (file: File) => {
    if (!file) return

    // Check file size (500MB limit)
    const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "File size must be less than 500MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setIsOpen(false)
    showLoading("Uploading file...")

    // Simulate progress
    const progressInterval = simulateProgress()

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload file")
      }

      const data = await response.json()

      // Complete the progress
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Check if it's a GIF
      const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")
      const fileType = isGif ? "gif" : data.fileType

      // Call the callback with the file data
      onFileUpload({
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: fileType,
      })

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the file",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsUploading(false)
      hideLoading()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  if (isUploading) {
    return (
      <div className="w-full p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Uploading...</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsUploading(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={uploadProgress} className="h-2" />
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" side="top">
        <div className="grid gap-1 p-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <Image className="h-4 w-4" />
            <span>Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <Gif className="h-4 w-4" />
            <span>GIF</span>
            <input type="file" accept="image/gif" className="hidden" onChange={handleFileChange} />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <Film className="h-4 w-4" />
            <span>Video</span>
            <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted">
            <FileText className="h-4 w-4" />
            <span>Document</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  )
}

