const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Recordatorios - Unit Tests', () => {
  let authToken;
  let userId;
  let habitId;
  let reminderId;

  beforeAll(async () => {
    // Limpiar datos
    await prisma.reminder.deleteMany();
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'reminders@example.com' }
    });

    // Registrar usuario
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'reminders@example.com',
        password: 'Test123456',
        name: 'Reminders Test User'
      });

    authToken = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;

    // Crear hábito
    const habitRes = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Hábito para recordatorio',
        frequency: 'DAILY'
      });

    habitId = habitRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.reminder.deleteMany();
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'reminders@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('CRUD de Recordatorios', () => {
    test('POST /api/reminders - Debería crear un recordatorio', async () => {
      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId,
          time: '09:00',
          days: '1,3,5',
          type: 'EMAIL'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('time', '09:00');
      expect(response.body.data).toHaveProperty('days', '1,3,5');
      
      reminderId = response.body.data.id;
    });

    test('GET /api/reminders - Debería listar recordatorios', async () => {
      const response = await request(app)
        .get('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('PUT /api/reminders/:id - Debería actualizar recordatorio', async () => {
      const response = await request(app)
        .put(`/api/reminders/${reminderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          time: '10:00',
          active: false
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('time', '10:00');
      expect(response.body.data).toHaveProperty('active', false);
    });

    test('DELETE /api/reminders/:id - Debería eliminar recordatorio', async () => {
      const response = await request(app)
        .delete(`/api/reminders/${reminderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('POST /api/reminders - No debería permitir recordatorio duplicado', async () => {
      // Crear primer recordatorio
      await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId,
          time: '11:00',
          type: 'EMAIL'
        })
        .expect(201);

      // Intentar crear duplicado
      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId,
          time: '11:00',
          type: 'EMAIL'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Ya existe un recordatorio activo');
    });
  });

  describe('Validaciones', () => {
    test('POST /api/reminders - Validación de hora inválida', async () => {
      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId,
          time: '25:00',
          type: 'EMAIL'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/reminders - Validación de días inválidos', async () => {
      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          habitId,
          time: '09:00',
          days: '8,9',
          type: 'EMAIL'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('POST /api/reminders - No debería permitir hábito de otro usuario', async () => {
      // Registrar otro usuario
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other-reminder@example.com',
          password: 'Test123456',
          name: 'Other User'
        });

      const otherToken = registerRes.body.data.token;

      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          habitId,
          time: '09:00',
          type: 'EMAIL'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Hábito no encontrado');
    });
  });
});