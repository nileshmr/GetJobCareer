const express = require("express");
const mongoose = require("mongoose");
const Subscriber = require("../models/Subscriber");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


// PUBLIC - SUBSCRIBE
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      whatsappOptIn,
      emailOptIn,
      categories,
    } = req.body;

    // Basic validation
    if (!name || !email || !phone) {
      return res.status(400).json({
        message: "Name, email and phone are required",
      });
    }

    // Check duplicate email
    const existingSubscriber = await Subscriber.findOne({
        $or: [
            {
            email: email.toLowerCase(),
            },
            {
            phone: phone.trim(),
            },
        ],
    });
   if (existingSubscriber) {
        return res.status(409).json({
            message: "This email or phone number is already subscribed",
        });
    }

    const subscriber = await Subscriber.create({
      name,
      email,
      phone,
      whatsappOptIn: whatsappOptIn || false,
      emailOptIn: emailOptIn || false,
      categories: categories || [],
    });

    res.status(201).json({
      message: "Subscribed successfully",
      subscriber: {
        id: subscriber._id,
        name: subscriber.name,
        email: subscriber.email,
        phone: subscriber.phone,
        whatsappOptIn: subscriber.whatsappOptIn,
        emailOptIn: subscriber.emailOptIn,
        categories: subscriber.categories,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to subscribe",
      error: error.message,
    });
  }
});

// ADMIN - GET ALL SUBSCRIBERS
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        category,
        emailOptIn,
        whatsappOptIn,
        isActive,
      } = req.query;

      const filter = {};

      // Category filter
      if (category) {
        filter.categories = category;
      }

      // Email notification filter
      if (emailOptIn !== undefined) {
        filter.emailOptIn = emailOptIn === "true";
      }

      // WhatsApp notification filter
      if (whatsappOptIn !== undefined) {
        filter.whatsappOptIn = whatsappOptIn === "true";
      }

      // Active / inactive filter
      if (isActive !== undefined) {
        filter.isActive = isActive === "true";
      }

      const subscribers = await Subscriber.find(filter)
        .sort({ createdAt: -1 });

      res.status(200).json({
        count: subscribers.length,

        filters: {
          category: category || null,
          emailOptIn:
            emailOptIn !== undefined
              ? emailOptIn === "true"
              : null,
          whatsappOptIn:
            whatsappOptIn !== undefined
              ? whatsappOptIn === "true"
              : null,
          isActive:
            isActive !== undefined
              ? isActive === "true"
              : null,
        },

        subscribers,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch subscribers",
        error: error.message,
      });
    }
  }
);


// ADMIN - CATEGORY WISE SUBSCRIBER SUMMARY
router.get(
  "/stats/categories",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const categoryStats = await Subscriber.aggregate([
        {
          $unwind: "$categories",
        },
        {
          $group: {
            _id: "$categories",
            totalSubscribers: { $sum: 1 },

            activeSubscribers: {
              $sum: {
                $cond: ["$isActive", 1, 0],
              },
            },

            emailOptIn: {
              $sum: {
                $cond: ["$emailOptIn", 1, 0],
              },
            },

            whatsappOptIn: {
              $sum: {
                $cond: ["$whatsappOptIn", 1, 0],
              },
            },
          },
        },
        {
          $sort: {
            totalSubscribers: -1,
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            totalSubscribers: 1,
            activeSubscribers: 1,
            emailOptIn: 1,
            whatsappOptIn: 1,
          },
        },
      ]);

      res.status(200).json({
        count: categoryStats.length,
        categories: categoryStats,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch category statistics",
        error: error.message,
      });
    }
  }
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid subscriber ID",
            });
        }
      const subscriber = await Subscriber.findById(req.params.id);

      if (!subscriber) {
        return res.status(404).json({
          message: "Subscriber not found",
        });
      }

      subscriber.isActive = !subscriber.isActive;

      await subscriber.save();

      res.status(200).json({
        message: subscriber.isActive
          ? "Subscriber activated successfully"
          : "Subscriber deactivated successfully",
        subscriber,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update subscriber status",
        error: error.message,
      });
    }
  }
);

module.exports = router;