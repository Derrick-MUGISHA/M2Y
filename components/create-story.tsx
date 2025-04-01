"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, Loader2, X, ImageIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"
import { Progress } from "@/components/ui/progress"
import { useLoading } from "@/contexts/loading-context"

interface CreateStoryProps {
  onStoryCreated?: () => void
}

export function CreateStory({ onStoryCreated }: CreateStoryProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { showLoading, hideLoading } = useLoading()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    const fileType = file.type.split("/")[0]
    if (!["image", "video"].includes(fileType)) {
      toast({
        title: "Invalid file type",
        description: "Please select an image or video file",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!content && !selectedFile) {
      toast({
        title: "Empty story",
        description: "Please add some content or media to your story",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)
    showLoading("Creating your story...")

    try {
      const formData = new FormData()

      if (content) {
        formData.append("content", content)
      }

      if (selectedFile) {
        formData.append("file", selectedFile)
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 100)

      const response = await fetch("/api/stories", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create story")
      }

      toast({
        title: "Story created",
        description: "Your story has been published successfully",
      })

      setContent("")
      clearSelectedFile()
      setOpen(false)

      if (onStoryCreated) {
        onStoryCreated()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
      hideLoading()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Create Story</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Story</DialogTitle>
          <DialogDescription>Share a moment with your contacts. Stories disappear after 24 hours.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={session?.user?.image || "/placeholder.svg?height=40&width=40"} />
              <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{session?.user?.name}</span>
          </div>

          {selectedFile && previewUrl ? (
            <div className="relative border rounded-md p-2">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80"
                onClick={clearSelectedFile}
              >
                <X className="h-4 w-4" />
              </Button>
              {selectedFile.type.startsWith("image/") ? (
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Story preview"
                  className="w-full h-48 object-contain rounded-md"
                />
              ) : (
                <video src={previewUrl} className="w-full h-48 object-contain rounded-md" controls />
              )}
            </div>
          ) : (
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
              rows={5}
            />
          )}

          {!selectedFile && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Add Photo/Video</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {isSubmitting && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || (!content && !selectedFile)}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>Post Story</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

