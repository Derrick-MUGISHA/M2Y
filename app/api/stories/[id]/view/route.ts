import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Story from "@/models/Story"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    const storyId = params.id

    await dbConnect()

    // Find the story
    const story = await Story.findById(storyId)

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Check if user has already viewed the story
    const alreadyViewed = story.viewedBy.some((view: any) => view.userId.toString() === session.user.id)

    if (!alreadyViewed) {
      // Add user to viewedBy array
      story.viewedBy.push({
        userId: session.user.id,
        viewedAt: new Date(),
      })

      await story.save()
    }

    return NextResponse.json({ message: "Story marked as viewed" })
  } catch (error) {
    console.error("Error marking story as viewed:", error)
    return NextResponse.json({ error: "An error occurred while marking story as viewed" }, { status: 500 })
  }
}

