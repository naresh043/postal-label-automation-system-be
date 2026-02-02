const Member = require("../models/Member");

// CREATE MEMBER
exports.createMember = async (req, res) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET ALL MEMBERS
exports.getMembers = async (req, res) => {
  const members = await Member.find().sort({ createdAt: -1 });
  res.json(members);
};

// UPDATE MEMBER
exports.updateMember = async (req, res) => {
  const member = await Member.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(member);
};

// DELETE MEMBER
exports.deleteMember = async (req, res) => {
  await Member.findByIdAndDelete(req.params.id);
  res.json({ message: "Member deleted" });
};
