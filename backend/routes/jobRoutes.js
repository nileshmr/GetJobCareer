const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getEligibleSubscribers,
  processJobNotifications,
} = require("../services/notificationService");

const router = express.Router();


// =====================================================
// PUBLIC - GET ALL PUBLISHED JOBS
// SEARCH + FILTER + PAGINATION
// =====================================================
router.get("/", async (req, res) => {
  try {
    const {
      search,
      category,
      jobType,
      workMode,
      location,
    } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 10, 1),
      50
    );

    const skip = (page - 1) * limit;

    const filter = {
      isPublished: true,
    };

    // Search by title or company
    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          companyName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Category
    if (category) {
      filter.category = category;
    }

    // Job type
    if (jobType) {
      filter.jobType = jobType;
    }

    // Work mode
    if (workMode) {
      filter.workMode = workMode;
    }

    // Location
    if (location) {
      filter.location = {
        $regex: location,
        $options: "i",
      };
    }

    const [jobs, totalJobs] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Job.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalJobs / limit);

    res.status(200).json({
      count: jobs.length,

      pagination: {
        currentPage: page,
        limit,
        totalJobs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      filters: {
        search: search || null,
        category: category || null,
        jobType: jobType || null,
        workMode: workMode || null,
        location: location || null,
      },

      jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
});


// =====================================================
// ADMIN - GET ALL JOBS
// PUBLISHED + UNPUBLISHED
// SEARCH + FILTER
// =====================================================
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const {
        search,
        category,
        jobType,
        workMode,
        isPublished,
      } = req.query;

      const filter = {};

      // Search by title or company
      if (search) {
        filter.$or = [
          {
            title: {
              $regex: search,
              $options: "i",
            },
          },
          {
            companyName: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      // Category
      if (category) {
        filter.category = category;
      }

      // Job type
      if (jobType) {
        filter.jobType = jobType;
      }

      // Work mode
      if (workMode) {
        filter.workMode = workMode;
      }

      // Published / Unpublished
      if (isPublished !== undefined) {
        filter.isPublished = isPublished === "true";
      }

      const jobs = await Job.find(filter)
        .sort({ createdAt: -1 });

      res.status(200).json({
        count: jobs.length,
        jobs,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch admin jobs",
        error: error.message,
      });
    }
  }
);


// =====================================================
// ADMIN - GET JOB FILTER OPTIONS
// =====================================================
router.get(
  "/filters/options",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const [
        categories,
        jobTypes,
        workModes,
        locations,
      ] = await Promise.all([
        Job.distinct("category"),
        Job.distinct("jobType"),
        Job.distinct("workMode"),
        Job.distinct("location"),
      ]);

      res.status(200).json({
        categories: categories.filter(Boolean).sort(),
        jobTypes: jobTypes.filter(Boolean).sort(),
        workModes: workModes.filter(Boolean).sort(),
        locations: locations.filter(Boolean).sort(),
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch filter options",
        error: error.message,
      });
    }
  }
);


// =====================================================
// ADMIN - NOTIFICATION PREVIEW
// =====================================================
router.get(
  "/:id/notification-preview",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid job ID",
        });
      }

      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          message: "Job not found",
        });
      }

      const subscribers = await getEligibleSubscribers(job);

      res.status(200).json({
        job: {
          id: job._id,
          title: job.title,
          category: job.category,
        },

        eligibleSubscribers: subscribers.map((subscriber) => ({
          id: subscriber._id,
          name: subscriber.name,
          email: subscriber.email,
          phone: subscriber.phone,
          emailOptIn: subscriber.emailOptIn,
          whatsappOptIn: subscriber.whatsappOptIn,
        })),
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to generate notification preview",
        error: error.message,
      });
    }
  }
);


// =====================================================
// PUBLIC - GET SINGLE PUBLISHED JOB
// =====================================================
router.get("/:slug", async (req, res) => {
  try {
    const job = await Job.findOne({
      slug: req.params.slug,
      isPublished: true,
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    res.status(200).json({
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch job",
      error: error.message,
    });
  }
});


// =====================================================
// ADMIN - CREATE JOB
// =====================================================
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const existingJob = await Job.findOne({
        slug: req.body.slug,
      });

      if (existingJob) {
        return res.status(409).json({
          message: "A job with this slug already exists",
        });
      }

      const job = await Job.create(req.body);

      res.status(201).json({
        message: "Job created successfully",
        job,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to create job",
        error: error.message,
      });
    }
  }
);


// =====================================================
// ADMIN - UPDATE JOB
// =====================================================
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid job ID",
        });
      }

      // Check duplicate slug
      if (req.body.slug) {
        const existingJob = await Job.findOne({
          slug: req.body.slug,
          _id: {
            $ne: req.params.id,
          },
        });

        if (existingJob) {
          return res.status(409).json({
            message: "A job with this slug already exists",
          });
        }
      }

      const job = await Job.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!job) {
        return res.status(404).json({
          message: "Job not found",
        });
      }

      res.status(200).json({
        message: "Job updated successfully",
        job,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update job",
        error: error.message,
      });
    }
  }
);


// =====================================================
// ADMIN - DELETE JOB
// =====================================================
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid job ID",
        });
      }

      const job = await Job.findByIdAndDelete(req.params.id);

      if (!job) {
        return res.status(404).json({
          message: "Job not found",
        });
      }

      res.status(200).json({
        message: "Job deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete job",
        error: error.message,
      });
    }
  }
);


// =====================================================
// ADMIN - PUBLISH / UNPUBLISH JOB
// =====================================================
router.patch(
  "/:id/publish",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid job ID",
        });
      }

      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          message: "Job not found",
        });
      }

      job.isPublished = !job.isPublished;

      await job.save();

      let notificationResult = null;

      // Send notifications only when publishing
      if (job.isPublished) {
        notificationResult = await processJobNotifications(job);
      }

      res.status(200).json({
        message: job.isPublished
          ? "Job published successfully"
          : "Job unpublished successfully",

        job,
        notificationResult,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update publish status",
        error: error.message,
      });
    }
  }
);


module.exports = router;