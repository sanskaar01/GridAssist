import { prisma } from '../utils/prisma.js';
import { Device, DeviceStatus } from '@prisma/client';

export class DeviceRepository {
  async findAll(): Promise<Device[]> {
    return prisma.device.findMany();
  }

  async findById(id: string): Promise<Device | null> {
    return prisma.device.findUnique({ where: { id } });
  }

  async findByDeviceCode(deviceCode: string): Promise<Device | null> {
    return prisma.device.findUnique({
      where: { deviceCode },
      include: { pole: true },
    });
  }

  async findByPoleId(poleId: string): Promise<Device | null> {
    return prisma.device.findUnique({ where: { poleId } });
  }

  async updateStatus(
    id: string,
    status: DeviceStatus,
    lastSeen: Date,
    batteryLevel?: number
  ): Promise<Device> {
    return prisma.device.update({
      where: { id },
      data: {
        status,
        lastSeen,
        ...(batteryLevel !== undefined ? { batteryLevel } : {}),
      },
    });
  }
}
