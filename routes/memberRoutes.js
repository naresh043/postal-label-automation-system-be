const express = require("express");
const router = express.Router();
const {
  createMember,
  getMembers,
  getPrintMembers,
  updateMember,
  deleteMember,
  getNextMemberCode,
  toggleAllowToPrint,
} = require("../controllers/memberController");

router.post("/", createMember);
router.get("/", getMembers);
router.get("/printlabelmembers", getPrintMembers);
router.put("/:id", updateMember);
router.delete("/:id", deleteMember);
router.get("/next-code", getNextMemberCode);
router.patch("/:id/toggle-print", toggleAllowToPrint);

module.exports = router;

