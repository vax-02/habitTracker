const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Autenticación - Unit Tests', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Test123456',
    name: 'Test User'
  };

  // Limpiar antes de cada test
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'duplicate@example.com']
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'duplicate@example.com']
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('Registro de Usuario', () => {
    test('POST /api/auth/register - Debería registrar usuario exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      expect(response.body.data.user).toHaveProperty('name', testUser.name);
      expect(response.body.data).toHaveProperty('token');
    });

    test('POST /api/auth/register - No debería permitir email duplicado', async () => {
      // Crear primer usuario
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Intentar crear con mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'EMAIL_EXISTS');
    });

    test('POST /api/auth/register - Validación de email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'email-invalido'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/auth/register - Validación de password débil', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          password: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/auth/register - Validación de name vacío', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          name: ''
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Login de Usuario', () => {
    beforeEach(async () => {
      // Limpiar usuario existente
      await prisma.user.deleteMany({
        where: { email: testUser.email }
      });
      
      // Crear usuario para pruebas de login
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    test('POST /api/auth/login - Debería iniciar sesión exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login exitoso');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
    });

    test('POST /api/auth/login - No debería permitir contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    test('POST /api/auth/login - No debería permitir usuario inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: 'Test123456'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    test('POST /api/auth/login - Validación de email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email-invalido',
          password: 'Test123456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});