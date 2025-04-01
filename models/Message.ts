import mongoose from "mongoose"

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: function (this: any) {
      return this.messageType === "text"
    },
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Sender ID is required"],
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  messageType: {
    type: String,
    enum: ["text", "image", "video", "file", "voice", "gif"],
    default: "text",
  },
  mediaUrl: {
    type: String,
    required: function (this: any) {
      return ["image", "video", "file", "voice", "gif"].includes(this.messageType)
    },
  },
  fileName: String,
  fileSize: Number,
  duration: Number, // For voice notes
  waveformData: [Number], // For voice visualization
  isViewOnce: {
    type: Boolean,
    default: false,
  },
  viewedAt: Date, // When the view-once message was viewed
  readBy: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ["sent", "delivered", "read", "failed"],
    default: "sent",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deletedAt: Date, // Soft delete
  deletedFor: [mongoose.Schema.Types.ObjectId], // For one-sided deletion
})

// Ensure either receiverId or groupId is provided
MessageSchema.pre("validate", function (next) {
  if (!this.receiverId && !this.groupId) {
    next(new Error("Either receiverId or groupId is required"))
  } else {
    next()
  }
})

export default mongoose.models.Message || mongoose.model("Message", MessageSchema)

