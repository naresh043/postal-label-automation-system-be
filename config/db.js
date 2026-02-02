const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://NamasteNaresh:Naresh%40143@namastenaresh.qddqpyv.mongodb.net/postalLabelsPrinting");
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Error", error);
    process.exit(1);
  }
};

module.exports = connectDB;
