const Member = require("../models/Member");

/* =========================
   CREATE MEMBER
========================= */
exports.createMember = async (req, res) => {
  try {
    const member = await Member.create(req.body);
    return res.status(201).json(member);
  } catch (err) {
    return res.status(400).json({
      error: err.message,
    });
  }
};

/* =========================
   GET ALL MEMBERS
========================= */
exports.getMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    return res.status(200).json(members);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch members",
    });
  }
};

/* =========================
   UPDATE MEMBER
========================= */
exports.updateMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({
        error: "Member not found",
      });
    }

    return res.status(200).json(member);
  } catch (err) {
    return res.status(400).json({
      error: err.message,
    });
  }
};

/* =========================
   DELETE MEMBER
========================= */
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({
        error: "Member not found",
      });
    }

    return res.status(200).json({
      message: "Member deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to delete member",
    });
  }
};
