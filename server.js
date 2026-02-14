const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const memberRoutes = require("./routes/memberRoutes");
const labelsRoutes = require("./routes/labels");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/members", memberRoutes);
app.use("/api/labels", labelsRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/auth", authRoutes);

// DB
connectDB();

/**
 * 🚀 START PDF WORKER ONLY WHEN ENABLED
 * (Required for Render Free plan)
 */
if (process.env.ENABLE_PDF_WORKER === "true") {
  console.log("🟢 Starting PDF Worker inside API process...");
  require("./workers/pdfWorker");
}

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);