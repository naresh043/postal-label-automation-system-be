const Member = require("../models/Member");
const CounterModel = require("../models/CounterModel");

/* =========================
   CREATE MEMBER (LM / NAD)
========================= */
exports.createMember = async (req, res) => {
  try {
    const { prefix, ...memberData } = req.body;

    if (!["LM", "NAD"].includes(prefix)) {
      return res.status(400).json({ error: "Invalid prefix" });
    }

    // 🔥 Atomic counter (single source of truth)
    const counter = await CounterModel.findOneAndUpdate(
      { prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const paddedSeq = String(counter.seq).padStart(2, "0");
    const labelCode = `${prefix}-${paddedSeq}`;

    const member = await Member.create({
      ...memberData,
      labelCode,
    });

    return res.status(201).json(member);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Duplicate label code",
      });
    }

    return res.status(500).json({
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
   - labelCode protected
   - remarks append-only
========================= */
exports.updateMember = async (req, res) => {
  try {
    const { remark, labelCode, ...updateFields } = req.body;
    // ❌ labelCode intentionally ignored

    const updateQuery = {
      $set: updateFields,
    };

    // ✅ Append-only remarks
    if (remark && remark.trim()) {
      updateQuery.$push = {
        remarks: {
          text: remark.trim(),
          createdAt: new Date(),
        },
      };
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    return res.status(200).json(member);
  } catch (err) {
    console.error("UPDATE MEMBER ERROR:", err);
    return res.status(500).json({ error: err.message });
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

/* =========================
   GET NEXT MEMBER CODE
   (Preview only)
========================= */
exports.getNextMemberCode = async (req, res) => {
  try {
    const { prefix } = req.query;

    if (!["LM", "NAD"].includes(prefix)) {
      return res.status(400).json({ error: "Invalid prefix" });
    }

    const counter = await CounterModel.findOne({ prefix });
    const nextSeq = counter ? counter.seq + 1 : 1;

    const padded = String(nextSeq).padStart(2, "0");

    return res.status(200).json({
      labelCode: `${prefix}-${padded}`,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to generate next member code",
    });
  }
};