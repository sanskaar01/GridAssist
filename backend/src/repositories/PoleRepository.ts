import { prisma } from '../utils/prisma.js';
import { Pole } from '@prisma/client';

export class PoleRepository {
  async findAll(): Promise<Pole[]> {
    return prisma.pole.findMany();
  }

  async findById(id: string): Promise<Pole | null> {
    return prisma.pole.findUnique({
      where: { id },
      include: {
        poleState: true,
        device: true,
      },
    });
  }

  async findByTransformerId(transformerId: string): Promise<Pole[]> {
    return prisma.pole.findMany({
      where: { transformerId },
      include: {
        poleState: true,
        device: true,
      },
    });
  }
}
