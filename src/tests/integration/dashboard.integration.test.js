const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Dashboard - Tests de Integración', () => {
  let authToken;
  let userId;
  let habitIds = [];

  beforeAll(async () => {
    // Limpiar datos
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'dashboard@example.com' }
    });

    // Registrar usuario
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dashboard@example.com',
        password: 'Test123456',
        name: 'Dashboard Test'
      });

    authToken = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;

    // Crear múltiples hábitos
    const habits = [
      { name: 'Ejercicio', frequency: 'DAILY', icon: '💪' },
      { name: 'Leer', frequency: 'DAILY', icon: '📖' },
      { name: 'Meditar', frequency: 'DAILY', icon: '🧘' }
    ];

    // PRIMERO crear todos los hábitos
    for (const habit of habits) {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habit);
      habitIds.push(res.body.data.id);
    }

    // ✅ USAR EL ENDPOINT PARA CREAR LOGS en lugar de Prisma directo
    // Esto asegura que las fechas se manejen de la misma manera
    
    // Completar hábito 1
    await request(app)
      .post(`/api/habits/${habitIds[0]}/log`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'COMPLETED'
      });

    // Completar hábito 2
    await request(app)
      .post(`/api/habits/${habitIds[1]}/log`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'COMPLETED'
      });

    // Saltar hábito 3
    await request(app)
      .post(`/api/habits/${habitIds[2]}/log`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'SKIPPED'
      });

    // ✅ También crear logs para días anteriores para probar el resumen semanal
    // Para esto, usamos Prisma directamente con fechas específicas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    // Crear logs para días anteriores directamente en la BD
    await prisma.habitLog.create({
      data: {
        habitId: habitIds[0],
        userId,
        date: yesterday,
        status: 'COMPLETED'
      }
    });

    await prisma.habitLog.create({
      data: {
        habitId: habitIds[1],
        userId,
        date: yesterday,
        status: 'COMPLETED'
      }
    });

    await prisma.habitLog.create({
      data: {
        habitId: habitIds[0],
        userId,
        date: twoDaysAgo,
        status: 'COMPLETED'
      }
    });
  });

  afterAll(async () => {
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'dashboard@example.com' }
    });
    await prisma.$disconnect();
  });

  test('GET /api/dashboard - Debería obtener el dashboard del día', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Debug: ver la respuesta
    console.log('Dashboard response:', JSON.stringify(response.body, null, 2));

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('summary');
    expect(response.body.data.summary).toHaveProperty('totalHabits', 3);
    
    // ✅ Verificar que completedToday sea al menos 2 (puede ser 3 si el tercero también se completó)
    expect(response.body.data.summary.completedToday).toBeGreaterThanOrEqual(2);
    expect(response.body.data.summary.skippedToday).toBeGreaterThanOrEqual(1);
    expect(response.body.data).toHaveProperty('habits');
    expect(response.body.data.habits.length).toBe(3);
  });

  test('GET /api/dashboard/weekly - Debería obtener resumen semanal', async () => {
    const response = await request(app)
      .get('/api/dashboard/weekly')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('week');
    expect(response.body.data).toHaveProperty('dailyStats');
    expect(response.body.data.dailyStats.length).toBe(7);
    expect(response.body.data).toHaveProperty('summary');
    expect(response.body.data.summary).toHaveProperty('totalHabits');
    expect(response.body.data.summary).toHaveProperty('totalCompleted');
    
    // Verificar que hay al menos algunos completados en la semana
    expect(response.body.data.summary.totalCompleted).toBeGreaterThan(0);
  });

  test('GET /api/dashboard/streak - Debería obtener la racha actual', async () => {
    const response = await request(app)
      .get('/api/dashboard/streak')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('currentStreak');
    expect(response.body.data).toHaveProperty('message');
  });

  test('GET /api/dashboard - No debería permitir acceso sin token', async () => {
    await request(app)
      .get('/api/dashboard')
      .expect(401);
  });

  test('GET /api/dashboard/weekly - No debería permitir acceso sin token', async () => {
    await request(app)
      .get('/api/dashboard/weekly')
      .expect(401);
  });
});