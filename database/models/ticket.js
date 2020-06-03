const mongoose = require("mongoose");

const Tickets = new mongoose.Schema({
    user: String,
    ticket: String,
    commission: String,
    details: String,
    price: Number,
    type: String,
    paid: Number,
    percent: Number,
    developer: String
});

module.exports = mongoose.model("Ticket", Tickets);
