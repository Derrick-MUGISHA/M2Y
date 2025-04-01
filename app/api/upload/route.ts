import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { uploadFile } from "@/lib/upload-service"

// Increase the body size limit to 500MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500mb",
    },
  },
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const directory = (formData.get("directory") as string) || "uploads"
    const fileType = (formData.get("fileType") as string) || undefined

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 500MB limit" }, { status: 400 })
    }

    // Upload the file
    const uploadedFile = await uploadFile(file, {
      directory,
      fileType: fileType as any,
    })

    return NextResponse.json(uploadedFile)
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "An error occurred while uploading the file" }, { status: 500 })
  }
}

