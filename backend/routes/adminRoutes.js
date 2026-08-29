const express = require("express");

const Job = require("../models/Job");
const Subscriber = require("../models/Subscriber");
const NotificationLog = require("../models/NotificationLog");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// GET ADMIN DASHBOARD STATS
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const [
        totalJobs,
        publishedJobs,
        draftJobs,
        totalSubscribers,
        activeSubscribers,
        emailSubscribers,
        whatsappSubscribers,
        totalNotifications,
      ] = await Promise.all([
        Job.countDocuments(),

        Job.countDocuments({
          isPublished: true,
        }),

        Job.countDocuments({
          isPublished: false,
        }),

        Subscriber.countDocuments(),

        Subscriber.countDocuments({
          isActive: true,
        }),

        Subscriber.countDocuments({
          isActive: true,
          emailOptIn: true,
        }),

        Subscriber.countDocuments({
          isActive: true,
          whatsappOptIn: true,
        }),

        NotificationLog.countDocuments(),
      ]);

      res.status(200).json({
        jobs: {
          total: totalJobs,
          published: publishedJobs,
          drafts: draftJobs,
        },

        subscribers: {
          total: totalSubscribers,
          active: activeSubscribers,
          email: emailSubscribers,
          whatsapp: whatsappSubscribers,
        },

        notifications: {
          total: totalNotifications,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch dashboard statistics",
        error: error.message,
      });
    }
  }
);

module.exports = router;