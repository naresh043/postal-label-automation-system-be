const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    labelCode: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    addressLine1: String,
    addressLine2: String,

    area: String,
    city: String,
    state: String,
    pincode: String,

    leaseStart: Date,
    leaseEnd: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);
