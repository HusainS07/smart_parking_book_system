import { Redis } from '@upstash/redis';

let client;

function getRedisClient() {
  if (!client) {
    // Only create Redis client if we have the URL
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL is not configured');
    }

    // Parse Redis URL for Upstash format
    const url = new URL(process.env.REDIS_URL);
    const [username, password] = (url.username && url.password) 
      ? [url.username, url.password] 
      : ['default', url.username || url.password];

    client = new Redis({
      url: `${url.protocol}//${url.host}`,
      token: `${username}:${password}`,
    });
  }
  return client;
}

export default getRedisClient;