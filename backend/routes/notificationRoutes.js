const express = require("express");
const NotificationLog = require("../models/NotificationLog");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// GET ALL NOTIFICATION LOGS - ADMIN
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const logs = await NotificationLog.find()
        .populate("job", "title category slug")
        .sort({ createdAt: -1 });

      res.status(200).json({
        count: logs.length,
        logs,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch notification logs",
        error: error.message,
      });
    }
  }
);

module.exports = router;