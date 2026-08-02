const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Logs - Unit Tests', () => {
  let authToken;
  let userId;
  let habitId;

  beforeAll(async () => {
    // Limpiar datos existentes
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'logs@example.com' }
    });

    // Registrar usuario
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'logs@example.com',
        password: 'Test123456',
        name: 'Logs Test User'
      });

    authToken = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;

    // Crear hábito para pruebas
    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Habit for Logs',
        frequency: 'DAILY'
      });

    habitId = habitRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'logs@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('Registro de Progreso', () => {
    test('POST /api/habits/:id/log - Debería registrar hábito como completado', async () => {
      const response = await request(app)
        .post(`/api/habits/${habitId}/log`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'COMPLETED',
          notes: '¡Excelente trabajo!'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'COMPLETED');
      expect(response.body.data).toHaveProperty('notes', '¡Excelente trabajo!');
    });

    test('POST /api/habits/:id/log - Debería actualizar log existente', async () => {
      // ✅ Crear un log primero
      const createResponse = await request(app)
        .post(`/api/habits/${habitId}/log`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'COMPLETED',
          notes: 'Primer intento'
        })
        .expect(201                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               );

      expect(createResponse.body).toHaveProperty('success', true);
      expect(createResponse.body.data).toHaveProperty('status', 'COMPLETED');

      // ✅ Luego actualizarlo
      const updateResponse = await request(app)
        .post(`/api/habits/${habitId}/log`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'SKIPPED',
          notes: 'No tuve tiempo hoy'
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('success', true);
      expect(updateResponse.body.data).toHaveProperty('status', 'SKIPPED');
      expect(updateResponse.body.data).toHaveProperty('notes', 'No tuve tiempo hoy');
    });

    test('POST /api/habits/:id/log - No debería permitir estado inválido', async () => {
      const response = await request(app)
        .post(`/api/habits/${habitId}/log`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'INVALID_STATUS'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/habits/:id/log - No debería permitir hábito inexistente', async () => {
      const response = await request(app)
        .post('/api/habits/99999/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'COMPLETED'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'HABIT_NOT_FOUND');
    });

    test('POST /api/habits/:id/log - No debería permitir acceso sin token', async () => {
      await request(app)
        .post(`/api/habits/${habitId}/log`)
        .send({
          status: 'COMPLETED'
        })
        .expect(401);
    });
  });

  describe('Obtención de Logs', () => {
    // ✅ Crear logs para diferentes días
    beforeAll(async () => {
      // Limpiar logs existentes para este hábito
      await prisma.habitLog.deleteMany({
        where: { habitId }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // ✅ Crear logs para 7 días diferentes (hoy + 6 días atrás)
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const status = i < 5 ? 'COMPLETED' : 'SKIPPED';
        
        await prisma.habitLog.create({
          data: {
            habitId,
            userId,
            date,
            status,
            notes: `Log del día ${i}`
          }
        });
      }
    });

    test('GET /api/habits/:id/logs - Debería obtener logs del hábito', async () => {
      const response = await request(app)
        .get(`/api/habits/${habitId}/logs`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('count');
    });

    test('GET /api/habits/:id/logs?limit=3 - Debería limitar resultados', async () => {
      const response = await request(app)
        .get(`/api/habits/${habitId}/logs?limit=3`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(3);
      expect(response.body.count).toBe(3);
    });

    test('GET /api/habits/:id/logs?startDate=... - Debería filtrar por fecha', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // ✅ Calcular fecha de inicio (hace 3 días)
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 3);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const response = await request(app)
        .get(`/api/habits/${habitId}/logs?startDate=${startDateStr}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // ✅ Debería devolver al menos 3 logs (los de los últimos 3 días)
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  

});