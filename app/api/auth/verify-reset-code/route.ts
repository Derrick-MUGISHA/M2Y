import { type NextRequest, NextResponse } from "next/server"
import VerificationCode from "@/models/verification-code"
import dbConnect from "@/lib/mongodb"
// import dbConnect from "@/lib/db-connect"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
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

    // Code is valid
    return NextResponse.json({
      valid: true,
      message: "Code verified successfully",
    })
  } catch (error) {
    console.error("Error verifying reset code:", error)
    return NextResponse.json({ error: "Failed to verify reset code" }, { status: 500 })
  }
}

