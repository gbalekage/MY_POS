const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    printer: { type: mongoose.Schema.Types.ObjectId, ref: "Printer" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);
