// middleware.js — Next.js Edge Middleware for login rate limiting
// Runs BEFORE next-auth processes the credentials login request.
// Uses Upstash Redis for distributed, serverless-safe rate limiting.

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Only initialize if credentials are configured
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const LOGIN_LIMIT = 10;           // max attempts
const LOGIN_WINDOW_SECONDS = 900; // 15 minutes

export async function middleware(req) {
  const { pathname, method } = req.nextUrl;

  // Only intercept POST to the credentials login callback
  if (
    pathname === '/api/auth/callback/credentials' &&
    req.method === 'POST'
  ) {
    if (redis) {
      // Get caller IP (Vercel sets x-forwarded-for)
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';

      const key = `login_ratelimit:${ip}`;

      try {
        const count = await redis.incr(key);
        if (count === 1) {
          // First attempt in this window — set expiry
          await redis.expire(key, LOGIN_WINDOW_SECONDS);
        }

        if (count > LOGIN_LIMIT) {
          return new NextResponse(
            JSON.stringify({
              error: 'Too many login attempts. Please wait 15 minutes before trying again.',
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(LOGIN_WINDOW_SECONDS),
              },
            }
          );
        }
      } catch (err) {
        // Fail-open: if Redis is down, allow the request through
        console.error('Login rate-limit middleware error:', err);
      }
    }
  }

  return NextResponse.next();
}

// Only run this middleware on the auth callback route
export const config = {
  matcher: ['/api/auth/callback/credentials'],
};
