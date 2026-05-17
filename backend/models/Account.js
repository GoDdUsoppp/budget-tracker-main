import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["bank", "cash"],
    required: true
  },
  userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true
},
  alias: {
    type: String,
    required: function () {
      return this.type === "bank";
    }
  },

  accountNumberLast4: {
    type: String,
    required: function () {
      return this.type === "bank";
    },
    validate: {
      validator: function (v) {
        if (this.type === "bank") {
          return /^\d{4}$/.test(v);
        }
        return true;
      },
      message: "Bank account must have exactly 4 digits"
    }
  },

  balance: {
    type: Number,
    default: 0
  },

  isArchived: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

export default mongoose.model("Account", accountSchema);