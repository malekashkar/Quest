const mongoose = require("mongoose");


async function connect() {
    await mongoose.connect(`mongodb+srv://Deposit:zKSM4q2GgPgOKL3Y@questdevelopment1-m0z24.gcp.mongodb.net/<dbname>?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
      });
};

connect();