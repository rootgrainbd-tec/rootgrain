export const TTL_POLICY = {
  PERMISSION_CACHE_MS: 5 * 60 * 1000, // 5 minutes
  OWNERSHIP_CACHE_MS: 60 * 1000,      // 1 minute
  POLICY_CACHE_MS: 60 * 60 * 1000,    // 1 hour
  AUDIT_CACHE_MS: 0,                  // Audit is never cached
};
