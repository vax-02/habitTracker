const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Hábitos - Unit Tests', () => {
  let authToken;
  let userId;
  let testHabitId;

  beforeAll(async () => {
    // Limpiar datos existentes
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'habits@example.com' }
    });

    // Registrar usuario de prueba
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'habits@example.com',
        password: 'Test123456',
        name: 'Habits Test User'
      });

    authToken = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'habits@example.com' }
    });
    await prisma.$disconnect();
  });

  describe('CRUD de Hábitos', () => {
    test('POST /api/habits - Debería crear un hábito', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Habit',
          description: 'Description for test habit',
          frequency: 'DAILY',
          targetDays: 5,
          color: '#FF6B6B',
          icon: '💪'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Habit');
      expect(response.body.data.userId).toBe(userId);
      
      testHabitId = response.body.data.id;
    });

    test('POST /api/habits - No debería permitir hábito duplicado', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Habit',
          frequency: 'DAILY'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'DUPLICATE_HABIT');
    });

    test('GET /api/habits - Debería listar hábitos del usuario', async () => {
      const response = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('pagination');
    });

    test('GET /api/habits/:id - Debería obtener un hábito específico', async () => {
      const response = await request(app)
        .get(`/api/habits/${testHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testHabitId);
      expect(response.body.data).toHaveProperty('name', 'Test Habit');
    });

    test('PUT /api/habits/:id - Debería actualizar un hábito', async () => {
      const response = await request(app)
        .put(`/api/habits/${testHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Habit Updated',
          description: 'Updated description',
          targetDays: 7
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Test Habit Updated');
      expect(response.body.data).toHaveProperty('targetDays', 7);
    });

    test('DELETE /api/habits/:id - Debería eliminar un hábito', async () => {
      const response = await request(app)
        .delete(`/api/habits/${testHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Hábito eliminado exitosamente');

      // Verificar que ya no existe
      await request(app)
        .get(`/api/habits/${testHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Validaciones', () => {
    test('POST /api/habits - Validación de nombre vacío', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          frequency: 'DAILY'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/habits - Validación de frecuencia inválida', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Habit',
          frequency: 'INVALID'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/habits - Validación de color inválido', async () => {
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Color Habit',
          frequency: 'DAILY',
          color: '#GGG'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Estadísticas', () => {
    let habitId;

    beforeAll(async () => {
      // Crear un hábito para pruebas de estadísticas
      const response = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Stats Habit',
          frequency: 'DAILY',
          targetDays: 7
        });
      
      habitId = response.body.data.id;

      // Agregar algunos logs para el hábito
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Hacer que los primeros 5 días estén completados
        const status = i < 5 ? 'COMPLETED' : 'SKIPPED';
        
        await prisma.habitLog.create({
          data: {
            habitId,
            userId,
            date,
            status
          }
        });
      }
    });

    test('GET /api/habits/:id/stats - Debería obtener estadísticas', async () => {
      const response = await request(app)
        .get(`/api/habits/${habitId}/stats?days=7`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('completedDays', 5);
      expect(response.body.data.stats).toHaveProperty('skippedDays', 2);
      expect(response.body.data.stats).toHaveProperty('completionRate', 71);
      expect(response.body.data).toHaveProperty('dailyData');
      expect(response.body.data.dailyData).toBeInstanceOf(Array);
      expect(response.body.data.dailyData.length).toBe(7);
    });

    test('GET /api/habits/:id/stats - Debería manejar días inválidos', async () => {
      const response = await request(app)
        .get(`/api/habits/${habitId}/stats?days=999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});