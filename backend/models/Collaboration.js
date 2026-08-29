
const mongoose = require("mongoose");

const collaborationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    collaborationType: {
      type: String,
      required: true,
      enum: [
        "Sponsored Job Listing",
        "Brand Advertising",
        "College / Coaching Collaboration",
        "Event Promotion",
        "Career Partnership",
        "Custom Partnership",
      ],
    },

    budget: {
      type: String,
      default: "",
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["new", "contacted", "in-progress", "completed", "rejected"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Collaboration", collaborationSchema);

