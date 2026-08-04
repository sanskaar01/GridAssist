import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TelemetryInputSchema } from '../validators/TelemetryValidator.js';
import { TelemetryService } from '../services/TelemetryService.js';
import { sendSuccess } from '../utils/response.js';

export class TelemetryController {
  constructor(private telemetryService = new TelemetryService()) {}

  ingest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    try {
      // Validate & Pre-transform request payload
      const validatedInput = TelemetryInputSchema.parse(req.body);

      // Delegate to TelemetryService
      const result = await this.telemetryService.ingestTelemetry(validatedInput);

      // Return HTTP 202 Accepted envelope
      sendSuccess(res, result, StatusCodes.ACCEPTED, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  };
}
