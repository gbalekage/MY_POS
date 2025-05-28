// models/company.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
  email: String,
  logo: { type: String, default: "demologo.png" },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Company", companySchema);
