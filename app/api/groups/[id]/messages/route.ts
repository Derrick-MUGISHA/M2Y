import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Group from "@/models/Group"
import Message from "@/models/Message"
import User from "@/models/User"
import Notification from "@/models/Notification"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const groupId = params.id

    await dbConnect()

    // Check if user is a member of the group
    const group = await Group.findOne({
      _id: groupId,
      "members.userId": session.user.id,
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found or you're not a member" }, { status: 404 })
    }

    // Get messages for the group
    const messages = await Message.aggregate([
      {
        $match: {
          groupId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "sender",
        },
      },
      {
        $unwind: {
          path: "$sender",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          messageType: 1,
          mediaUrl: 1,
          fileName: 1,
          fileSize: 1,
          duration: 1,
          createdAt: 1,
          readBy: 1,
          sender: {
            _id: 1,
            name: 1,
            image: 1,
          },
        },
      },
      {
        $sort: { createdAt: 1 },
      },
    ])

    // Mark messages as read by this user
    await Message.updateMany(
      {
        groupId,
        senderId: { $ne: session.user.id },
        "readBy.userId": { $ne: session.user.id },
      },
      {
        $push: {
          readBy: {
            userId: session.user.id,
            readAt: new Date(),
          },
        },
      },
    )

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching group messages:", error)
    return NextResponse.json({ error: "An error occurred while fetching group messages" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const groupId = params.id
    const { content, messageType = "text", mediaUrl, fileName, fileSize, duration } = await req.json()

    // Validate based on message type
    if (messageType === "text" && !content) {
      return NextResponse.json({ error: "Content is required for text messages" }, { status: 400 })
    }

    if (["image", "video", "file", "voice", "gif"].includes(messageType) && !mediaUrl) {
      return NextResponse.json({ error: "Media URL is required for media messages" }, { status: 400 })
    }

    await dbConnect()

    // Check if user is a member of the group
    const group = await Group.findOne({
      _id: groupId,
      "members.userId": session.user.id,
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found or you're not a member" }, { status: 404 })
    }

    // Create new message
    const messageData: any = {
      senderId: session.user.id,
      groupId,
      messageType,
      readBy: [{ userId: session.user.id }],
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

    // Get sender details
    const sender = await User.findById(session.user.id).select("name image")

    // Create notifications for all group members except sender
    const notifications = group.members
      .filter((member: any) => member.userId.toString() !== session.user.id)
      .map((member: any) => ({
        userId: member.userId,
        senderId: session.user.id,
        type: "group_message",
        content: `sent a message in "${group.name}"`,
        relatedId: message._id,
      }))

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }

    // Update user's last active time
    await User.findByIdAndUpdate(session.user.id, { lastActive: new Date() })

    return NextResponse.json({
      message: "Message sent successfully",
      data: {
        ...message.toObject(),
        sender: {
          _id: sender._id,
          name: sender.name,
          image: sender.image,
        },
      },
    })
  } catch (error) {
    console.error("Error sending group message:", error)
    return NextResponse.json({ error: "An error occurred while sending message" }, { status: 500 })
  }
}

