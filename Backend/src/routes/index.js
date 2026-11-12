const express = require('express');
const rateLimit = require('express-rate-limit');
const dbMiddleware = require('../middleware/dbMiddleware');
const authRoutes = require('./authRoutes');
const publicRoutes = require('./publicRoutes');
const aiRoutes = require('./aiRoutes');
const attachmentRoutes = require('./attachmentRoutes');
const grievanceRoutes = require('./grievanceRoutes');
const cmoRoutes = require('./cmoRoutes');
const officerRoutes = require('./officerRoutes');

const router = express.Router();

const isTestEnv = process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  skip: () => isTestEnv,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many authentication requests. Please retry shortly.' },
  },
});

const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  skip: () => isTestEnv,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'AI_RATE_LIMITED', message: 'AI assistant request limit reached. Please wait a moment.' },
  },
});

router.use('/auth', authLimiter, dbMiddleware, authRoutes);
router.use('/', publicRoutes);
router.use('/ai', aiLimiter, dbMiddleware, aiRoutes);
router.use('/attachments', dbMiddleware, attachmentRoutes);
router.use('/grievances', dbMiddleware, grievanceRoutes);
router.use('/cmo', dbMiddleware, cmoRoutes);
router.use('/officer', dbMiddleware, officerRoutes);

module.exports = router;
