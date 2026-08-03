/**
 * Simple Feature Flags utility.
 * In a real application, this might wrap LaunchDarkly, PostHog, or Vercel Edge Config.
 */

const flags = {
  // If false, Google Sign-In is hidden/disabled
  ENABLE_GOOGLE_AUTH: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true',
  
  // If false, Registration is closed
  ENABLE_REGISTRATION: process.env.NEXT_PUBLIC_ENABLE_REGISTRATION !== 'false',
};

export const FeatureFlags = {
  ...flags,
  // Check if a flag is enabled
  isEnabled(flag: keyof typeof flags) {
    return flags[flag] === true;
  }
};
