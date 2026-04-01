import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

interface RouteParams {
  params: { id: string } | Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için ADMIN yetkisi gereklidir.' }, { status: 403 });
    }

    const { id } = await Promise.resolve(params);
    const companyId = Number(id);
    if (!Number.isInteger(companyId) || companyId <= 0) {
      return NextResponse.json({ error: 'Geçersiz şirket id.' }, { status: 400 });
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

    const existingWithEmail = await prisma.company.findFirst({
      where: {
        email: String(email).trim().toLowerCase(),
        id: { not: companyId },
      },
      select: { id: true },
    });

    if (existingWithEmail) {
      return NextResponse.json({ error: 'Bu e-posta başka bir şirkete ait.' }, { status: 409 });
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Company update error:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Şirket bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Şirket güncellenirken sunucu hatası oluştu.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Bu işlem için ADMIN yetkisi gereklidir.' }, { status: 403 });
    }

    const { id } = await Promise.resolve(params);
    const companyId = Number(id);
    if (!Number.isInteger(companyId) || companyId <= 0) {
      return NextResponse.json({ error: 'Geçersiz şirket id.' }, { status: 400 });
    }

    await prisma.company.delete({
      where: { id: companyId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Company delete error:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Şirket bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Şirket silinirken sunucu hatası oluştu.' }, { status: 500 });
  }
}
