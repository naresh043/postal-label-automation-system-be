const Member = require("../models/Member");
const CounterModel = require("../models/CounterModel");
// CREATE MEMBER
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

    res.status(201).json(member);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Duplicate label code",
      });
    }

    res.status(500).json({ error: err.message });
  }
};

// GET ALL MEMBERS
exports.getMembers = async (req, res) => {
  const members = await Member.find().sort({ createdAt: -1 });
  res.json(members);
};

// UPDATE MEMBER (safe + remark-aware)
// UPDATE MEMBER (safe, no labelCode update)
exports.updateMember = async (req, res) => {
  try {
    const { remark, labelCode, ...updateFields } = req.body;
    //        ❌ ignored explicitly

    const updateQuery = {
      $set: updateFields,
    };

    // ✅ Append remark (date handled here)
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
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json(member);
  } catch (err) {
    console.error("UPDATE MEMBER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE MEMBER
exports.deleteMember = async (req, res) => {
  await Member.findByIdAndDelete(req.params.id);
  res.json({ message: "Member deleted" });
};




exports.getNextMemberCode = async (req, res) => {
  const { prefix } = req.query;

  if (!["LM", "NAD"].includes(prefix)) {
    return res.status(400).json({ error: "Invalid prefix" });
  }

  const counter = await CounterModel.findOne({ prefix });

  const nextSeq = counter ? counter.seq + 1 : 1;
  const padded = String(nextSeq).padStart(2, "0");

  res.json({
    labelCode: `${prefix}-${padded}`,
  });
};