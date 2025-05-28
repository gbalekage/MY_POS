const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "manager", "serveur", "caissier"],
    default: "serveur",
  },
  password: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  lastLogin: {
    type: Date,
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

  assignedTables: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: [],
    },
  ],

  loginHistory: [
    {
      ip: String,
      userAgent: String,
      date: { type: Date, default: Date.now },
    },
  ],

  avatar: { type: String, default: "default-image.jpg" },
});

module.exports = mongoose.model("User", userSchema);
