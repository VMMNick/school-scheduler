import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Запуск seed...');

  // Subjects
  await prisma.subject.createMany({
    data: [
      { name: "Математика" },
      { name: "Інформатика" },
      { name: "Українська мова" },
      { name: "Англійська мова" },
      { name: "Історія" },
    ],
    skipDuplicates: true,
  });

  // ClassGroups
  await prisma.classGroup.createMany({
    data: [
      { name: "11-А" },
      { name: "10-Б" },
      { name: "9-А" },
    ],
    skipDuplicates: true,
  });

  // Classrooms
  await prisma.classroom.createMany({
    data: [
      { name: "101", capacity: 30 },
      { name: "102", capacity: 25 },
      { name: "308", capacity: 33 },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed виконано успішно!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());