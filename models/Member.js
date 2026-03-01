const mongoose = require("mongoose");
const memberSchema = new mongoose.Schema(
  {
    labelCode: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },

    addressLine1: {
      type: String,
      trim: true,
    },

    addressLine2: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      default: null,
      trim: true,
    },
    remark: {
      type: String,
      trim: true,
    },
    isAllowedToPrint: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
memberSchema.index({ labelCode: 1 }, { unique: true });

module.exports = mongoose.model("Member", memberSchema);
