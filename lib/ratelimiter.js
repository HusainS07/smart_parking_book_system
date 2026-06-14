// lib/ratelimiter.js
// In-memory rate limiter (no external DB dependency)
// For production at scale, consider using PostgreSQL or Redis-backed rate limiting.

const rateLimitStore = new Map();

export async function ratelimit({ key, limit = 5, window_in_seconds = 600 }) {
  const now = Date.now();
  const windowMs = window_in_seconds * 1000;

  const entry = rateLimitStore.get(key);

  if (!entry || (now - entry.startTime) > windowMs) {
    // First request in this window or window expired — reset
    rateLimitStore.set(key, { count: 1, startTime: now });
    return true;
  }

  entry.count += 1;

  if (entry.count > limit) {
    return false;
  }

  return true;
}