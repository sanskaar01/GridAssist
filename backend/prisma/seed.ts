import { PrismaClient, TopologySource, PoleStateStatus, DeviceStatus, OutageScope } from '@prisma/client';

const prisma = new PrismaClient();

// Deterministic Pseudo-Random Number Generator (Mulberry32)
class DeterministicPRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed;
  }

  nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  booleanChance(probability: number): boolean {
    return this.nextFloat() < probability;
  }
}

async function main() {
  console.log('🌱 Starting deterministic Karnataka LT Network seed generation...');

  const prng = new DeterministicPRNG(2026);

  // Clean existing tables in reverse dependency order
  await prisma.ticket.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.telemetry.deleteMany();
  await prisma.device.deleteMany();
  await prisma.poleState.deleteMany();
  await prisma.inferredEdge.deleteMany();
  await prisma.pole.deleteMany();
  await prisma.distributionTransformer.deleteMany();
  await prisma.feeder.deleteMany();
  await prisma.scheduledOutage.deleteMany();
  await prisma.crew.deleteMany();

  console.log('🧹 Existing database tables cleared.');

  // 1. Seed Crews
  await prisma.crew.createMany({
    data: [
      { code: 'CREW-BLR-01', name: 'Indiranagar Quick Response Team A', status: 'AVAILABLE', contactNumber: '+91-9876543210' },
      { code: 'CREW-BLR-02', name: 'Koramangala Emergency Repair Unit', status: 'AVAILABLE', contactNumber: '+91-9876543211' },
      { code: 'CREW-BLR-03', name: 'MG Road Lineman Squad 3', status: 'AVAILABLE', contactNumber: '+91-9876543212' },
    ],
  });

  // 2. Seed Scheduled Outage
  await prisma.scheduledOutage.create({
    data: {
      scope: OutageScope.FEEDER,
      targetId: 'F-07-03',
      startTime: new Date('2026-08-05T10:00:00Z'),
      endTime: new Date('2026-08-05T12:00:00Z'),
      reason: 'Scheduled Jumper Replacement & Line Trimming',
    },
  });

  // 3. Seed Feeders
  const feedersData = [
    { feederCode: 'F-07-01', name: 'HAL 1st Stage Feeder', substation: '66/11kV Indiranagar Substation', status: 'ACTIVE' },
    { feederCode: 'F-07-03', name: 'Koramangala 4th Block Feeder', substation: '66/11kV Koramangala Substation', status: 'ACTIVE' },
  ];

  const createdFeeders = [];
  for (const f of feedersData) {
    const feeder = await prisma.feeder.create({ data: f });
    createdFeeders.push(feeder);
  }

  // 4. Seed Distribution Transformers (10 DTs)
  // Exactly 60% missing topology (6 DTs), 40% surveyed topology (4 DTs)
  const dtConfigs = [
    { code: 'D-0101', ward: 'W-084', lat: 12.9716, lon: 77.6412, missingTopology: false },
    { code: 'D-0102', ward: 'W-084', lat: 12.9725, lon: 77.6425, missingTopology: false },
    { code: 'D-0103', ward: 'W-084', lat: 12.9734, lon: 77.6438, missingTopology: false },
    { code: 'D-0104', ward: 'W-085', lat: 12.9352, lon: 77.6245, missingTopology: false },
    { code: 'D-0105', ward: 'W-085', lat: 12.9361, lon: 77.6258, missingTopology: true },
    { code: 'D-0106', ward: 'W-085', lat: 12.9370, lon: 77.6271, missingTopology: true },
    { code: 'D-0107', ward: 'W-085', lat: 12.9379, lon: 77.6284, missingTopology: true },
    { code: 'D-0108', ward: 'W-086', lat: 12.9781, lon: 77.6012, missingTopology: true },
    { code: 'D-0109', ward: 'W-086', lat: 12.9790, lon: 77.6025, missingTopology: true },
    { code: 'D-0110', ward: 'W-086', lat: 12.9799, lon: 77.6038, missingTopology: true },
  ];

  let totalPolesCount = 0;
  let totalDevicesCount = 0;
  let polesWithoutDeviceCount = 0;
  let missingTopologyDtCount = 0;

  for (let i = 0; i < dtConfigs.length; i++) {
    const config = dtConfigs[i];
    const feeder = createdFeeders[i < 5 ? 0 : 1];

    const dt = await prisma.distributionTransformer.create({
      data: {
        transformerCode: config.code,
        feederId: feeder.id,
        latitude: config.lat,
        longitude: config.lon,
        ward: config.ward,
        status: 'ACTIVE',
      },
    });

    if (config.missingTopology) {
      missingTopologyDtCount++;
    }

    // Generate 35 poles per DT (Total 350 poles)
    const dtPolesCount = 35;
    let prevPoleId: string | null = null;
    const createdDtPoles = [];

    for (let seq = 1; seq <= dtPolesCount; seq++) {
      totalPolesCount++;

      // ~9% without IoT device
      const isDeviceFitted = !prng.booleanChance(0.09);
      if (!isDeviceFitted) {
        polesWithoutDeviceCount++;
      } else {
        totalDevicesCount++;
      }

      // ~3% missing pincode
      const isMissingPincode = prng.booleanChance(0.03);
      const pincode = isMissingPincode ? null : '560078';

      // GPS offset stepping outward from DT
      const latOffset = (seq * 0.00015) + (prng.nextFloat() * 0.00005);
      const lonOffset = (seq * 0.00012) + (prng.nextFloat() * 0.00005);

      const poleData = {
        transformerId: dt.id,
        parentPoleId: config.missingTopology ? null : prevPoleId,
        sequenceNumber: config.missingTopology ? null : seq,
        latitude: config.lat + latOffset,
        longitude: config.lon + lonOffset,
        ward: config.ward,
        pincode,
        poleType: seq % 5 === 0 ? 'LT-8m-Steel' : 'LT-9m-PCC',
        topologySource: config.missingTopology ? TopologySource.INFERRED : TopologySource.SURVEYED,
        currentState: PoleStateStatus.LIVE,
        hasDevice: isDeviceFitted,
      };

      const pole = await prisma.pole.create({ data: poleData });
      createdDtPoles.push(pole);
      prevPoleId = pole.id;

      // Create PoleState record (1-to-1)
      await prisma.poleState.create({
        data: {
          poleId: pole.id,
          currentState: PoleStateStatus.LIVE,
          lastEvent: null,
          lastEventTimestamp: null,
        },
      });

      // Create Device record if device is fitted
      if (isDeviceFitted) {
        const deviceCode = `KSPDB-${config.ward}-${config.code}-P${seq.toString().padStart(4, '0')}`;
        const isLegacyFirmware = prng.booleanChance(0.08); // ~8% on firmware 1.2

        await prisma.device.create({
          data: {
            poleId: pole.id,
            deviceCode,
            firmwareVersion: isLegacyFirmware ? '1.2.4' : '1.4.2',
            batteryLevel: prng.nextInt(3200, 3600),
            lastSeen: new Date(),
            status: DeviceStatus.ACTIVE,
          },
        });
      }
    }

    // For missing topology DTs, construct InferredEdges
    if (config.missingTopology) {
      for (let j = 0; j < createdDtPoles.length - 1; j++) {
        await prisma.inferredEdge.create({
          data: {
            transformerId: dt.id,
            parentPoleId: createdDtPoles[j].id,
            childPoleId: createdDtPoles[j + 1].id,
            confidence: 'MEDIUM',
          },
        });
      }
    }
  }

  console.log('✅ Deterministic Seed Generation Complete!');
  console.log(`📊 Statistics:
  - Feeders: ${createdFeeders.length}
  - Distribution Transformers: ${dtConfigs.length}
  - Missing Topology DTs: ${missingTopologyDtCount} / ${dtConfigs.length} (${((missingTopologyDtCount / dtConfigs.length) * 100).toFixed(0)}%)
  - Total Poles: ${totalPolesCount}
  - Devices Fitted: ${totalDevicesCount}
  - Poles Without Device: ${polesWithoutDeviceCount} / ${totalPolesCount} (${((polesWithoutDeviceCount / totalPolesCount) * 100).toFixed(1)}%)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
