const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { seedDemoData, DEMO_CREDENTIALS } = require('../services/seedService');

async function runSeed() {
  const force = process.argv.includes('--force');

  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB Atlas.');

    const result = await seedDemoData({ force });
    if (result.skipped) {
      console.log(`[Seed] ${result.reason} (Pass --force to reset and re-seed demo data)`);
    } else {
      console.log('[Seed] Fictional sample departments, users, grievances, history, and enquiries seeded.');
      console.log('[Seed] Demo Login Accounts:');
      for (const acc of DEMO_CREDENTIALS) {
        console.log(`  - [${acc.role}] ${acc.email} / ${acc.password}`);
      }
    }
  } catch (err) {
    console.error('[Seed] Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

runSeed();
