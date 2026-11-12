const {
  User,
  Department,
  Grievance,
  GrievanceHistory,
  DepartmentAssignment,
} = require('../models');
const {
  GRIEVANCE_STATUSES,
  GRIEVANCE_PRIORITIES,
  GRIEVANCE_CATEGORIES,
  KERALA_DISTRICTS,
  USER_ROLES,
} = require('../constants/keralaData');
const { AppError, asyncHandler } = require('../utils/errors');
const {
  assertValidObjectId,
  parsePagination,
  sanitizeSearchRegex,
} = require('../utils/validators');

const listAllGrievances = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  if (req.query.district && KERALA_DISTRICTS.includes(req.query.district)) {
    filter.district = req.query.district;
  }
  if (req.query.category && GRIEVANCE_CATEGORIES.includes(req.query.category)) {
    filter.category = req.query.category;
  }
  if (req.query.priority && GRIEVANCE_PRIORITIES.includes(req.query.priority)) {
    filter.priority = req.query.priority;
  }
  if (req.query.status && GRIEVANCE_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.departmentId) {
    assertValidObjectId(req.query.departmentId, 'Department ID');
    filter.assignedDepartment = req.query.departmentId;
  }
  if (req.query.escalated === 'true') {
    filter.isEscalated = true;
  }
  if (req.query.overdue === 'true') {
    if (filter.status) {
      filter.$and = [
        ...(filter.$and || []),
        { status: filter.status },
        { status: { $ne: 'Resolved' } },
      ];
      delete filter.status;
    } else {
      filter.status = { $ne: 'Resolved' };
    }
    filter.dueDate = { $lt: new Date() };
  }
  if (req.query.search) {
    const safeRegex = new RegExp(sanitizeSearchRegex(req.query.search), 'i');
    filter.$or = [
      { referenceId: safeRegex },
      { subject: safeRegex },
      { description: safeRegex },
    ];
  }

  const sortOrder = req.query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const [grievances, total] = await Promise.all([
    Grievance.find(filter)
      .populate('citizen', 'name email mobileNumber district')
      .populate('assignedDepartment', 'name code')
      .populate('assignedOfficer', 'name email designation')
      .populate('attachments', 'originalName mimeType size purpose')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit),
    Grievance.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
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

const getCmoStats = asyncHandler(async (_req, res) => {
  const now = new Date();

  const [
    total,
    resolved,
    escalated,
    overdue,
    statusBreakdown,
    priorityBreakdown,
    districtBreakdown,
    departmentBreakdown,
    categoryBreakdown,
    recentHistory,
  ] = await Promise.all([
    Grievance.countDocuments(),
    Grievance.countDocuments({ status: 'Resolved' }),
    Grievance.countDocuments({ isEscalated: true, status: { $ne: 'Resolved' } }),
    Grievance.countDocuments({ status: { $ne: 'Resolved' }, dueDate: { $lt: now } }),
    Grievance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Grievance.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Grievance.aggregate([
      {
        $group: {
          _id: '$district',
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $ne: ['$status', 'Resolved'] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Grievance.aggregate([
      { $match: { assignedDepartment: { $ne: null } } },
      {
        $group: {
          _id: '$assignedDepartment',
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $ne: ['$status', 'Resolved'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department',
        },
      },
      { $unwind: '$department' },
      {
        $project: {
          _id: 1,
          code: '$department.code',
          name: '$department.name',
          total: 1,
          resolved: 1,
          inProgress: 1,
          pending: 1,
        },
      },
      { $sort: { total: -1 } },
    ]),
    Grievance.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    GrievanceHistory.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const byStatus = {};
  for (const s of GRIEVANCE_STATUSES) byStatus[s] = 0;
  for (const row of statusBreakdown) byStatus[row._id] = row.count;

  const byPriority = {};
  for (const p of GRIEVANCE_PRIORITIES) byPriority[p] = 0;
  for (const row of priorityBreakdown) byPriority[row._id] = row.count;

  res.json({
    success: true,
    data: {
      summary: {
        total,
        pending: Math.max(0, total - resolved),
        resolved,
        overdue,
        escalated,
        submitted: byStatus.Submitted,
        underReview: byStatus['Under Review'],
        inProgress: byStatus['In Progress'],
        reopened: byStatus.Reopened,
      },
      byStatus,
      byPriority,
      districtStats: districtBreakdown.map((d) => ({
        district: d._id,
        total: d.total,
        resolved: d.resolved,
        pending: d.pending,
      })),
      departmentStats: departmentBreakdown,
      categoryStats: categoryBreakdown.map((c) => ({
        category: c._id,
        count: c.count,
      })),
      recentActivity: recentHistory,
    },
  });
});

const listDepartmentOfficers = asyncHandler(async (req, res) => {
  const filter = { role: USER_ROLES.DEPARTMENT_OFFICER, isActive: true };
  if (req.query.departmentId) {
    assertValidObjectId(req.query.departmentId, 'Department ID');
    filter.department = req.query.departmentId;
  }

  const officers = await User.find(filter)
    .populate('department', 'name code')
    .select('name email mobileNumber designation district department')
    .sort({ name: 1 })
    .lean();

  res.json({
    success: true,
    data: officers,
  });
});

const reviewGrievance = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');
  const { priority, category, cmoPublicRemark, internalRemark, markReviewed = true } = req.body;

  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }

  const prevStatus = grievance.status;

  if (priority && GRIEVANCE_PRIORITIES.includes(priority)) {
    grievance.priority = priority;
  }
  if (category && GRIEVANCE_CATEGORIES.includes(category)) {
    grievance.category = category;
  }
  if (cmoPublicRemark !== undefined) {
    grievance.cmoPublicRemark = String(cmoPublicRemark).trim();
  }
  if (internalRemark && String(internalRemark).trim()) {
    grievance.cmoInternalRemarks.push({
      remark: String(internalRemark).trim(),
      addedBy: req.user._id,
      addedByName: req.user.name,
    });
  }
  if (markReviewed && grievance.aiAnalysis) {
    grievance.aiAnalysis.reviewedByCmo = true;
  }
  if (grievance.status === 'Submitted' || grievance.status === 'Reopened') {
    grievance.status = 'Under Review';
  }

  await grievance.save();

  await GrievanceHistory.create({
    grievance: grievance._id,
    referenceId: grievance.referenceId,
    action: 'CMO Administrative Review',
    fromStatus: prevStatus,
    toStatus: grievance.status,
    remark:
      String(cmoPublicRemark || internalRemark || '').trim() ||
      'Grievance reviewed by CMO administrator.',
    isInternal: Boolean(!cmoPublicRemark && internalRemark),
    changedBy: req.user._id,
    changedByRole: req.user.role,
    changedByName: req.user.name,
  });

  const updated = await Grievance.findById(grievance._id)
    .populate('assignedDepartment', 'name code')
    .populate('assignedOfficer', 'name email designation');

  res.json({
    success: true,
    message: 'CMO review saved successfully.',
    data: updated,
  });
});

const assignToDepartment = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');
  const {
    departmentId,
    officerId = null,
    priority,
    dueDate,
    instructions = '',
    cmoPublicRemark,
  } = req.body;

  if (!departmentId) {
    throw new AppError('Target departmentId is required.', 400, 'DEPARTMENT_REQUIRED');
  }
  assertValidObjectId(departmentId, 'Department ID');

  const [grievance, department] = await Promise.all([
    Grievance.findById(req.params.id),
    Department.findById(departmentId),
  ]);

  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }
  if (!department) {
    throw new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND');
  }
  if (grievance.status === 'Resolved') {
    throw new AppError(
      'Cannot forward a Resolved grievance. Reopen it first before reassigning.',
      400,
      'ALREADY_RESOLVED'
    );
  }

  let officer = null;
  if (officerId) {
    assertValidObjectId(officerId, 'Officer ID');
    officer = await User.findOne({
      _id: officerId,
      role: USER_ROLES.DEPARTMENT_OFFICER,
      isActive: true,
    });
    if (!officer) {
      throw new AppError('Department officer not found.', 404, 'OFFICER_NOT_FOUND');
    }
    if (officer.department && !officer.department.equals(department._id)) {
      throw new AppError(
        'Selected officer belongs to a different department.',
        400,
        'OFFICER_DEPT_MISMATCH'
      );
    }
  }

  const prevStatus = grievance.status;
  const resolvedPriority =
    priority && GRIEVANCE_PRIORITIES.includes(priority) ? priority : grievance.priority;

  const computedDueDate = dueDate
    ? new Date(dueDate)
    : new Date(Date.now() + (department.slaDays || 7) * 24 * 60 * 60 * 1000);

  if (Number.isNaN(computedDueDate.getTime())) {
    throw new AppError('Invalid dueDate format.', 400, 'INVALID_DATE');
  }

  await DepartmentAssignment.updateMany(
    { grievance: grievance._id, status: { $in: ['Assigned', 'In Progress', 'Action Submitted'] } },
    { $set: { status: 'Reassigned' } }
  );

  const assignment = await DepartmentAssignment.create({
    grievance: grievance._id,
    department: department._id,
    assignedOfficer: officer ? officer._id : null,
    assignedBy: req.user._id,
    instructions: String(instructions || '').trim(),
    priority: resolvedPriority,
    dueDate: computedDueDate,
    status: 'Assigned',
  });

  grievance.assignedDepartment = department._id;
  grievance.assignedOfficer = officer ? officer._id : null;
  grievance.priority = resolvedPriority;
  grievance.dueDate = computedDueDate;
  if (grievance.status === 'Submitted' || grievance.status === 'Reopened') {
    grievance.status = 'Under Review';
  }
  if (cmoPublicRemark !== undefined) {
    grievance.cmoPublicRemark = String(cmoPublicRemark).trim();
  } else if (!grievance.cmoPublicRemark) {
    grievance.cmoPublicRemark = `Forwarded to ${department.name} for investigation and action.`;
  }
  if (grievance.aiAnalysis) {
    grievance.aiAnalysis.reviewedByCmo = true;
  }

  await grievance.save();

  await GrievanceHistory.create({
    grievance: grievance._id,
    referenceId: grievance.referenceId,
    action: `Forwarded to ${department.name}`,
    fromStatus: prevStatus,
    toStatus: grievance.status,
    remark:
      String(instructions || cmoPublicRemark || '').trim() ||
      `Assigned to ${department.name}${officer ? ` (${officer.name})` : ''}.`,
    isInternal: false,
    changedBy: req.user._id,
    changedByRole: req.user.role,
    changedByName: req.user.name,
    metadata: {
      departmentCode: department.code,
      officerName: officer?.name || null,
    },
  });

  const populated = await Grievance.findById(grievance._id)
    .populate('assignedDepartment', 'name code')
    .populate('assignedOfficer', 'name email designation');

  res.json({
    success: true,
    message: `Grievance forwarded to ${department.name}.`,
    data: {
      grievance: populated,
      assignment,
    },
  });
});

const escalateGrievance = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');
  const reason = String(req.body.reason || req.body.escalationReason || '').trim();
  if (reason.length < 5) {
    throw new AppError('Escalation reason (at least 5 characters) is required.', 400, 'REASON_REQUIRED');
  }

  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }
  if (grievance.status === 'Resolved') {
    throw new AppError('Cannot escalate an already Resolved grievance.', 400, 'ALREADY_RESOLVED');
  }

  grievance.isEscalated = true;
  grievance.escalatedAt = new Date();
  grievance.escalationReason = reason;
  if (req.body.elevatePriority !== false) {
    grievance.priority = 'High';
  }
  grievance.cmoInternalRemarks.push({
    remark: `ESCALATED: ${reason}`,
    addedBy: req.user._id,
    addedByName: req.user.name,
  });

  await grievance.save();

  await GrievanceHistory.create({
    grievance: grievance._id,
    referenceId: grievance.referenceId,
    action: 'Grievance Escalated by CMO',
    fromStatus: grievance.status,
    toStatus: grievance.status,
    remark: reason,
    isInternal: true,
    changedBy: req.user._id,
    changedByRole: req.user.role,
    changedByName: req.user.name,
  });

  res.json({
    success: true,
    message: 'Grievance escalated and flagged for urgent review.',
    data: grievance,
  });
});

const updateGrievanceStatus = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');
  const { status, remark = '', isInternal = false } = req.body;

  if (!status || !GRIEVANCE_STATUSES.includes(status)) {
    throw new AppError(
      `Invalid status. Allowed values: ${GRIEVANCE_STATUSES.join(', ')}.`,
      400,
      'INVALID_STATUS'
    );
  }

  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }

  const prevStatus = grievance.status;
  grievance.status = status;

  if (status === 'Resolved') {
    grievance.resolvedAt = new Date();
    await DepartmentAssignment.updateMany(
      { grievance: grievance._id, status: { $in: ['Assigned', 'In Progress', 'Action Submitted'] } },
      { $set: { status: 'Completed', completedAt: new Date() } }
    );
  } else {
    grievance.resolvedAt = null;
    if (status === 'Reopened') {
      grievance.reopenedAt = new Date();
    }
  }

  if (remark && !isInternal) {
    grievance.cmoPublicRemark = String(remark).trim();
  } else if (remark && isInternal) {
    grievance.cmoInternalRemarks.push({
      remark: String(remark).trim(),
      addedBy: req.user._id,
      addedByName: req.user.name,
    });
  }

  await grievance.save();

  await GrievanceHistory.create({
    grievance: grievance._id,
    referenceId: grievance.referenceId,
    action: `Status Updated to ${status}`,
    fromStatus: prevStatus,
    toStatus: status,
    remark: String(remark).trim() || `CMO changed status from ${prevStatus} to ${status}.`,
    isInternal: Boolean(isInternal),
    changedBy: req.user._id,
    changedByRole: req.user.role,
    changedByName: req.user.name,
  });

  res.json({
    success: true,
    message: `Grievance status updated to ${status}.`,
    data: grievance,
  });
});

module.exports = {
  listAllGrievances,
  getCmoStats,
  listDepartmentOfficers,
  reviewGrievance,
  assignToDepartment,
  escalateGrievance,
  updateGrievanceStatus,
};
