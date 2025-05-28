const mongoose = require("mongoose");

const connectDB = async (retries = 5, delay = 5000) => {
  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      const message = `✅ MongoDB Connected: ${conn.connection.host}`;
      if (process.send) {
        process.send(message);
      }
      console.log(message);
      return;
    } catch (error) {
      retries -= 1;
      const errorMessage = `❌ MongoDB Connection Error: ${error.message}. Retries left: ${retries}`;
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
      console.error(`Stack Trace: ${error.stack}`);
      if (process.send) {
        process.send({ type: "error", message: `MongoDB Connection Error: ${error.message}` });
      }
      console.error(errorMessage);

      if (retries === 0) {
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
