const mongoose = require('mongoose');
const {
  KERALA_DISTRICTS,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STATUSES,
  GRIEVANCE_PRIORITIES,
} = require('../constants/keralaData');

const aiDuplicateSchema = new mongoose.Schema(
  {
    grievanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grievance' },
    referenceId: String,
    subject: String,
    status: String,
    district: String,
    similarityScore: Number,
    reason: String,
  },
  { _id: false }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    optimizedSubject: { type: String, default: '' },
    optimizedDescription: { type: String, default: '' },
    summary: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    suggestedDepartmentCode: { type: String, default: '' },
    suggestedDepartmentName: { type: String, default: '' },
    suggestedCategory: { type: String, default: '' },
    suggestedPriority: {
      type: String,
      enum: ['', ...GRIEVANCE_PRIORITIES],
      default: '',
    },
    reasoning: { type: String, default: '' },
    potentialDuplicates: { type: [aiDuplicateSchema], default: [] },
    source: {
      type: String,
      enum: ['gemini', 'fallback', 'none'],
      default: 'none',
    },
    isFallback: { type: Boolean, default: false },
    fallbackReason: { type: String, default: '' },
    modelUsed: { type: String, default: '' },
    analyzedAt: { type: Date, default: null },
    reviewedByCitizen: { type: Boolean, default: false },
    reviewedByCmo: { type: Boolean, default: false },
  },
  { _id: false }
);

const grievanceSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      enum: KERALA_DISTRICTS,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: GRIEVANCE_CATEGORIES,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [5, 'Subject must be at least 5 characters'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
      minlength: [15, 'Description must be at least 15 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    originalDescription: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: GRIEVANCE_STATUSES,
      default: 'Submitted',
      index: true,
    },
    priority: {
      type: String,
      enum: GRIEVANCE_PRIORITIES,
      default: 'Medium',
      index: true,
    },
    assignedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      index: true,
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    escalationReason: {
      type: String,
      default: '',
      trim: true,
    },
    cmoPublicRemark: {
      type: String,
      default: '',
      trim: true,
    },
    cmoInternalRemarks: [
      {
        remark: { type: String, required: true, trim: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedByName: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    officerRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    actionTakenReport: {
      summary: { type: String, default: '', trim: true },
      details: { type: String, default: '', trim: true },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      submittedByName: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
      attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
    },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
    aiAnalysis: {
      type: aiAnalysisSchema,
      default: () => ({}),
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    reopenedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

grievanceSchema.virtual('isOverdue').get(function isOverdue() {
  if (this.status === 'Resolved' || !this.dueDate) return false;
  return new Date() > new Date(this.dueDate);
});

grievanceSchema.index({ createdAt: -1 });
grievanceSchema.index({ subject: 'text', description: 'text' });

module.exports = mongoose.model('Grievance', grievanceSchema);
