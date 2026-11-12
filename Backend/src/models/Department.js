const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    headDesignation: {
      type: String,
      default: 'Department Nodal Officer',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    slaDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 90,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Department', departmentSchema);
