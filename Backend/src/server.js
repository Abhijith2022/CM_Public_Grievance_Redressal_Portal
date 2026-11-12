const app = require('./app');
const { ensureDatabaseReady } = require('./config/db');

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await ensureDatabaseReady();
    console.log('[DB] Connected to MongoDB Atlas successfully.');
  } catch (err) {
    console.warn(`[DB] Startup warning: ${err.message}`);
    console.warn('[DB] Server will start, and /api/health will report database configuration status.');
  }

  app.listen(PORT, () => {
    console.log(`[API] CM Kerala Grievance Portal API listening on http://localhost:${PORT}`);
  });
}

startServer();
