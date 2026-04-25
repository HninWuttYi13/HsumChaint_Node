import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

//structure to parsed result
type RequestData = {
  body?: unknown;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  cookies?: Record<string, unknown>;
};

export const validator =
  <T extends ZodTypeAny>(schema: T) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //combine all request data into one object
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies ?? {},
      });

      // stored parsed result
      const data = parsed as RequestData;

      const update = <K extends keyof RequestData>(
        target: unknown, //original express object -> req.body, req.query
        source: RequestData[K] //validated data from zod
      ) => {
        if (source === undefined || typeof target !== 'object' || target === null) return;

        const t = target as Record<string, unknown>;

        // clear old keys
        for (const key of Object.keys(t)) {
          delete t[key];
        } //after that t become {}
        // assign new validated values
        Object.assign(t, source); //e.g {name: "abc"}
      };

      update(req.body, data.body);
      update(req.params, data.params);
      update(req.query, data.query);
      update(req.cookies, data.cookies);

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Error',
          detail: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      console.error('[Validator Error]:', error);

      return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        detail: null,
      });
    }
  };
