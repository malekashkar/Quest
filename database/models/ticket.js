const mongoose = require("mongoose");

const Tickets = new mongoose.Schema({
    user: String,
    ticket: String,
    commission: String,
    details: String,
    price: Number,
    type: String
});

module.exports = mongoose.model("Ticket", Tickets);
