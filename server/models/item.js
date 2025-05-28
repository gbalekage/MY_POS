const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    barcode: { type: String, unique: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    lowStock: { type: Number, default: 5 },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    activityLogs: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        description: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
