import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import { uploadFile } from "@/lib/upload-service"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file type
    const fileType = file.type.split("/")[0]
    if (fileType !== "image") {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Upload the file
    const uploadedFile = await uploadFile(file, {
      directory: "profiles",
      fileType: "image",
    })

    await dbConnect()

    // Update user's profile image in the database
    await User.findByIdAndUpdate(session.user.id, { image: uploadedFile.url })

    return NextResponse.json({
      message: "Profile image updated successfully",
      url: uploadedFile.url,
    })
  } catch (error) {
    console.error("Error uploading profile image:", error)
    return NextResponse.json({ error: "An error occurred while uploading profile image" }, { status: 500 })
  }
}

