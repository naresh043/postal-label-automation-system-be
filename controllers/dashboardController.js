const Member = require("../models/Member");

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await Member.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: "$labelCode", regex: /^NAD-/ } },
              "NAD",
              "LM"
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Default counts
    let nadCount = 0;
    let lmCount = 0;

    stats.forEach((item) => {
      if (item._id === "NAD") nadCount = item.count;
      if (item._id === "LM") lmCount = item.count;
    });

    res.json({
      totalMembers: nadCount + lmCount,
      nadMembers: nadCount,
      lmMembers: lmCount,
    });
  } catch (err) {
    console.error("DASHBOARD STATS ERROR:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
};