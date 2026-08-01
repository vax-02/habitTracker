const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Hábitos - Tests de Integración', () => {
  let authToken;
  let userId;
  let habitIds = [];

  beforeAll(async () => {
    // Limpiar datos
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'int-habits@example.com' }
    });

    // Registrar usuario
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'int-habits@example.com',
        password: 'Test123456',
        name: 'Integration Habits Test'
      });

    authToken = registerRes.body.data.token;
    userId = registerRes.body.data.user.id;

    // Crear varios hábitos para pruebas de listado
    const habits = [
      { name: 'Habit 1', frequency: 'DAILY' },
      { name: 'Habit 2', frequency: 'WEEKLY' },
      { name: 'Habit 3', frequency: 'MONTHLY' }
    ];

    for (const habit of habits) {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habit);
      
      habitIds.push(res.body.data.id);
    }
  });

  afterAll(async () => {
    await prisma.habitLog.deleteMany();
    await prisma.habit.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'int-habits@example.com' }
    });
    await prisma.$disconnect();
  });

  test('GET /api/habits - Debería listar todos los hábitos del usuario', async () => {
    const response = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.length).toBe(3);
    expect(response.body.pagination.total).toBe(3);
  });

  test('GET /api/habits?search=Habit 1 - Debería filtrar por nombre', async () => {
    const response = await request(app)
      .get('/api/habits?search=Habit 1')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].name).toBe('Habit 1');
  });

  test('GET /api/habits?page=1&limit=2 - Debería paginar resultados', async () => {
    const response = await request(app)
      .get('/api/habits?page=1&limit=2')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.length).toBe(2);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.pagination.totalPages).toBe(2);
  });

  test('GET /api/habits - No debería permitir acceso sin token', async () => {
    await request(app)
      .get('/api/habits')
      .expect(401);
  });

  test('POST /api/habits - No debería permitir acceso sin token', async () => {
    await request(app)
      .post('/api/habits')
      .send({
        name: 'Unauthorized Habit',
        frequency: 'DAILY'
      })
      .expect(401);
  });

})