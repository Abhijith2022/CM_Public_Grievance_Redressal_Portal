const mongoose = require('mongoose');
const { GRIEVANCE_STATUSES, USER_ROLES } = require('../constants/keralaData');

const grievanceHistorySchema = new mongoose.Schema(
  {
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
      index: true,
    },
    referenceId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    fromStatus: {
      type: String,
      enum: ['', ...GRIEVANCE_STATUSES],
      default: '',
    },
    toStatus: {
      type: String,
      enum: GRIEVANCE_STATUSES,
      required: true,
    },
    remark: {
      type: String,
      default: '',
      trim: true,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedByRole: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    changedByName: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

grievanceHistorySchema.index({ grievance: 1, createdAt: 1 });

module.exports = mongoose.model('GrievanceHistory', grievanceHistorySchema);
