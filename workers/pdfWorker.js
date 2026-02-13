const fs = require("fs");
const path = require("path");
const { Worker } = require("bullmq");
require("dotenv").config(); 

const connectDB = require("../config/db");
const Member = require("../models/Member");
const generateLabelHTML = require("../utils/generateLabelHTML");
const { getBrowser, closeBrowser } = require("../utils/browser");
const { PDF_QUEUE_NAME, redisConnection } = require("../queue/pdfQueue");
// Store PDFs locally; swap this with S3 upload if required in production.
const OUTPUT_DIR = path.join(__dirname, "..", "storage", "labels");
const WORKER_CONCURRENCY = Number(process.env.PDF_WORKER_CONCURRENCY || 2);

let worker;

const ensureOutputDirectory = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
};

// Main BullMQ job processor.
const processPdfJob = async (job) => {
  const { memberIds } = job.data;

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error("Job payload is missing memberIds.");
  }

  await job.updateProgress(10);

  // Fetch member records for selected IDs.
  const members = await Member.find({ _id: { $in: memberIds } }).lean();
  if (!members.length) {
    throw new Error("No members found for provided IDs.");
  }

  await job.updateProgress(35);

  // Build printable HTML and render PDF using shared browser instance.
  const html = generateLabelHTML(members);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await job.updateProgress(60);

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

    await job.updateProgress(85);

    const fileName = `labels-${job.id}.pdf`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    await job.updateProgress(100);

    // Return value is stored by BullMQ and used by status/download APIs.
    return {
      fileName,
      filePath,
      fileSize: pdfBuffer.length,
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await page.close();
  }
};

const startWorker = async () => {
  await connectDB();
  ensureOutputDirectory();

  worker = new Worker(PDF_QUEUE_NAME, processPdfJob, {
    connection: redisConnection,
    concurrency: WORKER_CONCURRENCY,
  });

  worker.on("ready", () => {
    console.log(`[pdf-worker] Ready. Listening on queue "${PDF_QUEUE_NAME}"`);
  });

  worker.on("completed", (job, result) => {
    console.log(`[pdf-worker] Job ${job.id} completed: ${result.fileName}`);
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[pdf-worker] Job ${job ? job.id : "unknown"} failed: ${error.message}`
    );
  });
};

const shutdown = async () => {
  console.log("[pdf-worker] Shutting down...");

  if (worker) {
    await worker.close();
  }

  await closeBrowser();
  await redisConnection.quit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startWorker().catch((error) => {
  console.error("[pdf-worker] Startup failed:", error);
  process.exit(1);
});
