import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Vercel Cron veya harici bir servis tarafından çağrılacak
// Database'i aktif tutmak için her 14 günde bir çalışır
export async function GET(request: Request) {
  try {
    // CRON_SECRET kontrolü - yetkisiz erişimi engelle
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // 1. Eski keep-alive kayıtlarını sil (temizlik)
    const deleted = await prisma.keepAlive.deleteMany({});
    
    // 2. Yeni bir keep-alive kaydı oluştur
    const keepAlive = await prisma.keepAlive.create({
      data: {
        message: `keep-alive-ping-${new Date().toISOString()}`,
      },
    });

    console.log(
      `[KEEP-ALIVE] Database ping başarılı. Silinen: ${deleted.count}, Yeni ID: ${keepAlive.id}, Zaman: ${keepAlive.pingAt.toISOString()}`
    );

    return NextResponse.json({
      success: true,
      message: 'Database keep-alive başarılı',
      deletedCount: deleted.count,
      newRecord: {
        id: keepAlive.id,
        pingAt: keepAlive.pingAt,
        message: keepAlive.message,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[KEEP-ALIVE] Hata:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database keep-alive başarısız',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
