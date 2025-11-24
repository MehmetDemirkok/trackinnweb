import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

type MyJwtPayload = JwtPayload & { role: string; userId: number; companyId?: number };

// Tüm kullanıcıları listele - ADMIN tümünü, ŞİRKET_YÖNETİCİSİ sadece kendi şirketini
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
    if (!['ADMIN', 'SIRKET_YONETICISI'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Bu işlem için yetki gereklidir.' }, { status: 403 });
    }
    
    // ŞİRKET_YÖNETİCİSİ sadece kendi şirketindeki kullanıcıları görebilir
    const whereClause = decoded.role === 'SIRKET_YONETICISI' 
      ? { companyId: decoded.companyId }
      : {};
    
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}

// Yeni kullanıcı oluştur - ADMIN tüm şirketler için, ŞİRKET_YÖNETİCİSİ sadece kendi şirketi için
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as MyJwtPayload;
    if (!['ADMIN', 'SIRKET_YONETICISI'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Bu işlem için yetki gereklidir.' }, { status: 403 });
    }
    
    const data = await request.json();
    
    if (!data.email || !data.password) {
      return NextResponse.json({ error: 'Email ve şifre zorunludur.' }, { status: 400 });
    }
    
    // ŞİRKET_YÖNETİCİSİ sadece kendi şirketi için kullanıcı oluşturabilir ve sadece ŞİRKET_YÖNETİCİSİ rolü verebilir
    if (decoded.role === 'SIRKET_YONETICISI' && data.role === 'ADMIN') {
      return NextResponse.json({ error: 'Şirket yöneticisi ADMIN rolü oluşturamaz.' }, { status: 403 });
    }
    
    // ŞİRKET_YÖNETİCİSİ sadece kendi şirketi için kullanıcı oluşturabilir
    const companyId = decoded.role === 'SIRKET_YONETICISI' ? decoded.companyId : data.companyId;
    
    // Email kontrolü (şirket bazlı)
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: data.email,
        companyId: companyId
      }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Bu email adresi bu şirkette zaten kullanılıyor.' }, { status: 400 });
    }
    
    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name || '',
        password: hashedPassword,
        role: data.role || 'SIRKET_YONETICISI',
        companyId: companyId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
} 