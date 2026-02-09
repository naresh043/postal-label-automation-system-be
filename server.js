const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const memberRoutes = require("./routes/memberRoutes");
const labelRoutes = require("./routes/labelRoutes");
const dashboardRoutes=require("./routes/dashboardRoutes")
const authRoutes=require("./routes/authRoutes")

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/members", memberRoutes);
app.use("/api/labels", labelRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/auth", authRoutes)

// DB
connectDB();

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
