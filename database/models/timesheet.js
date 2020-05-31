const mongoose = require("mongoose");

const Timesheet = new mongoose.Schema({
  user: String,
  login: Number,
  logout: Number,
  totalTime: Number,
  status: String
});

module.exports = mongoose.model("Timesheet", Timesheet);
