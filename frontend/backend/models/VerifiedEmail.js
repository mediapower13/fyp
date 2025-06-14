import mongoose from "mongoose";

const VerifiedEmailSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  token: String,
  verified: { type: Boolean, default: false },
});

export default mongoose.model("VerifiedEmail", VerifiedEmailSchema);
