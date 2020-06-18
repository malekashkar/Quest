const mongoose = require("mongoose");

const Timesheet = new mongoose.Schema({
  _id: String,
  status: { type: Boolean, default: true },
  type: String,
  sessions: [{
    login: { type: Number, default: Date.now() },
    logout: { type: Number, default: 0 },
    work: Array
  }]
});

module.exports = mongoose.model("Timesheet", Timesheet);
