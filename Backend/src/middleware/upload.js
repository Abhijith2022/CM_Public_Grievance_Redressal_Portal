const multer = require('multer');
const { AppError } = require('../utils/errors');

const MAX_SIZE_MB = Math.min(4, Math.max(1, Number(process.env.MAX_ATTACHMENT_SIZE_MB || 3)));
const MAX_FILE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: 3,
  },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new AppError(
          `Unsupported file type (${file.mimetype}). Allowed: JPG, PNG, WEBP, PDF, TXT, DOC, DOCX.`,
          400,
          'UNSUPPORTED_FILE_TYPE'
        )
      );
    }
    return cb(null, true);
  },
});

module.exports = {
  upload,
  MAX_SIZE_MB,
  MAX_FILE_BYTES,
  ALLOWED_MIME_TYPES,
};
