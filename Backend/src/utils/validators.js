const mongoose = require('mongoose');
const { AppError } = require('./errors');

function assertValidObjectId(id, label = 'Resource ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400, 'INVALID_ID');
  }
}

function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function sanitizeSearchRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  assertValidObjectId,
  parsePagination,
  sanitizeSearchRegex,
};
