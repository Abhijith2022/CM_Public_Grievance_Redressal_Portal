const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { ensureDatabaseReady } = require('./config/db');
const { isGeminiConfigured } = require('./services/aiService');
const { PROTOTYPE_DISCLAIMER } = require('./constants/keralaData');
const apiRoutes = require('./routes');
const { AppError } = require('./utils/errors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin || allowedOrigins.includes('*')) return true;
  const cleanOrigin = origin.replace(/\/+$/, '');
  return allowedOrigins.some((pattern) => {
    if (pattern === cleanOrigin) return true;
    if (pattern.includes('*')) {
      const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+');
      return new RegExp(`^${escaped}$`, 'i').test(cleanOrigin);
    }
    return false;
  });
}

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new AppError(`CORS origin "${origin}" is not allowed.`, 403, 'CORS_NOT_ALLOWED'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

function apiIndexPayload() {
  return {
    success: true,
    name: 'CM Kerala Public Grievance Redressal Portal API',
    status: 'running',
    disclaimer: PROTOTYPE_DISCLAIMER,
    architecture: {
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'node-express',
      database: 'MongoDB Atlas (Mongoose cached serverless connection)',
      aiAssistant: isGeminiConfigured()
        ? 'Google Gemini API + labelled fallback'
        : 'Labelled deterministic fallback (set GEMINI_API_KEY for Gemini LLM)',
      attachmentStorage: 'MongoDB Atlas binary collection (serverless-safe)',
    },
    endpoints: {
      health: 'GET /api/health',
      publicOverview: 'GET /api/public/overview',
      departments: 'GET /api/departments',
      contact: 'POST /api/contact',
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'GET /api/auth/me',
        'GET /api/auth/demo-accounts',
      ],
      aiAssistant: [
        'POST /api/ai/optimize-complaint',
        'POST /api/ai/analyze-grievance',
        'POST /api/ai/grievances/:id/analyze',
      ],
      grievances: [
        'GET /api/grievances/track/:referenceId',
        'POST /api/grievances',
        'GET /api/grievances/my',
        'GET /api/grievances/:id',
        'POST /api/grievances/:id/feedback',
        'POST /api/grievances/:id/reopen',
      ],
      attachments: [
        'POST /api/attachments/upload',
        'GET /api/attachments/:id',
      ],
      cmoAdmin: [
        'GET /api/cmo/stats',
        'GET /api/cmo/officers',
        'GET /api/cmo/grievances',
        'PATCH /api/cmo/grievances/:id/review',
        'POST /api/cmo/grievances/:id/assign',
        'PATCH /api/cmo/grievances/:id/escalate',
        'PATCH /api/cmo/grievances/:id/status',
      ],
      departmentOfficer: [
        'GET /api/officer/stats',
        'GET /api/officer/grievances',
        'PATCH /api/officer/grievances/:id/progress',
        'POST /api/officer/grievances/:id/action-report',
      ],
    },
  };
}

app.get('/', (_req, res) => {
  res.json(apiIndexPayload());
});

app.get('/api', (_req, res) => {
  res.json(apiIndexPayload());
});

app.get('/api/index', (_req, res) => {
  res.json(apiIndexPayload());
});

app.get('/api/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  let dbMessage = 'Not connected';

  try {
    await ensureDatabaseReady();
    dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'connecting';
    dbMessage = 'MongoDB Atlas connection healthy';
  } catch (err) {
    dbStatus = 'error';
    dbMessage = err.message;
  }

  const healthy = dbStatus === 'connected';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'MongoDB Atlas',
      status: dbStatus,
      message: dbMessage,
    },
    ai: {
      geminiConfigured: isGeminiConfigured(),
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      fallbackAvailable: true,
    },
  });
});

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
