import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Message from "@/models/Message"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const url = new URL(req.url)
    const contactId = url.searchParams.get("contactId")

    if (!contactId) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 })
    }

    await dbConnect()

    // Get the last message between the user and the contact
    const lastMessage = await Message.findOne({
      $or: [
        { senderId: session.user.id, receiverId: contactId },
        { senderId: contactId, receiverId: session.user.id },
      ],
    }).sort({ createdAt: -1 })

    return NextResponse.json(lastMessage)
  } catch (error) {
    console.error("Error fetching last message:", error)
    return NextResponse.json({ error: "An error occurred while fetching last message" }, { status: 500 })
  }
}

