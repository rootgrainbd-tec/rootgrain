const test = async () => {
  const url = 'https://rootgrain.bd';
  const email = 'test.login.' + Date.now() + '@example.com';
  const password = 'Password123!';

  // 1. Register
  const regRes = await fetch(url + '/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      firstName: 'Test',
      lastName: 'User'
    })
  });
  const regData = await regRes.json();
  console.log('Register:', regData);

  // We cannot easily verify without DB access to the token!
  // Unless... can we hit the local DB?
  // Wait, is there a way to bypass email verification?
};

test().catch(console.error);
