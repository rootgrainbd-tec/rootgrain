import { beforeAll } from 'vitest';

beforeAll(() => {
  const dbUrl = process.env.DATABASE_URL;

  // Phase 20 - DATABASE LEAK TEST
  if (!dbUrl) {
    throw new Error('UNSAFE TEST DATABASE: DATABASE_URL is missing. Failsafe activated to prevent fallback to remote embedded URL.');
  }

  // Phase 8 - PRODUCTION SAFETY / Phase 21 - UNSAFE DATABASE TEST
  if (dbUrl.includes('supabase.co') || dbUrl.includes('pooler.supabase.com')) {
    throw new Error(`UNSAFE TEST DATABASE: Detected remote/Supabase connection string. Aborting test execution.`);
  }

  // Phase 7 / 34 - DATABASE TARGET VERIFICATION
  const isLocalHost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  if (!isLocalHost) {
    throw new Error(`UNSAFE TEST DATABASE: Expected local test database, but detected non-local host. Aborting test execution.`);
  }

  // Phase 12 - TEST DATABASE IDENTITY CHECK
  const expectedDbName = 'rootgrain_local';
  if (!dbUrl.includes(expectedDbName)) {
    throw new Error(`UNSAFE TEST DATABASE: Expected database name '${expectedDbName}' not found in connection string. Aborting test execution.`);
  }

  // Sanitized output for Phase 34
  console.log(`[TEST SETUP] DB Safety Guard Passed: Target is local database '${expectedDbName}'`);
});
