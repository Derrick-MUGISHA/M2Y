import { type NextRequest, NextResponse } from "next/server"
import User from "@/models/User"
import VerificationCode from "@/models/verification-code"
import { hashPassword } from "@/lib/auth-utils"
import dbConnect from "@/lib/mongodb"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const { email, code, password } = await req.json()

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Email, code, and password are required" }, { status: 400 })
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Find the verification code
    const verificationCode = await VerificationCode.findOne({
      email: email.toLowerCase(),
      code,
      type: "password-reset",
      expiresAt: { $gt: new Date() }, // Code must not be expired
    })

    if (!verificationCode) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update the password
    const hashedPassword = await hashPassword(password)
    user.password = hashedPassword
    await user.save()

    // Delete the verification code
    await VerificationCode.deleteOne({ _id: verificationCode._id })

    return NextResponse.json({
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}

