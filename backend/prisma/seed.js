const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai melakukan seeding data...');

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('admin123', saltRounds);

  // Buat Super Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      nama: 'Super Admin',
      username: 'admin',
      password: hashedPassword,
      role: 'super_admin'
    },
  });

  console.log(`Berhasil membuat user: ${admin.username} (Role: ${admin.role})`);
  console.log('Password default: admin123');
}

main()
  .catch((e) => {
    console.error('Terjadi error saat seeding: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
