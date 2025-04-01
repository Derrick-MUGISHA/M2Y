import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Message from "@/models/Message"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const messageId = params.id

    await dbConnect()

    // Find the message and verify ownership
    const message = await Message.findOne({
      _id: messageId,
      senderId: session.user.id,
    })

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or you don't have permission to delete it" },
        { status: 404 },
      )
    }

    // Delete the message
    await Message.deleteOne({ _id: messageId })

    return NextResponse.json({ message: "Message deleted successfully" })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json({ error: "An error occurred while deleting the message" }, { status: 500 })
  }
}

