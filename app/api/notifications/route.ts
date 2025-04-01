import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Notification from "@/models/Notification"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    await dbConnect()

    // Get notifications for the current user
    const notifications = await Notification.aggregate([
      {
        $match: {
          userId: session.user.id,
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
        $unwind: "$sender",
      },
      {
        $project: {
          _id: 1,
          type: 1,
          content: 1,
          read: 1,
          relatedId: 1,
          createdAt: 1,
          sender: {
            _id: 1,
            name: 1,
            image: 1,
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ])

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "An error occurred while fetching notifications" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const { notificationIds } = await req.json()

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "Notification IDs are required" }, { status: 400 })
    }

    await dbConnect()

    // Mark notifications as read
    await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId: session.user.id,
      },
      { $set: { read: true } },
    )

    return NextResponse.json({ message: "Notifications marked as read" })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json({ error: "An error occurred while marking notifications as read" }, { status: 500 })
  }
}

