import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Contact from "@/models/Contact"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    await dbConnect()

    // Get user profile
    const user = await User.findById(session.user.id).select("-password")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Count contacts
    const contactCount = await Contact.countDocuments({
      $or: [{ userId: session.user.id }, { contactId: session.user.id }],
      status: "accepted",
    })

    return NextResponse.json({
      ...user.toObject(),
      contactCount,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "An error occurred while fetching user profile" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const { name, location, theme } = await req.json()

    await dbConnect()

    // Update user profile
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (name) user.name = name
    if (location) user.location = location
    if (theme) user.theme = theme

    // Update last active time
    user.lastActive = new Date()

    await user.save()

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        ...user.toObject(),
        password: undefined,
      },
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "An error occurred while updating user profile" }, { status: 500 })
  }
}

