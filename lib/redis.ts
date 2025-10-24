import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

declare global {
  var __redisClient: RedisClient | undefined;
  var __redisClientPromise: Promise<void> | undefined;
}

const globalForRedis = globalThis as unknown as {
  __redisClient?: RedisClient;
  __redisClientPromise?: Promise<void>;
};

const CONNECTION_ERROR_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'NR_CLOSED', 'ETIMEDOUT']);

function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const { code, message } = error as { code?: unknown; message?: unknown };

  if (typeof code === 'string' && CONNECTION_ERROR_CODES.has(code)) {
    return true;
  }

  if (typeof message === 'string') {
    for (const knownCode of CONNECTION_ERROR_CODES) {
      if (message.includes(knownCode)) {
        return true;
      }
    }
  }

  return false;
}

function resetCachedClient(client: RedisClient): void {
  if (globalForRedis.__redisClient === client) {
    globalForRedis.__redisClient = undefined;
  }
}

export function getRedisClient(): RedisClient {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error('REDIS_URL is not configured');
  }

  if (!globalForRedis.__redisClient) {
    const client = createClient({ url });

    client.on('error', (error) => {
      console.error('[redis] client error', error);
      if (isConnectionError(error)) {
        resetCachedClient(client);
        try {
          client.destroy();
        } catch (disconnectError) {
          console.error('[redis] destroy after connection error failed', disconnectError);
        }
      }
    });

    client.on('end', () => {
      resetCachedClient(client);
    });

    globalForRedis.__redisClient = client;
  }

  return globalForRedis.__redisClient;
}

export async function ensureRedisConnection(): Promise<RedisClient> {
  const client = getRedisClient();

  if (client.isReady) {
    return client;
  }

  if (!globalForRedis.__redisClientPromise) {
    globalForRedis.__redisClientPromise = (async () => {
      try {
        await client.connect();
      } catch (error) {
        resetCachedClient(client);
        try {
          client.destroy();
        } catch (disconnectError) {
          console.error('[redis] disconnect after failed connect error', disconnectError);
        }
        throw error;
      } finally {
        globalForRedis.__redisClientPromise = undefined;
      }
    })();
  }

  const connectPromise = globalForRedis.__redisClientPromise;

  await connectPromise;

  return globalForRedis.__redisClient ?? client;
}
