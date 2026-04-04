import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { checkPaymentRequired, getAccommodationSaleCount, FREE_PLAN_LIMITS } from '@/lib/utils/payment';

// GET - Satış kayıtlarını getir
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Şirket bilgisi bulunamadı' }, { status: 400 });
    }

    const sales = await prisma.accommodationSale.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ sales });
  } catch (error: any) {
    console.error('AccommodationSale GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// POST - Yeni satış kaydı oluştur veya toplu satışa aktar
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken();
    
    if (!user) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'Şirket bilgisi bulunamadı' }, { status: 400 });
    }

    const data = await request.json();

    // Toplu satışa aktarma
    if (data.accommodationIds && Array.isArray(data.accommodationIds)) {
      // Limit kontrolü - kaç tane yeni satış kaydı oluşturulacak?
      const currentSaleCount = await getAccommodationSaleCount(user.companyId);
      const newSalesCount = data.accommodationIds.length;
      const totalAfterAdd = currentSaleCount + newSalesCount;

      // Eğer limit aşılacaksa kontrol et
      if (totalAfterAdd > FREE_PLAN_LIMITS.ACCOMMODATION_SALE) {
        const paymentCheck = await checkPaymentRequired(user.companyId, 'accommodationSale');
        if (paymentCheck.paymentRequired) {
          return NextResponse.json(
            {
              error: 'PAYMENT_REQUIRED',
              message: paymentCheck.message,
              accommodationCount: paymentCheck.accommodationCount,
              accommodationSaleCount: paymentCheck.accommodationSaleCount,
              willExceedLimit: true,
            },
            { status: 402 } // 402 Payment Required
          );
        }
      }
      if (data.accommodationIds.length === 0) {
        return NextResponse.json({ error: 'En az bir kayıt seçmelisiniz' }, { status: 400 });
      }

      try {
        const saleCustomersPayload =
          data.saleCustomers && typeof data.saleCustomers === 'object' && !Array.isArray(data.saleCustomers)
            ? (data.saleCustomers as Record<string, { musteriAdi?: string; musteriCariKodu?: string }>)
            : {};

        const result = await prisma.$transaction(
          async (tx) => {
            const sales = [];
            const errors = [];

            for (const accommodationId of data.accommodationIds) {
              try {
                // Alış kaydını getir (şirket kontrolü ile)
                const accommodation = await tx.accommodation.findFirst({
                  where: { 
                    id: accommodationId,
                    companyId: user.companyId
                  },
                });

                if (!accommodation) {
                  errors.push(`Accommodation ID ${accommodationId} bulunamadı`);
                  continue;
                }

                // Bu kayıt zaten satışa aktarılmış mı kontrol et
                const existingSale = await tx.accommodationSale.findFirst({
                  where: {
                    accommodationId: accommodation.id,
                    companyId: user.companyId
                  }
                });

                if (existingSale) {
                  console.log(`Accommodation ID ${accommodationId} zaten satışa aktarılmış`);
                  continue;
                }

                // Satış fiyatları opsiyonel - kullanıcıdan gelen fiyatları kullan veya boş bırak
                const salePrices = data.salePrices && data.salePrices[accommodation.id] 
                  ? data.salePrices[accommodation.id]
                  : { satisFiyati: 0, toplamSatisFiyati: 0 };

                const satisFiyati = salePrices.satisFiyati || 0;
                const toplamSatisFiyati = salePrices.toplamSatisFiyati || 0;
                const kar = toplamSatisFiyati > 0 ? (toplamSatisFiyati - accommodation.toplamUcret) : 0;
                const karOrani = accommodation.toplamUcret > 0 && toplamSatisFiyati > 0 
                  ? (kar / accommodation.toplamUcret) * 100 
                  : 0;

                const custRaw =
                  saleCustomersPayload[accommodation.id] ?? saleCustomersPayload[String(accommodation.id)];
                const musteriAdiTrim = custRaw?.musteriAdi?.trim();
                const musteriCariTrim = custRaw?.musteriCariKodu?.trim();
                const musteriAdi =
                  musteriAdiTrim ||
                  (accommodation.kurumCari?.trim() ? accommodation.kurumCari.trim() : null);
                const musteriCariKodu = musteriCariTrim || null;

                // Satış kaydı oluştur
                const sale = await tx.accommodationSale.create({
                  data: {
                    accommodationId: accommodation.id,
                    adiSoyadi: accommodation.adiSoyadi,
                    unvani: accommodation.unvani,
                    ulke: accommodation.ulke,
                    sehir: accommodation.sehir,
                    girisTarihi: accommodation.girisTarihi,
                    cikisTarihi: accommodation.cikisTarihi,
                    odaTipi: accommodation.odaTipi,
                    konaklamaTipi: accommodation.konaklamaTipi,
                    otelAdi: accommodation.otelAdi,
                    alisFiyati: accommodation.gecelikUcret,
                    toplamAlisFiyati: accommodation.toplamUcret,
                    satisFiyati: satisFiyati,
                    toplamSatisFiyati: toplamSatisFiyati,
                    kar: kar,
                    karOrani: karOrani,
                    kalanTutar: toplamSatisFiyati,
                    musteriAdi,
                    musteriCariKodu,
                    companyId: user.companyId,
                  },
                });

                // Log kaydı
                await tx.log.create({
                  data: {
                    action: 'CREATE',
                    modelName: 'AccommodationSale',
                    recordId: sale.id,
                    recordData: JSON.stringify(sale),
                    userId: user.id,
                    companyId: user.companyId,
                  },
                });

                sales.push(sale);
              } catch (itemError: any) {
                console.error(`Accommodation ID ${accommodationId} işlenirken hata:`, itemError);
                errors.push(`ID ${accommodationId}: ${itemError.message}`);
              }
            }

            if (sales.length === 0 && errors.length > 0) {
              throw new Error(`Hiçbir kayıt aktarılamadı: ${errors.join(', ')}`);
            }

            return { sales, errors };
          },
          {
            maxWait: 10000, // 10 saniye bekleme
            timeout: 30000, // 30 saniye timeout
          }
        );

        if (result.errors && result.errors.length > 0) {
          return NextResponse.json({
            message: `${result.sales.length} kayıt satışa aktarıldı, ${result.errors.length} kayıt atlandı`,
            sales: result.sales,
            errors: result.errors,
            warning: true
          });
        }

        return NextResponse.json({
          message: `${result.sales.length} kayıt satışa aktarıldı`,
          sales: result.sales,
        });
      } catch (error: any) {
        console.error('Transaction error:', error);
        return NextResponse.json(
          { error: error.message || 'Satışa aktarma sırasında hata oluştu' },
          { status: 500 }
        );
      }
    }

    // Tekli satış kaydı oluşturma - Limit kontrolü
    const paymentCheck = await checkPaymentRequired(user.companyId, 'accommodationSale');
    if (paymentCheck.paymentRequired) {
      return NextResponse.json(
        {
          error: 'PAYMENT_REQUIRED',
          message: paymentCheck.message,
          accommodationCount: paymentCheck.accommodationCount,
          accommodationSaleCount: paymentCheck.accommodationSaleCount,
        },
        { status: 402 } // 402 Payment Required
      );
    }

    const sale = await prisma.accommodationSale.create({
      data: {
        ...data,
        companyId: user.companyId,
        kalanTutar: data.toplamSatisFiyati - (data.odenenTutar || 0),
      },
    });

    await prisma.log.create({
      data: {
        action: 'CREATE',
        modelName: 'AccommodationSale',
        recordId: sale.id,
        recordData: JSON.stringify(sale),
        userId: user.id,
        companyId: user.companyId,
      },
    });

    return NextResponse.json(sale);
  } catch (error: any) {
    console.error('AccommodationSale POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
