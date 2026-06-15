import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client for distributed rate limiting in serverless environments
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function ratelimit({ key, limit = 5, window_in_seconds = 600 }) {
  if (!redis) {
    // Fallback if Redis credentials are not configured in Vercel / local env
    console.warn('⚠️ Upstash Redis credentials not configured. Skipping rate limiting.');
    return true;
  }

  try {
    const redisKey = `ratelimit:${key}`;
    const currentCount = await redis.incr(redisKey);

    if (currentCount === 1) {
      // Set expiration only on the first request in the window
      await redis.expire(redisKey, window_in_seconds);
    }

    if (currentCount > limit) {
      return false;
    }

    return true;
  } catch (err) {
    console.error('Rate limiting error:', err);
    // Fail-open strategy to prevent blocking legitimate users if Redis has issues
    return true;
  }
}