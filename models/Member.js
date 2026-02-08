const mongoose = require("mongoose");

/* =========================
   REMARK SUB-SCHEMA
========================= */
const remarkSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* =========================
   MEMBER SCHEMA
========================= */
const memberSchema = new mongoose.Schema(
  {
    labelCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
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

    /* ✅ Append-only remarks */
    remarks: {
      type: [remarkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =========================
   INDEXES
========================= */
memberSchema.index({ labelCode: 1 }, { unique: true });

module.exports = mongoose.model("Member", memberSchema);