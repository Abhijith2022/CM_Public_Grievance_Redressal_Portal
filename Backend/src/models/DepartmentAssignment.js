const mongoose = require('mongoose');
const { GRIEVANCE_PRIORITIES } = require('../constants/keralaData');

const departmentAssignmentSchema = new mongoose.Schema(
  {
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: GRIEVANCE_PRIORITIES,
      default: 'Medium',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Assigned', 'In Progress', 'Action Submitted', 'Completed', 'Reassigned'],
      default: 'Assigned',
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
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

module.exports = mongoose.model('DepartmentAssignment', departmentAssignmentSchema);
