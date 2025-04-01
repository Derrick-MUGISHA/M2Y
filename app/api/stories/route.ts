import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Story from "@/models/Story"
import Contact from "@/models/Contact"
import Notification from "@/models/Notification"
import User from "@/models/User"
import mongoose from "mongoose"
import { uploadFile } from "@/lib/upload-service"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    await dbConnect()

    // Get all contacts of the current user
    const contacts = await Contact.find({
      $or: [{ userId: session.user.id }, { contactId: session.user.id }],
      status: "accepted",
    })

    // Extract contact IDs
    const contactIds = contacts.map((contact) =>
      contact.userId.toString() === session.user.id ? contact.contactId : contact.userId,
    )

    // Get stories from contacts that are less than 24 hours old
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const stories = await Story.aggregate([
      {
        $match: {
          $or: [
            { userId: new mongoose.Types.ObjectId(session.user.id) }, // User's own stories
            { userId: { $in: contactIds.map((id) => new mongoose.Types.ObjectId(id.toString())) } }, // Contact's stories
          ],
          createdAt: { $gte: oneDayAgo },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          content: 1,
          mediaUrl: 1,
          mediaType: 1,
          fileName: 1,
          fileSize: 1,
          createdAt: 1,
          viewedBy: 1,
          user: {
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

    return NextResponse.json(stories)
  } catch (error) {
    console.error("Error fetching stories:", error)
    return NextResponse.json({ error: "An error occurred while fetching stories" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const formData = await req.formData()
    const content = formData.get("content") as string
    const file = formData.get("file") as File

    if (!content && !file) {
      return NextResponse.json({ error: "Content or media is required" }, { status: 400 })
    }

    await dbConnect()

    const storyData: any = {
      userId: session.user.id,
      content,
    }

    // Handle file upload if present
    if (file) {
      const uploadedFile = await uploadFile(file, {
        directory: "stories",
      })

      storyData.mediaUrl = uploadedFile.url
      storyData.mediaType = uploadedFile.fileType === "audio" ? "video" : uploadedFile.fileType
      storyData.fileName = uploadedFile.fileName
      storyData.fileSize = uploadedFile.fileSize
    }

    // Create new story
    const story = await Story.create(storyData)

    // Get all contacts to create notifications
    const contacts = await Contact.find({
      $or: [{ userId: session.user.id }, { contactId: session.user.id }],
      status: "accepted",
    })

    // Create notifications for all contacts
    const notifications = contacts.map((contact) => {
      const contactId = contact.userId.toString() === session.user.id ? contact.contactId : contact.userId

      return {
        userId: contactId,
        senderId: session.user.id,
        type: "story",
        content: "posted a new story",
        relatedId: story._id,
      }
    })

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }

    // Get user details for response
    const user = await User.findById(session.user.id).select("name image")

    return NextResponse.json(
      {
        message: "Story created successfully",
        data: {
          ...story.toObject(),
          user: {
            _id: user._id,
            name: user.name,
            image: user.image,
          },
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating story:", error)
    return NextResponse.json({ error: "An error occurred while creating story" }, { status: 500 })
  }
}

