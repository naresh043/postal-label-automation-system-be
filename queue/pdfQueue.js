const PdfJob = require("../models/PdfJob");
const mongoose = require("mongoose");

const PDF_QUEUE_NAME = "pdf-generation";
const DEFAULT_JOB_ATTEMPTS = 3;
const DEFAULT_BACKOFF_DELAY_MS = 2000;

class QueueJob {
  constructor(doc) {
    this.applyDoc(doc);
  }

  applyDoc(doc) {
    this.id = doc._id.toString();
    this.name = doc.name;
    this.data = doc.data || {};
    this.progress = typeof doc.progress === "number" ? doc.progress : 0;
    this.timestamp = doc.createdAt ? new Date(doc.createdAt).getTime() : null;
    this.finishedOn = doc.finishedAt ? new Date(doc.finishedAt).getTime() : null;
    this.failedReason = doc.failedReason || null;
    this.returnvalue = doc.returnvalue || null;
  }

  async refresh() {
    const doc = await PdfJob.findById(this.id).lean();
    if (!doc) {
      return null;
    }
    this.applyDoc(doc);
    return doc;
  }

  async getState() {
    const doc = await this.refresh();
    return doc ? doc.status : null;
  }

  async updateProgress(progress) {
    const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
    const doc = await PdfJob.findByIdAndUpdate(
      this.id,
      { $set: { progress: safeProgress } },
      { new: true },
    ).lean();

    if (doc) {
      this.applyDoc(doc);
    }

    return this.progress;
  }
}

let pdfQueue;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const findJobByIdSafe = async (jobId) => {
  if (!isValidObjectId(jobId)) {
    return null;
  }
  return PdfJob.findById(jobId).lean();
};

const createQueue = () => ({
  add: async (name, data) => {
    const doc = await PdfJob.create({
      queueName: PDF_QUEUE_NAME,
      name,
      data,
      status: "waiting",
      progress: 0,
      attemptsMade: 0,
      maxAttempts: DEFAULT_JOB_ATTEMPTS,
      nextRunAt: new Date(),
    });
    return new QueueJob(doc.toObject());
  },
  getJob: async (jobId) => {
    const doc = await findJobByIdSafe(jobId);
    if (!doc || doc.queueName !== PDF_QUEUE_NAME) {
      return null;
    }
    return new QueueJob(doc);
  },
});

const getPdfQueue = () => {
  if (!pdfQueue) {
    pdfQueue = createQueue();
  }
  return pdfQueue;
};

const claimNextPdfJob = async () => {
  const now = new Date();
  const doc = await PdfJob.findOneAndUpdate(
    {
      queueName: PDF_QUEUE_NAME,
      status: "waiting",
      nextRunAt: { $lte: now },
    },
    {
      $set: {
        status: "active",
        startedAt: now,
        failedReason: null,
      },
    },
    { sort: { createdAt: 1 }, new: true },
  ).lean();

  if (!doc) {
    return null;
  }

  return new QueueJob(doc);
};

const markPdfJobCompleted = async (jobId, result) => {
  await PdfJob.findByIdAndUpdate(jobId, {
    $set: {
      status: "completed",
      progress: 100,
      returnvalue: result,
      failedReason: null,
      finishedAt: new Date(),
    },
  });
};

const markPdfJobFailed = async (jobId, error) => {
  const doc = await findJobByIdSafe(jobId);
  if (!doc) {
    return;
  }

  const failedReason =
    error && error.message ? error.message : "Unknown PDF processing error.";
  const nextAttemptsMade = (doc.attemptsMade || 0) + 1;
  const maxAttempts = doc.maxAttempts || DEFAULT_JOB_ATTEMPTS;

  if (nextAttemptsMade < maxAttempts) {
    const backoffDelayMs =
      DEFAULT_BACKOFF_DELAY_MS * Math.pow(2, nextAttemptsMade - 1);

    await PdfJob.findByIdAndUpdate(jobId, {
      $set: {
        status: "waiting",
        progress: 0,
        failedReason,
        attemptsMade: nextAttemptsMade,
        nextRunAt: new Date(Date.now() + backoffDelayMs),
      },
      $unset: { finishedAt: 1 },
    });
    return;
  }

  await PdfJob.findByIdAndUpdate(jobId, {
    $set: {
      status: "failed",
      failedReason,
      attemptsMade: nextAttemptsMade,
      finishedAt: new Date(),
    },
  });
};

module.exports = {
  PDF_QUEUE_NAME,
  getPdfQueue,
  claimNextPdfJob,
  markPdfJobCompleted,
  markPdfJobFailed,
};
