const mongoose = require("mongoose");

const Timesheet = new mongoose.Schema({
  user: String,
  login: Number,
  logout: Number,
  totalTime: Number,
});

module.exports = mongoose.model("Timesheet", Timesheet);
