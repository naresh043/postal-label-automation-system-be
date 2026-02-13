const express = require("express");
const {
  enqueueLabelsPDFJob,
  getLabelsPDFJobStatus,
  downloadLabelsPDF,
} = require("../controllers/labelsController");

const router = express.Router();

// Backward-compatible endpoint: old clients can still POST /api/labels.
router.post("/", enqueueLabelsPDFJob);

// Enqueue a background PDF generation job.
router.post("/jobs", enqueueLabelsPDFJob);

// Poll this endpoint to know whether the job is queued/active/completed/failed.
router.get("/jobs/:jobId", getLabelsPDFJobStatus);

// Download generated PDF after job completion.
router.get("/jobs/:jobId/download", downloadLabelsPDF);

module.exports = router;
