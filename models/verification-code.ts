import mongoose, { Schema, type Document } from "mongoose"

export interface IVerificationCode extends Document {
  email: string
  code: string
  type: "password-reset" | "email-verification" | "two-factor"
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["password-reset", "email-verification", "two-factor"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB will automatically delete documents when expiresAt is reached
    },
  },
  { timestamps: true },
)

// Create TTL index for automatic expiration
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.VerificationCode ||
  mongoose.model<IVerificationCode>("VerificationCode", VerificationCodeSchema)

