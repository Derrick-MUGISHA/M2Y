import mongoose from "mongoose"

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Sender ID is required"],
  },
  type: {
    type: String,
    enum: ["message", "story", "contact_request", "contact_accepted"],
    required: [true, "Notification type is required"],
  },
  content: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    // This could reference a message, story, or contact request
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index to expire notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 })

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema)

