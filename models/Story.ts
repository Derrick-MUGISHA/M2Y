import mongoose from "mongoose"

const StorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  content: {
    type: String,
  },
  mediaUrl: {
    type: String,
  },
  mediaType: {
    type: String,
    enum: ["image", "video", "gif"],
    required: function () {
      return !!this.mediaUrl
    },
  },
  fileName: String,
  fileSize: Number,
  viewedBy: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      viewedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // 24 hours in seconds
  },
})

export default mongoose.models.Story || mongoose.model("Story", StorySchema)

