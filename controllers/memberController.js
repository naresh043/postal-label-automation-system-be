const Member = require("../models/Member");
const CounterModel = require("../models/CounterModel");

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
      { new: true, upsert: true },
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

exports.getPrintMembers = async (req, res) => {
  try {
    const members = await Member.find({ isAllowedToPrint: true })
      .sort({ createdAt: -1 })
      .lean(); // ✅ faster, lighter objects

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

    const updateQuery = {
      $set: updateFields,
    };

    // ✅ Only ONE remark (overwrite old one)
    if (remark && remark.trim()) {
      updateQuery.$set.remark = {
        text: remark.trim(),
        createdAt: new Date(), // stores date + time
      };
    }

    const member = await Member.findByIdAndUpdate(req.params.id, updateQuery, {
      new: true,
      runValidators: true,
    });

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

exports.toggleAllowToPrint = async (req, res) => {
  try {
    // 1️⃣ Get current value
    const member = await Member.findById(req.params.id).select(
      "isAllowedToPrint"
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // 2️⃣ Toggle value
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      {
        isAllowedToPrint: !member.isAllowedToPrint,
      },
      {
        new: true,
        runValidators: false, // avoids remark validation issue
      }
    );

    return res.status(200).json({
      message: "Print permission updated",
      isAllowedToPrint: updatedMember.isAllowedToPrint,
    });
  } catch (err) {
    console.error("TOGGLE PRINT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};