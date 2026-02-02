const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    labelCode: {
      type: String,
      unique: true,
      required: true // LM-24
    },

    name: { type: String, required: true },

    addressLine1: String,
    addressLine2: String,

    area: String,
    city: String,
    state: String,
    pincode: String,

    phone: String,

    leaseStart: Date,
    leaseEnd: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);
