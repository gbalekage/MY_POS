const mongoose = require("mongoose");

const ConfigSchema = new mongoose.Schema({
    mode: { type: String, required: true },
    ip: { type: String, required: true },
    port: { type: Number, required: true },
});

module.exports = mongoose.model("Config", ConfigSchema);
