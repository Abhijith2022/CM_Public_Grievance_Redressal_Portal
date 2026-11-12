const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_unit_integration_tests_2026';
process.env.CORS_ORIGIN = 'http://localhost:5173';

const app = require('../src/app');
const vercelIndexApp = require('../api/index');
const vercelCatchAllApp = require('../api/[...all]');
const {
  analyzeGrievanceText,
  buildFallbackAnalysis,
  computeJaccardSimilarity,
} = require('../src/services/aiService');
const { signToken, authorizeRoles, extractToken } = require('../src/middleware/auth');
const { USER_ROLES } = require('../src/constants/keralaData');

test('GET /, GET /api, and GET /api/index return API directory and prototype disclaimer', async () => {
  const resRoot = await request(app).get('/');
  assert.equal(resRoot.status, 200);
  assert.equal(resRoot.body.success, true);
  assert.match(resRoot.body.disclaimer, /Recruitment Prototype/i);
  assert.ok(resRoot.body.endpoints);

  const resApi = await request(app).get('/api');
  assert.equal(resApi.status, 200);
  assert.equal(resApi.body.success, true);

  const resIndex = await request(app).get('/api/index');
  assert.equal(resIndex.status, 200);
  assert.equal(resIndex.body.success, true);
});

test('GET /api/health reports degraded 503 cleanly when MONGODB_URI is unset', async () => {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  const res = await request(app).get('/api/health');
  assert.equal(res.status, 503);
  assert.equal(res.body.success, false);
  assert.equal(res.body.database.provider, 'MongoDB Atlas');
  assert.equal(res.body.database.status, 'error');

  if (originalUri !== undefined) process.env.MONGODB_URI = originalUri;
});

test('AI fallback optimizer classifies domain, priority, highlights, and formatted text cleanly', async () => {
  delete process.env.GEMINI_API_KEY;

  const result = await analyzeGrievanceText({
    subject: 'Broken water pipe flooding street',
    description:
      'Main drinking water pipe broke yesterday near Ernakulam market road causing severe flooding and no drinking water for 40 houses urgent repair needed.',
    district: 'Ernakulam',
    category: 'Water Supply & Drainage',
  });

  assert.equal(result.source, 'fallback');
  assert.equal(result.isFallback, true);
  assert.equal(result.suggestedDepartment.code, 'WTR');
  assert.equal(result.suggestedPriority, 'High');
  assert.ok(result.optimizedDescription.includes('Respected Sir/Madam'));
  assert.ok(result.summary.length > 10);
  assert.ok(Array.isArray(result.highlights) && result.highlights.length >= 3);
  assert.match(result.disclaimer, /advisory only/i);
});

test('AI service invokes Gemini REST API when GEMINI_API_KEY is configured and parses structured JSON', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;

  process.env.GEMINI_API_KEY = 'fake_test_gemini_key_12345';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  optimizedSubject: 'Urgent Repair Needed for Damaged Bridge Approach in Kozhikode',
                  optimizedDescription:
                    'Respected Sir/Madam, The approach road to the Kozhikode bridge has developed dangerous cracks affecting daily commuters. Kindly inspect and repair urgently.',
                  summary:
                    'Citizen reports dangerous road cracks on a bridge approach in Kozhikode posing safety risks.',
                  highlights: [
                    'Core Issue: Cracks on bridge approach road',
                    'Location: Kozhikode',
                    'Urgency: High commuter safety hazard',
                  ],
                  suggestedDepartmentCode: 'PWD',
                  suggestedCategory: 'Roads & Public Infrastructure',
                  suggestedPriority: 'High',
                  reasoning: 'Bridge infrastructure damage poses an immediate public safety risk.',
                  duplicateMatches: [],
                }),
              },
            ],
          },
        },
      ],
    }),
  });

  try {
    const result = await analyzeGrievanceText({
      subject: 'bridge road crack',
      description: 'kozhikode bridge approach road cracked badly dangerous for buses',
      district: 'Kozhikode',
    });

    assert.equal(result.source, 'gemini');
    assert.equal(result.isFallback, false);
    assert.equal(result.suggestedDepartmentCode, 'PWD');
    assert.equal(result.suggestedPriority, 'High');
    assert.equal(result.highlights.length, 3);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});

test('Jaccard similarity and fallback duplicate detection identify overlapping complaints', () => {
  const score = computeJaccardSimilarity(
    'Severe potholes on Kaloor link road causing bike accidents',
    'Deep potholes on Kaloor road causing two-wheeler accidents'
  );
  assert.ok(score > 0.35);

  const fallback = buildFallbackAnalysis({
    subject: 'Potholes on Kaloor link road',
    description: 'Deep potholes on Kaloor link road causing two-wheeler skids',
    district: 'Ernakulam',
    category: 'Roads & Public Infrastructure',
    departments: [
      { code: 'PWD', name: 'Public Works & Infrastructure Department', categories: ['Roads & Public Infrastructure'] },
    ],
    candidates: [
      {
        _id: '507f1f77bcf86cd799439011',
        referenceId: 'KL-CMO-2026-1001',
        subject: 'Severe potholes on Kaloor link road',
        description: 'Deep potholes on Kaloor road causing two wheeler accidents',
        district: 'Ernakulam',
        category: 'Roads & Public Infrastructure',
        status: 'In Progress',
      },
    ],
  });

  assert.equal(fallback.potentialDuplicates.length, 1);
  assert.equal(fallback.potentialDuplicates[0].referenceId, 'KL-CMO-2026-1001');
});

test('Role-based access middleware permits matching role and rejects unauthorized roles', async () => {
  const citizenToken = signToken({
    _id: '507f1f77bcf86cd799439012',
    role: USER_ROLES.CITIZEN,
    email: 'citizen@demo.test',
  });
  assert.ok(citizenToken.split('.').length === 3);

  const cmoGuard = authorizeRoles(USER_ROLES.CMO_ADMIN);

  await new Promise((resolve) => {
    cmoGuard({ user: { role: USER_ROLES.CITIZEN } }, {}, (err) => {
      assert.ok(err);
      assert.equal(err.statusCode, 403);
      resolve();
    });
  });

  await new Promise((resolve) => {
    cmoGuard({ user: { role: USER_ROLES.CMO_ADMIN } }, {}, (err) => {
      assert.equal(err, undefined);
      resolve();
    });
  });
});

test('Unknown routes return clean 404 JSON error', async () => {
  const res = await request(app).get('/api/does-not-exist-xyz');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND');
});

test('Malformed JSON payload returns 400 INVALID_JSON instead of 500', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email": "bad-json');
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'INVALID_JSON');
});

test('Disallowed CORS origin returns 403 CORS_NOT_ALLOWED', async () => {
  const res = await request(app)
    .get('/api')
    .set('Origin', 'https://unauthorized.example.com');
  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'CORS_NOT_ALLOWED');
});

test('extractToken supports query token only for GET attachment downloads', () => {
  const attachGetReq = {
    method: 'GET',
    headers: {},
    baseUrl: '/api/attachments',
    path: '/65f000000000000000000001',
    query: { token: 'sample_jwt_token' },
  };
  assert.equal(extractToken(attachGetReq), 'sample_jwt_token');

  const attachPostReq = {
    method: 'POST',
    headers: {},
    baseUrl: '/api/attachments',
    path: '/upload',
    query: { token: 'sample_jwt_token' },
  };
  assert.equal(extractToken(attachPostReq), null);

  const nonAttachReq = {
    method: 'GET',
    headers: {},
    baseUrl: '/api/grievances',
    path: '/my',
    query: { token: 'sample_jwt_token' },
  };
  assert.equal(extractToken(nonAttachReq), null);
});

test('Vercel serverless entrypoints export Express app cleanly', () => {
  assert.equal(vercelIndexApp, app);
  assert.equal(vercelCatchAllApp, app);
});
