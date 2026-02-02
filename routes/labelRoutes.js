const express = require("express");
const router = express.Router();
const { generateLabelsPDF } = require("../controllers/labelController");

router.post("/", generateLabelsPDF);

module.exports = router;
