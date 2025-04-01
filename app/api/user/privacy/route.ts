import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    await dbConnect()

    // Update user's privacy acceptance
    const user = await User.findByIdAndUpdate(session.user.id, { privacyAccepted: true }, { new: true })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Privacy policy accepted" })
  } catch (error) {
    console.error("Error accepting privacy policy:", error)
    return NextResponse.json({ error: "An error occurred while accepting privacy policy" }, { status: 500 })
  }
}

