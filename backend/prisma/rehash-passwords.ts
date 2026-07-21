import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  let count = 0;

  for (const user of users) {
    // Bcrypt-хеші завжди починаються з $2 — якщо вже хеш, пропускаємо
    if (user.password.startsWith('$2')) continue;

    const hashed = await bcrypt.hash(user.password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    count++;
  }

  console.log(`Перехешовано паролів: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());