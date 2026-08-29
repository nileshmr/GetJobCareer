const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);


const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const subscriberRoutes = require("./routes/subscriberRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const express = require("express");
const collaborationRoutes = require("./routes/collaborationRoutes");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");




dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());



app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/collaborations", collaborationRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error.message);
  });

app.get("/", (req, res) => {
  res.json({
    message: "Job Portal API is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});