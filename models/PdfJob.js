const mongoose = require("mongoose");

const pdfJobSchema = new mongoose.Schema(
  {
    queueName: {
      type: String,
      required: true,
      default: "pdf-generation",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["waiting", "active", "completed", "failed"],
      default: "waiting",
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    attemptsMade: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
    },
    nextRunAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    failedReason: {
      type: String,
      default: null,
    },
    returnvalue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

pdfJobSchema.index({ queueName: 1, status: 1, nextRunAt: 1, createdAt: 1 });

module.exports = mongoose.model("PdfJob", pdfJobSchema);
