import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public recommendation?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  logger.error({ err }, 'Error caught by global error handler');

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.recommendation);
  }

  return sendError(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    'INTERNAL_SERVER_ERROR',
    'An unexpected internal error occurred.'
  );
}
