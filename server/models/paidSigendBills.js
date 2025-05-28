const mongoose = require("mongoose");

const paidSigendBillsSchema = new mongoose.Schema(
  {
    items: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        quantity: Number,
        price: Number,
        total: Number,
      },
    ],
    totalAmount: Number,
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    attendant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "airtel", "orange", "africell", "mpesa"],
      default: "cash",
    },
    receivedAmount: {
      type: Number,
      required: true,
    },
    change: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaidSigendBills", paidSigendBillsSchema);
