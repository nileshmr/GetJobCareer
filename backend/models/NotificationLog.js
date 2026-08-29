const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    totalSubscribers: {
      type: Number,
      default: 0,
    },

    emailSubscribers: {
      type: Number,
      default: 0,
    },

    whatsappSubscribers: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["processed", "failed"],
      default: "processed",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "NotificationLog",
  notificationLogSchema
);