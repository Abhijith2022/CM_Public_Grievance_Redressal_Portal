const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

if (!global._mongooseCache) {
  global._mongooseCache = {
    conn: null,
    promise: null,
    seedPromise: null,
    seeded: false,
  };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('your_mongodb_atlas_connection_string_here')) {
    const err = new Error(
      'MONGODB_URI is not configured. Please set a valid MongoDB Atlas (mongodb+srv://...) URI in environment variables.'
    );
    err.statusCode = 503;
    err.code = 'DB_NOT_CONFIGURED';
    throw err;
  }

  if (global._mongooseCache.conn && mongoose.connection.readyState === 1) {
    return global._mongooseCache.conn;
  }

  if (!global._mongooseCache.promise) {
    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 6000,
      socketTimeoutMS: 45000,
    };

    global._mongooseCache.promise = mongoose
      .connect(uri, options)
      .then((mongooseInstance) => mongooseInstance)
      .catch((err) => {
        global._mongooseCache.promise = null;
        throw err;
      });
  }

  global._mongooseCache.conn = await global._mongooseCache.promise;
  return global._mongooseCache.conn;
}

async function ensureDatabaseReady() {
  await connectDB();

  if (process.env.AUTO_SEED_DEMO === 'true' && !global._mongooseCache.seeded) {
    if (!global._mongooseCache.seedPromise) {
      const { seedIfEmpty } = require('../services/seedService');
      global._mongooseCache.seedPromise = seedIfEmpty()
        .then(() => {
          global._mongooseCache.seeded = true;
        })
        .catch((err) => {
          console.error('Auto-seed check failed:', err.message);
          global._mongooseCache.seedPromise = null;
        });
    }
    await global._mongooseCache.seedPromise;
  }
}

module.exports = {
  connectDB,
  ensureDatabaseReady,
};
