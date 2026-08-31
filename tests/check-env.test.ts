import { it } from 'vitest';
it('prints env', () => {
  console.log("VITEST DATABASE_URL:", process.env.DATABASE_URL);
});
