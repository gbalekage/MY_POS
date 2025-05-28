const mongoose = require("mongoose");

const printerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["usb", "network"], required: true },
    ip: { type: String },
    port: { type: Number, default: 9100 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Printer", printerSchema);
