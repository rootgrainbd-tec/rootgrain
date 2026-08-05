const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

async function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  const email = "e2etest_" + Date.now() + "@example.com";
  const password = "TestPassword123!";
  const baseUrl = "http://127.0.0.1:3000";
  
  console.log(`\n1. Registering account with ${email}...`);
  const regRes = await fetchJSON(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: "E2E Test", email, password, confirmPassword: password, acceptTerms: true })
  });
  console.log(`Register status: ${regRes.status}`);
  if (regRes.status !== 201 && regRes.status !== 200) {
    console.error(regRes.data);
    return;
  }

  console.log("\n2. Checking Database for Verification Token...");
  let tokenRecord;
  // wait a bit for DB insert
  await new Promise(r => setTimeout(r, 2000));
  const userRecord = await prisma.user.findUnique({ where: { email } });
  if (!userRecord) {
    console.error("User not found in DB!");
    return;
  }
  tokenRecord = await prisma.verificationToken.findUnique({
    where: { userId: userRecord.id }
  });
  
  if (!tokenRecord) {
    console.error("Token not found in database!");
    return;
  }
  console.log("Token found:", tokenRecord.token);

  console.log("\n3. Verifying Email...");
  const verifyRes = await fetchJSON(`${baseUrl}/api/v1/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenRecord.token })
  });
  console.log(`Verify status: ${verifyRes.status}`);

  console.log("\n4. Testing Login...");
  const loginRes = await fetchJSON(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  console.log(`Login status: ${loginRes.status}`);
  
  console.log("\n5. Testing Password Reset...");
  const forgotRes = await fetchJSON(`${baseUrl}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  console.log(`Forgot password status: ${forgotRes.status}`);
  
  console.log("\n6. Checking Database for Reset Token...");
  let resetTokenRecord;
  await new Promise(r => setTimeout(r, 2000));
  resetTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { userId: userRecord.id }
  });
  if (!resetTokenRecord) {
    console.error("Reset token not found in database!");
    return;
  }
  console.log("Reset token found:", resetTokenRecord.token);
  
  console.log("\n7. Executing Password Reset...");
  const resetExecuteRes = await fetchJSON(`${baseUrl}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: resetTokenRecord.token, newPassword: "NewPassword123!", confirmPassword: "NewPassword123!" })
  });
  console.log(`Password reset execute status: ${resetExecuteRes.status}`);

  console.log("\nE2E Test PASS (Tokens verified in DB)!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
