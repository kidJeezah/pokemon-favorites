import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from '../lib/http-error.js';

type Source = 'body' | 'query' | 'params';

/**
 * Parses req[source] and writes the result to res.locals.validated[source].
 * Express 5: req.query is a read-only getter — never reassign req.*.
 */
export function validate(schema: ZodSchema, source: Source) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join('.') || source}: ${i.message}`)
        .join('; ');
      next(new HttpError(400, 'VALIDATION_ERROR', issues));
      return;
    }
    (res.locals.validated ??= {})[source] = result.data;
    next();
  };
}
