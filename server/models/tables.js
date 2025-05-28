const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied"],
      default: "available",
    },
    assignedServer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    totalAmount: { type: Number, default: 0 },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    activityLogs: [
      {
        action: String,
        description: String,
        createdAt: { type: Date, default: Date.now },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
