const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    labelCode: {
      type: String,
      trim: true,
      required: [true, "labelCode is required"],
      index: true,
    },

    name: {
      type: String,
      trim: true,
      required: [true, "name is required"],
      default: "UNKNOWN",
    },

    phone: {
      type: String,
      trim: true,
      default: null,
      set: v => (v === "" ? null : v),
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      set: v => (v === "" ? null : v),
    },

    addressLine1: {
      type: String,
      trim: true,
      default: "",
    },

    addressLine2: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: null,
      set: v => (v === "" ? null : v),
    },

    remark: {
      type: String,
      trim: true,
      default: "",
    },

    isAllowedToPrint: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// UNIQUE constraint (DB-level safety)
memberSchema.index({ labelCode: 1 }, { unique: true });

module.exports = mongoose.model("Member", memberSchema);