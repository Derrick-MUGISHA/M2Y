import { v4 as uuidv4 } from "uuid"
import path from "path"
import fs from "fs"
import { writeFile, mkdir } from "fs/promises"

// Ensure upload directories exist
const ensureDirectoryExists = async (directory: string) => {
  try {
    await fs.promises.access(directory)
  } catch (error) {
    await mkdir(directory, { recursive: true })
  }
}

export type FileType = "image" | "video" | "audio" | "document" | "gif"

export interface UploadedFile {
  url: string
  fileName: string
  originalName: string
  fileSize: number
  fileType: FileType
  mimeType: string
}

export async function uploadFile(
  file: File | Buffer,
  options: {
    fileName?: string
    originalName?: string
    directory?: string
    fileType?: FileType
  } = {},
): Promise<UploadedFile> {
  // Default options
  const { fileName = uuidv4(), originalName = "file", directory = "uploads", fileType = "document" } = options

  // Determine file extension and mime type
  let extension = ""
  let mimeType = ""
  let buffer: Buffer

  if (file instanceof File) {
    extension = path.extname(file.name) || ""
    mimeType = file.type
    buffer = Buffer.from(await file.arrayBuffer())
    if (!options.originalName) {
      options.originalName = file.name
    }
  } else {
    extension = path.extname(originalName) || ""
    mimeType = "application/octet-stream"
    buffer = file
  }

  // Create full file path
  const uploadDir = path.join(process.cwd(), "public", directory)
  await ensureDirectoryExists(uploadDir)

  const fullFileName = `${fileName}${extension}`
  const filePath = path.join(uploadDir, fullFileName)

  // Write file to disk
  await writeFile(filePath, buffer)

  // Return file information
  return {
    url: `/${directory}/${fullFileName}`,
    fileName: fullFileName,
    originalName: options.originalName || originalName,
    fileSize: buffer.length,
    fileType: determineFileType(extension, mimeType, fileType),
    mimeType,
  }
}

function determineFileType(extension: string, mimeType: string, defaultType: FileType): FileType {
  extension = extension.toLowerCase()

  // Check for image types
  if (mimeType.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".svg", ".bmp"].includes(extension)) {
    if (extension === ".gif" || mimeType === "image/gif") {
      return "gif"
    }
    return "image"
  }

  // Check for video types
  if (mimeType.startsWith("video/") || [".mp4", ".webm", ".ogg", ".mov", ".avi"].includes(extension)) {
    return "video"
  }

  // Check for audio types
  if (mimeType.startsWith("audio/") || [".mp3", ".wav", ".ogg", ".m4a"].includes(extension)) {
    return "audio"
  }

  // Default to provided type
  return defaultType
}

