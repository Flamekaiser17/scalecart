import { Redis } from "ioredis";

// Singleton Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

// Helper: Get cached value (returns parsed object or null)
export const getCache = async (key: string): Promise<any | null> => {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data);
};

// Helper: Set cache with TTL in seconds
export const setCache = async (
  key: string,
  data: any,
  ttlSeconds: number = 3600
): Promise<void> => {
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
};

// Helper: Delete a cache key (cache invalidation)
export const deleteCache = async (key: string): Promise<void> => {
  await redis.del(key);
};

// Helper: Delete all keys matching a pattern (e.g. "product:*")
export const deleteCachePattern = async (pattern: string): Promise<void> => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

export default redis;
