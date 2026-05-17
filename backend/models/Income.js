import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    note: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    category: {
      type: String,
      enum: ["salary", "freelance", "business", "investment", "other"],
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Income", incomeSchema);
