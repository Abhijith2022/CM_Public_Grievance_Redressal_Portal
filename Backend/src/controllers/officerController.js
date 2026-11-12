const {
  Grievance,
  GrievanceHistory,
  DepartmentAssignment,
} = require('../models');
const { GRIEVANCE_STATUSES, GRIEVANCE_PRIORITIES } = require('../constants/keralaData');
const { AppError, asyncHandler } = require('../utils/errors');
const {
  assertValidObjectId,
  parsePagination,
  sanitizeSearchRegex,
} = require('../utils/validators');
const { saveUploadedFilesToAtlas } = require('./attachmentController');

function getOfficerDeptId(user) {
  return user.department?._id || user.department;
}

const listDepartmentGrievances = asyncHandler(async (req, res) => {
  const deptId = getOfficerDeptId(req.user);
  if (!deptId) {
    throw new AppError('Officer account is not linked to any department.', 400, 'NO_DEPARTMENT');
  }

  const { page, limit, skip } = parsePagination(req.query);
  const filter = { assignedDepartment: deptId };

  if (req.query.assignedToMe === 'true') {
    filter.assignedOfficer = req.user._id;
  }
  if (req.query.status && GRIEVANCE_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.priority && GRIEVANCE_PRIORITIES.includes(req.query.priority)) {
    filter.priority = req.query.priority;
  }
  if (req.query.search) {
    const safeRegex = new RegExp(sanitizeSearchRegex(req.query.search), 'i');
    filter.$or = [{ referenceId: safeRegex }, { subject: safeRegex }];
  }

  const [grievances, total] = await Promise.all([
    Grievance.find(filter)
      .populate('citizen', 'name district')
      .populate('assignedDepartment', 'name code')
      .populate('assignedOfficer', 'name email designation')
      .populate('attachments', 'originalName mimeType size purpose')
      .sort({ isEscalated: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Grievance.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      department: req.user.department,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      grievances,
    },
  });
});

const getOfficerStats = asyncHandler(async (req, res) => {
  const deptId = getOfficerDeptId(req.user);
  if (!deptId) {
    throw new AppError('Officer account is not linked to any department.', 400, 'NO_DEPARTMENT');
  }

  const now = new Date();
  const [totalAssigned, underReview, inProgress, resolved, actionSubmitted, overdue] =
    await Promise.all([
      Grievance.countDocuments({ assignedDepartment: deptId }),
      Grievance.countDocuments({ assignedDepartment: deptId, status: 'Under Review' }),
      Grievance.countDocuments({ assignedDepartment: deptId, status: 'In Progress' }),
      Grievance.countDocuments({ assignedDepartment: deptId, status: 'Resolved' }),
      Grievance.countDocuments({
        assignedDepartment: deptId,
        'actionTakenReport.submittedAt': { $ne: null },
      }),
      Grievance.countDocuments({
        assignedDepartment: deptId,
        status: { $ne: 'Resolved' },
        dueDate: { $lt: now },
      }),
    ]);

  res.json({
    success: true,
    data: {
      department: req.user.department,
      summary: {
        totalAssigned,
        underReview,
        inProgress,
        resolved,
        actionSubmitted,
        overdue,
      },
    },
  });
});

const updateInvestigationProgress = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');
  const deptId = getOfficerDeptId(req.user);

  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }
  if (!grievance.assignedDepartment || !deptId || !grievance.assignedDepartment.equals(deptId)) {
    throw new AppError(
      'This grievance is not forwarded to your department.',
      403,
      'FORBIDDEN'
    );
  }
  if (grievance.status === 'Resolved') {
    throw new AppError(
      'This grievance is already Resolved. Only a CMO administrator or the citizen can reopen it.',
      400,
      'ALREADY_RESOLVED'
    );
  }

  const { officerRemarks, status = 'In Progress' } = req.body;
  if (!['Under Review', 'In Progress'].includes(status)) {
    throw new AppError(
      'Department officers can update active status to "Under Review" or "In Progress". Final "Resolved" sign-off is performed by CMO after reviewing your Action-Taken Report.',
      400,
      'INVALID_OFFICER_STATUS'
    );
  }

  const prevStatus = grievance.status;
  grievance.status = status;
  if (!grievance.assignedOfficer) {
    grievance.assignedOfficer = req.user._id;
  }
  if (officerRemarks !== undefined) {
    grievance.officerRemarks = String(officerRemarks).trim();
  }

  await grievance.save();

  await DepartmentAssignment.updateMany(
    { grievance: grievance._id, department: deptId, status: 'Assigned' },
    { $set: { status: 'In Progress', assignedOfficer: req.user._id } }
  );

  await GrievanceHistory.create({
    grievance: grievance._id,
    referenceId: grievance.referenceId,
    action: 'Officer Investigation Update',
    fromStatus: prevStatus,
    toStatus: grievance.status,
    remark:
      String(officerRemarks || '').trim() ||
      `Department officer updated status to ${grievance.status}.`,
    isInternal: false,
    changedBy: req.user._id,
    changedByRole: req.user.role,
    changedByName: req.user.name,
  });

  res.json({
    success: true,
    message: 'Investigation progress updated successfully.',
    data: grievance,
  });
});

const submitActionReport = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');
  const deptId = getOfficerDeptId(req.user);

  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }
  if (!grievance.assignedDepartment || !deptId || !grievance.assignedDepartment.equals(deptId)) {
    throw new AppError(
      'This grievance is not forwarded to your department.',
      403,
      'FORBIDDEN'
    );
  }
  if (grievance.status === 'Resolved') {
    throw new AppError(
      'This grievance is already Resolved. Only a CMO administrator or the citizen can reopen it.',
      400,
      'ALREADY_RESOLVED'
    );
  }

  const summary = String(req.body.summary || '').trim();
  const details = String(req.body.details || req.body.officerRemarks || '').trim();

  if (summary.length < 10) {
    throw new AppError(
      'Action-taken report summary (at least 10 characters) is required.',
      400,
      'REPORT_SUMMARY_REQUIRED'
    );
  }

  let uploadedAttachmentIds = [];
  if (req.files && req.files.length > 0) {
    const savedFiles = await saveUploadedFilesToAtlas({
      files: req.files,
      userId: req.user._id,
      grievanceId: grievance._id,
      purpose: 'action_report',
    });
    uploadedAttachmentIds = savedFiles.map((f) => f._id);
  }

  const prevStatus = grievance.status;
  if (grievance.status === 'Under Review' || grievance.status === 'Submitted' || grievance.status === 'Reopened') {
    grievance.status = 'In Progress';
  }
  if (!grievance.assignedOfficer) {
    grievance.assignedOfficer = req.user._id;
  }

  const existingReportAttachments = grievance.actionTakenReport?.attachments || [];
  grievance.officerRemarks = summary;
  grievance.actionTakenReport = {
    summary,
    details,
    submittedBy: req.user._id,
    submittedByName: req.user.name,
    submittedAt: new Date(),
    attachments: [...existingReportAttachments, ...uploadedAttachmentIds],
  };

  await grievance.save();

  await DepartmentAssignment.updateMany(
    {
      grievance: grievance._id,
      department: deptId,
      status: { $in: ['Assigned', 'In Progress'] },
    },
    { $set: { status: 'Action Submitted', assignedOfficer: req.user._id } }
  );

  await GrievanceHistory.create({
    grievance: grievance._id,
    referenceId: grievance.referenceId,
    action: 'Action-Taken Report Submitted to CMO',
    fromStatus: prevStatus,
    toStatus: grievance.status,
    remark: summary,
    isInternal: false,
    changedBy: req.user._id,
    changedByRole: req.user.role,
    changedByName: req.user.name,
  });

  const populated = await Grievance.findById(grievance._id)
    .populate('assignedDepartment', 'name code')
    .populate('actionTakenReport.attachments', 'originalName mimeType size purpose');

  res.json({
    success: true,
    message: 'Action-taken report submitted back to CMO for review.',
    data: populated,
  });
});

module.exports = {
  listDepartmentGrievances,
  getOfficerStats,
  updateInvestigationProgress,
  submitActionReport,
};
