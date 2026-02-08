const mongoose = require("mongoose");

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
  { _id: false } // no separate _id for each remark
);

const memberSchema = new mongoose.Schema(
  {
    labelCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
    },

    /* ✅ NEW REMARKS STRUCTURE */
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

memberSchema.index({ labelCode: 1 }, { unique: true });

module.exports = mongoose.model("Member", memberSchema);