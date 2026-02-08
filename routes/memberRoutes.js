const express = require("express");
const router = express.Router();
const {
  createMember,
  getMembers,
  updateMember,
  deleteMember,
  getNextMemberCode
} = require("../controllers/memberController");

router.post("/", createMember);
router.get("/", getMembers);
router.put("/:id", updateMember);
router.delete("/:id", deleteMember);
router.get("/next-code", getNextMemberCode);

module.exports = router;

