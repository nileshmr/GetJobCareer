
const express = require("express");
const Collaboration = require("../models/Collaboration");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

/*
 * PUBLIC
 * Submit collaboration / advertisement request
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      company,
      email,
      phone,
      collaborationType,
      budget,
      message,
    } = req.body;

    if (!name || !company || !email || !collaborationType || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, company, email, collaboration type and message are required.",
      });
    }

    const collaboration = await Collaboration.create({
      name,
      company,
      email,
      phone,
      collaborationType,
      budget,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Collaboration request submitted successfully.",
      data: collaboration,
    });
  } catch (error) {
    console.error("Collaboration submit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit collaboration request.",
    });
  }
});


/*
 * ADMIN
 * Get all collaboration requests
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const collaborations = await Collaboration.find()
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: collaborations.length,
        data: collaborations,
      });
    } catch (error) {
      console.error("Get collaborations error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch collaboration requests.",
      });
    }
  }
);


/*
 * ADMIN
 * Get single collaboration request
 */
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const collaboration = await Collaboration.findById(req.params.id);

      if (!collaboration) {
        return res.status(404).json({
          success: false,
          message: "Collaboration request not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: collaboration,
      });
    } catch (error) {
      console.error("Get collaboration error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch collaboration request.",
      });
    }
  }
);


/*
 * ADMIN
 * Update collaboration status
 */
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "new",
        "contacted",
        "in-progress",
        "completed",
        "rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status.",
        });
      }

      const collaboration = await Collaboration.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!collaboration) {
        return res.status(404).json({
          success: false,
          message: "Collaboration request not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Status updated successfully.",
        data: collaboration,
      });
    } catch (error) {
      console.error("Update collaboration status error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update collaboration status.",
      });
    }
  }
);


/*
 * ADMIN
 * Delete collaboration request
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const collaboration = await Collaboration.findByIdAndDelete(
        req.params.id
      );

      if (!collaboration) {
        return res.status(404).json({
          success: false,
          message: "Collaboration request not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Collaboration request deleted successfully.",
      });
    } catch (error) {
      console.error("Delete collaboration error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete collaboration request.",
      });
    }
  }
);

module.exports = router;

