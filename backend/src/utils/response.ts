import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    version: string;
    processingTimeMs?: number;
  };
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    recommendation?: string;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = StatusCodes.OK,
  processingTimeMs?: number
): Response {
  const response: SuccessEnvelope<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
      ...(processingTimeMs !== undefined ? { processingTimeMs } : {}),
    },
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  recommendation?: string
): Response {
  const response: ErrorEnvelope = {
    success: false,
    error: {
      code,
      message,
      ...(recommendation ? { recommendation } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  };
  return res.status(statusCode).json(response);
}
