const mongoose = require("mongoose");

const expensesSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expensesSchema);
