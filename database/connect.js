const mongoose = require("mongoose");

function connect() {
    mongoose.connect(`mongodb://mainUser:WDRPJfaw8hcCBAvQ@149.56.197.125/mainDB`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });
};

connect();