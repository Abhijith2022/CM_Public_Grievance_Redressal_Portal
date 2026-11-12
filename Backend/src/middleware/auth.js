const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError, asyncHandler } = require('../utils/errors');

function getJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new AppError(
      'JWT_SECRET environment variable is not configured securely on the server.',
      500,
      'JWT_NOT_CONFIGURED'
    );
  }
  return 'dev_only_fallback_secret_change_before_deploy_2026';
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const requestPath = `${req.baseUrl || ''}${req.path || ''}`;
  if (req.method === 'GET' && req.query && req.query.token && requestPath.includes('/attachments/')) {
    return String(req.query.token).trim();
  }
  return null;
}

const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (err) {
    throw new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(decoded.sub).populate('department', 'name code');
  if (!user || !user.isActive) {
    throw new AppError('User account not found or inactive.', 401, 'ACCOUNT_INACTIVE');
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.sub).populate('department', 'name code');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (_err) {
    req.user = null;
  }
  return next();
});

function authorizeRoles(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
          403,
          'FORBIDDEN'
        )
      );
    }
    return next();
  };
}

module.exports = {
  signToken,
  authenticate,
  optionalAuth,
  authorizeRoles,
  getJwtSecret,
  extractToken,
};
