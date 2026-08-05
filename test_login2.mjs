const test = async () => {
  const url = 'https://rootgrain.bd';
  
  // 1. Get CSRF Token
  const csrfRes = await fetch(url + '/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const setCookie = csrfRes.headers.get('set-cookie');
  
  // parse the next-auth.csrf-token cookie
  const cookies = [];
  if (setCookie) {
    const parts = setCookie.split(',');
    for (const p of parts) {
      if (p.includes('next-auth.csrf-token')) {
        cookies.push(p.split(';')[0]);
      }
    }
  }
  
  // 2. Login
  const loginRes = await fetch(url + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies.join('; ')
    },
    body: JSON.stringify({
      csrfToken: csrfToken,
      email: 'test.verify.fixed.1785939365.81498@example.com',
      password: 'Password123!',
      redirect: false,
      json: true
    })
  });
  
  const loginText = await loginRes.text();
  console.log('Login Response Text:', loginText.substring(0, 200));
  
  const loginCookies = loginRes.headers.get('set-cookie');
  if (loginCookies) {
    const parts = loginCookies.split(',');
    for (const p of parts) {
      if (p.includes('next-auth.session-token') || p.includes('rootgrain_session')) {
        cookies.push(p.split(';')[0].trim());
      }
    }
  }
  
  console.log('Cookies after login:', cookies);

  // 3. Test Account Page
  const accountRes = await fetch(url + '/account', {
    headers: {
      'Cookie': cookies.join('; ')
    },
    redirect: 'manual'
  });
  
  console.log('Account Page Status:', accountRes.status);
  console.log('Account Page Redirected (manual):', accountRes.headers.get('location'));
  if (accountRes.status === 200) {
      console.log('SUCCESS: Account page loaded correctly without redirecting to login!');
  } else {
      console.log('FAILED: Account page redirected to', accountRes.headers.get('location'));
  }
};

test().catch(console.error);
