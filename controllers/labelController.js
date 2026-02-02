const puppeteer = require("puppeteer");
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
      _id: { $in: memberIds }
    });

    // 2️⃣ Generate HTML
    const html = generateLabelHTML(members);

    // 3️⃣ Launch Puppeteer (SAFE MODE)
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    // 4️⃣ Set content and WAIT until fully rendered
    // await page.setContent(html, {
    //   waitUntil: "networkidle0"
    // });

    await page.setContent(html, {
      waitUntil: "domcontentloaded"
    });
    // 5️⃣ Generate PDF with FIXED margins
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm"
      }
    });

    await browser.close();

    // 6️⃣ Send PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=labels.pdf"
    });

    res.send(pdf);

  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};
