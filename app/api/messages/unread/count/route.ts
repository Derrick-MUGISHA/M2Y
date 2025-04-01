import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Message from "@/models/Message"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    await dbConnect()

    // Count unread messages
    const count = await Message.countDocuments({
      receiverId: session.user.id,
      read: false,
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("Error counting unread messages:", error)
    return NextResponse.json({ error: "An error occurred while counting unread messages" }, { status: 500 })
  }
}

