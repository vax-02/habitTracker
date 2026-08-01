const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('Modelos de Base de Datos', () => {
  let testUser;
  let testHabit;

  // Limpiar antes de cada test
  beforeEach(async () => {
    await prisma.$transaction([
      prisma.habitLog.deleteMany(),
      prisma.reminder.deleteMany(),
      prisma.habit.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User Model', () => {
    test('Debería crear un usuario correctamente', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: await bcrypt.hash('Password123', 10),
          name: 'Test User',
        },
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.password).not.toBe('Password123'); // Debe estar hasheado
    });

    test('No debería permitir emails duplicados', async () => {
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          password: 'hash',
          name: 'User 1',
        },
      });

      await expect(
        prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            password: 'hash',
            name: 'User 2',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Habit Model', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'habit-user@example.com',
          password: 'hash',
          name: 'Habit User',
        },
      });
    });

    test('Debería crear un hábito asociado a un usuario', async () => {
      const habit = await prisma.habit.create({
        data: {
          userId: testUser.id,
          name: 'Test Habit',
          description: 'Test Description',
          frequency: 'DAILY',
          targetDays: 5,
          color: '#FF0000',
          icon: '✅',
        },
      });

      expect(habit).toHaveProperty('id');
      expect(habit.userId).toBe(testUser.id);
      expect(habit.name).toBe('Test Habit');
      expect(habit.frequency).toBe('DAILY');
    });

    test('Debería tener relación con el usuario', async () => {
      const habit = await prisma.habit.create({
        data: {
          userId: testUser.id,
          name: 'Related Habit',
          frequency: 'DAILY',
        },
        include: {
          user: true,
        },
      });

      expect(habit.user).toBeDefined();
      expect(habit.user.id).toBe(testUser.id);
      expect(habit.user.email).toBe('habit-user@example.com');
    });
  });

  describe('HabitLog Model', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'log-user@example.com',
          password: 'hash',
          name: 'Log User',
        },
      });

      testHabit = await prisma.habit.create({
        data: {
          userId: testUser.id,
          name: 'Log Habit',
          frequency: 'DAILY',
        },
      });
    });

    test('Debería crear un log para un hábito', async () => {
      const log = await prisma.habitLog.create({
        data: {
          habitId: testHabit.id,
          userId: testUser.id,
          date: new Date(),
          status: 'COMPLETED',
          notes: 'Great job!',
        },
      });

      expect(log).toHaveProperty('id');
      expect(log.habitId).toBe(testHabit.id);
      expect(log.userId).toBe(testUser.id);
      expect(log.status).toBe('COMPLETED');
    });

    test('No debería permitir logs duplicados para el mismo día y hábito', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.habitLog.create({
        data: {
          habitId: testHabit.id,
          userId: testUser.id,
          date: today,
          status: 'COMPLETED',
        },
      });

      await expect(
        prisma.habitLog.create({
          data: {
            habitId: testHabit.id,
            userId: testUser.id,
            date: today,
            status: 'SKIPPED',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Relaciones', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'relations@example.com',
          password: 'hash',
          name: 'Relations User',
        },
      });
    });

    test('Un usuario debería tener múltiples hábitos', async () => {
      await prisma.habit.createMany({
        data: [
          { userId: testUser.id, name: 'Habit 1', frequency: 'DAILY' },
          { userId: testUser.id, name: 'Habit 2', frequency: 'WEEKLY' },
          { userId: testUser.id, name: 'Habit 3', frequency: 'MONTHLY' },
        ],
      });

      const userWithHabits = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { habits: true },
      });

      expect(userWithHabits.habits).toHaveLength(3);
    });

    test('Eliminar usuario debería eliminar sus hábitos (Cascade)', async () => {
      const habit = await prisma.habit.create({
        data: {
          userId: testUser.id,
          name: 'Cascade Test',
          frequency: 'DAILY',
        },
      });

      await prisma.user.delete({
        where: { id: testUser.id },
      });

      const deletedHabit = await prisma.habit.findUnique({
        where: { id: habit.id },
      });

      expect(deletedHabit).toBeNull();
    });
  });
});