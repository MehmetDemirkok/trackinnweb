import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Türkiye'deki popüler şehirler
const cities = [
  'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Muğla', 'Aydın', 
  'Balıkesir', 'Çanakkale', 'Mersin', 'Adana', 'Bursa', 'Konya'
];

// Otel isimleri
const hotelNames = [
  'Grand Hotel', 'Seaside Resort', 'Mountain View Hotel', 'City Center Hotel',
  'Plaza Hotel', 'Paradise Resort', 'Royal Palace', 'Sunset Beach Hotel',
  'Garden Hotel', 'Marina Hotel', 'Palace Hotel', 'Ocean Blue Resort'
];

// Oda tipleri
const roomTypes = ['Standart', 'Deluxe', 'Suite', 'Family Room', 'Premium', 'Executive'];

// Konaklama tipleri
const boardTypes = ['Oda Kahvaltı', 'Yarım Pansiyon', 'Tam Pansiyon', 'Her Şey Dahil', 'Ultra Her Şey Dahil'];

// Müşteri ünvanları
const titles = ['Bay', 'Bayan', 'Dr.', 'Prof.'];

// Türk isimleri
const firstNames = [
  'Ahmet', 'Mehmet', 'Mustafa', 'Ayşe', 'Fatma', 'Zeynep', 'Ali', 'Hasan',
  'Hüseyin', 'Emine', 'Elif', 'Murat', 'Can', 'Deniz', 'Ece', 'Burak',
  'Serkan', 'Oğuz', 'Selin', 'Merve', 'Kemal', 'Emre', 'Nur', 'Cemre'
];

const lastNames = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Arslan', 'Öztürk',
  'Aydın', 'Özdemir', 'Aktaş', 'Çetin', 'Korkmaz', 'Kurt', 'Özkan', 'Şimşek',
  'Erdoğan', 'Koç', 'Güler', 'Aslan', 'Tunç', 'Polat', 'Acar', 'Bayram'
];

// Organizasyon isimleri
const organizations = [
  'ABC Turizm', 'XYZ Seyahat', 'Global Travel', 'Mega Tour', 'Holiday World',
  'Dream Holidays', 'Star Tours', 'Elite Travel', 'Premium Turizm'
];

// Random date generator
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Random number between min and max
function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random name
function randomName(): string {
  return `${randomElement(firstNames)} ${randomElement(lastNames)}`;
}

// Format date as DD.MM.YYYY
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Get the first user and company
  const user = await prisma.user.findFirst({
    include: { company: true }
  });

  if (!user) {
    console.error('❌ No user found. Please create a user first.');
    return;
  }

  const companyId = user.companyId;
  const userId = user.id;

  console.log(`📌 Using Company ID: ${companyId}, User ID: ${userId}`);
  console.log(`📌 Company: ${user.company.name}`);

  // Create hotels if they don't exist
  console.log('\n🏨 Creating hotels...');
  const hotels = [];
  for (let i = 0; i < 10; i++) {
    const city = randomElement(cities);
    const hotel = await prisma.hotel.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        adi: `${randomElement(hotelNames)} ${city}`,
        sehir: city,
        ulke: 'Türkiye',
        adres: `${randomElement(['Merkez', 'Sahil', 'Plaj'])} Mahallesi, No: ${randomNumber(1, 100)}`,
        telefon: `+90 ${randomNumber(200, 599)} ${randomNumber(100, 999)} ${randomNumber(1000, 9999)}`,
        email: `info@hotel${i + 1}.com`,
        durum: randomElement(['AKTIF', 'AKTIF', 'AKTIF', 'PASIF']),
        yildizSayisi: randomNumber(3, 5),
        puan: randomNumber(7, 10) + Math.random(),
        aciklama: 'Test oteli - Seed verisi',
        companyId,
      },
    });
    hotels.push(hotel);
  }
  console.log(`✅ Created ${hotels.length} hotels`);

  // Create organizations
  console.log('\n🏢 Creating organizations...');
  const orgs = [];
  for (let i = 0; i < 5; i++) {
    const org = await prisma.organization.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        name: organizations[i],
        description: 'Test organizasyonu',
        contactPerson: randomName(),
        contactEmail: `contact@org${i + 1}.com`,
        contactPhone: `+90 ${randomNumber(200, 599)} ${randomNumber(100, 999)} ${randomNumber(1000, 9999)}`,
        status: 'ACTIVE',
        companyId,
        sehir: randomElement(cities),
        ulke: 'Türkiye',
      },
    });
    orgs.push(org);
  }
  console.log(`✅ Created ${orgs.length} organizations`);

  // Create 40 accommodations
  console.log('\n🛏️  Creating 40 accommodations...');
  const accommodations = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-12-31');

  for (let i = 0; i < 40; i++) {
    const checkIn = randomDate(startDate, endDate);
    const nights = randomNumber(2, 7);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);

    const nightlyRate = randomNumber(500, 3000);
    const totalPrice = nightlyRate * nights;

    const isMunferit = Math.random() > 0.5;
    const organization = isMunferit ? null : randomElement(orgs);

    const accommodation = await prisma.accommodation.create({
      data: {
        adiSoyadi: randomName(),
        unvani: randomElement(titles),
        ulke: 'Türkiye',
        sehir: randomElement(cities),
        girisTarihi: formatDate(checkIn),
        cikisTarihi: formatDate(checkOut),
        odaTipi: randomElement(roomTypes),
        konaklamaTipi: randomElement(boardTypes),
        gecelikUcret: nightlyRate,
        toplamUcret: totalPrice,
        numberOfNights: nights,
        otelAdi: randomElement(hotels).adi,
        organizasyonAdi: organization?.name,
        kurumCari: organization ? `CARI-${randomNumber(1000, 9999)}` : undefined,
        isMunferit,
        companyId,
        organizationId: organization?.id,
      },
    });
    accommodations.push(accommodation);
  }
  console.log(`✅ Created ${accommodations.length} accommodations`);

  // Create 40 accommodation sales (one for each accommodation)
  console.log('\n💰 Creating 40 accommodation sales...');
  let salesCount = 0;
  for (const accommodation of accommodations) {
    const profitMargin = randomNumber(10, 40) / 100; // 10-40% kar marjı
    const sellPricePerNight = accommodation.gecelikUcret * (1 + profitMargin);
    const totalSellPrice = sellPricePerNight * (accommodation.numberOfNights || 1);
    const profit = totalSellPrice - accommodation.toplamUcret;
    const profitPercent = (profit / accommodation.toplamUcret) * 100;

    const paidAmount = Math.random() > 0.3 ? totalSellPrice : randomNumber(0, totalSellPrice);
    const remainingAmount = totalSellPrice - paidAmount;

    let paymentStatus: 'ODENMEDI' | 'KISMI_ODENDI' | 'ODENDI';
    if (paidAmount === 0) paymentStatus = 'ODENMEDI';
    else if (paidAmount >= totalSellPrice) paymentStatus = 'ODENDI';
    else paymentStatus = 'KISMI_ODENDI';

    await prisma.accommodationSale.create({
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
        satisFiyati: Math.round(sellPricePerNight * 100) / 100,
        toplamSatisFiyati: Math.round(totalSellPrice * 100) / 100,
        kar: Math.round(profit * 100) / 100,
        karOrani: Math.round(profitPercent * 100) / 100,
        musteriAdi: randomName(),
        musteriCariKodu: `CARI-${randomNumber(1000, 9999)}`,
        faturaDurumu: randomElement(['BEKLIYOR', 'KESILDI', 'KESILDI']),
        odemeDurumu: paymentStatus,
        odenenTutar: paidAmount,
        kalanTutar: remainingAmount,
        notlar: 'Test satış verisi',
        companyId,
      },
    });
    salesCount++;
  }
  console.log(`✅ Created ${salesCount} accommodation sales`);

  // Create 30 financial transactions
  console.log('\n💳 Creating 30 financial transactions...');
  const financialCategories = [
    'KONAKLAMA', 'TRANSFER', 'OFIS_GIDERLERI', 'TEDARIKCI_ODEMESI', 'MAAŞ', 'VERGI', 'DİĞER'
  ];

  const descriptions = {
    GELIR: [
      'Müşteri ödemesi alındı',
      'Konaklama satış geliri',
      'Tur satış geliri',
      'Transfer hizmeti geliri',
      'Ek hizmet geliri',
    ],
    GIDER: [
      'Otel ödemesi yapıldı',
      'Ofis kira ödemesi',
      'Personel maaş ödemesi',
      'Tedarikçi ödemesi',
      'Vergi ödemesi',
      'Elektrik faturası',
      'İnternet faturası',
      'Ofis malzeme alımı',
    ],
  };

  for (let i = 0; i < 30; i++) {
    const type = randomElement(['GELIR', 'GIDER', 'GELIR']) as 'GELIR' | 'GIDER'; // Biraz daha fazla gelir
    const category = randomElement(financialCategories) as 'KONAKLAMA' | 'TRANSFER' | 'OFIS_GIDERLERI' | 'TEDARIKCI_ODEMESI' | 'MAAŞ' | 'VERGI' | 'DİĞER';
    const amount = randomNumber(500, 15000);
    const date = randomDate(new Date('2024-01-01'), new Date());

    await prisma.financialTransaction.create({
      data: {
        type,
        category,
        description: randomElement(descriptions[type]),
        amount,
        date,
        companyId,
        userId,
        notes: `Test ${type.toLowerCase()} verisi`,
      },
    });
  }
  console.log('✅ Created 30 financial transactions');

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 40 Accommodations (Konaklama Alışları)`);
  console.log(`   - 40 Accommodation Sales (Konaklama Satışları)`);
  console.log(`   - 30 Financial Transactions (Finans İşlemleri)`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
