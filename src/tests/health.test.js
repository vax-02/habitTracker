const request = require('supertest');
const app = require('../src/app');

describe('Health Check Endpoint', () => {
  test('GET /api/health debería retornar status OK', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
  });

  test('GET /ruta-invalida debería retornar 404', async () => {
    const response = await request(app)
      .get('/api/ruta-que-no-existe')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Ruta no encontrada');
  });
});