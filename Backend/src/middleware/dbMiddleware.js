const { ensureDatabaseReady } = require('../config/db');

async function dbMiddleware(_req, _res, next) {
  try {
    await ensureDatabaseReady();
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = dbMiddleware;
