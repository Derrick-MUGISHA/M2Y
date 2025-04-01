import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Message from "@/models/Message"
import Contact from "@/models/Contact"
import User from "@/models/User"
import Notification from "@/models/Notification"

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

    // Verify that the contact exists and is accepted
    const contact = await Contact.findOne({
      $or: [
        { userId: session.user.id, contactId },
        { userId: contactId, contactId: session.user.id },
      ],
      status: "accepted",
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found or not accepted" }, { status: 404 })
    }

    // Get messages between the user and the contact
    const messages = await Message.find({
      $or: [
        { senderId: session.user.id, receiverId: contactId },
        { senderId: contactId, receiverId: session.user.id },
      ],
    }).sort({ createdAt: 1 })

    // Mark messages as read
    await Message.updateMany(
      {
        senderId: contactId,
        receiverId: session.user.id,
        read: false,
      },
      { $set: { read: true } },
    )

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "An error occurred while fetching messages" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const { content, receiverId, messageType = "text", mediaUrl, fileName, fileSize, duration } = await req.json()

    if (!receiverId) {
      return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 })
    }

    // Validate based on message type
    if (messageType === "text" && !content) {
      return NextResponse.json({ error: "Content is required for text messages" }, { status: 400 })
    }

    if (["image", "video", "file", "voice"].includes(messageType) && !mediaUrl) {
      return NextResponse.json({ error: "Media URL is required for media messages" }, { status: 400 })
    }

    await dbConnect()

    // Verify that the contact exists and is accepted
    const contact = await Contact.findOne({
      $or: [
        { userId: session.user.id, contactId: receiverId },
        { userId: receiverId, contactId: session.user.id },
      ],
      status: "accepted",
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found or not accepted" }, { status: 404 })
    }

    // Create new message
    const messageData: any = {
      senderId: session.user.id,
      receiverId,
      messageType,
      read: false,
    }

    if (messageType === "text") {
      messageData.content = content
    } else {
      messageData.mediaUrl = mediaUrl
      messageData.fileName = fileName
      messageData.fileSize = fileSize
      if (messageType === "voice" && duration) {
        messageData.duration = duration
      }
    }

    const message = await Message.create(messageData)

    // Create notification
    await Notification.create({
      userId: receiverId,
      senderId: session.user.id,
      type: "message",
      content: messageType === "text" ? content : `sent you a ${messageType} message`,
      relatedId: message._id,
    })

    // Update user's last active time
    await User.findByIdAndUpdate(session.user.id, { lastActive: new Date() })

    return NextResponse.json({ message: "Message sent successfully", data: message }, { status: 201 })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "An error occurred while sending message" }, { status: 500 })
  }
}

