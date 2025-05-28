const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const os = require("os");
const dotenv = require("dotenv");
const path = require("path");
const Config = require("./models/config");
const { errorHandler, notFound } = require("./middlewares/error")
const routes = require("./routes/routes")
const connectDB = require("./configs/database")
const upload = require("express-fileupload")
const HttpError = require("./models/error")

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(upload());
app.use("/images", express.static(__dirname + "/images"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  if (process.send) {
    process.send({ type: "error", message: `Uncaught Exception: ${error.message}` });
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  if (process.send) {
    process.send({ type: "error", message: `Unhandled Rejection: ${reason}` });
  }
});


const initializeConfig = async (req, res, next) => {
  const localIP = getLocalIP();
  try {
    const existingConfig = await Config.findOne();
    if (!existingConfig) {
      const newConfig = new Config({
        mode: "production",
        ip: localIP,
        port: port,
      });
      await newConfig.save();
      console.log("✅ Configuraion unitial cree");
    } else {
      console.log("✅ Utilisation de la Configuratiion existante");
    }
  } catch (error) {
    console.log(`❌ Error initializing configuration: ${error.message}`);
    return next(new HttpError("❌ Erreur lors de l'initialisation de la configuration configuration"))
  }
}

mongoose.connection.once("open", initializeConfig);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const info of iface) {
      if (info.family === "IPv4" && !info.internal) {
        return info.address;
      }
    }
  }
  return "127.0.0.1";
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

const localIP = getLocalIP();
const HOST = localIP || "0.0.0.0";

app.listen(port, HOST, () => {
  connectDB()
  console.log(`✅ Server running at http://${localIP}:${port}`);
});