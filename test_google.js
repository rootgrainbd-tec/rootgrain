require('ts-node/register');
const { authOptions } = require('./src/lib/auth.ts');
const googleProvider = authOptions.providers.find(p => p.id === 'google');
const profileResult = googleProvider.profile({
  sub: '12345',
  name: 'Test',
  email: 'test@example.com',
  picture: 'pic',
  email_verified: true
});
console.log("Profile Result:", profileResult);
