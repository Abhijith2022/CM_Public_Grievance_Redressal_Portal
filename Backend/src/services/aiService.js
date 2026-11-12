const { Department, Grievance } = require('../models');
const {
  GRIEVANCE_CATEGORIES,
  GRIEVANCE_PRIORITIES,
} = require('../constants/keralaData');

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const SECONDARY_GEMINI_MODEL = 'gemini-2.0-flash';

const FALLBACK_DEPARTMENTS = [
  { code: 'PWD', name: 'Public Works & Infrastructure Department', categories: ['Roads & Public Infrastructure'] },
  { code: 'HLTH', name: 'Health & Family Welfare Department', categories: ['Healthcare & Sanitation'] },
  { code: 'EDU', name: 'General Education Department', categories: ['Education & Schools'] },
  { code: 'WTR', name: 'Water Resources & Supply Authority', categories: ['Water Supply & Drainage'] },
  { code: 'PWR', name: 'State Electricity & Power Distribution', categories: ['Electricity & Power'] },
  { code: 'REV', name: 'Revenue & Disaster Management', categories: ['Revenue & Land Records'] },
  { code: 'TRN', name: 'Public Transport & Mobility', categories: ['Public Transport'] },
  { code: 'WEL', name: 'Social Justice & Citizen Welfare', categories: ['Social Welfare & Pensions', 'Public Safety & Services', 'Other'] },
];

const STOP_WORDS = new Set([
  'the', 'is', 'in', 'at', 'of', 'and', 'or', 'to', 'a', 'an', 'for', 'on', 'with',
  'by', 'from', 'as', 'this', 'that', 'it', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'not', 'but', 'we', 'our', 'my', 'very', 'there', 'here',
  'please', 'kindly', 'sir', 'madam', 'issue', 'problem', 'complaint', 'kerala',
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function computeJaccardSimilarity(textA, textB) {
  const setA = new Set(tokenize(textA));
  const setB = new Set(tokenize(textB));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function findLexicalDuplicateCandidates(input, candidates = []) {
  const inputCombined = `${input.subject || ''} ${input.description || ''}`;
  const matches = [];

  for (const cand of candidates) {
    const candCombined = `${cand.subject || ''} ${cand.description || ''}`;
    let score = computeJaccardSimilarity(inputCombined, candCombined);

    if (input.district && cand.district && input.district === cand.district) {
      score += 0.12;
    }
    if (input.category && cand.category && input.category === cand.category) {
      score += 0.08;
    }

    const clamped = Math.min(0.98, Number(score.toFixed(2)));
    if (clamped >= 0.28) {
      matches.push({
        grievanceId: cand._id,
        referenceId: cand.referenceId,
        subject: cand.subject,
        status: cand.status,
        district: cand.district,
        similarityScore: clamped,
        reason: `Lexical & metadata overlap (${Math.round(clamped * 100)}%) in ${cand.district}`,
      });
    }
  }

  return matches.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 3);
}

function buildFallbackAnalysis({ subject, description, district, category, departments, candidates }) {
  const combined = `${subject || ''} ${description || ''}`.toLowerCase();

  const rules = [
    {
      deptCode: 'HLTH',
      category: 'Healthcare & Sanitation',
      keywords: ['hospital', 'clinic', 'doctor', 'medicine', 'phc', 'ambulance', 'dengue', 'sanitation', 'garbage', 'waste', 'health', 'patient', 'medical'],
    },
    {
      deptCode: 'PWD',
      category: 'Roads & Public Infrastructure',
      keywords: ['road', 'pothole', 'bridge', 'highway', 'culvert', 'footpath', 'street', 'pwd', 'asphalt', 'collapse', 'building', 'construction'],
    },
    {
      deptCode: 'WTR',
      category: 'Water Supply & Drainage',
      keywords: ['water', 'pipe', 'pipeline', 'leak', 'drinking', 'tap', 'drainage', 'flood', 'sewage', 'canal', 'well', 'shortage'],
    },
    {
      deptCode: 'PWR',
      category: 'Electricity & Power',
      keywords: ['electricity', 'power', 'transformer', 'kseb', 'voltage', 'outage', 'blackout', 'electric', 'wire', 'pole', 'streetlight'],
    },
    {
      deptCode: 'EDU',
      category: 'Education & Schools',
      keywords: ['school', 'college', 'teacher', 'student', 'classroom', 'exam', 'scholarship', 'education', 'library', 'hostel'],
    },
    {
      deptCode: 'REV',
      category: 'Revenue & Land Records',
      keywords: ['land', 'patta', 'revenue', 'village office', 'survey', 'tax', 'deed', 'certificate', 'compensation', 'landslide'],
    },
    {
      deptCode: 'TRN',
      category: 'Public Transport',
      keywords: ['bus', 'ksrtc', 'transport', 'station', 'route', 'traffic', 'auto', 'ferry', 'boat', 'commute'],
    },
    {
      deptCode: 'WEL',
      category: 'Social Welfare & Pensions',
      keywords: ['pension', 'ration', 'welfare', 'senior citizen', 'widow', 'disability', 'subsidy', 'scheme', 'benefit'],
    },
  ];

  let bestRule = { deptCode: 'WEL', category: category || 'Other', score: 0 };
  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (combined.includes(kw)) score += 1;
    }
    if (score > bestRule.score) {
      bestRule = { ...rule, score };
    }
  }

  const matchedDept =
    departments.find((d) => d.code === bestRule.deptCode) ||
    departments[0] ||
    FALLBACK_DEPARTMENTS[0];

  const highUrgencyKeywords = [
    'emergency', 'urgent', 'danger', 'accident', 'collapse', 'life', 'critical',
    'hospital', 'ambulance', 'electrocuted', 'live wire', 'flood', 'contaminated',
    'severe', 'children', 'no water', 'outage', 'broken bridge', 'immediately',
  ];
  const lowUrgencyKeywords = ['inquiry', 'request', 'suggestion', 'minor', 'clarification', 'update'];

  let highHits = 0;
  for (const kw of highUrgencyKeywords) {
    if (combined.includes(kw)) highHits += 1;
  }
  let lowHits = 0;
  for (const kw of lowUrgencyKeywords) {
    if (combined.includes(kw)) lowHits += 1;
  }

  let suggestedPriority = 'Medium';
  if (highHits >= 1) suggestedPriority = 'High';
  else if (lowHits >= 1 && combined.length < 180) suggestedPriority = 'Low';

  const cleanText = String(description || '').replace(/\s+/g, ' ').trim();
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const cleanSubject = String(subject || '').trim() || (sentences[0] ? sentences[0].slice(0, 90) : 'Citizen Public Grievance');
  const capitalizedSubject = cleanSubject.charAt(0).toUpperCase() + cleanSubject.slice(1);

  const formattedBody = cleanText
    ? cleanText.charAt(0).toUpperCase() + cleanText.slice(1)
    : 'No description provided.';

  const optimizedDescription = [
    `Respected Sir/Madam,`,
    ``,
    `Subject: ${capitalizedSubject}${district ? ` (${district} District)` : ''}`,
    ``,
    `Grievance Details:`,
    formattedBody.endsWith('.') ? formattedBody : `${formattedBody}.`,
    ``,
    `Requested Action: Kindly review this matter under ${matchedDept.name} and take appropriate remedial action at the earliest.`,
  ].join('\n');

  const summary =
    sentences.slice(0, 2).join(' ') ||
    `${capitalizedSubject} reported${district ? ` in ${district} district` : ''}.`;

  const highlights = [
    `Core Issue: ${capitalizedSubject}`,
    district ? `Location: ${district} District` : 'Location: District specified in record',
    `Suggested Routing: ${matchedDept.name} (${bestRule.category})`,
    `Assessed Urgency: ${suggestedPriority} priority based on complaint indicators`,
  ];

  const potentialDuplicates = findLexicalDuplicateCandidates(
    { subject, description, district, category },
    candidates
  );

  return {
    optimizedSubject: capitalizedSubject,
    optimizedDescription,
    summary: summary.length > 320 ? `${summary.slice(0, 317)}...` : summary,
    highlights,
    suggestedDepartmentCode: matchedDept.code,
    suggestedDepartmentName: matchedDept.name,
    suggestedCategory: GRIEVANCE_CATEGORIES.includes(bestRule.category)
      ? bestRule.category
      : category || 'Other',
    suggestedPriority,
    reasoning: `Fallback classifier matched ${bestRule.score} domain keyword(s) for ${matchedDept.name} and assigned ${suggestedPriority} priority.`,
    potentialDuplicates,
  };
}

function isGeminiConfigured() {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  return Boolean(key && !key.includes('your_google_gemini_api_key_here'));
}

async function callGeminiModel({ model, apiKey, promptText }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const err = new Error(`Gemini API HTTP ${response.status}: ${errorBody.slice(0, 240)}`);
    err.httpStatus = response.status;
    throw err;
  }

  const json = await response.json();
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned an empty response payload.');
  }

  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

function buildGeminiPrompt({ subject, description, district, category, departments, candidates }) {
  const deptList = departments
    .map((d) => `- ${d.code}: ${d.name} (Categories: ${(d.categories || []).join(', ')})`)
    .join('\n');

  const candidateList = candidates.slice(0, 8).map((c) => ({
    referenceId: c.referenceId,
    district: c.district,
    category: c.category,
    status: c.status,
    subject: c.subject,
    snippet: String(c.description || '').slice(0, 140),
  }));

  return `You are the AI Grievance Assistant for a Chief Minister's Public Grievance Redressal Portal (Kerala recruitment prototype).
Your role is STRICTLY ADVISORY. Never claim official approval or fabricate names, dates, places, or statistics not present in the citizen's text.

Analyze the citizen complaint below and return ONLY valid JSON matching the exact schema.

Citizen Input:
- District: ${district || 'Not specified'}
- Selected Category: ${category || 'Not specified'}
- Subject: ${subject || 'Not provided'}
- Complaint Description: ${description}

Available Government Departments:
${deptList}

Allowed Categories:
${GRIEVANCE_CATEGORIES.join(', ')}

Allowed Priorities: Low, Medium, High
Priority Rubric:
- High: immediate safety hazard, medical/health crisis, collapsed bridge/road hazard, severe prolonged water/power outage, vulnerable groups in distress.
- Medium: recurring civic service delay, localized infrastructure/road damage, school/hospital administrative disruption.
- Low: general enquiry, minor maintenance request, routine feedback/clarification.

Recent Existing Grievances (for optional potential duplicate flagging ONLY if truly related):
${JSON.stringify(candidateList)}

Return JSON with this exact structure:
{
  "optimizedSubject": "Clear, factual, concise subject (max 120 chars)",
  "optimizedDescription": "Well-structured, polite, factual rewrite of the complaint preserving ALL facts, places, and details from the citizen's input without inventing anything.",
  "summary": "2-3 sentence executive summary written for the CMO administrator.",
  "highlights": ["3 to 5 concise bullet strings highlighting core issue, location, impact, and requested action"],
  "suggestedDepartmentCode": "Exact department code from Available Government Departments",
  "suggestedCategory": "Exact category from Allowed Categories",
  "suggestedPriority": "Low | Medium | High",
  "reasoning": "1-2 sentences explaining why this department and priority were recommended",
  "duplicateMatches": [
    {
      "referenceId": "KL-CMO-...",
      "similarityScore": 0.75,
      "reason": "Short reason why human reviewer should check for duplication"
    }
  ]
}`;
}

async function analyzeGrievanceText({
  subject = '',
  description = '',
  district = '',
  category = '',
  excludeGrievanceId = null,
}) {
  let departments = FALLBACK_DEPARTMENTS;
  let candidates = [];

  try {
    const dbDepts = await Department.find({ isActive: true })
      .select('code name categories shortDescription')
      .lean();
    if (dbDepts.length > 0) {
      departments = dbDepts;
    }

    const queryFilter = {};
    if (excludeGrievanceId) {
      queryFilter._id = { $ne: excludeGrievanceId };
    }
    if (district) {
      queryFilter.district = district;
    }

    candidates = await Grievance.find(queryFilter)
      .select('referenceId subject description category district status createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (candidates.length === 0 && district) {
      candidates = await Grievance.find(
        excludeGrievanceId ? { _id: { $ne: excludeGrievanceId } } : {}
      )
        .select('referenceId subject description category district status createdAt')
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();
    }
  } catch (_dbErr) {
    // Allow isolated unit testing without active DB connection
  }

  const disclaimer =
    'AI suggestions are advisory only and require human review by the citizen or CMO administrator. AI does not make official decisions.';

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const configuredModel = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();

  if (isGeminiConfigured()) {
    const promptText = buildGeminiPrompt({
      subject,
      description,
      district,
      category,
      departments,
      candidates,
    });

    let modelUsed = configuredModel;
    let parsed = null;
    let failureReason = '';

    try {
      parsed = await callGeminiModel({ model: configuredModel, apiKey, promptText });
    } catch (primaryErr) {
      if (primaryErr.httpStatus === 404 && configuredModel !== SECONDARY_GEMINI_MODEL) {
        try {
          modelUsed = SECONDARY_GEMINI_MODEL;
          parsed = await callGeminiModel({ model: SECONDARY_GEMINI_MODEL, apiKey, promptText });
        } catch (secondaryErr) {
          failureReason = secondaryErr.message;
        }
      } else {
        failureReason = primaryErr.message;
      }
    }

    if (parsed) {
      const matchedDept =
        departments.find(
          (d) => d.code === String(parsed.suggestedDepartmentCode || '').trim().toUpperCase()
        ) || departments[0];

      const validCategory = GRIEVANCE_CATEGORIES.includes(parsed.suggestedCategory)
        ? parsed.suggestedCategory
        : category || matchedDept.categories?.[0] || 'Other';

      const validPriority = GRIEVANCE_PRIORITIES.includes(parsed.suggestedPriority)
        ? parsed.suggestedPriority
        : 'Medium';

      const candidateByRef = new Map(candidates.map((c) => [c.referenceId, c]));
      const geminiDuplicates = Array.isArray(parsed.duplicateMatches)
        ? parsed.duplicateMatches
            .map((m) => {
              const found = candidateByRef.get(m.referenceId);
              if (!found) return null;
              return {
                grievanceId: found._id,
                referenceId: found.referenceId,
                subject: found.subject,
                status: found.status,
                district: found.district,
                similarityScore: Math.min(0.99, Math.max(0.3, Number(m.similarityScore) || 0.6)),
                reason: m.reason || 'Flagged by AI for human duplicate review',
              };
            })
            .filter(Boolean)
        : [];

      const lexicalDuplicates = findLexicalDuplicateCandidates(
        { subject, description, district, category },
        candidates
      );

      const mergedDuplicates = [...geminiDuplicates];
      for (const lex of lexicalDuplicates) {
        if (!mergedDuplicates.some((d) => d.referenceId === lex.referenceId)) {
          mergedDuplicates.push(lex);
        }
      }

      return {
        source: 'gemini',
        isFallback: false,
        fallbackReason: '',
        modelUsed,
        analyzedAt: new Date(),
        disclaimer,
        optimizedSubject: String(parsed.optimizedSubject || subject).trim(),
        optimizedDescription: String(parsed.optimizedDescription || description).trim(),
        summary: String(parsed.summary || '').trim(),
        highlights: Array.isArray(parsed.highlights)
          ? parsed.highlights.map((h) => String(h).trim()).filter(Boolean).slice(0, 6)
          : [],
        suggestedDepartment: {
          code: matchedDept.code,
          name: matchedDept.name,
        },
        suggestedDepartmentCode: matchedDept.code,
        suggestedDepartmentName: matchedDept.name,
        suggestedCategory: validCategory,
        suggestedPriority: validPriority,
        reasoning: String(parsed.reasoning || '').trim(),
        potentialDuplicates: mergedDuplicates.slice(0, 3),
      };
    }

    const fallback = buildFallbackAnalysis({
      subject,
      description,
      district,
      category,
      departments,
      candidates,
    });

    return {
      source: 'fallback',
      isFallback: true,
      fallbackReason: `Gemini API unavailable (${failureReason}); served by clearly labelled heuristic fallback.`,
      modelUsed: 'rule-based-heuristic-fallback-v1',
      analyzedAt: new Date(),
      disclaimer,
      suggestedDepartment: {
        code: fallback.suggestedDepartmentCode,
        name: fallback.suggestedDepartmentName,
      },
      ...fallback,
    };
  }

  const fallback = buildFallbackAnalysis({
    subject,
    description,
    district,
    category,
    departments,
    candidates,
  });

  return {
    source: 'fallback',
    isFallback: true,
    fallbackReason: 'GEMINI_API_KEY is not configured; served by clearly labelled deterministic fallback.',
    modelUsed: 'rule-based-heuristic-fallback-v1',
    analyzedAt: new Date(),
    disclaimer,
    suggestedDepartment: {
      code: fallback.suggestedDepartmentCode,
      name: fallback.suggestedDepartmentName,
    },
    ...fallback,
  };
}

module.exports = {
  analyzeGrievanceText,
  buildFallbackAnalysis,
  computeJaccardSimilarity,
  isGeminiConfigured,
};
