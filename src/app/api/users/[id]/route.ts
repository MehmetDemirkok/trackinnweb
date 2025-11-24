/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

type MyJwtPayload = JwtPayload & { role: string; userId: number; companyId?: number };

// Kullanıcı güncelle - ADMIN tümünü, ŞİRKET_YÖNETİCİSİ sadece kendi şirketini
export async function PUT(request: Request, context: any) {
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
    const params = await context.params;
    const userId = parseInt(params.id);
    
    // ŞİRKET_YÖNETİCİSİ için kullanıcının kendi şirketinde olup olmadığını kontrol et
    if (decoded.role === 'SIRKET_YONETICISI') {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true, role: true }
      });
      
      if (!targetUser || targetUser.companyId !== decoded.companyId) {
        return NextResponse.json({ error: 'Bu kullanıcıyı düzenleme yetkiniz yok.' }, { status: 403 });
      }
      
      // ŞİRKET_YÖNETİCİSİ ADMIN rolüne değiştiremez
      if (targetUser.role === 'ADMIN') {
        return NextResponse.json({ error: 'Şirket yöneticisi ADMIN rolünü düzenleyemez.' }, { status: 403 });
      }
    }
    
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.role !== undefined) {
      // ŞİRKET_YÖNETİCİSİ ADMIN rolüne değiştiremez
      if (decoded.role === 'SIRKET_YONETICISI' && data.role === 'ADMIN') {
        return NextResponse.json({ error: 'Şirket yöneticisi ADMIN rolüne değiştiremez.' }, { status: 403 });
      }
      updateData.role = data.role;
    }
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    // MUDUR şirket değiştiremez
    if (data.companyId !== undefined && decoded.role === 'ADMIN') {
      updateData.companyId = data.companyId;
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

// Kullanıcı sil - ADMIN tümünü, ŞİRKET_YÖNETİCİSİ sadece kendi şirketini
export async function DELETE(request: Request, context: any) {
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
    
    const params = await context.params;
    const userId = parseInt(params.id);
    
    // Kendini silmeye çalışıyorsa engelle
    if (decoded.userId === userId) {
      return NextResponse.json({ error: 'Kendi hesabınızı silemezsiniz.' }, { status: 400 });
    }
    
    // ŞİRKET_YÖNETİCİSİ için kullanıcının kendi şirketinde olup olmadığını kontrol et
    if (decoded.role === 'SIRKET_YONETICISI') {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true, role: true }
      });
      
      if (!targetUser || targetUser.companyId !== decoded.companyId) {
        return NextResponse.json({ error: 'Bu kullanıcıyı silme yetkiniz yok.' }, { status: 403 });
      }
      
      // ŞİRKET_YÖNETİCİSİ ADMIN rolünü silemez
      if (targetUser.role === 'ADMIN') {
        return NextResponse.json({ error: 'Şirket yöneticisi ADMIN rolünü silemez.' }, { status: 403 });
      }
    }
    
    await prisma.user.delete({
      where: { id: userId }
    });
    
    return NextResponse.json({ message: 'Kullanıcı başarıyla silindi.' });
  } catch {
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}