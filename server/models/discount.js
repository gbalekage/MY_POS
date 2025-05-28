const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    discountedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      enum: [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], // Only allow specific discount percentages
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    newTotalAmount: {
      type: Number,
      required: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discount", discountSchema);
