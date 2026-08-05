import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const test = async () => {
  const url = 'https://rootgrain.bd';
  const email = 'test.final.login.' + Date.now() + '@example.com';
  const password = 'Password123!';

  console.log('1. Registering user...');
  const regRes = await fetch(url + '/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      confirmPassword: password,
      name: 'Test User',
      acceptTerms: true
    })
  });
  const regData = await regRes.json();
  console.log('Register Response:', regData);

  console.log('2. Fetching verification token from DB...');
  // Find token directly in DB
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found in DB!');
  
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: { userId: user.id }
  });
  if (!tokenRecord) throw new Error('Token not found in DB!');

  console.log('3. Verifying email...');
  const verifyRes = await fetch(url + '/api/v1/auth/verify-email?token=' + tokenRecord.token);
  const verifyData = await verifyRes.json();
  console.log('Verify Response:', verifyData);

  console.log('4. Logging in via NextAuth...');
  // Get CSRF
  const csrfRes = await fetch(url + '/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const setCookie = csrfRes.headers.get('set-cookie');
  const cookies = [];
  if (setCookie) {
    const parts = setCookie.split(',');
    for (const p of parts) {
      if (p.includes('next-auth.csrf-token')) cookies.push(p.split(';')[0].trim());
    }
  }

  // Login
  const form = new URLSearchParams();
  form.append('csrfToken', csrfData.csrfToken);
  form.append('email', email);
  form.append('password', password);
  form.append('json', 'true');
  form.append('redirect', 'false');

  const loginRes = await fetch(url + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies.join('; ')
    },
    body: form.toString()
  });
  
  const loginData = await loginRes.json();
  console.log('Login Result:', loginData);
  
  const loginCookies = loginRes.headers.get('set-cookie');
  let sessionTokenFound = false;
  let rootgrainSessionFound = false;
  if (loginCookies) {
    const parts = loginCookies.split(',');
    for (const p of parts) {
      if (p.includes('next-auth.session-token') || p.includes('rootgrain_session')) {
        cookies.push(p.split(';')[0].trim());
        if (p.includes('next-auth.session-token')) sessionTokenFound = true;
        if (p.includes('rootgrain_session')) rootgrainSessionFound = true;
      }
    }
  }
  console.log('Got NextAuth Session Cookie?', sessionTokenFound);
  console.log('Got rootgrain_session Cookie?', rootgrainSessionFound);

  console.log('5. Testing /account page access...');
  const accountRes = await fetch(url + '/account', {
    headers: { 'Cookie': cookies.join('; ') },
    redirect: 'manual'
  });
  
  console.log('Account Page Status:', accountRes.status);
  if (accountRes.status === 200) {
      console.log('SUCCESS: Account page loaded correctly without redirecting to login!');
  } else {
      console.log('FAILED: Account page redirected to', accountRes.headers.get('location'));
  }
  
  await prisma.$disconnect();
};

test().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
