const Member = require("../models/Member");

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await Member.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                {
                  case: {
                    $regexMatch: { input: "$labelCode", regex: /^NAD-/ },
                  },
                  then: "NAD",
                },
                {
                  case: {
                    $regexMatch: { input: "$labelCode", regex: /^BFD-/ },
                  },
                  then: "BFD",
                },
                {
                  case: { $regexMatch: { input: "$labelCode", regex: /^LM-/ } },
                  then: "LM",
                },
              ],
              default: "OTHER",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    let nadCount = 0;
    let lmCount = 0;
    let bfdCount = 0;

    stats.forEach((item) => {
      if (item._id === "NAD") nadCount = item.count;
      if (item._id === "LM") lmCount = item.count;
      if (item._id === "BFD") bfdCount = item.count;
    });

    res.json({
      totalMembers: nadCount + lmCount + bfdCount,
      nadMembers: nadCount,
      lmMembers: lmCount,
      bfdMembers: bfdCount,
    });
  } catch (err) {
    console.error("DASHBOARD STATS ERROR:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
};
