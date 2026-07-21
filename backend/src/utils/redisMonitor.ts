import { redisClient } from '../config/redis.config';

export const monitorRedis = async () => {
  try {
    const info = await redisClient.info();
    const usedMemory = parseInt(info.match(/used_memory_human:(\S+)/)?.[1] || '0');
    console.log(`📊 Redis Memory: ${usedMemory} MB`);
  } catch (err) {
    console.error('Redis monitoring error:', err);
  }
};

setInterval(monitorRedis, 5 * 60 * 1000);
monitorRedis();