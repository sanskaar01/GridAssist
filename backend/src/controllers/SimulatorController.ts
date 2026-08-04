import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { simulatorRunner } from '../simulator/SimulationRunner.js';
import { sendSuccess } from '../utils/response.js';
import { z } from 'zod';

const RunScenarioSchema = z.object({
  scenarioId: z.string().min(1, 'Scenario ID is required'),
  speed: z.number().optional().default(1.0),
});

const StepRunSchema = z.object({
  scenarioId: z.string().min(1, 'Scenario ID is required'),
  stepIndex: z.number().int().min(0, 'Step index must be non-negative'),
});

export class SimulatorController {
  getScenarios = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scenarios = simulatorRunner.getScenarios();
      sendSuccess(res, scenarios, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = simulatorRunner.getStatus();
      sendSuccess(res, status, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  run = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scenarioId, speed } = RunScenarioSchema.parse(req.body);
      await simulatorRunner.runScenario(scenarioId, speed);
      const status = simulatorRunner.getStatus();
      sendSuccess(res, status, StatusCodes.ACCEPTED);
    } catch (error) {
      next(error);
    }
  };

  stepRun = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scenarioId, stepIndex } = StepRunSchema.parse(req.body);
      const result = await simulatorRunner.executeSingleStep(scenarioId, stepIndex);
      sendSuccess(res, result, StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  pause = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      simulatorRunner.pause();
      sendSuccess(res, simulatorRunner.getStatus(), StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  resume = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      simulatorRunner.resume();
      sendSuccess(res, simulatorRunner.getStatus(), StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  stop = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      simulatorRunner.stop();
      sendSuccess(res, simulatorRunner.getStatus(), StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  reset = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await simulatorRunner.resetGrid();
      sendSuccess(res, simulatorRunner.getStatus(), StatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };
}
