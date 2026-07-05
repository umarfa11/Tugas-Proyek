const prisma = require('./config/db');

async function main() {
  try {
    console.log("Mencoba menghubungkan ke database...");
    const count = await prisma.produk.count();
    console.log(`Koneksi database sukses! Jumlah produk: ${count}`);
  } catch (error) {
    console.error("Gagal terhubung ke database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
