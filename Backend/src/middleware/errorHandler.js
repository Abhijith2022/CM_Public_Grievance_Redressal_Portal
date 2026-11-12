const multer = require('multer');
const { AppError } = require('../utils/errors');

function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
}

function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || err.status || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected server error occurred.';
  let details = err.details || null;

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON payload in request body.';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload exceeds maximum allowed size.';
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds the maximum allowed size (Vercel limit friendly max 3 MB per file).';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded at once (maximum 3 files per request).';
    }
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = details.map((d) => d.message).join('; ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_IDENTIFIER';
    message = `Invalid identifier format for field "${err.path}".`;
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    const duplicateFields = Object.keys(err.keyPattern || {});
    message = `Duplicate value for ${duplicateFields.join(', ') || 'unique field'}.`;
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[API Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
