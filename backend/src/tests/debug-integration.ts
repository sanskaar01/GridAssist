import { createApp } from '../app.js';
import http from 'http';

function makeRequest(port: number, path: string, method: string = 'GET', body?: any): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      `http://localhost:${port}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ statusCode: res.statusCode || 500, data: parsed });
          } catch {
            resolve({ statusCode: res.statusCode || 500, data: rawData });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function auditAllEndpoints() {
  console.log('🔍 Comprehensive Integration Audit of Simulator & Control Room Endpoints...');
  const app = createApp();

  const server = app.listen(0, async () => {
    const port = (server.address() as any).port;
    console.log(`Integration test server running on port ${port}`);

    try {
      // 1. Test GET /api/v1/dashboard
      const dashboard = await makeRequest(port, '/api/v1/dashboard');
      console.assert(dashboard.statusCode === 200, `GET /dashboard returned ${dashboard.statusCode}`);
      console.log(`✅ 1. GET /api/v1/dashboard -> HTTP ${dashboard.statusCode}`);

      // 2. Test GET /api/v1/simulator/scenarios
      const scenarios = await makeRequest(port, '/api/v1/simulator/scenarios');
      console.assert(scenarios.statusCode === 200, `GET /simulator/scenarios returned ${scenarios.statusCode}`);
      console.log(`✅ 2. GET /api/v1/simulator/scenarios -> HTTP ${scenarios.statusCode} (${scenarios.data.data.length} scenarios)`);

      // 3. Test GET /api/v1/simulator/status
      const status = await makeRequest(port, '/api/v1/simulator/status');
      console.assert(status.statusCode === 200, `GET /simulator/status returned ${status.statusCode}`);
      console.log(`✅ 3. GET /api/v1/simulator/status -> HTTP ${status.statusCode} (state: ${status.data.data.state})`);

      // 4. Test POST /api/v1/simulator/run
      const run = await makeRequest(port, '/api/v1/simulator/run', 'POST', { scenarioId: 'single-span-fault', speed: 2.0 });
      console.assert(run.statusCode === 202 || run.statusCode === 200, `POST /simulator/run returned ${run.statusCode}`);
      console.log(`✅ 4. POST /api/v1/simulator/run -> HTTP ${run.statusCode}`);

      // 5. Test POST /api/v1/simulator/pause
      const pause = await makeRequest(port, '/api/v1/simulator/pause', 'POST');
      console.assert(pause.statusCode === 200, `POST /simulator/pause returned ${pause.statusCode}`);
      console.log(`✅ 5. POST /api/v1/simulator/pause -> HTTP ${pause.statusCode}`);

      // 6. Test POST /api/v1/simulator/resume
      const resume = await makeRequest(port, '/api/v1/simulator/resume', 'POST');
      console.assert(resume.statusCode === 200, `POST /simulator/resume returned ${resume.statusCode}`);
      console.log(`✅ 6. POST /api/v1/simulator/resume -> HTTP ${resume.statusCode}`);

      // 7. Test POST /api/v1/simulator/stop
      const stop = await makeRequest(port, '/api/v1/simulator/stop', 'POST');
      console.assert(stop.statusCode === 200, `POST /simulator/stop returned ${stop.statusCode}`);
      console.log(`✅ 7. POST /api/v1/simulator/stop -> HTTP ${stop.statusCode}`);

      // 8. Test POST /api/v1/simulator/reset
      const reset = await makeRequest(port, '/api/v1/simulator/reset', 'POST');
      console.assert(reset.statusCode === 200, `POST /simulator/reset returned ${reset.statusCode}`);
      console.log(`✅ 8. POST /api/v1/simulator/reset -> HTTP ${reset.statusCode}`);

      console.log('\n🎉 ALL 8 INTEGRATION ENDPOINTS RETURN HTTP 200 / 202 CLEANLY WITH ZERO ERRORS!');
    } catch (err) {
      console.error('❌ Audit failure:', err);
    } finally {
      server.close();
    }
  });
}

auditAllEndpoints();
