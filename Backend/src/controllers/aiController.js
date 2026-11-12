const { Grievance } = require('../models');
const { USER_ROLES } = require('../constants/keralaData');
const { AppError, asyncHandler } = require('../utils/errors');
const { assertValidObjectId } = require('../utils/validators');
const { analyzeGrievanceText } = require('../services/aiService');

function validateAiPayload(body = {}) {
  const description = String(body.description || body.complaint || '').trim();
  const subject = String(body.subject || '').trim();
  const district = String(body.district || '').trim();
  const category = String(body.category || '').trim();

  if (description.length < 10) {
    throw new AppError(
      'Please enter at least 10 characters in complaint description for AI analysis.',
      400,
      'DESCRIPTION_TOO_SHORT'
    );
  }

  return { subject, description, district, category };
}

const optimizeComplaint = asyncHandler(async (req, res) => {
  const payload = validateAiPayload(req.body);
  const analysis = await analyzeGrievanceText(payload);

  res.json({
    success: true,
    message: analysis.isFallback
      ? 'Complaint analyzed using labelled fallback mode.'
      : 'Complaint optimized, summarized, and highlighted using Gemini AI.',
    data: analysis,
  });
});

const analyzeGrievance = asyncHandler(async (req, res) => {
  const payload = validateAiPayload(req.body);
  const analysis = await analyzeGrievanceText(payload);

  res.json({
    success: true,
    message: analysis.isFallback
      ? 'AI Grievance Assistant completed in labelled fallback mode.'
      : 'AI Grievance Assistant analysis completed via Gemini API.',
    data: analysis,
  });
});

const reanalyzeExistingGrievance = asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'Grievance ID');
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) {
    throw new AppError('Grievance not found.', 404, 'GRIEVANCE_NOT_FOUND');
  }

  const isOwner = grievance.citizen.equals(req.user._id);
  const isCmo = req.user.role === USER_ROLES.CMO_ADMIN;
  if (!isOwner && !isCmo) {
    throw new AppError('You are not authorized to analyze this grievance.', 403, 'FORBIDDEN');
  }

  const analysis = await analyzeGrievanceText({
    subject: grievance.subject,
    description: grievance.description,
    district: grievance.district,
    category: grievance.category,
    excludeGrievanceId: grievance._id,
  });

  grievance.aiAnalysis = {
    optimizedSubject: analysis.optimizedSubject,
    optimizedDescription: analysis.optimizedDescription,
    summary: analysis.summary,
    highlights: analysis.highlights,
    suggestedDepartmentCode: analysis.suggestedDepartmentCode,
    suggestedDepartmentName: analysis.suggestedDepartmentName,
    suggestedCategory: analysis.suggestedCategory,
    suggestedPriority: analysis.suggestedPriority,
    reasoning: analysis.reasoning,
    potentialDuplicates: analysis.potentialDuplicates,
    source: analysis.source,
    isFallback: analysis.isFallback,
    fallbackReason: analysis.fallbackReason,
    modelUsed: analysis.modelUsed,
    analyzedAt: analysis.analyzedAt,
    reviewedByCitizen: grievance.aiAnalysis?.reviewedByCitizen || false,
    reviewedByCmo: isCmo,
  };

  await grievance.save();

  res.json({
    success: true,
    message: 'Grievance AI analysis updated.',
    data: {
      grievanceId: grievance._id,
      referenceId: grievance.referenceId,
      aiAnalysis: grievance.aiAnalysis,
      disclaimer: analysis.disclaimer,
    },
  });
});

module.exports = {
  optimizeComplaint,
  analyzeGrievance,
  reanalyzeExistingGrievance,
};
