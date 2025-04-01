import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const { isOnline } = await req.json()

    await dbConnect()

    // Update user's online status
    await User.findByIdAndUpdate(session.user.id, {
      isOnline: isOnline,
      lastActive: new Date(),
    })

    return NextResponse.json({ message: "Status updated successfully" })
  } catch (error) {
    console.error("Error updating status:", error)
    return NextResponse.json({ error: "An error occurred while updating status" }, { status: 500 })
  }
}

