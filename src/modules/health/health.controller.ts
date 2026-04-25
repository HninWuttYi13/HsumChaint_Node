import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/utils/logger';
import { successResponse } from '@/utils/response';

export const getHealth = async (_req: Request, res: Response) => {
  let dbStatus = 'down';
  let redisStatus = 'down';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'up';
  } catch (error) {
    logger.error(error, 'Database health check failed');
    dbStatus = 'down';
  }

  try {
    const ping = await redis.ping();
    if (ping === 'PONG') {
      redisStatus = 'up';
    }
  } catch (error) {
    logger.error(error, 'Redis health check failed');
    redisStatus = 'down';
  }

  const isOk = dbStatus === 'up' && redisStatus === 'up';

  return successResponse(
    res,
    {
      status: isOk ? 'ok' : 'degraded',
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date(),
    },
    isOk ? 'Health check successful' : 'Health check degraded'
  );
};
