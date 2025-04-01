import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Contact from "@/models/Contact"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const search = url.searchParams.get("search") || ""

    await dbConnect()

    // Get existing contacts
    const contacts = await Contact.find({
      $or: [{ userId: session.user.id }, { contactId: session.user.id }],
    })

    // Extract contact IDs (both accepted and pending)
    const contactIds = contacts.map((contact) =>
      contact.userId.toString() === session.user.id ? contact.contactId.toString() : contact.userId.toString(),
    )

    // Add current user ID to exclude
    contactIds.push(session.user.id)

    // Build query
    const query: any = {
      _id: { $nin: contactIds },
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    // Count total users matching query
    const total = await User.countDocuments(query)

    // Get paginated users
    const users = await User.find(query)
      .select("_id name email image lastActive")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ name: 1 })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "An error occurred while fetching users" }, { status: 500 })
  }
}

