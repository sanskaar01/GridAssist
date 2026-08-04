import { prisma } from '../utils/prisma.js';
import { DistributionTransformer } from '@prisma/client';

export class TransformerRepository {
  async findAll(): Promise<DistributionTransformer[]> {
    return prisma.distributionTransformer.findMany();
  }

  async findById(id: string): Promise<DistributionTransformer | null> {
    return prisma.distributionTransformer.findUnique({ where: { id } });
  }

  async findByCode(transformerCode: string): Promise<DistributionTransformer | null> {
    return prisma.distributionTransformer.findUnique({ where: { transformerCode } });
  }
}
