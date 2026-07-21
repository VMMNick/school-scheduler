import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis.config';

export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (command: string, ...args: any[]) => 
      redisClient.call(command, ...args) as any,
  }),
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (command: string, ...args: any[]) => 
      redisClient.call(command, ...args) as any,
  }),
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});