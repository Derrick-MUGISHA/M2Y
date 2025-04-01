import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Group from "@/models/Group"
import User from "@/models/User"
import Notification from "@/models/Notification"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    await dbConnect()

    // Find all groups where the user is a member
    const groups = await Group.aggregate([
      {
        $match: {
          "members.userId": session.user.id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $unwind: {
          path: "$creator",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          createdAt: 1,
          memberCount: { $size: "$members" },
          creator: {
            _id: 1,
            name: 1,
            image: 1,
          },
          userRole: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$members",
                  as: "member",
                  cond: { $eq: ["$$member.userId", session.user.id] },
                },
              },
              0,
            ],
          },
        },
      },
    ])

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json({ error: "An error occurred while fetching groups" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const { name, description, members } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 })
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: "At least one member is required" }, { status: 400 })
    }

    await dbConnect()

    // Create new group
    const group = await Group.create({
      name,
      description,
      createdBy: session.user.id,
      members: [
        { userId: session.user.id, role: "admin" },
        ...members.map((userId: string) => ({ userId, role: "member" })),
      ],
    })

    // Create notifications for all members
    const notifications = members.map((userId: string) => ({
      userId,
      senderId: session.user.id,
      type: "group_invite",
      content: `added you to the group "${name}"`,
      relatedId: group._id,
    }))

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }

    // Get creator details
    const creator = await User.findById(session.user.id).select("name image")

    return NextResponse.json({
      message: "Group created successfully",
      group: {
        ...group.toObject(),
        memberCount: members.length + 1,
        creator: {
          _id: creator._id,
          name: creator.name,
          image: creator.image,
        },
        userRole: { userId: session.user.id, role: "admin" },
      },
    })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json({ error: "An error occurred while creating group" }, { status: 500 })
  }
}

