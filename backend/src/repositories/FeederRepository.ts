import { prisma } from '../utils/prisma.js';
import { Feeder } from '@prisma/client';

export class FeederRepository {
  async findAll(): Promise<Feeder[]> {
    return prisma.feeder.findMany();
  }

  async findById(id: string): Promise<Feeder | null> {
    return prisma.feeder.findUnique({ where: { id } });
  }

  async findByCode(feederCode: string): Promise<Feeder | null> {
    return prisma.feeder.findUnique({ where: { feederCode } });
  }
}
