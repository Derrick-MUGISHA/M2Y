import mongoose from "mongoose"

const AccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  providerAccountId: {
    type: String,
    required: true,
  },
  refresh_token: String,
  access_token: String,
  expires_at: Number,
  token_type: String,
  scope: String,
  id_token: String,
  session_state: String,
})

// Compound index to ensure uniqueness of provider + providerAccountId
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true })

export default mongoose.models.Account || mongoose.model("Account", AccountSchema)

