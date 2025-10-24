import Redis from 'ioredis';

let client;

function getRedisClient() {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null, // Disable max retries
      enableOfflineQueue: true,
      reconnectOnError: true,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 10000); // More generous retry timing
        return delay;
      },
      connectTimeout: 20000, // Longer timeout
      disconnectTimeout: 20000,
      commandTimeout: 10000,
      lazyConnect: true, // Only connect when needed
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
      if (err.code === 'ECONNREFUSED') {
        console.warn('Please ensure Redis is running. You can:');
        console.warn('1. Use Docker: docker run --name redis -p 6379:6379 -d redis');
        console.warn('2. Use WSL2: Install Redis on WSL2');
        console.warn('3. Install Redis for Windows');
      }
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