const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// Central queue name so API + worker always point to the same Redis queue.
const PDF_QUEUE_NAME = "pdf-generation";

// Shared Redis connection options for BullMQ queue operations.
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

let pdfQueue;

// Lazily create the queue so importing this module in worker/controller is safe.
const getPdfQueue = () => {
  if (!pdfQueue) {
    pdfQueue = new Queue(PDF_QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 24 * 60 * 60, count: 1000 }, // Keep 24h history.
        removeOnFail: { age: 7 * 24 * 60 * 60 }, // Keep failures longer for debugging.
      },
    });
  }

  return pdfQueue;
};

module.exports = {
  PDF_QUEUE_NAME,
  redisConnection,
  getPdfQueue,
};
