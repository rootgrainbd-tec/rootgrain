const test = async () => {
  const url = 'https://rootgrain.bd';
  
  // 1. Get CSRF Token
  const csrfRes = await fetch(url + '/api/auth/csrf');
  console.log('CSRF Status:', csrfRes.status);
  
  const text = await csrfRes.text();
  let csrfData;
  try {
    csrfData = JSON.parse(text);
  } catch (e) {
    console.log('CSRF failed to parse:', text.substring(0, 100));
    return;
  }
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
  const form = new URLSearchParams();
  form.append('csrfToken', csrfToken);
  form.append('email', 'test.verify.fixed.1785939365.81498@example.com');
  form.append('password', 'Password123!');
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
  console.log('Login Response:', loginData);
  
  const loginCookies = loginRes.headers.get('set-cookie');
  if (loginCookies) {
    const parts = loginCookies.split(',');
    for (const p of parts) {
      if (p.includes('next-auth.session-token') || p.includes('rootgrain_session')) {
        cookies.push(p.split(';')[0].trim());
      }
    }
  }

  // 3. Test Account Page
  const accountRes = await fetch(url + '/account', {
    headers: {
      'Cookie': cookies.join('; ')
    }
  });
  
  console.log('Account Page Status:', accountRes.status);
  console.log('Account Page Redirected:', accountRes.redirected);
  if (accountRes.status === 200) {
      console.log('SUCCESS: Account page loaded correctly without redirecting to login!');
  }
  
  // 4. Logout
  const logoutRes = await fetch(url + '/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      'Cookie': cookies.join('; ')
    }
  });
  console.log('Logout API status:', logoutRes.status);
  
  const accountResAfterLogout = await fetch(url + '/account', {
    headers: {
      'Cookie': cookies.join('; ')
    },
    redirect: 'manual'
  });
  console.log('Account Page After Logout Status:', accountResAfterLogout.status); // should be 302
};

test().catch(console.error);
