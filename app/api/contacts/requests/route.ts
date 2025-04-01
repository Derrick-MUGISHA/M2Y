import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Contact from "@/models/Contact"
import mongoose from "mongoose"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    await dbConnect()

    // Find all pending contact requests where the user is the contact
    const requests = await Contact.aggregate([
      {
        $match: {
          contactId: new mongoose.Types.ObjectId(session.user.id),
          status: "pending",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "requester",
        },
      },
      {
        $unwind: "$requester",
      },
      {
        $project: {
          _id: 1,
          status: 1,
          createdAt: 1,
          requester: {
            _id: 1,
            name: 1,
            email: 1,
            image: 1,
          },
        },
      },
    ])

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching contact requests:", error)
    return NextResponse.json({ error: "An error occurred while fetching contact requests" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const { requestId, action } = await req.json()

    if (!requestId || !action) {
      return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 })
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await dbConnect()

    // Find the contact request
    const request = await Contact.findOne({
      _id: requestId,
      contactId: session.user.id,
      status: "pending",
    })

    if (!request) {
      return NextResponse.json({ error: "Contact request not found" }, { status: 404 })
    }

    if (action === "accept") {
      // Update the request status to accepted
      request.status = "accepted"
      await request.save()
    } else {
      // Delete the request
      await Contact.deleteOne({ _id: requestId })
    }

    return NextResponse.json({
      message: `Contact request ${action === "accept" ? "accepted" : "rejected"} successfully`,
    })
  } catch (error) {
    console.error("Error handling contact request:", error)
    return NextResponse.json({ error: "An error occurred while handling contact request" }, { status: 500 })
  }
}

