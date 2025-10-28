import { Redis } from '@upstash/redis';

// Singleton Redis client -- one Redis connection per application

let client;

function getRedisClient() {
  if (!client) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Redis configuration is missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
    }

    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Log connection status for debugging
    console.log('Redis client initialized');
  }
  return client;
}

export default getRedisClient;