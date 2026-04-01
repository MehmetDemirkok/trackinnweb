import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// Şirketleri listele - ADMIN tüm şirketleri görebilir
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    // Sadece ADMIN tüm şirketleri görebilir
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için ADMIN yetkisi gereklidir.' }, { status: 403 });
    }

    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        taxNumber: true,
        taxOffice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            accommodations: true,
            hotels: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(companies);
  } catch (error: any) {
    console.error('Companies fetch error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// Yeni şirket oluştur - sadece ADMIN
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için ADMIN yetkisi gereklidir.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      country,
      taxNumber,
      taxOffice,
      logo,
      status,
    } = body || {};

    if (!name || !email) {
      return NextResponse.json({ error: 'Şirket adı ve e-posta zorunludur.' }, { status: 400 });
    }

    const existing = await prisma.company.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta ile kayıtlı şirket zaten mevcut.' }, { status: 409 });
    }

    const created = await prisma.company.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone || null,
        address: address || null,
        city: city || null,
        country: country || 'Türkiye',
        taxNumber: taxNumber || null,
        taxOffice: taxOffice || null,
        logo: logo || null,
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Company create error:', error);
    return NextResponse.json({ error: 'Şirket oluşturulurken sunucu hatası oluştu.' }, { status: 500 });
  }
}

