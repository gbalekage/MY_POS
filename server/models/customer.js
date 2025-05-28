// models/customer.js

const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
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
    bills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SignedBill",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
