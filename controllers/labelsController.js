const fs = require("fs");
const path = require("path");
const PdfJob = require("../models/PdfJob");

/**
 * POST /api/labels/jobs
 * Create a PDF generation job (async, no timeout)
 */
exports.enqueueLabelsPDFJob = async (req, res) => {
  try {
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        message: "memberIds must be a non-empty array.",
      });
    }

    const job = await PdfJob.create({
      queueName: "pdf-generation",
      name: "generate-label-pdf",
      data: { memberIds },
      status: "waiting",
      progress: 0,
      attemptsMade: 0,
      maxAttempts: 3,
    });

    return res.status(202).json({
      message: "PDF generation job queued.",
      jobId: job._id,
      statusUrl: `/api/labels/jobs/${job._id}`,
      downloadUrl: `/api/labels/jobs/${job._id}/download`,
    });
  } catch (error) {
    console.error("Failed to enqueue PDF job:", error);
    return res.status(500).json({
      message: "Failed to enqueue PDF job.",
      error: error.message,
    });
  }
};

/**
 * GET /api/labels/jobs/:jobId
 * Get job status (for polling)
 */
exports.getLabelsPDFJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await PdfJob.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    const response = {
      jobId: job._id,
      name: job.name,
      status: job.status,          // waiting | active | completed | failed
      progress: job.progress,      // 0–100
      attemptsMade: job.attemptsMade,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      failedReason: job.failedReason,
    };

    if (job.status === "completed" && job.returnvalue) {
      response.result = {
        fileName: job.returnvalue.fileName,
        fileSize: job.returnvalue.fileSize || null,
        generatedAt: job.finishedAt,
      };
      response.downloadUrl = `/api/labels/jobs/${job._id}/download`;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Failed to read job status:", error);
    return res.status(500).json({
      message: "Failed to fetch job status.",
      error: error.message,
    });
  }
};

/**
 * GET /api/labels/jobs/:jobId/download
 * Download the generated PDF
 */
exports.downloadLabelsPDF = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await PdfJob.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    if (job.status !== "completed") {
      return res.status(409).json({
        message: "PDF is not ready yet.",
        status: job.status,
      });
    }

    const filePath = job.returnvalue?.filePath;
    const fileName =
      job.returnvalue?.fileName || `labels.pdf`;

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(410).json({
        message: "Generated PDF not found on disk.",
      });
    }

    return res.download(path.resolve(filePath), fileName);
  } catch (error) {
    console.error("Failed to download generated PDF:", error);
    return res.status(500).json({
      message: "Failed to download generated PDF.",
      error: error.message,
    });
  }
};