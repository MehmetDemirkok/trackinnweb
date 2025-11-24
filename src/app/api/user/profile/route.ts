import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

type MyJwtPayload = JwtPayload & { id: number; role: string };

// Kullanıcının kendi profilini güncelle
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
    if (!decoded.id) {
      return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Sadece name ve email güncellenebilir
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.email !== undefined) {
      // Email değişikliği varsa, benzersizlik kontrolü yap
      if (data.email !== decoded.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email }
        });
        
        if (existingUser) {
          return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanılıyor.' }, { status: 400 });
        }
      }
      updateData.email = data.email;
    }
    
    // Eğer güncellenecek veri yoksa hata döndür
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek veri bulunamadı.' }, { status: 400 });
    }
    
    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,

      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profil başarıyla güncellendi.',
      user 
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    return NextResponse.json({ error: 'Profil güncellenirken bir hata oluştu.' }, { status: 500 });
  }
}
