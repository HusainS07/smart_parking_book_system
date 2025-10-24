import Redis from 'ioredis';

let client;

function getRedisClient() {
  if (!client) {
    // Only create Redis client if we have the URL
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL is not configured');
    }

    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) {
          return null; // stop retrying after 3 attempts
        }
        return Math.min(times * 100, 3000);
      },
      connectTimeout: 5000,
      disconnectTimeout: 5000,
      commandTimeout: 5000,
      lazyConnect: true,
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    });
    
    client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
    
    client.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    client.on('ready', () => {
      console.log('✅ Redis is ready to accept commands');
    });

    client.on('reconnecting', () => {
      console.log('🔄 Reconnecting to Redis...');
    });
  }
  return client;
}

export default getRedisClient;