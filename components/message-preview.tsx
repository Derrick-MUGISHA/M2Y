import { FileText, ImageIcon, Video, Mic } from "lucide-react"

interface MessagePreviewProps {
  content?: string
  messageType: "text" | "image" | "video" | "file" | "voice"
  fileName?: string
  isMe: boolean
}

export function MessagePreview({ content, messageType, fileName, isMe }: MessagePreviewProps) {
  const prefix = isMe ? "You: " : ""

  switch (messageType) {
    case "text":
      return (
        <p className="text-sm text-muted-foreground truncate">
          {prefix}
          {content}
        </p>
      )

    case "image":
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <ImageIcon className="h-3 w-3" />
          <span>{prefix}Photo</span>
        </div>
      )

    case "video":
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Video className="h-3 w-3" />
          <span>{prefix}Video</span>
        </div>
      )

    case "file":
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>
            {prefix}
            {fileName || "File"}
          </span>
        </div>
      )

    case "voice":
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Mic className="h-3 w-3" />
          <span>{prefix}Voice message</span>
        </div>
      )

    default:
      return null
  }
}

