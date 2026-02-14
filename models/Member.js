const mongoose = require("mongoose");

/* =========================
   REMARK SUB-SCHEMA
========================= */
const remarkSchema = new mongoose.Schema({
  remark: {
    text: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
    },
  },
});

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
    remark: {
      text: {
        type: String,
        trim: true,
      },
      createdAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* =========================
   INDEXES
========================= */
memberSchema.index({ labelCode: 1 }, { unique: true });

module.exports = mongoose.model("Member", memberSchema);
