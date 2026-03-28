const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function test() {
  console.log('🔄 Keep-alive test başlıyor...');
  
  // 1. Yeni kayıt oluştur
  const record = await prisma.keepAlive.create({
    data: { message: 'test-ping-' + new Date().toISOString() }
  });
  console.log('✅ Kayıt oluşturuldu:', record);

  // 2. Eski kayıtları sil
  const deleted = await prisma.keepAlive.deleteMany({});
  console.log('🗑️  Silinen kayıt sayısı:', deleted.count);

  console.log('✅ Keep-alive test başarılı!');
  await prisma.$disconnect();
}

test().catch(e => {
  console.error('❌ Hata:', e);
  process.exit(1);
});
