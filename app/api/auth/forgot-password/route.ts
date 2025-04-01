import { type NextRequest, NextResponse } from "next/server"
import User from "@/models/User"
import { sendEmail } from "@/lib/email"
import { addMinutes } from "date-fns"
// import { generateVerificationCode } from "@/lib/auth-utils"
import verificationCode from "@/models/verification-code"
import dbConnect from "@/lib/mongodb"
import { generateVerificationCode } from "@/lib/auth-utils"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return NextResponse.json({
        message: "If your email is registered, you will receive a password reset link",
      })
    }

    // Generate a verification code
    const code = generateVerificationCode()

    // Save the verification code
    await verificationCode.create({
      email: email.toLowerCase(),
      code,
      type: "password-reset",
      expiresAt: addMinutes(new Date(), 15), // Code expires in 15 minutes
    })

    // Send the email
    await sendEmail({
      to: email,
      subject: "Reset Your Password",
      text: `Your password reset code is: ${code}. This code will expire in 15 minutes.`,
      html: `
        <div>
          <h1>Reset Your Password</h1>
          <p>Your password reset code is: <strong>${code}</strong></p>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `,
    })

    return NextResponse.json({
      message: "If your email is registered, you will receive a password reset link",
    })
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 })
  }
}

