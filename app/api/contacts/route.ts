import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Contact from "@/models/Contact"
import mongoose from "mongoose"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    await dbConnect()

    // Find all contacts where the user is either the user or the contact
    const contacts = await Contact.aggregate([
      {
        $match: {
          $or: [
            { userId: new mongoose.Types.ObjectId(session.user.id) },
            { contactId: new mongoose.Types.ObjectId(session.user.id) },
          ],
          status: "accepted",
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            userId: "$userId",
            contactId: "$contactId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: {
                    if: { $eq: ["$$userId", new mongoose.Types.ObjectId(session.user.id)] },
                    then: { $eq: ["$_id", "$$contactId"] },
                    else: { $eq: ["$_id", "$$userId"] },
                  },
                },
              },
            },
          ],
          as: "contactDetails",
        },
      },
      {
        $unwind: "$contactDetails",
      },
      {
        $project: {
          _id: 1,
          status: 1,
          createdAt: 1,
          contactDetails: {
            _id: 1,
            name: 1,
            email: 1,
            image: 1,
          },
        },
      },
    ])

    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json({ error: "An error occurred while fetching contacts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await dbConnect()

    // Find the contact user
    const contactUser = await User.findOne({ email })

    if (!contactUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent adding yourself as a contact
    if (contactUser._id.toString() === session.user.id) {
      return NextResponse.json({ error: "You cannot add yourself as a contact" }, { status: 400 })
    }

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      $or: [
        { userId: session.user.id, contactId: contactUser._id },
        { userId: contactUser._id, contactId: session.user.id },
      ],
    })

    if (existingContact) {
      return NextResponse.json({ error: "Contact already exists", status: existingContact.status }, { status: 409 })
    }

    // Create new contact request
    const contact = await Contact.create({
      userId: session.user.id,
      contactId: contactUser._id,
      status: "pending",
    })

    return NextResponse.json({ message: "Contact request sent successfully", contact }, { status: 201 })
  } catch (error) {
    console.error("Error adding contact:", error)
    return NextResponse.json({ error: "An error occurred while adding contact" }, { status: 500 })
  }
}

