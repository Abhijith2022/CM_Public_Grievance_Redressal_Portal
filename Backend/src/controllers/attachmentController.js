const path = require('path');
const crypto = require('crypto');
const { Attachment, Grievance } = require('../models');
const { USER_ROLES } = require('../constants/keralaData');
const { AppError, asyncHandler } = require('../utils/errors');
const { assertValidObjectId } = require('../utils/validators');

async function saveUploadedFilesToAtlas({
  files = [],
  userId,
  grievanceId = null,
  purpose = 'citizen_evidence',
}) {
  if (!files || files.length === 0) return [];

  const docs = files.map((file) => {
    const ext = path.extname(file.originalname || '').slice(0, 12);
    const safeFilename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    return {
      originalName: file.originalname || safeFilename,
      filename: safeFilename,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer,
      uploadedBy: userId,
      grievance: grievanceId,
      purpose,
    };
  });

  const saved = await Attachment.insertMany(docs);
  return saved.map((doc) => ({
    _id: doc._id,
    originalName: doc.originalName,
    filename: doc.filename,
    mimeType: doc.mimeType,
    size: doc.size,
    purpose: doc.purpose,
    url: `/api/attachments/${doc._id}`,
    createdAt: doc.createdAt,
  }));
}

const uploadAttachments = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    throw new AppError('Please select at least one file to upload.', 400, 'NO_FILES');
  }

  const purpose =
    req.body.purpose === 'action_report' && req.user.role !== USER_ROLES.CITIZEN
      ? 'action_report'
      : 'citizen_evidence';

  let grievance = null;
  let grievanceId = null;
  if (req.body.grievanceId) {
    assertValidObjectId(req.body.grievanceId, 'Grievance ID');
    grievance = await Grievance.findById(req.body.grievanceId);
    if (!grievance) {
      throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
    }

    if (req.user.role === USER_ROLES.CITIZEN) {
      if (!grievance.citizen.equals(req.user._id)) {
        throw new AppError('You are not authorized to attach files to this grievance.', 403, 'FORBIDDEN');
      }
    } else if (req.user.role === USER_ROLES.DEPARTMENT_OFFICER) {
      const officerDeptId = req.user.department?._id || req.user.department;
      if (!grievance.assignedDepartment || !officerDeptId || !grievance.assignedDepartment.equals(officerDeptId)) {
        throw new AppError('This grievance is not forwarded to your department.', 403, 'FORBIDDEN');
      }
    }
    grievanceId = grievance._id;
  }

  const saved = await saveUploadedFilesToAtlas({
    files,
    userId: req.user._id,
    grievanceId,
    purpose,
  });

  if (grievance) {
    const newIds = saved.map((f) => f._id);
    if (purpose === 'action_report') {
      grievance.actionTakenReport = grievance.actionTakenReport || {};
      grievance.actionTakenReport.attachments = [
        ...(grievance.actionTakenReport.attachments || []),
        ...newIds,
      ];
    } else {
      grievance.attachments = [...(grievance.attachments || []), ...newIds];
    }
    await grievance.save();
  }

  res.status(201).json({
    success: true,
    message: `${saved.length} file(s) uploaded securely to MongoDB Atlas.`,
    data: saved,
  });
});

const getAttachmentById = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Attachment ID');

  const attachment = await Attachment.findById(req.params.id).select('+data');
  if (!attachment) {
    throw new AppError('Attachment not found.', 404, 'ATTACHMENT_NOT_FOUND');
  }

  if (req.user.role !== USER_ROLES.CMO_ADMIN) {
    const isUploader = attachment.uploadedBy && attachment.uploadedBy.equals(req.user._id);

    if (attachment.grievance) {
      const grievance = await Grievance.findById(attachment.grievance).select(
        'citizen assignedDepartment'
      );
      if (!grievance) {
        if (!isUploader) {
          throw new AppError('Forbidden.', 403, 'FORBIDDEN');
        }
      } else if (req.user.role === USER_ROLES.CITIZEN) {
        if (!grievance.citizen.equals(req.user._id)) {
          throw new AppError('You are not authorized to access this file.', 403, 'FORBIDDEN');
        }
      } else if (req.user.role === USER_ROLES.DEPARTMENT_OFFICER) {
        const officerDeptId = req.user.department?._id || req.user.department;
        const matchesDept =
          grievance.assignedDepartment &&
          officerDeptId &&
          grievance.assignedDepartment.equals(officerDeptId);
        if (!matchesDept && !isUploader) {
          throw new AppError(
            'This file belongs to a grievance not assigned to your department.',
            403,
            'FORBIDDEN'
          );
        }
      }
    } else if (!isUploader) {
      throw new AppError('You are not authorized to access this file.', 403, 'FORBIDDEN');
    }
  }

  const sanitizedName = attachment.originalName.replace(/["\r\n]/g, '_');
  res.setHeader('Content-Type', attachment.mimeType);
  res.setHeader('Content-Length', attachment.size);
  res.setHeader('Content-Disposition', `inline; filename="${sanitizedName}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(attachment.data);
});

module.exports = {
  saveUploadedFilesToAtlas,
  uploadAttachments,
  getAttachmentById,
};
