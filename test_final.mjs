import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const test = async () => {
  const url = 'https://rootgrain.bd';
  const email = 'final.test2.' + Date.now() + '@example.com';
  const password = 'Password123!';

  console.log('1. Registering new user...');
  const regRes = await fetch(url + '/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirmPassword: password, name: 'Final Test 2', acceptTerms: true })
  });
  console.log('Reg status:', regRes.status);
  
  console.log('2. Verifying user...');
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const tokenRecord = await prisma.verificationToken.findFirst({ where: { userId: user.id } });
    if (tokenRecord) {
      const verifyRes = await fetch(url + '/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenRecord.token })
      });
      console.log('Verify status:', verifyRes.status);
    }
  }

  console.log('3. Logging in...');
  const csrfRes = await fetch(url + '/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const csrfCookie = csrfRes.headers.get('set-cookie').split(';')[0];
  
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
      'Cookie': csrfCookie
    },
    body: form.toString()
  });
  console.log('Login status:', loginRes.status);
  const loginCookies = loginRes.headers.get('set-cookie');
  let sessionToken = '';
  if (loginCookies) {
    for (const p of loginCookies.split(',')) {
      if (p.includes('next-auth.session-token')) {
        sessionToken = p.split(';')[0].trim();
      }
    }
  }

  console.log('4. Testing /account page access...');
  const accountRes = await fetch(url + '/account', {
    headers: { 'Cookie': sessionToken },
    redirect: 'manual'
  });
  console.log('Account Page Status:', accountRes.status);
  if (accountRes.status === 200) {
      console.log('SUCCESS: Middleware allowed NextAuth session token!');
  } else {
      console.log('FAILED: Redirected to', accountRes.headers.get('location'));
  }
  
  await prisma.$disconnect();
};
test().catch(console.error);
