import test from "node:test";
import assert from "node:assert";
import { execSync } from "child_process";

test('Sanity Environment Dataset Configuration', async (t) => {
  const runTest = (envArgs: Record<string, string>) => {
    return execSync(`npx tsx -e "import { dataset } from './sanity/env'; console.log('DATASET=' + dataset);"`, { 
      env: { ...process.env, ...envArgs },
      stdio: 'pipe',
      encoding: 'utf-8'
    });
  };

  await t.test('Production explicit resolves to production', () => {
    const output = runTest({ NEXT_PUBLIC_ENVIRONMENT_ID: "", NEXT_PUBLIC_SANITY_DATASET: "production" });
    assert.match(output, /DATASET=production/);
  });

  await t.test('Staging explicit resolves to staging', () => {
    const output = runTest({ NEXT_PUBLIC_ENVIRONMENT_ID: "staging", NEXT_PUBLIC_SANITY_DATASET: "staging" });
    assert.match(output, /DATASET=staging/);
  });

  await t.test('Staging missing dataset FAILS CLOSED', () => {
    assert.throws(() => {
      runTest({ NEXT_PUBLIC_ENVIRONMENT_ID: "staging", NEXT_PUBLIC_SANITY_DATASET: "" });
    }, /FATAL: Staging environment requires NEXT_PUBLIC_SANITY_DATASET="staging"/);
  });

  await t.test('dataset=staging without NEXT_PUBLIC_ENVIRONMENT_ID=staging FAILS CLOSED', () => {
    assert.throws(() => {
      runTest({ NEXT_PUBLIC_ENVIRONMENT_ID: "", NEXT_PUBLIC_SANITY_DATASET: "staging" });
    }, /FATAL: Dataset "staging" requires NEXT_PUBLIC_ENVIRONMENT_ID="staging"/);
  });

  await t.test('unknown dataset FAILS CLOSED', () => {
    assert.throws(() => {
      runTest({ NEXT_PUBLIC_ENVIRONMENT_ID: "", NEXT_PUBLIC_SANITY_DATASET: "invalid_dataset" });
    }, /FATAL: Unknown dataset configured/);
  });
});
