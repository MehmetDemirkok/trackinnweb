import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

type MyJwtPayload = JwtPayload & { role: string; userId: number; };

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
    
    // Kullanıcı bilgilerini veritabanından çek
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
    
    // Yeni JWT token oluştur
    const newToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.company.id,
        companyName: user.company.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Yeni cookie ayarla
    const response = NextResponse.json({
      message: 'Token güncellendi',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.company.id,
        companyName: user.company.name
      }
    });
    
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 saat
    });
    
    return response;
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Token güncellenirken hata oluştu.' }, { status: 500 });
  }
}
