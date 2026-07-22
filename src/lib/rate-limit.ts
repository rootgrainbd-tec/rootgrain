import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitCategory = 
  | "credentials"
  | "admin_auth"
  | "register"
  | "verify"
  | "forgot_password"
  | "checkout"
  | "cart"
  | "wishlist"
  | "reviews"
  | "profile"
  | "address"
  | "orders"
  | "admin_api"
  | "product_search"
  | "product_detail"
  | "contact"
  | "cron_internal";

export type FailureStrategy = "FAIL_CLOSED" | "FAIL_OPEN" | "DEGRADED_MODE";

export interface RateLimitPolicy {
  limit: number;
  window: `${number} s` | `${number} m` | `${number} h`;
  failureStrategy: FailureStrategy;
}

export const RATE_LIMIT_POLICIES: Record<RateLimitCategory, RateLimitPolicy> = {
  credentials: { limit: 5, window: "15 m", failureStrategy: "FAIL_CLOSED" },
  admin_auth: { limit: 3, window: "30 m", failureStrategy: "FAIL_CLOSED" },
  register: { limit: 3, window: "1 h", failureStrategy: "FAIL_CLOSED" },
  verify: { limit: 5, window: "15 m", failureStrategy: "FAIL_CLOSED" },
  forgot_password: { limit: 3, window: "1 h", failureStrategy: "FAIL_CLOSED" },
  checkout: { limit: 5, window: "5 m", failureStrategy: "FAIL_CLOSED" },
  cart: { limit: 30, window: "1 m", failureStrategy: "DEGRADED_MODE" },
  wishlist: { limit: 10, window: "1 h", failureStrategy: "FAIL_OPEN" },
  reviews: { limit: 10, window: "1 h", failureStrategy: "FAIL_OPEN" },
  profile: { limit: 30, window: "1 m", failureStrategy: "FAIL_OPEN" },
  address: { limit: 30, window: "1 m", failureStrategy: "FAIL_OPEN" },
  orders: { limit: 30, window: "1 m", failureStrategy: "FAIL_OPEN" },
  admin_api: { limit: 300, window: "1 m", failureStrategy: "FAIL_CLOSED" },
  product_search: { limit: 200, window: "1 m", failureStrategy: "FAIL_OPEN" },
  product_detail: { limit: 300, window: "1 m", failureStrategy: "FAIL_OPEN" },
  contact: { limit: 3, window: "1 h", failureStrategy: "FAIL_OPEN" },
  cron_internal: { limit: 5, window: "1 m", failureStrategy: "FAIL_OPEN" }
};

let redisClient: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = Redis.fromEnv();
  }
} catch (e) {
  // Graceful degradation handled by applyFailureStrategy
}

let mockLimiter: ((key: string, category: RateLimitCategory) => Promise<any>) | null = null;
export const setMockRateLimiter = (mock: any) => mockLimiter = mock;

const cartFallbackMap = new Map<string, { count: number, resetAt: number }>();

export async function getAccountTargetKey(email: string): Promise<string> {
  const secret = process.env.RATE_LIMIT_SECRET || "fallback_test_secret_only";
  const normalized = email.trim().toLowerCase();
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    keyMaterial,
    encoder.encode(normalized)
  );
  
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function checkRateLimit(key: string, category: RateLimitCategory) {
  if (mockLimiter) return mockLimiter(key, category);
  
  const policy = RATE_LIMIT_POLICIES[category];
  
  if (!redisClient) {
    return applyFailureStrategy(key, category, policy);
  }

  try {
    const ratelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(policy.limit, policy.window as any),
      analytics: false
    });
    
    const res = await ratelimit.limit(`${category}:${key}`);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset
    };
  } catch (err) {
    console.error(`Rate limit Redis error for ${category}:`, err);
    return applyFailureStrategy(key, category, policy);
  }
}

function applyFailureStrategy(key: string, category: RateLimitCategory, policy: RateLimitPolicy) {
  if (policy.failureStrategy === "FAIL_CLOSED") {
    return { success: false, limit: policy.limit, remaining: 0, reset: Date.now() + 60000 };
  } else if (policy.failureStrategy === "FAIL_OPEN") {
    return { success: true, limit: policy.limit, remaining: 1, reset: Date.now() };
  } else if (policy.failureStrategy === "DEGRADED_MODE") {
    // Acknowledged serverless limitation: memory resets per edge isolate
    const now = Date.now();
    let record = cartFallbackMap.get(key);
    
    if (!record || now > record.resetAt) {
      const windowMs = parseWindow(policy.window);
      record = { count: 0, resetAt: now + windowMs };
    }
    
    record.count++;
    cartFallbackMap.set(key, record);
    
    if (record.count > policy.limit) {
      return { success: false, limit: policy.limit, remaining: 0, reset: record.resetAt };
    }
    return { success: true, limit: policy.limit, remaining: policy.limit - record.count, reset: record.resetAt };
  }
  
  return { success: true, limit: policy.limit, remaining: 1, reset: Date.now() };
}

function parseWindow(windowStr: string): number {
  const match = windowStr.match(/^(\d+)\s*(s|m|h)$/);
  if (!match) return 60000;
  const num = parseInt(match[1]);
  const unit = match[2];
  if (unit === 's') return num * 1000;
  if (unit === 'm') return num * 60 * 1000;
  if (unit === 'h') return num * 60 * 60 * 1000;
  return 60000;
}
