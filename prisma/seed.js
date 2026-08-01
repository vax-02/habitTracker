const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // Limpiar datos existentes (en orden correcto por relaciones)
  await prisma.$transaction([
    prisma.habitLog.deleteMany(),
    prisma.reminder.deleteMany(),
    prisma.habit.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Datos existentes eliminados');

  // ============================================
  // CREAR USUARIOS DE PRUEBA
  // ============================================
  const users = [
    {
      email: 'juan@example.com',
      password: await bcrypt.hash('Password123', 10),
      name: 'Juan Pérez',
    },
    {
      email: 'maria@example.com',
      password: await bcrypt.hash('Password123', 10),
      name: 'María García',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    createdUsers.push(user);
    console.log(`Usuario creado: ${user.email}`);
  }

  // ============================================
  // CREAR HÁBITOS PARA CADA USUARIO
  // ============================================

  // Hábitos para Juan
  const juanHabits = [
    {
      userId: createdUsers[0].id,
      name: 'Ejercicio diario',
      description: 'Hacer 30 minutos de ejercicio físico',
      frequency: 'DAILY',
      targetDays: 7,
      color: '#FF6B6B',
      icon: '💪',
    },
    {
      userId: createdUsers[0].id,
      name: 'Leer 20 páginas',
      description: 'Leer al menos 20 páginas de un libro',
      frequency: 'DAILY',
      targetDays: 7,
      color: '#4ECDC4',
      icon: '📖',
    },
    {
      userId: createdUsers[0].id,
      name: 'Meditar',
      description: 'Meditar 10 minutos al despertar',
      frequency: 'DAILY',
      targetDays: 5,
      color: '#95E1D3',
      icon: '🧘',
    },
  ];

  const juanCreatedHabits = [];
  for (const habitData of juanHabits) {
    const habit = await prisma.habit.create({
      data: habitData,
    });
    juanCreatedHabits.push(habit);
    console.log(` Hábito creado para Juan: ${habit.name}`);
  }

  // Hábitos para María
  const mariaHabits = [
    {
      userId: createdUsers[1].id,
      name: 'Estudiar inglés',
      description: 'Estudiar inglés 1 hora diaria',
      frequency: 'DAILY',
      targetDays: 5,
      color: '#A8E6CF',
      icon: '🇬🇧',
    },
    {
      userId: createdUsers[1].id,
      name: 'Programar',
      description: 'Programar al menos 2 horas',
      frequency: 'DAILY',
      targetDays: 6,
      color: '#FFD93D',
      icon: '💻',
    },
  ];

  const mariaCreatedHabits = [];
  for (const habitData of mariaHabits) {
    const habit = await prisma.habit.create({
      data: habitData,
    });
    mariaCreatedHabits.push(habit);
    console.log(`✅ Hábito creado para María: ${habit.name}`);
  }

  // ============================================
  // CREAR LOGS DE ACTIVIDAD (últimos 7 días)
  // ============================================

  console.log('📝 Creando logs de actividad...');

  const today = new Date();
  const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'SKIPPED', 'COMPLETED', 'FAILED', 'COMPLETED'];

  // Logs para los hábitos de Juan
  for (const habit of juanCreatedHabits) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simular que los días más recientes tienen más probabilidad de estar completados
      const randomIndex = Math.floor(Math.random() * statuses.length);
      const status = i < 3 ? 'COMPLETED' : statuses[randomIndex];

      await prisma.habitLog.create({
        data: {
          habitId: habit.id,
          userId: habit.userId,
          date: date,
          status: status,
          notes: status === 'COMPLETED' ? '¡Buen trabajo!' : 'Necesito mejorar',
        },
      });
    }
  }

  // Logs para los hábitos de María
  for (const habit of mariaCreatedHabits) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const randomIndex = Math.floor(Math.random() * statuses.length);
      const status = i < 2 ? 'COMPLETED' : statuses[randomIndex];

      await prisma.habitLog.create({
        data: {
          habitId: habit.id,
          userId: habit.userId,
          date: date,
          status: status,
        },
      });
    }
  }

  // ============================================
  // CREAR RECORDATORIOS
  // ============================================

  console.log(' Creando recordatorios...');

  // Recordatorios para Juan
  await prisma.reminder.createMany({
    data: [
      {
        habitId: juanCreatedHabits[0].id,
        userId: createdUsers[0].id,
        time: '07:00',
        days: null, // Todos los días
        active: true,
      },
      {
        habitId: juanCreatedHabits[1].id,
        userId: createdUsers[0].id,
        time: '21:00',
        days: '1,3,5', // Lunes, Miércoles, Viernes
        active: true,
      },
    ],
  });

  // Recordatorios para María
  await prisma.reminder.createMany({
    data: [
      {
        habitId: mariaCreatedHabits[0].id,
        userId: createdUsers[1].id,
        time: '08:00',
        days: null,
        active: true,
      },
      {
        habitId: mariaCreatedHabits[1].id,
        userId: createdUsers[1].id,
        time: '18:00',
        days: null,
        active: false,
      },
    ],
  });

  console.log('✅ Recordatorios creados');

  // ============================================
  // RESUMEN FINAL
  // ============================================

  console.log('\n📊 RESUMEN DEL SEED:');
  console.log(`👥 Usuarios creados: ${createdUsers.length}`);
  console.log(`📋 Hábitos creados: ${juanCreatedHabits.length + mariaCreatedHabits.length}`);
  console.log(`📝 Logs creados: ${(juanCreatedHabits.length + mariaCreatedHabits.length) * 7}`);
  console.log(`⏰ Recordatorios creados: 4`);

  console.log('\n🔑 CREDENCIALES DE PRUEBA:');
  console.log('📧 juan@example.com / Password123');
  console.log('📧 maria@example.com / Password123');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });