const puppeteer = require("puppeteer");
const chromium = require("chromium");
const Member = require("../models/Member");
const generateLabelHTML = require("../utils/generateLabelHTML");

exports.generateLabelsPDF = async (req, res) => {
  try {
    const { memberIds } = req.body;

    if (!memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: "No members selected" });
    }

    // 1️⃣ Fetch members
    const members = await Member.find({
      _id: { $in: memberIds },
    });

    if (!members.length) {
      return res.status(404).json({ message: "No members found" });
    }

    // 2️⃣ Generate HTML
    // const html = generateLabelHTML(members);

    // 3️⃣ Launch Puppeteer (RENDER SAFE)
    // const browser = await puppeteer.launch({
    //   executablePath: chromium.path,
    //   headless: chromium.headless,
    //   args: chromium.args,
    // });

    // const page = await browser.newPage();

    // 4️⃣ Set HTML content
    // await page.setContent(html, {
    //   waitUntil: "domcontentloaded",
    // });

    // 5️⃣ Generate PDF
    // const pdf = await page.pdf({
    //   format: "A4",
    //   printBackground: true,
    //   preferCSSPageSize: true,
    //   margin: {
    //     top: "10mm",
    //     bottom: "10mm",
    //     left: "10mm",
    //     right: "10mm",
    //   },
    // });

    // await browser.close();

    // 6️⃣ Send PDF for PRINT (not download)
    // res.set({
    //   "Content-Type": "application/pdf",
    //   "Content-Disposition": "inline; filename=labels.pdf",
    //   "Content-Length": pdf.length,
    // });

    res.send(members);

  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      message: "Failed to generate PDF",
      error: error.message,
    });
  }
};
