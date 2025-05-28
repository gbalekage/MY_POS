const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    receivedAmount: { type: Number, required: true },
    change: { type: Number, required: true },
    status: {
      type: String,
      enum: ["paid", "signed"],
      default: "paid",
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "airtel", "orange", "africell", "mpesa"],
      default: "cash",
    },
    attendant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", salesSchema);
