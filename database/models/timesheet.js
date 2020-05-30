const mongoose = require("mongoose");

const Timesheet = new mongoose.Schema({
  _id: String,
  user: String,
  time: {type: Number, default: Date.now()},
});

module.exports = mongoose.model("Timesheet", Timesheet);
