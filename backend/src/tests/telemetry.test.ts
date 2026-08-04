import { TelemetryInputSchema, ProcessedTelemetryInput } from '../validators/TelemetryValidator.js';
import { TelemetryService } from '../services/TelemetryService.js';
import { DeviceStatus, PoleStateStatus, TelemetryEventType } from '@prisma/client';

async function testTelemetryValidator() {
  console.log('🧪 Testing Telemetry Payload Validation...');

  // Test camelCase payload
  const camelCaseInput = {
    deviceId: 'DEV-TEST-001',
    event: 'POWER_LOST',
    sequenceNumber: 101,
    eventTimestamp: '2026-08-04T22:50:00Z',
    battery: 88,
    signalStrength: -75,
  };
  const parsed1 = TelemetryInputSchema.parse(camelCaseInput);
  console.assert(parsed1.deviceId === 'DEV-TEST-001', 'CamelCase deviceId failed');
  console.assert(parsed1.eventType === TelemetryEventType.POWER_LOST, 'Event POWER_LOST failed');
  console.assert(parsed1.sequenceNumber === 101, 'Sequence number failed');

  // Test snake_case payload
  const snakeCaseInput = {
    device_id: 'DEV-TEST-002',
    event_type: 'power_restored',
    seq: 42,
    ts: '2026-08-04T22:51:00Z',
    battery_mv: 3480,
    rssi: -85,
  };
  const parsed2 = TelemetryInputSchema.parse(snakeCaseInput);
  console.assert(parsed2.deviceId === 'DEV-TEST-002', 'SnakeCase device_id failed');
  console.assert(parsed2.eventType === TelemetryEventType.POWER_RESTORED, 'Event POWER_RESTORED failed');
  console.assert(parsed2.sequenceNumber === 42, 'Sequence number seq failed');

  console.log('✅ Telemetry Validator Tests Passed!');
}

async function testMockTelemetryPipeline() {
  console.log('🧪 Testing Telemetry Pipeline Ingestion Logic (Mock Storage)...');

  const mockDevice = {
    id: 'device-uuid-001',
    poleId: 'pole-uuid-001',
    deviceCode: 'DEV-001',
    firmwareVersion: '1.4.2',
    batteryLevel: 90,
    lastSeen: new Date(),
    status: DeviceStatus.ACTIVE,
    installedAt: new Date(),
  };

  const storedTelemetry: Array<{ deviceId: string; sequenceNumber: number }> = [];
  const poleStates = new Map<string, PoleStateStatus>();

  const mockDeviceRepo: any = {
    findByDeviceCode: async (code: string) => (code === 'DEV-001' ? mockDevice : null),
    updateStatus: async () => mockDevice,
  };

  const mockTelemetryRepo: any = {
    findByDeviceAndSequence: async (deviceId: string, seq: number) => {
      return storedTelemetry.find((t) => t.deviceId === deviceId && t.sequenceNumber === seq) || null;
    },
    findLatestByDevice: async (deviceId: string) => {
      const devTelemetry = storedTelemetry.filter((t) => t.deviceId === deviceId);
      if (devTelemetry.length === 0) return null;
      return devTelemetry.sort((a, b) => b.sequenceNumber - a.sequenceNumber)[0];
    },
    create: async (data: any) => {
      storedTelemetry.push({ deviceId: data.deviceId, sequenceNumber: data.sequenceNumber });
      return { id: 'telemetry-uuid', ...data };
    },
  };

  const mockPoleStateRepo: any = {
    findByPoleId: async (poleId: string) => {
      const state = poleStates.get(poleId) || PoleStateStatus.LIVE;
      return { poleId, currentState: state, lastEvent: null, lastEventTimestamp: null, lastUpdated: new Date() };
    },
    updateState: async (poleId: string, newState: PoleStateStatus) => {
      poleStates.set(poleId, newState);
      return { poleId, currentState: newState, lastEvent: null, lastEventTimestamp: null, lastUpdated: new Date() };
    },
  };

  const service = new TelemetryService(mockDeviceRepo, mockTelemetryRepo, mockPoleStateRepo);

  const createInput = (eventType: TelemetryEventType, sequenceNumber: number): ProcessedTelemetryInput => ({
    deviceId: 'DEV-001',
    poleId: 'pole-uuid-001',
    eventType,
    sequenceNumber,
    eventTimestamp: new Date(),
    batteryLevel: 90,
    signalStrength: -75,
    firmwareVersion: '1.4.2',
    rawPayload: {},
  });

  // 1. Test Ingest POWER_LOST
  const res1 = await service.ingestTelemetry(createInput(TelemetryEventType.POWER_LOST, 10));
  console.assert(res1.accepted === true, 'Res1 should be accepted');
  console.assert(poleStates.get('pole-uuid-001') === PoleStateStatus.DARK, 'Pole should be DARK');

  // 2. Test Duplicate Event (seq 10 again)
  const res2 = await service.ingestTelemetry(createInput(TelemetryEventType.POWER_LOST, 10));
  console.assert(res2.accepted === true && res2.duplicate === true, 'Res2 should be duplicate');

  // 3. Test Ingest POWER_RESTORED (seq 11)
  const res3 = await service.ingestTelemetry(createInput(TelemetryEventType.POWER_RESTORED, 11));
  console.assert(res3.accepted === true, 'Res3 should be accepted');
  console.assert(poleStates.get('pole-uuid-001') === PoleStateStatus.LIVE, 'Pole should be LIVE');

  // 4. Test Stale Event (seq 5 after seq 11)
  const res4 = await service.ingestTelemetry(createInput(TelemetryEventType.POWER_LOST, 5));
  console.assert(res4.accepted === true && res4.stale === true, 'Res4 should be marked stale');
  console.assert(poleStates.get('pole-uuid-001') === PoleStateStatus.LIVE, 'Pole state should remain LIVE despite stale POWER_LOST');

  console.log('✅ Mock Telemetry Ingestion Pipeline Verification Passed!');
}

async function runAllTests() {
  await testTelemetryValidator();
  await testMockTelemetryPipeline();
}

runAllTests().catch((err) => {
  console.error('❌ Tests failed:', err);
  process.exit(1);
});
