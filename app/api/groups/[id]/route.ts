import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Group from "@/models/Group"
import mongoose from "mongoose"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const groupId = params.id

    await dbConnect()

    // Find the group and check if user is a member
    const group = await Group.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(groupId),
          "members.userId": new mongoose.Types.ObjectId(session.user.id),
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
        $lookup: {
          from: "users",
          localField: "members.userId",
          foreignField: "_id",
          as: "memberDetails",
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
          members: {
            $map: {
              input: "$members",
              as: "member",
              in: {
                userId: "$$member.userId",
                role: "$$member.role",
                joinedAt: "$$member.joinedAt",
                user: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$memberDetails",
                        as: "detail",
                        cond: { $eq: ["$$detail._id", "$$member.userId"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
          userRole: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$members",
                  as: "member",
                  cond: { $eq: ["$$member.userId", new mongoose.Types.ObjectId(session.user.id)] },
                },
              },
              0,
            ],
          },
        },
      },
    ])

    if (!group || group.length === 0) {
      return NextResponse.json({ error: "Group not found or you're not a member" }, { status: 404 })
    }

    return NextResponse.json(group[0])
  } catch (error) {
    console.error("Error fetching group:", error)
    return NextResponse.json({ error: "An error occurred while fetching group" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const groupId = params.id
    const { name, description } = await req.json()

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

    // Update group details
    if (name) group.name = name
    if (description !== undefined) group.description = description

    await group.save()

    return NextResponse.json({
      message: "Group updated successfully",
      group,
    })
  } catch (error) {
    console.error("Error updating group:", error)
    return NextResponse.json({ error: "An error occurred while updating group" }, { status: 500 })
  }
}

