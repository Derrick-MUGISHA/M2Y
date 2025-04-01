import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Group from "@/models/Group"
import User from "@/models/User"
import Notification from "@/models/Notification"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const groupId = params.id
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await dbConnect()

    // Check if user is a member of the group and has admin rights
    const group = await Group.findOne({
      _id: groupId,
      "members.userId": session.user.id,
      "members.role": "admin",
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found or you don't have permission" }, { status: 404 })
    }

    // Find the user to invite
    const userToInvite = await User.findOne({ email: email.toLowerCase() })

    if (!userToInvite) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a member
    const isMember = group.members.some((member: any) => member.userId.toString() === userToInvite._id.toString())

    if (isMember) {
      return NextResponse.json({ error: "User is already a member of this group" }, { status: 409 })
    }

    // Add user to group
    group.members.push({
      userId: userToInvite._id,
      role: "member",
      joinedAt: new Date(),
    })

    await group.save()

    // Create notification for the invited user
    await Notification.create({
      userId: userToInvite._id,
      senderId: session.user.id,
      type: "group_invite",
      content: `added you to the group "${group.name}"`,
      relatedId: group._id,
    })

    return NextResponse.json({
      message: "User invited successfully",
    })
  } catch (error) {
    console.error("Error inviting user to group:", error)
    return NextResponse.json({ error: "An error occurred while inviting user" }, { status: 500 })
  }
}

