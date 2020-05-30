const mongoose = require("mongoose");


async function connect() {
    await mongoose.connect(`mongodb://mainUser:WDRPJfaw8hcCBAvQ@149.56.197.125:27017/mainDB`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
      });
};

connect();