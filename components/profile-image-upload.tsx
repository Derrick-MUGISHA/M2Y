"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Camera, Loader2, CropIcon, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { useSession } from "next-auth/react"
import { Progress } from "@/components/ui/progress"
import { useLoading } from "@/contexts/loading-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

interface ProfileImageUploadProps {
  currentImage?: string
  name: string
  onImageUpdated: (imageUrl: string) => void
}

export function ProfileImageUpload({ currentImage, name, onImageUpdated }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()
  const { update, data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showLoading, hideLoading } = useLoading()

  // Image editing state
  const [showEditor, setShowEditor] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const imageRef = useRef<HTMLImageElement | null>(null)

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    // Create preview URL and open editor
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setSelectedFile(file)
    setShowEditor(true)

    // Reset crop, zoom and rotation
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    })
    setZoom(1)
    setRotation(0)
  }

  const onImageLoad = useCallback((img: HTMLImageElement) => {
    imageRef.current = img
    return false // Return false to prevent completion
  }, [])

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0])
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const getCroppedImg = async () => {
    if (!imageRef.current || !crop.width || !crop.height) return null

    const image = imageRef.current
    const canvas = document.createElement("canvas")
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Set canvas dimensions based on crop
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // Calculate dimensions
    const pixelRatio = window.devicePixelRatio
    const cropWidth = crop.width * scaleX
    const cropHeight = crop.height * scaleY

    canvas.width = cropWidth * pixelRatio
    canvas.height = cropHeight * pixelRatio

    // Apply rotation if needed
    if (rotation > 0) {
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(zoom, zoom)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
    } else {
      ctx.scale(pixelRatio * zoom, pixelRatio * zoom)
    }

    // Draw the cropped image
    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

    if (rotation > 0) {
      ctx.restore()
    }

    // Convert canvas to blob
    return new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Canvas is empty")
            return
          }
          resolve(blob)
        },
        "image/jpeg",
        0.95,
      )
    })
  }

  const handleSaveImage = async () => {
    if (!selectedFile) return

    try {
      const croppedImageBlob = await getCroppedImg()
      if (!croppedImageBlob) {
        toast({
          title: "Error",
          description: "Failed to process the image",
          variant: "destructive",
        })
        return
      }

      // Create a new file from the blob
      const croppedFile = new File([croppedImageBlob], selectedFile.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      })

      // Close the editor
      setShowEditor(false)

      // Upload the cropped image
      await uploadImage(croppedFile)
    } catch (error) {
      console.error("Error saving cropped image:", error)
      toast({
        title: "Error",
        description: "Failed to save the cropped image",
        variant: "destructive",
      })
    }
  }

  const uploadImage = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    showLoading("Updating profile image...")

    // Simulate progress
    const progressInterval = simulateProgress()

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
      })

      // Complete the progress
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload profile image")
      }

      const data = await response.json()

      // Update the image URL
      onImageUpdated(data.url)

      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.url,
        },
      })

      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      hideLoading()

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }

      setSelectedFile(null)
    }
  }

  return (
    <>
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={currentImage || "/placeholder.svg?height=96&width=96"} />
          <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
        </Avatar>

        {isUploading ? (
          <div className="absolute -bottom-8 left-0 right-0">
            <Progress value={uploadProgress} className="h-2" />
          </div>
        ) : (
          <label
            htmlFor="profile-image-upload"
            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-md"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </label>
        )}

        <input
          id="profile-image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          disabled={isUploading}
        />
      </div>

      {/* Image Editor Dialog */}
      <Dialog
        open={showEditor}
        onOpenChange={(open) => {
          if (!open && previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
            setSelectedFile(null)
          }
          setShowEditor(open)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile Picture</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4">
            {previewUrl && (
              <div className="relative w-full max-h-[300px] overflow-hidden">
                <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={1} circularCrop>
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Profile preview"
                    onLoad={(e) => onImageLoad(e.currentTarget)}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      maxHeight: "300px",
                      maxWidth: "100%",
                      margin: "0 auto",
                    }}
                  />
                </ReactCrop>
              </div>
            )}

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Zoom</span>
                <div className="flex items-center gap-2 flex-1 mx-4">
                  <ZoomOut className="h-4 w-4" />
                  <Slider
                    value={[zoom]}
                    min={0.5}
                    max={3}
                    step={0.1}
                    onValueChange={handleZoomChange}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4" />
                </div>
              </div>

              <Button variant="outline" onClick={handleRotate} className="w-full">
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveImage}>
              <CropIcon className="h-4 w-4 mr-2" />
              Apply & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

