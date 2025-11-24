import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload, JsonWebTokenError } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

type MyJwtPayload = JwtPayload & { role: string; userId: number; };

// Kullanıcı listeleme
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    let decoded: MyJwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
    } catch (jwtError) {
      if (jwtError instanceof JsonWebTokenError) {
        console.error('JWT verification failed:', jwtError.message);
        // Clear the invalid token
        const response = NextResponse.json({ error: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' }, { status: 401 });
        response.headers.set('Set-Cookie', 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly');
        return response;
      }
      throw jwtError;
    }
    
    if (!decoded.id || typeof decoded.id !== 'number' || isNaN(decoded.id)) {
      return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        companyId: user.companyId,
        companyName: user.company?.name
      }
    });
  } catch (error) {
    console.error('Error in user GET route:', error);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}

// Kullanıcı ekleme - sadece ADMIN yetkisi
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    let decoded: MyJwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
    } catch (jwtError) {
      if (jwtError instanceof JsonWebTokenError) {
        console.error('JWT verification failed:', jwtError.message);
        return NextResponse.json({ error: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' }, { status: 401 });
      }
      throw jwtError;
    }
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için ADMIN yetkisi gereklidir.' }, { status: 403 });
    }
    
    const data = await request.json();
    // Basit validasyon: email zorunlu
    if (!data.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Şifreyi hash'le
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    // Role varsayılan olarak USER
    if (!data.role) {
      data.role = 'USER';
    }
    
    const user = await prisma.user.create({ data });
    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('Error in user POST route:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
} 