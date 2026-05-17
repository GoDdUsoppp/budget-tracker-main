import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },

    note: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    date: {
      type: Date,
      required: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
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

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    splitDetails: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amountOwed: { type: Number, required: true },
        hasPaid: { type: Boolean, default: false },
        incomeClaimed: { type: Boolean, default: false }, // <-- NEW FIELD!
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Expense", expenseSchema);
