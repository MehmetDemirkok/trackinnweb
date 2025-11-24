import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { company, user } = await request.json();

    // Validation
    if (!company || !user) {
      return NextResponse.json(
        { error: 'Şirket ve kullanıcı bilgileri gerekli' },
        { status: 400 }
      );
    }

    if (!company.name || !company.email) {
      return NextResponse.json(
        { error: 'Şirket adı ve email adresi zorunludur' },
        { status: 400 }
      );
    }

    if (!user.name || !user.email || !user.password) {
      return NextResponse.json(
        { error: 'Ad, email ve şifre zorunludur' },
        { status: 400 }
      );
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      return NextResponse.json(
        { error: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      );
    }

    if (!emailRegex.test(company.email)) {
      return NextResponse.json(
        { error: 'Geçerli bir şirket email adresi giriniz' },
        { status: 400 }
      );
    }

    // Şifre uzunluk kontrolü
    if (user.password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // Şirket email kontrolü (unique)
    const existingCompany = await prisma.company.findUnique({
      where: { email: company.email }
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Bu şirket email adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Kullanıcı email kontrolü (unique)
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Transaction ile şirket ve kullanıcı oluştur
    const result = await prisma.$transaction(async (tx) => {
      // Şirket oluştur
      const newCompany = await tx.company.create({
        data: {
          name: company.name,
          email: company.email,
          phone: company.phone || null,
          address: company.address || null,
          city: company.city || null,
          country: company.country || 'Türkiye',
          taxNumber: company.taxNumber || null,
          taxOffice: company.taxOffice || null,
          status: 'ACTIVE',
        },
      });

      // Kullanıcı oluştur - Yeni üyeler otomatik olarak kendi şirketinin yöneticisi olur
      const newUser = await tx.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: 'SIRKET_YONETICISI', // Şirket sahibi olarak ŞİRKET_YÖNETİCİSİ rolü
          companyId: newCompany.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyId: true,
        },
      });

      return { company: newCompany, user: newUser };
    });

    return NextResponse.json({
      message: 'Kayıt başarıyla oluşturuldu',
      company: result.company,
      user: result.user,
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // Veritabanı bağlantı hatası kontrolü
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || 
          error.message.includes('connection') ||
          error.message.includes('timeout') ||
          error.message.includes('P1001') ||
          error.message.includes('P1002')) {
        return NextResponse.json(
          { error: 'Veritabanına bağlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' },
          { status: 503 }
        );
      }

      // Unique constraint hatası
      if (error.message.includes('Unique constraint') || error.message.includes('P2002')) {
        return NextResponse.json(
          { error: 'Bu email adresi veya şirket bilgisi zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Kayıt oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}

