import Redis from 'ioredis';

function buildRedisUrl() {
  const baseUrl = process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl) throw new Error('Missing UPSTASH_REDIS_URL');

  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    throw new Error(
      'UPSTASH_REDIS_URL must be a Redis connection string (redis:// or rediss://), not the Upstash REST URL (https://...). Copy the “Redis URL” from Upstash console.'
    );
  }

  try {
    const u = new URL(baseUrl);

    if (!u.password && token) {
      u.password = token;
    }

    return u.toString();
  } catch {
    if (token && !baseUrl.includes('@') && baseUrl.startsWith('redis')) {
      return baseUrl.replace('://', `://:${encodeURIComponent(token)}@`);
    }
    return baseUrl;
  }
}

export const redis = new Redis(buildRedisUrl(), {
  maxRetriesPerRequest: 2,
  connectTimeout: 10_000,
  enableReadyCheck: true,
});
