const fs = require("fs");
const path = require("path");
const { getPdfQueue } = require("../queue/pdfQueue");

// POST /api/labels/jobs
// Enqueue PDF generation and immediately return job details.
exports.enqueueLabelsPDFJob = async (req, res) => {
  try {
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "memberIds must be a non-empty array." });
    }

    const queue = getPdfQueue();

    // Job payload includes only IDs; worker fetches full member data from MongoDB.
    const job = await queue.add("generate-label-pdf", { memberIds });

    return res.status(202).json({
      message: "PDF generation job queued.",
      jobId: job.id,
      statusUrl: `/api/labels/jobs/${job.id}`,
      downloadUrl: `/api/labels/jobs/${job.id}/download`,
    });
  } catch (error) {
    console.error("Failed to enqueue PDF job:", error);
    return res.status(500).json({
      message: "Failed to enqueue PDF job.",
      error: error.message,
    });
  }
};

// GET /api/labels/jobs/:jobId
// Return queue state so clients can poll for completion.
exports.getLabelsPDFJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const queue = getPdfQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    const state = await job.getState();
    const response = {
      jobId: job.id,
      name: job.name,
      status: state,
      progress: job.progress || 0,
      createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      failedReason: job.failedReason || null,
    };

    // Worker stores the generated file metadata as job return value on success.
    if (state === "completed" && job.returnvalue) {
      response.result = {
        fileName: job.returnvalue.fileName,
        fileSize: job.returnvalue.fileSize,
        generatedAt: job.returnvalue.generatedAt,
      };
      response.downloadUrl = `/api/labels/jobs/${job.id}/download`;
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

// GET /api/labels/jobs/:jobId/download
// Download the generated PDF only when the BullMQ job is completed.
exports.downloadLabelsPDF = async (req, res) => {
  try {
    const { jobId } = req.params;
    const queue = getPdfQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    const state = await job.getState();
    if (state !== "completed") {
      return res.status(409).json({
        message: "PDF is not ready yet.",
        status: state,
      });
    }

    const filePath = job.returnvalue && job.returnvalue.filePath;
    const fileName = (job.returnvalue && job.returnvalue.fileName) || `labels-${job.id}.pdf`;

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
