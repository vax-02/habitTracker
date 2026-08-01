const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Autenticación - Tests de Integración', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Limpiar base de datos antes de empezar
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['integration@example.com', 'flow@example.com']
        }
      }
    });

    // Registrar usuario
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'integration@example.com',
        password: 'Test123456',
        name: 'Integration Test'
      });

    // Debug: Ver qué está devolviendo
    console.log('Register response:', registerRes.body);

    // Verificar que el registro fue exitoso
    if (registerRes.status !== 201) {
      throw new Error(`Registro falló: ${registerRes.status} - ${JSON.stringify(registerRes.body)}`);
    }

    authToken = registerRes.body.data?.token;
    testUser = registerRes.body.data?.user;

    if (!authToken) {
      throw new Error('No se pudo obtener el token de autenticación');
    }
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['integration@example.com', 'flow@example.com']
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('Perfil de Usuario', () => {
    test('GET /api/auth/profile - Debería obtener perfil con token válido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testUser.id);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('_count');
    });

    test('GET /api/auth/profile - No debería permitir sin token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'MISSING_TOKEN');
    });

    test('GET /api/auth/profile - No debería permitir token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('PUT /api/auth/profile - Debería actualizar perfil', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Nombre Actualizado'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Nombre Actualizado');
    });

    test('PUT /api/auth/change-password - Debería cambiar contraseña', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test123456',
          newPassword: 'NewPassword789'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Contraseña actualizada exitosamente');

      // Verificar que se puede hacer login con la nueva contraseña
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'NewPassword789'
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('success', true);
    });
  });

  describe('Flujo Completo de Autenticación', () => {
    test('Flujo completo: registro → login → perfil → cambio de contraseña', async () => {
      const testEmail = 'flow@example.com';
      
      // Limpiar usuario si existe
      await prisma.user.deleteMany({
        where: { email: testEmail }
      });

      // 1. Registro
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: 'FlowTest123',
          name: 'Flow Test'
        })
        .expect(201);

      const token = registerRes.body.data.token;

      // 2. Verificar perfil
      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileRes.body.data.email).toBe(testEmail);

      // 3. Actualizar perfil
      await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Flow Test Actualizado'
        })
        .expect(200);

      // 4. Cambiar contraseña
      await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'FlowTest123',
          newPassword: 'NewFlowTest456'
        })
        .expect(200);

      // 5. Login con nueva contraseña
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'NewFlowTest456'
        })
        .expect(200);

      expect(loginRes.body.data.token).toBeDefined();
    });
  });
});