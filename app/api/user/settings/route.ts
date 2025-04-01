import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const { theme, chatBackground } = await req.json()

    await dbConnect()

    // Update user settings
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (theme) user.theme = theme
    if (chatBackground) user.chatBackground = chatBackground

    await user.save()

    return NextResponse.json({
      message: "Settings updated successfully",
      user: {
        theme: user.theme,
        chatBackground: user.chatBackground,
      },
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "An error occurred while updating settings" }, { status: 500 })
  }
}

