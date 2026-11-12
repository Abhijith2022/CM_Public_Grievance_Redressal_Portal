const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    data: {
      type: Buffer,
      required: true,
      select: false,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    grievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grievance',
      default: null,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['citizen_evidence', 'action_report'],
      default: 'citizen_evidence',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.data;
        delete ret.__v;
        return ret;
      },
    },
  }
);

attachmentSchema.virtual('url').get(function getUrl() {
  return `/api/attachments/${this._id}`;
});

module.exports = mongoose.model('Attachment', attachmentSchema);
