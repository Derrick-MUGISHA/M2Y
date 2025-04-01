import mongoose from "mongoose"

const ContactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Contact ID is required"],
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "blocked"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Ensure uniqueness of userId + contactId
ContactSchema.index({ userId: 1, contactId: 1 }, { unique: true })

export default mongoose.models.Contact || mongoose.model("Contact", ContactSchema)

