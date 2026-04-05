import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type z from 'zod';

export const validator =
  // use <T extends z.ZodTypeAny> to make the function "smart"
    <T extends z.ZodTypeAny>(schema: T) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // TypeScript now knows 'parsed' matches the schema T
        const parsed = await schema.parseAsync({
          body: req.body,
          params: req.params,
          query: req.query,
          cookies: req.cookies || {},
        });
        const data = parsed as {
          body?: unknown;
          params?: Request['params'];
          query?: Request['query'];
          cookies?: Request['cookies'];
        };
        if (data.body !== undefined) req.body = data.body;
        if (data.params !== undefined) req.params = data.params;
        if (data.query !== undefined) req.query = data.query;
        if (data.cookies !== undefined) req.cookies = data.cookies;
        return next();
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            success: false,
            message: 'Validation Error',
            error: error.issues.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Internal Server Error',
          error: null,
        });
      }
    };
