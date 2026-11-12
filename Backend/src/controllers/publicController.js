const { Department, Grievance, ContactEnquiry } = require('../models');
const {
  KERALA_DISTRICTS,
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_STATUSES,
  GRIEVANCE_PRIORITIES,
  PROTOTYPE_DISCLAIMER,
  SAMPLE_FAQS,
} = require('../constants/keralaData');
const { AppError, asyncHandler } = require('../utils/errors');
const { assertValidObjectId } = require('../utils/validators');

const getOverview = asyncHandler(async (_req, res) => {
  const [totalGrievances, resolvedCount, inProgressCount, underReviewCount, departments] =
    await Promise.all([
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: 'Resolved' }),
      Grievance.countDocuments({ status: 'In Progress' }),
      Grievance.countDocuments({ status: 'Under Review' }),
      Department.find({ isActive: true }).sort({ isFeatured: -1, name: 1 }).lean(),
    ]);

  const pendingCount = Math.max(0, totalGrievances - resolvedCount);

  res.json({
    success: true,
    data: {
      portalTitle: 'CM Kerala – Chief Minister\'s Public Grievance Redressal Portal',
      disclaimer: PROTOTYPE_DISCLAIMER,
      stats: {
        totalGrievances,
        resolvedCount,
        inProgressCount,
        underReviewCount,
        pendingCount,
        departmentsCount: departments.length,
        districtsCovered: KERALA_DISTRICTS.length,
      },
      featuredDepartments: departments.filter((d) => d.isFeatured),
      departments,
      districts: KERALA_DISTRICTS,
      categories: GRIEVANCE_CATEGORIES,
      statuses: GRIEVANCE_STATUSES,
      priorities: GRIEVANCE_PRIORITIES,
      faqs: SAMPLE_FAQS,
      workflowSteps: [
        'Citizen submits grievance & receives unique Reference ID',
        'AI Grievance Assistant optimizes text, highlights facts & suggests routing',
        'CMO reviews complaint & forwards to relevant Department/Officer',
        'Department Officer investigates & submits Action-Taken Report',
        'CMO reviews response & resolves grievance; Citizen gives feedback or reopens',
      ],
    },
  });
});

const getDepartments = asyncHandler(async (_req, res) => {
  const departments = await Department.find({ isActive: true }).sort({ name: 1 }).lean();

  const counts = await Grievance.aggregate([
    { $match: { assignedDepartment: { $ne: null } } },
    {
      $group: {
        _id: '$assignedDepartment',
        totalAssigned: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] },
        },
      },
    },
  ]);

  const countMap = new Map(counts.map((c) => [c._id.toString(), c]));

  const enriched = departments.map((dept) => {
    const stat = countMap.get(dept._id.toString()) || { totalAssigned: 0, resolved: 0 };
    return {
      ...dept,
      stats: {
        totalAssigned: stat.totalAssigned,
        resolved: stat.resolved,
        pending: Math.max(0, stat.totalAssigned - stat.resolved),
      },
    };
  });

  res.json({
    success: true,
    data: enriched,
  });
});

const getDepartmentById = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Department ID');
  const dept = await Department.findById(req.params.id).lean();
  if (!dept) {
    throw new AppError('Department not found.', 404, 'DEPARTMENT_NOT_FOUND');
  }
  res.json({
    success: true,
    data: dept,
  });
});

const submitContactEnquiry = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    throw new AppError('Name, email, subject, and message are required.', 400, 'MISSING_FIELDS');
  }

  const enquiry = await ContactEnquiry.create({
    name: String(name).trim(),
    email: String(email).trim(),
    subject: String(subject).trim(),
    message: String(message).trim(),
  });

  res.status(201).json({
    success: true,
    message: 'Your enquiry has been recorded successfully.',
    data: enquiry,
  });
});

const listContactEnquiries = asyncHandler(async (_req, res) => {
  const enquiries = await ContactEnquiry.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({
    success: true,
    data: enquiries,
  });
});

module.exports = {
  getOverview,
  getDepartments,
  getDepartmentById,
  submitContactEnquiry,
  listContactEnquiries,
};
