const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const subscriberRoutes = require("./routes/subscriberRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");

dotenv.config();

const app = express();

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin: [
      "http://localhost:4321",
      "https://get-job-career.vercel.app",
      "https://getjobcareer.com",
      "https://www.getjobcareer.com",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* =========================
   MongoDB Connection
========================= */

let dbConnectionPromise = null;

async function connectDB() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Connection is already in progress
  if (mongoose.connection.readyState === 2 && dbConnectionPromise) {
    await dbConnectionPromise;
    return;
  }

  // Create a new connection
  dbConnectionPromise = mongoose
    .connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    })
    .then(() => {
      console.log("MongoDB connected successfully");
    })
    .catch((error) => {
      dbConnectionPromise = null;

      console.error(
        "MongoDB connection error:",
        error.message
      );

      throw error;
    });

  await dbConnectionPromise;
}

/* =========================
   MongoDB Connection Events
========================= */

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
});

mongoose.connection.on("error", (error) => {
  console.error(
    "MongoDB runtime error:",
    error.message
  );
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
  dbConnectionPromise = null;
});

/* =========================
   Ensure DB Before API
========================= */

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(
      "Database unavailable:",
      error.message
    );

    return res.status(503).json({
      message: "Database connection unavailable",
    });
  }
});

/* =========================
   API Routes
========================= */

app.use("/api/auth", authRoutes);

app.use("/api/jobs", jobRoutes);

app.use("/api/subscribers", subscriberRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/collaborations", collaborationRoutes);

/* =========================
   Health Check
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Job Portal API is running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

/* =========================
   Server
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
