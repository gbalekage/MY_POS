const mongoose = require("mongoose");

const signedBillSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("SignedBill", signedBillSchema);
