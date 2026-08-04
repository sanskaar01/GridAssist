import { simulatorRunner } from '../simulator/SimulationRunner.js';
import { ALL_SCENARIOS, getScenarioById } from '../simulator/scenarios/index.js';

async function testScenarioRegistry() {
  console.log('🧪 Test 1: Scenario Registry Validation...');
  console.assert(ALL_SCENARIOS.length >= 5, `Expected at least 5 scenarios, got ${ALL_SCENARIOS.length}`);

  const scenario1 = getScenarioById('single-span-fault');
  console.assert(scenario1 !== null, 'single-span-fault should exist');
  console.assert(scenario1?.steps.length === 4, 'single-span-fault should have 4 steps');

  console.log('✅ Test 1 Passed! Scenario registry loaded cleanly.');
}

async function testSimulatorControlState() {
  console.log('🧪 Test 2: Simulator Runner State Machine...');

  const initialStatus = simulatorRunner.getStatus();
  console.assert(initialStatus.state === 'IDLE', 'Initial state should be IDLE');

  simulatorRunner.pause();
  console.assert(simulatorRunner.getStatus().state === 'IDLE', 'Pause while IDLE should remain IDLE');

  simulatorRunner.stop();
  console.assert(simulatorRunner.getStatus().state === 'IDLE', 'Stop should set IDLE');

  console.log('✅ Test 2 Passed! Simulator runner state machine verified.');
}

async function runAllSimulatorTests() {
  await testScenarioRegistry();
  await testSimulatorControlState();
}

runAllSimulatorTests().catch((err) => {
  console.error('❌ Simulator tests failed:', err);
  process.exit(1);
});
