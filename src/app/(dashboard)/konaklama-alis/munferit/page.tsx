'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AccommodationTableSection from "@/app/components/AccommodationTableSection";
import AuthGuard from "@/components/layout/AuthGuard";
import * as XLSX from 'xlsx';

interface User {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'SIRKET_YONETICISI';
}

export default function MunferitKonaklamaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Puantaj raporu için state'ler
  const [showPuantajFilterModal, setShowPuantajFilterModal] = useState<boolean>(false);
  const [puantajFilters, setPuantajFilters] = useState({
    organizasyonAdi: '',
    baslangicTarihi: '',
    bitisTarihi: ''
  });
  const [records, setRecords] = useState<any[]>([]);
  const organizasyonRef = useRef<HTMLDivElement>(null);
  const [showOrganizasyonOptions, setShowOrganizasyonOptions] = useState(false);
  const [organizasyonOptions, setOrganizasyonOptions] = useState<string[]>([]);

  // Kullanıcı bilgilerini yükle
  useEffect(() => {
    fetch('/api/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCurrentUser(data.user);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Kullanıcı bilgisi alınamadı:', err);
        setIsLoading(false);
      });
  }, []);

  const hasPageAccess = (): boolean => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SIRKET_YONETICISI') {
      return true;
    }
    return false;
  };

  // Puantaj raporu fonksiyonu
  const handlePuantajRaporu = async () => {
    // Münferit konaklamalar için tarih aralığını belirle
    try {
      const response = await fetch('/api/accommodation?isMunferit=true');
      if (response.ok) {
        const data = await response.json();
        setRecords(data);

        // Organizasyon seçeneklerini güncelle
        const uniqueOrganizations = [...new Set(data.map((record: any) => record.organizasyonAdi).filter(Boolean))];
        setOrganizasyonOptions(uniqueOrganizations);

        // En küçük giriş tarihi ve en büyük çıkış tarihini bul
        if (data.length > 0) {
          const allDates = data.flatMap((record: any) => [new Date(record.girisTarihi), new Date(record.cikisTarihi)]);
          const minDate = new Date(Math.min(...allDates.map((date: Date) => date.getTime())));
          const maxDate = new Date(Math.max(...allDates.map((date: Date) => date.getTime())));

          // Tarihleri YYYY-MM-DD formatına çevir
          const minDateStr = minDate.toISOString().split('T')[0];
          const maxDateStr = maxDate.toISOString().split('T')[0];

          // Filtreleme değerlerini güncelle
          setPuantajFilters(prev => ({
            ...prev,
            baslangicTarihi: minDateStr,
            bitisTarihi: maxDateStr
          }));
        }
      }
    } catch (error) {
      console.error('Münferit konaklama verileri yüklenirken hata:', error);
    }

    // Filtreleme modalını aç
    setShowPuantajFilterModal(true);
  };

  // Puantaj raporu Excel dosyası oluşturma fonksiyonu
  const generatePuantajRaporu = async () => {
    const { organizasyonAdi, baslangicTarihi, bitisTarihi } = puantajFilters;

    try {
      // API'den kayıtları al
      const response = await fetch('/api/accommodation?isMunferit=true');
      if (!response.ok) {
        throw new Error('Kayıtlar alınamadı');
      }

      let records = await response.json();

      // Eğer tarih aralığı belirtilmemişse, en küçük ve en büyük tarihleri bul
      let startDate = baslangicTarihi ? new Date(baslangicTarihi) : null;
      let endDate = bitisTarihi ? new Date(bitisTarihi) : null;

      if (!startDate || !endDate) {
        const allDates = records.flatMap((record: any) => [new Date(record.girisTarihi), new Date(record.cikisTarihi)]);
        const minDate = new Date(Math.min(...allDates.map((date: Date) => date.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((date: Date) => date.getTime())));

        if (!startDate) startDate = minDate;
        if (!endDate) endDate = maxDate;
      }

      // Metin bazlı filtreler
      if (organizasyonAdi) {
        records = records.filter((record: any) =>
          record.organizasyonAdi?.toLowerCase().includes(organizasyonAdi.toLowerCase())
        );
      }

      // Tarih aralığında en az bir gün kesişen kayıtları filtrele
      records = records.filter((record: any) => {
        const recordBaslangic = new Date(record.girisTarihi);
        const recordBitis = new Date(record.cikisTarihi);

        // İki tarih aralığının kesişimi var mı kontrol et
        return (
          (recordBaslangic <= endDate && recordBitis >= startDate)
        );
      });

      // Tüm kayıtları tarih aralıklarına göre düzenle
      const sortedRecords = [...records].sort((a, b) => {
        // Önce giriş tarihine göre sırala
        const dateA = new Date(a.girisTarihi).getTime();
        const dateB = new Date(b.girisTarihi).getTime();
        return dateA - dateB;
      });

      // Tüm tarihleri bul (benzersiz giriş ve çıkış tarihleri)
      const allDatesSet = new Set<string>();
      sortedRecords.forEach(record => {
        // Giriş ve çıkış tarihleri arasındaki tün günleri ekle
        const startDate = new Date(record.girisTarihi);
        const endDate = new Date(record.cikisTarihi);

        // Her gün için döngü
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          allDatesSet.add(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD formatında ekle
          currentDate.setDate(currentDate.getDate() + 1); // Bir sonraki güne geç
        }
      });

      // Tarihleri sırala
      const allDates = Array.from(allDatesSet).sort();

      // Başlık satırını oluştur (Otel konaklama puantajı için)
      const headers = [
        "Adı Soyadı",
        "Unvanı",
        "Cari",
        "Otel Adı",
        "Oda Tipi",
        "Konaklama Tipi",
        "Gecelik Ücret",
        "Toplam Ücret",
        "Giriş Tarihi",
        "Çıkış Tarihi",
        "Gece Sayısı"
      ];

      // Tarih başlıklarını ekle (startDate'den endDate'e kadar)
      const dateRange = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      dateRange.forEach(date => {
        headers.push(date.toLocaleDateString('tr-TR'));
      });

      // Veri satırlarını oluştur
      const dataRows = sortedRecords.map(record => {
        const row = [
          record.adiSoyadi || '',
          record.unvani || '',
          record.kurumCari || '',
          record.otelAdi || '',
          record.odaTipi || '',
          record.konaklamaTipi || '',
          record.gecelikUcret || 0,
          record.toplamUcret || 0,
          new Date(record.girisTarihi).toLocaleDateString('tr-TR'),
          new Date(record.cikisTarihi).toLocaleDateString('tr-TR'),
          record.numberOfNights || 0
        ];

        // Her tarih için kontrol et
        dateRange.forEach(date => {
          const recordStart = new Date(record.girisTarihi);
          const recordEnd = new Date(record.cikisTarihi);

          // Bu tarihte konaklama var mı?
          if (date >= recordStart && date <= recordEnd) {
            row.push('✓'); // Konaklama var
          } else {
            row.push(''); // Konaklama yok
          }
        });

        return row;
      });

      // ExcelJS kullanarak Excel dosyası oluştur
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Puantaj Raporu');

      // Başlık satırı
      const headerRow = worksheet.addRow(headers);
      headerRow.font = {
        bold: true,
        size: 11,
        name: 'Arial',
        color: { argb: 'FFFFFFFF' }
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4285F4' },
      };
      headerRow.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      headerRow.height = 25;

      // Veri satırları
      dataRows.forEach((rowData, index) => {
        const row = worksheet.addRow(rowData);
        row.font = { size: 10, name: 'Arial' };
        row.alignment = { vertical: 'middle', wrapText: true };

        // Para birimi formatları
        row.getCell(7).numFmt = '#,##0.00 ₺'; // Gecelik Ücret
        row.getCell(8).numFmt = '#,##0.00 ₺'; // Toplam Ücret

        // Hizalama
        row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };

        // Tarih sütunlarını ortala
        for (let i = 12; i <= headers.length; i++) {
          row.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Sütun genişliklerini ayarla
      worksheet.getColumn(1).width = 20; // Adı Soyadı
      worksheet.getColumn(2).width = 15; // Unvanı
      worksheet.getColumn(3).width = 20; // Cari
      worksheet.getColumn(4).width = 20; // Otel Adı
      worksheet.getColumn(5).width = 15; // Oda Tipi
      worksheet.getColumn(6).width = 18; // Konaklama Tipi
      worksheet.getColumn(7).width = 15; // Gecelik Ücret
      worksheet.getColumn(8).width = 15; // Toplam Ücret
      worksheet.getColumn(9).width = 15; // Giriş Tarihi
      worksheet.getColumn(10).width = 15; // Çıkış Tarihi
      worksheet.getColumn(11).width = 12; // Gece Sayısı

      // Tarih sütunları için genişlik
      for (let i = 12; i <= headers.length; i++) {
        worksheet.getColumn(i).width = 8;
      }

      // Border ekle
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Alternatif satır renkleri
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1 && rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF5F5F5' }
            };
          });
        }
      });

      // Dosya adını oluştur
      const fileName = `Münferit_Konaklama_Puantaj_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.xlsx`;

      // Dosyayı indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Puantaj raporu oluşturulurken hata:', error);
      alert('Puantaj raporu oluşturulurken bir hata oluştu.');
    }
  };

  // Loading durumu
  if (isLoading) {
    return (
      <AuthGuard>
        <main className="w-full px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-hidden">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 text-center max-w-sm sm:max-w-md mx-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Yükleniyor...</h2>
              <p className="text-sm sm:text-base text-gray-600">Kullanıcı bilgileri kontrol ediliyor.</p>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  // Sayfa erişim kontrolü
  if (!isLoading && !hasPageAccess()) {
    return (
      <AuthGuard>
        <main className="w-full px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-hidden">
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 text-center max-w-sm sm:max-w-md mx-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Erişim Kısıtlı</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Bu sayfaya erişim izniniz bulunmamaktadır.</p>
              <button
                onClick={() => window.history.back()}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="w-full mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Başlık */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/konaklama-alis')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Münferit Konaklamalar</h1>
                <p className="text-gray-600 mt-1">Organizasyona bağlı olmayan konaklama kayıtları</p>
              </div>
            </div>
          </div>
        </div>

        {/* Münferit konaklamalar tablosu */}
        <AccommodationTableSection
          handlePuantajRaporu={handlePuantajRaporu}
          filterType="munferit"
          action={searchParams.get('action')}
        />

        {/* Puantaj Filtre Modalı */}
        {showPuantajFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Puantaj Raporu Filtrele</h2>
              <div className="space-y-4">
                <div className="relative" ref={organizasyonRef}>
                  <label htmlFor="organizasyonAdi" className="block text-sm font-medium text-gray-700 mb-1">Organizasyon Adı</label>
                  <input
                    type="text"
                    id="organizasyonAdi"
                    className="input w-full"
                    value={puantajFilters.organizasyonAdi}
                    onChange={(e) => setPuantajFilters(prev => ({ ...prev, organizasyonAdi: e.target.value }))}
                    onFocus={() => setShowOrganizasyonOptions(true)}
                  />
                  {showOrganizasyonOptions && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-auto">
                      {organizasyonOptions
                        .filter(option => option.toLowerCase().includes(puantajFilters.organizasyonAdi.toLowerCase()))
                        .map((option, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm truncate"
                            onClick={() => {
                              setPuantajFilters(prev => ({ ...prev, organizasyonAdi: option }));
                              setShowOrganizasyonOptions(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      {organizasyonOptions.filter(option => option.toLowerCase().includes(puantajFilters.organizasyonAdi.toLowerCase())).length === 0 && (
                        <div className="px-4 py-2 text-gray-500 italic text-sm">Sonuç bulunamadı</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="baslangicTarihi" className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    id="baslangicTarihi"
                    className="input w-full"
                    value={puantajFilters.baslangicTarihi}
                    onChange={(e) => setPuantajFilters(prev => ({ ...prev, baslangicTarihi: e.target.value }))}
                    max={puantajFilters.bitisTarihi || undefined}
                  />
                </div>
                <div>
                  <label htmlFor="bitisTarihi" className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    id="bitisTarihi"
                    className="input w-full"
                    value={puantajFilters.bitisTarihi}
                    onChange={(e) => setPuantajFilters(prev => ({ ...prev, bitisTarihi: e.target.value }))}
                    min={puantajFilters.baslangicTarihi || undefined}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowPuantajFilterModal(false)}
                >
                  İptal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await generatePuantajRaporu();
                    setShowPuantajFilterModal(false);
                  }}
                >
                  Rapor Oluştur
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
