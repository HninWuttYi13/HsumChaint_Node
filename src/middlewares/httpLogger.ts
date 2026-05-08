import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

const SILENT_PATHS = ['/health', '/stats', '/api-docs', '/favicon.ico'];

function isNonEmptyRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length > 0
  );
}

export const httpLogger = pinoHttp({
  logger,
  // Skip noisy internal/health check routes
  autoLogging: {
    ignore: (req) => SILENT_PATHS.some((p) => req.url?.startsWith(p)),
  },
  // Clean one-liner log messages
  customSuccessMessage: (req, res) => `${req.method} ${req.url} → ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} → ${res.statusCode} | ${err.message}`,
  // Only include body/query when they are non-empty
  customProps: (req) => {
    const r = req as unknown as { body?: unknown; query?: unknown };
    return {
      ...(isNonEmptyRecord(r.body) ? { body: r.body } : {}),
      ...(isNonEmptyRecord(r.query) ? { query: r.query } : {}),
    };
  },
  serializers: {
    req: () => undefined, // Suppress default req object
    res: () => undefined, // Suppress default res object
  },
});
