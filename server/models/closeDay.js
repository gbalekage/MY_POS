// models/CloseDay.js
const mongoose = require("mongoose");

const paymentSummarySchema = new mongoose.Schema({
  method: { type: String, required: true },
  total: { type: Number, required: true },
  declared: { type: Number, required: true },
  difference: { type: Number, required: true }
}, { _id: false });

const storeItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

const salesByStoreSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  storeTotal: { type: Number, required: true },
  items: [storeItemSchema]
}, { _id: false });

const attendantSalesSchema = new mongoose.Schema({
  attendant: String,
  total: Number
}, { _id: false })

const closeDaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  cashierName: { type: String, required: true },
  paymentSummary: [paymentSummarySchema],
  discounts: { type: Number, default: 0 },
  cancellations: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalCollections: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  signedBills: { type: Number, default: 0 },
  salesByStore: [salesByStoreSchema],
  salesByAttendant: [attendantSalesSchema],
  totalDifference: { type: Number, default: 0 },
  status: { type: String, enum: ["Excees", "Perte", "Ballence"], default: "Ballence" },
  message: { type: String },
  notes: { type: String, default: "" }
}, {
  timestamps: true
});

module.exports = mongoose.model("CloseDay", closeDaySchema);
