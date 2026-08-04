import { createApp } from '../app.js';
import http from 'http';

async function debugDashboardEndpoint() {
  console.log('🔍 Debugging GET /api/v1/dashboard endpoint...');
  const app = createApp();
  const server = app.listen(0, async () => {
    const address = server.address() as any;
    const port = address.port;
    console.log(`Test server running on port ${port}`);

    http.get(`http://localhost:${port}/api/v1/dashboard`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`HTTP Status: ${res.statusCode}`);
        console.log('Response Body:', data);
        server.close();
      });
    }).on('error', (err) => {
      console.error('Request Error:', err);
      server.close();
    });
  });
}

debugDashboardEndpoint().catch((err) => {
  console.error('Fatal Debug Error:', err);
});
