const {
  Grievance,
  GrievanceHistory,
  DepartmentAssignment,
  Attachment,
  CitizenFeedback,
} = require('../models');
const {
  KERALA_DISTRICTS,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STATUSES,
  GRIEVANCE_PRIORITIES,
  USER_ROLES,
} = require('../constants/keralaData');
const { AppError, asyncHandler } = require('../utils/errors');
const { generateUniqueReferenceId } = require('../utils/referenceId');
const { assertValidObjectId, parsePagination } = require('../utils/validators');
const { analyzeGrievanceText } = require('../services/aiService');
const { saveUploadedFilesToAtlas } = require('./attachmentController');

function safeJsonParse(val, fallback = null) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (_err) {
    return fallback;
  }
}

const submitGrievance = asyncHandler(async (req, res) => {
  const {
    district,
    category,
    subject,
    description,
    originalDescription = '',
    priority = 'Medium',
    attachmentIds,
    aiAnalysis: providedAi,
    reviewedByCitizen = false,
    runAiAnalysis = true,
  } = req.body;

  if (!district || !category || !subject || !description) {
    throw new AppError(
      'District, category, subject, and detailed description are required.',
      400,
      'MISSING_GRIEVANCE_FIELDS'
    );
  }

  if (!KERALA_DISTRICTS.includes(district)) {
    throw new AppError('Invalid Kerala district selected.', 400, 'INVALID_DISTRICT');
  }
  if (!GRIEVANCE_CATEGORIES.includes(category)) {
    throw new AppError('Invalid grievance category selected.', 400, 'INVALID_CATEGORY');
  }

  const chosenPriority = GRIEVANCE_PRIORITIES.includes(priority) ? priority : 'Medium';
  const referenceId = await generateUniqueReferenceId(Grievance);

  let aiData = safeJsonParse(providedAi, null);
  const shouldRunAi = runAiAnalysis !== false && runAiAnalysis !== 'false';

  if (!aiData && shouldRunAi) {
    aiData = await analyzeGrievanceText({
      subject: String(subject).trim(),
      description: String(description).trim(),
      district,
      category,
    });
  }

  const normalizedAi = aiData
    ? {
        optimizedSubject: aiData.optimizedSubject || '',
        optimizedDescription: aiData.optimizedDescription || '',
        summary: aiData.summary || '',
        highlights: Array.isArray(aiData.highlights) ? aiData.highlights : [],
        suggestedDepartmentCode:
          aiData.suggestedDepartmentCode || aiData.suggestedDepartment?.code || '',
        suggestedDepartmentName:
          aiData.suggestedDepartmentName || aiData.suggestedDepartment?.name || '',
        suggestedCategory: aiData.suggestedCategory || '',
        suggestedPriority: GRIEVANCE_PRIORITIES.includes(aiData.suggestedPriority)
          ? aiData.suggestedPriority
          : '',
        reasoning: aiData.reasoning || '',
        potentialDuplicates: Array.isArray(aiData.potentialDuplicates)
          ? aiData.potentialDuplicates
          : [],
        source: aiData.source || 'none',
        isFallback: Boolean(aiData.isFallback),
        fallbackReason: aiData.fallbackReason || '',
        modelUsed: aiData.modelUsed || '',
        analyzedAt: aiData.analyzedAt || new Date(),
        reviewedByCitizen: reviewedByCitizen === true || reviewedByCitizen === 'true',
        reviewedByCmo: false,
      }
    : undefined;

  const parsedAttachmentIds = Array.isArray(attachmentIds)
    ? attachmentIds
    : safeJsonParse(attachmentIds, []);

  const validAttachmentIds = [];
  if (Array.isArray(parsedAttachmentIds)) {
    for (const id of parsedAttachmentIds) {
      assertValidObjectId(id, 'Attachment ID');
      if (!validAttachmentIds.includes(String(id))) {
        validAttachmentIds.push(String(id));
      }
    }
  }

  if (validAttachmentIds.length + (req.files?.length || 0) > 3) {
    throw new AppError('Maximum 3 attachments are allowed per grievance.', 400, 'TOO_MANY_ATTACHMENTS');
  }

  if (validAttachmentIds.length > 0) {
    const ownedAttachments = await Attachment.find({
      _id: { $in: validAttachmentIds },
      uploadedBy: req.user._id,
    }).select('_id');
    if (ownedAttachments.length !== validAttachmentIds.length) {
      throw new AppError(
        'One or more attachment IDs are invalid or do not belong to your account.',
        400,
        'INVALID_ATTACHMENT_IDS'
      );
    }
  }

  const grievance = await Grievance.create({
    referenceId,
    citizen: req.user._id,
    district,
    category,
    subject: String(subject).trim(),
    description: String(description).trim(),
    originalDescription: String(originalDescription || '').trim(),
    status: 'Submitted',
    priority: chosenPriority,
    attachments: validAttachmentIds,
    ...(normalizedAi ? { aiAnalysis: normalizedAi } : {}),
  });

  if (req.files && req.files.length > 0) {
    const uploaded = await saveUploadedFilesToAtlas({
      files: req.files,
      userId: req.user._id,
      grievanceId: grievance._id,
      purpose: 'citizen_evidence',
    });
    grievance.attachments.push(...uploaded.map((f) => f._id));
    await grievance.save();
  }

  if (validAttachmentIds.length > 0) {
    await Attachment.updateMany(
      { _id: { $in: validAttachmentIds }, uploadedBy: req.user._id },
      { $set: { grievance: grievance._id } }
    );
  }

  await GrievanceHistory.create({
    grievance: grievance._id,
    referenceId: grievance.referenceId,
    action: 'Grievance Submitted',
    fromStatus: '',
    toStatus: 'Submitted',
    remark: 'Grievance registered by citizen and unique reference ID generated.',
    isInternal: false,
    changedBy: req.user._id,
    changedByRole: req.user.role,
    changedByName: req.user.name,
  });

  const populated = await Grievance.findById(grievance._id)
    .populate('attachments', 'originalName mimeType size url purpose createdAt')
    .populate('assignedDepartment', 'name code');

  res.status(201).json({
    success: true,
    message: `Grievance submitted successfully. Your Reference ID is ${referenceId}.`,
    data: populated,
  });
});

const trackByReferenceId = asyncHandler(async (req, res) => {
  const ref = String(req.params.referenceId || '').trim().toUpperCase();
  if (!ref) {
    throw new AppError('Reference ID is required.', 400, 'MISSING_REFERENCE_ID');
  }

  const grievance = await Grievance.findOne({ referenceId: ref })
    .populate('assignedDepartment', 'name code shortDescription')
    .select(
      'referenceId district category subject status priority assignedDepartment cmoPublicRemark officerRemarks actionTakenReport isEscalated dueDate resolvedAt reopenedAt createdAt updatedAt'
    )
    .lean();

  if (!grievance) {
    throw new AppError(`No grievance found with Reference ID "${ref}".`, 404, 'GRIEVANCE_NOT_FOUND');
  }

  const history = await GrievanceHistory.find({
    grievance: grievance._id,
    isInternal: false,
  })
    .select('action fromStatus toStatus remark changedByRole changedByName createdAt')
    .sort({ createdAt: 1 })
    .lean();

  const isOverdue =
    grievance.status !== 'Resolved' &&
    Boolean(grievance.dueDate) &&
    new Date() > new Date(grievance.dueDate);

  res.json({
    success: true,
    data: {
      ...grievance,
      isOverdue,
      history,
    },
  });
});

const getMyGrievances = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { citizen: req.user._id };

  if (req.query.status && GRIEVANCE_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const [grievances, total, statusCountsAgg] = await Promise.all([
    Grievance.find(filter)
      .populate('assignedDepartment', 'name code')
      .populate('attachments', 'originalName mimeType size purpose createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Grievance.countDocuments(filter),
    Grievance.aggregate([
      { $match: { citizen: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const countsByStatus = {};
  let allCount = 0;
  for (const row of statusCountsAgg) {
    countsByStatus[row._id] = row.count;
    allCount += row.count;
  }

  const resolvedCount = countsByStatus.Resolved || 0;

  res.json({
    success: true,
    data: {
      summary: {
        total: allCount,
        submitted: countsByStatus.Submitted || 0,
        underReview: countsByStatus['Under Review'] || 0,
        inProgress: countsByStatus['In Progress'] || 0,
        resolved: resolvedCount,
        reopened: countsByStatus.Reopened || 0,
        pending: Math.max(0, allCount - resolvedCount),
      },
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

const getGrievanceById = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');

  const grievance = await Grievance.findById(req.params.id)
    .populate('citizen', 'name email mobileNumber district')
    .populate('assignedDepartment', 'name code shortDescription slaDays')
    .populate('assignedOfficer', 'name email designation')
    .populate('attachments', 'originalName filename mimeType size purpose createdAt')
    .populate('actionTakenReport.attachments', 'originalName filename mimeType size purpose createdAt');

  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }

  if (req.user.role === USER_ROLES.CITIZEN) {
    if (!grievance.citizen._id.equals(req.user._id)) {
      throw new AppError('You are not authorized to view this grievance.', 403, 'FORBIDDEN');
    }
  } else if (req.user.role === USER_ROLES.DEPARTMENT_OFFICER) {
    const officerDeptId = req.user.department?._id || req.user.department;
    if (
      !grievance.assignedDepartment ||
      !officerDeptId ||
      !grievance.assignedDepartment._id.equals(officerDeptId)
    ) {
      throw new AppError(
        'This grievance has not been forwarded to your department.',
        403,
        'FORBIDDEN'
      );
    }
  }

  const historyFilter = { grievance: grievance._id };
  if (req.user.role === USER_ROLES.CITIZEN) {
    historyFilter.isInternal = false;
  }

  const [history, assignments, feedback] = await Promise.all([
    GrievanceHistory.find(historyFilter).sort({ createdAt: 1 }).lean(),
    DepartmentAssignment.find({ grievance: grievance._id })
      .populate('department', 'name code')
      .populate('assignedOfficer', 'name email designation')
      .sort({ createdAt: -1 })
      .lean(),
    CitizenFeedback.findOne({ grievance: grievance._id }).lean(),
  ]);

  const result = grievance.toJSON();
  if (req.user.role === USER_ROLES.CITIZEN) {
    delete result.cmoInternalRemarks;
  }

  res.json({
    success: true,
    data: {
      grievance: result,
      history,
      assignments,
      feedback,
    },
  });
});

const submitFeedback = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');
  const { rating, isSatisfied, comment = '', reopenRequested = false } = req.body;

  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }
  if (!grievance.citizen.equals(req.user._id)) {
    throw new AppError('Only the submitting citizen can submit feedback.', 403, 'FORBIDDEN');
  }
  if (grievance.status !== 'Resolved') {
    throw new AppError(
      'Feedback can only be submitted after a grievance is Resolved.',
      400,
      'NOT_RESOLVED'
    );
  }

  const numRating = Number(rating);
  if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
    throw new AppError('Rating must be a number between 1 and 5.', 400, 'INVALID_RATING');
  }

  const existingFeedback = await CitizenFeedback.findOne({ grievance: grievance._id });
  if (existingFeedback) {
    throw new AppError('Feedback has already been submitted for this grievance.', 409, 'FEEDBACK_EXISTS');
  }

  const shouldReopen = Boolean(reopenRequested);

  const feedback = await CitizenFeedback.create({
    grievance: grievance._id,
    citizen: req.user._id,
    rating: numRating,
    isSatisfied: isSatisfied !== undefined ? Boolean(isSatisfied) : !shouldReopen,
    comment: String(comment).trim(),
    reopenRequested: shouldReopen,
  });

  if (shouldReopen) {
    const prevStatus = grievance.status;
    grievance.status = 'Reopened';
    grievance.reopenedAt = new Date();
    grievance.resolvedAt = null;
    await grievance.save();

    await GrievanceHistory.create({
      grievance: grievance._id,
      referenceId: grievance.referenceId,
      action: 'Grievance Reopened via Citizen Feedback',
      fromStatus: prevStatus,
      toStatus: 'Reopened',
      remark: String(comment).trim() || 'Citizen requested reopening after resolution.',
      isInternal: false,
      changedBy: req.user._id,
      changedByRole: req.user.role,
      changedByName: req.user.name,
    });
  }

  res.status(201).json({
    success: true,
    message: shouldReopen
      ? 'Feedback recorded and grievance reopened for CMO review.'
      : 'Thank you! Your feedback has been recorded.',
    data: {
      feedback,
      grievanceStatus: grievance.status,
    },
  });
});

const reopenGrievance = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');
  const reason = String(req.body.reason || req.body.remark || '').trim();
  if (reason.length < 5) {
    throw new AppError('Please provide a reason (at least 5 characters) to reopen.', 400, 'REASON_REQUIRED');
  }

  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }
  if (!grievance.citizen.equals(req.user._id)) {
    throw new AppError('Only the submitting citizen can reopen this grievance.', 403, 'FORBIDDEN');
  }
  if (grievance.status !== 'Resolved') {
    throw new AppError('Only Resolved grievances can be reopened.', 400, 'INVALID_STATUS_TRANSITION');
  }

  const prevStatus = grievance.status;
  grievance.status = 'Reopened';
  grievance.reopenedAt = new Date();
  grievance.resolvedAt = null;
  await grievance.save();

  await GrievanceHistory.create({
    grievance: grievance._id,
    referenceId: grievance.referenceId,
    action: 'Grievance Reopened by Citizen',
    fromStatus: prevStatus,
    toStatus: 'Reopened',
    remark: reason,
    isInternal: false,
    changedBy: req.user._id,
    changedByRole: req.user.role,
    changedByName: req.user.name,
  });

  res.json({
    success: true,
    message: 'Grievance reopened and returned to CMO queue.',
    data: grievance,
  });
});

module.exports = {
  submitGrievance,
  trackByReferenceId,
  getMyGrievances,
  getGrievanceById,
  submitFeedback,
  reopenGrievance,
};
