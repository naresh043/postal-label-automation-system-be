const puppeteer = require("puppeteer");
const chromium = require("chromium");

let browserInstance;

// Resolve Chromium executable path across local/dev/prod environments.
const getExecutablePath = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  if (chromium && chromium.path) {
    return chromium.path;
  }

  return undefined;
};

const getLaunchOptions = () => {
  const executablePath = getExecutablePath();

  return {
    headless:
      process.env.PUPPETEER_HEADLESS === "false"
        ? false
        : chromium.headless ?? true,
    executablePath,
    args:
      Array.isArray(chromium.args) && chromium.args.length
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],
  };
};

// Return one shared browser instance for all jobs in the worker process.
const getBrowser = async () => {
  if (browserInstance) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch(getLaunchOptions());

  // Reset local reference if Chromium process exits unexpectedly.
  browserInstance.on("disconnected", () => {
    browserInstance = null;
  });

  return browserInstance;
};

// Graceful shutdown hook for worker process exit.
const closeBrowser = async () => {
  if (!browserInstance) {
    return;
  }

  await browserInstance.close();
  browserInstance = null;
};

module.exports = {
  getBrowser,
  closeBrowser,
};
