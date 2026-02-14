const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { PDFDocument } = require("pdf-lib");

const connectDB = require("../config/db");
const Member = require("../models/Member");
const generateLabelHTML = require("../utils/generateLabelHTML");
const { getBrowser, closeBrowser } = require("../utils/browser");
const {
  PDF_QUEUE_NAME,
  claimNextPdfJob,
  markPdfJobCompleted,
  markPdfJobFailed,
} = require("../queue/pdfQueue");

const OUTPUT_DIR = path.join(__dirname, "..", "storage", "labels");
const WORKER_CONCURRENCY = Number(process.env.PDF_WORKER_CONCURRENCY || 1);
const POLL_INTERVAL_MS = Number(process.env.PDF_QUEUE_POLL_INTERVAL_MS || 1000);
const CHUNK_SIZE = 100;

let workerPromises = [];
let isShuttingDown = false;
let shutdownInProgress = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureOutputDirectory = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
};

/**
 * Process one PDF job safely (chunked)
 */
const processPdfJob = async (job) => {
  const { memberIds } = job.data;

  console.log(
  "[DEBUG] Total memberIds received:",
  memberIds.length
);
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error("Job payload is missing memberIds.");
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  const finalPdf = await PDFDocument.create();
  const fileName = `labels.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  try {
    let processed = 0;
    const total = memberIds.length;

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const batchIds = memberIds.slice(i, i + CHUNK_SIZE);
console.log(
  `[DEBUG] Chunk ${i / CHUNK_SIZE + 1}: batchIds length =`,
  batchIds.length
);
      const members = await Member.find({
        _id: { $in: batchIds },
      }).lean();
      console.log(
  `[DEBUG] Chunk ${i / CHUNK_SIZE + 1}: members fetched =`,
  members.length
);

if (members.length !== batchIds.length) {
  console.warn(
    "⚠️ MISMATCH:",
    "batchIds =", batchIds.length,
    "members =", members.length
  );
}

      if (!members.length) continue;

      const html = generateLabelHTML(members);
      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm",
        },
      });

      // ✅ PROPER PDF MERGE
      const chunkPdf = await PDFDocument.load(pdfBuffer);
      const pages = await finalPdf.copyPages(
        chunkPdf,
        chunkPdf.getPageIndices()
      );
      pages.forEach((p) => finalPdf.addPage(p));
      console.log(
  "[DEBUG] Total pages so far:",
  finalPdf.getPageCount()
);

      processed += members.length;
      await job.updateProgress(
        Math.round((processed / total) * 100)
      );

      console.log(
        `[pdf-worker] job=${job.id}, processed=${processed}/${total}`
      );
    }

    const finalPdfBytes = await finalPdf.save();

// 🔥 Delete existing file if already exists
if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);
}

fs.writeFileSync(filePath, finalPdfBytes);

    return {
      fileName,
      filePath,
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await page.close();
  }
};

/**
 * Worker loop
 */
const runWorkerLoop = async (workerId) => {
  while (!isShuttingDown) {
    try {
      const job = await claimNextPdfJob();

      if (!job) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      try {
        const result = await processPdfJob(job);
        await markPdfJobCompleted(job.id, result);
        console.log(`[pdf-worker] Job ${job.id} completed`);
      } catch (error) {
        await markPdfJobFailed(job.id, error);
        console.error(`[pdf-worker] Job ${job.id} failed: ${error.message}`);
      }
    } catch (error) {
      console.error(`[pdf-worker] Worker error: ${error.message}`);
      await sleep(POLL_INTERVAL_MS);
    }
  }
};

/**
 * Start worker
 */
const startWorker = async () => {
  await connectDB();
  ensureOutputDirectory();

  const concurrency = Math.max(1, WORKER_CONCURRENCY);
  console.log(`[pdf-worker] Ready. Queue "${PDF_QUEUE_NAME}"`);

  workerPromises = Array.from({ length: concurrency }, (_, i) =>
    runWorkerLoop(i + 1),
  );
};

/**
 * Graceful shutdown
 */
const shutdown = async () => {
  if (shutdownInProgress) return;
  shutdownInProgress = true;

  console.log("[pdf-worker] Shutting down...");
  isShuttingDown = true;

  await Promise.all(workerPromises);
  await closeBrowser();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startWorker().catch((err) => {
  console.error("[pdf-worker] Startup failed:", err);
  process.exit(1);
});
