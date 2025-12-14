'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AccommodationTableSection from '@/app/components/AccommodationTableSection';
import AccommodationFolderTree from '@/app/components/AccommodationFolderTree';
import QuickAddRow from '@/app/components/QuickAddRow';
import AccommodationStatistics from '@/app/components/AccommodationStatistics';
import SalesPriceModal from '@/app/components/SalesPriceModal';
import PaymentModal from '@/components/payment/PaymentModal';
import { transferToSales } from '@/lib/transferToSales';
import {
  BedDouble,
  TrendingUp,
  DollarSign,
  Users,
  ArrowRightCircle,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react';
import { AccommodationRecord } from '@/app/components/AccommodationTableSection';

export default function KonaklamaAlisPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const action = searchParams?.get('action');

  const [stats, setStats] = useState({
    totalRecords: 0,
    totalCost: 0,
    activeGuests: 0,
    suppliers: 0
  });
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [allRecords, setAllRecords] = useState<AccommodationRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AccommodationRecord[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');
  const [showFolders, setShowFolders] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showSalesPriceModal, setShowSalesPriceModal] = useState(false);
  const [pendingTransferIds, setPendingTransferIds] = useState<number[]>([]);
  const [transferredRecordIds, setTransferredRecordIds] = useState<Set<number>>(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    accommodationCount: number;
    accommodationSaleCount: number;
    message: string;
  } | null>(null);

  // Puantaj raporu state'leri
  const [showPuantajFilterModal, setShowPuantajFilterModal] = useState(false);
  const [puantajFilters, setPuantajFilters] = useState({
    baslangicTarihi: '',
    bitisTarihi: ''
  });

  useEffect(() => {
    // Fetch accommodation purchase statistics
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/accommodation?isMunferit=false');
        if (res.ok) {
          const data = await res.json();
          const accommodations = Array.isArray(data) ? data : (data.accommodations || []);

          // Satışa aktarılan kayıtları kontrol et
          const salesRes = await fetch('/api/accommodation-sales');
          if (salesRes.ok) {
            const salesData = await salesRes.json();
            const sales = salesData.sales || [];
            const transferredIds = new Set<number>(sales.map((sale: any) => sale.accommodationId));
            setTransferredRecordIds(transferredIds);
          }

          setAllRecords(accommodations);
          setFilteredRecords(accommodations);

          // Calculate stats
          const totalCost = accommodations.reduce((sum: number, acc: any) => {
            return sum + (parseFloat(acc.toplamUcret) || 0);
          }, 0);

          const activeGuests = accommodations.filter((acc: any) => {
            const today = new Date();
            const checkIn = new Date(acc.girisTarihi);
            const checkOut = new Date(acc.cikisTarihi);
            return checkIn <= today && checkOut >= today;
          }).length;

          setStats({
            totalRecords: accommodations.length,
            totalCost: totalCost,
            activeGuests: activeGuests,
            suppliers: new Set(accommodations.map((acc: any) => acc.otelAdi).filter(Boolean)).size
          });
        }
      } catch (error) {
        console.error('Stats fetch error:', error);
      }
    };

    fetchStats();
  }, []);

  const handleFolderSelect = (folder: any) => {
    setSelectedFolderId(folder.id);
    if (folder.records) {
      setFilteredRecords(folder.records);
    } else if (folder.id === 'root') {
      setFilteredRecords(allRecords);
    } else {
      // Eğer klasörün kayıtları yoksa, tüm kayıtları göster
      setFilteredRecords(allRecords);
    }
  };

  const handleTransferToSales = async (ids: number[]) => {
    if (ids.length === 0) {
      alert('Lütfen satışa aktarmak için en az bir kayıt seçin');
      return;
    }

    // Seçili kayıtları getir
    const selectedRecords = allRecords.filter(record => ids.includes(record.id));

    // Modal'ı göster
    setPendingTransferIds(ids);
    setShowSalesPriceModal(true);
  };

  const handleSalesPriceConfirm = async (prices: Record<number, { satisFiyati: number; toplamSatisFiyati: number }>) => {
    try {
      const result = await transferToSales(pendingTransferIds, prices);

      // Başarılı aktarılan kayıtları işaretle
      const newTransferredIds = new Set(transferredRecordIds);
      pendingTransferIds.forEach(id => newTransferredIds.add(id));
      setTransferredRecordIds(newTransferredIds);

      alert(result.message || 'Kayıtlar başarıyla satışa aktarıldı!');
      setShowSalesPriceModal(false);
      setPendingTransferIds([]);

      // Sayfayı yenile
      window.location.reload();
    } catch (error: any) {
      // Ödeme gerekli hatası
      if (error.status === 402 && error.paymentData) {
        setPaymentData(error.paymentData);
        setShowPaymentModal(true);
        setShowSalesPriceModal(false);
        setPendingTransferIds([]);
      } else {
        alert(error.message || 'Satışa aktarma başarısız oldu');
      }
    }
  };

  // Puantaj raporu modalını açan fonksiyon
  const handlePuantajRaporu = async () => {
    try {
      // Tarih aralığını otomatik hesapla
      if (filteredRecords.length > 0) {
        const allDates = filteredRecords.flatMap((record: any) => [
          new Date(record.girisTarihi),
          new Date(record.cikisTarihi)
        ]);
        const minDate = new Date(Math.min(...allDates.map((date: Date) => date.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((date: Date) => date.getTime())));

        if (!isNaN(minDate.getTime()) && !isNaN(maxDate.getTime())) {
          const minDateStr = minDate.toISOString().split('T')[0];
          const maxDateStr = maxDate.toISOString().split('T')[0];

          setPuantajFilters({
            baslangicTarihi: minDateStr,
            bitisTarihi: maxDateStr
          });
        }
      }
    } catch (error) {
      console.error('Tarih hesaplama hatası:', error);
    }

    setShowPuantajFilterModal(true);
  };

  // Puantaj raporu Excel dosyası oluşturma fonksiyonu
  const generatePuantajRaporu = async () => {
    const { baslangicTarihi, bitisTarihi } = puantajFilters;

    try {
      let records = filteredRecords;

      // Tarih aralığını belirle
      // Tarih aralığını belirle
      let startDate = baslangicTarihi ? new Date(baslangicTarihi) : null;
      // Check for Invalid Date object
      if (startDate && isNaN(startDate.getTime())) startDate = null;

      let endDate = bitisTarihi ? new Date(bitisTarihi) : null;
      // Check for Invalid Date object
      if (endDate && isNaN(endDate.getTime())) endDate = null;

      if (!startDate || !endDate) {
        if (records.length === 0) {
          alert('Listelenecek kayıt bulunamadı.');
          return;
        }

        const allDates = records.flatMap((record: any) => [
          new Date(record.girisTarihi),
          new Date(record.cikisTarihi)
        ]).filter(d => !isNaN(d.getTime()));

        if (allDates.length === 0) {
          alert('Kayıtlarda geçerli tarih bilgisi bulunamadı.');
          return;
        }

        const minDate = new Date(Math.min(...allDates.map((date: Date) => date.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((date: Date) => date.getTime())));

        if (!startDate) startDate = minDate;
        if (!endDate) endDate = maxDate;
      }

      // Tarih aralığında kesişen kayıtları filtrele
      records = records.filter((record: any) => {
        const recordBaslangic = new Date(record.girisTarihi);
        const recordBitis = new Date(record.cikisTarihi);
        return recordBaslangic <= endDate && recordBitis >= startDate;
      });

      // Tarihe göre sırala
      const sortedRecords = [...records].sort((a, b) => {
        const dateA = new Date(a.girisTarihi).getTime();
        const dateB = new Date(b.girisTarihi).getTime();
        return dateA - dateB;
      });

      if (sortedRecords.length === 0) {
        alert('Seçilen tarih aralığında kayıt bulunamadı.');
        return;
      }

      // ExcelJS kullanarak Excel dosyası oluştur
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Konaklama Puantajı');

      // Başlık satırını oluştur
      const headers = [
        'Adı Soyadı',
        'Ünvan',
        'Organizasyon',
        'Otel Adı',
        'Oda Tipi',
        'Konaklama Tipi',
        'Gecelik Ücret',
        'Toplam Ücret',
        'Giriş Tarihi',
        'Çıkış Tarihi',
        'Gece Sayısı'
      ];

      // Tarih sütunlarını ekle
      const dateRange: Date[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      dateRange.forEach(date => {
        headers.push(date.toLocaleDateString('tr-TR'));
      });

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
        fgColor: { argb: 'FF4285F4' }
      };
      headerRow.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      headerRow.height = 25;

      // Veri satırları
      sortedRecords.forEach(record => {
        const row = [
          record.adiSoyadi || '',
          record.unvani || '',
          record.organizasyonAdi || record.organization?.name || '-',
          record.otelAdi || '',
          record.odaTipi || '',
          record.konaklamaTipi || '',
          record.gecelikUcret || 0,
          record.toplamUcret || 0,
          new Date(record.girisTarihi).toLocaleDateString('tr-TR'),
          new Date(record.cikisTarihi).toLocaleDateString('tr-TR'),
          record.numberOfNights || 0
        ];

        // Her tarih için konaklama durumunu kontrol et
        dateRange.forEach(date => {
          const recordStart = new Date(record.girisTarihi);
          const recordEnd = new Date(record.cikisTarihi);

          if (date >= recordStart && date <= recordEnd) {
            row.push('✓');
          } else {
            row.push('');
          }
        });

        const dataRow = worksheet.addRow(row);
        dataRow.font = { size: 10, name: 'Arial', color: { argb: 'FF000000' } };
        dataRow.alignment = { vertical: 'middle', wrapText: true };

        // Para birimi formatları
        dataRow.getCell(7).numFmt = '#,##0.00 ₺';
        dataRow.getCell(8).numFmt = '#,##0.00 ₺';

        // Hizalama
        dataRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
        dataRow.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
        dataRow.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };

        // Tarih sütunlarını ortala
        for (let i = 12; i <= headers.length; i++) {
          dataRow.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Sütun genişliklerini ayarla
      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 15;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 20;
      worksheet.getColumn(5).width = 15;
      worksheet.getColumn(6).width = 18;
      worksheet.getColumn(7).width = 15;
      worksheet.getColumn(8).width = 15;
      worksheet.getColumn(9).width = 15;
      worksheet.getColumn(10).width = 15;
      worksheet.getColumn(11).width = 12;

      // Tarih sütunları için genişlik
      for (let i = 12; i <= headers.length; i++) {
        worksheet.getColumn(i).width = 8;
      }

      // Border ekle
      worksheet.eachRow((row) => {
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
      const safeDateStr = (date: any) => {
        try {
          if (!date || isNaN(new Date(date).getTime())) return 'tarih-yok';
          return new Date(date).toISOString().split('T')[0];
        } catch (e) {
          return 'tarih-yok';
        }
      };

      const fileName = `Konaklama_Puantaj_${safeDateStr(startDate)}_${safeDateStr(endDate)}.xlsx`;

      // Dosyayı indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      setShowPuantajFilterModal(false);
    } catch (error) {
      console.error('Puantaj raporu oluşturulurken hata:', error);
      alert('Puantaj raporu oluşturulurken bir hata oluştu.');
    }
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgClass}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Konaklama Alış Kayıtları</h1>
        <p className="text-gray-500 mt-1">Otellerde konakladığınız misafirlerin kayıtları, ücretler ve tedarikçi takibi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Kayıt"
          value={stats.totalRecords}
          icon={BedDouble}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          title="Toplam Maliyet"
          value={`₺${stats.totalCost.toLocaleString('tr-TR')}`}
          icon={DollarSign}
          colorClass="text-green-600"
          bgClass="bg-green-50"
        />
        <StatCard
          title="Aktif Misafir"
          value={stats.activeGuests}
          icon={Users}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <StatCard
          title="Tedarikçi"
          value={stats.suppliers}
          icon={TrendingUp}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
        />
      </div>

      {/* İstatistikler Toggle */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handlePuantajRaporu}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Puantaj Export</span>
        </button>
        <button
          onClick={() => setShowStatistics(!showStatistics)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showStatistics
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{showStatistics ? 'İstatistikleri Gizle' : 'İstatistikleri Göster'}</span>
        </button>
      </div>

      {/* İstatistikler */}
      {showStatistics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <AccommodationStatistics records={allRecords} />
        </div>
      )}

      {/* Main Content - Folder Tree + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder Tree Sidebar */}
        {showFolders && (
          <div className="lg:col-span-1">
            <AccommodationFolderTree
              records={allRecords}
              onFolderSelect={handleFolderSelect}
              selectedFolderId={selectedFolderId}
              viewMode="combined"
            />
          </div>
        )}

        {/* Main Data Table */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${showFolders ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedFolderId === 'root' ? 'Tüm Kayıtlar' : `Seçili Klasör (${filteredRecords.length} kayıt)`}
              </h2>
            </div>
            <button
              onClick={() => setShowFolders(!showFolders)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
            >
              {showFolders ? 'Klasörleri Gizle' : 'Klasörleri Göster'}
            </button>
          </div>

          {/* Quick Add Row - Tablonun Üstünde */}
          <QuickAddRow
            onAddRecord={(newRecord) => {
              // Refresh the page to show new record
              window.location.reload();
            }}
          />

          <AccommodationTableSection
            filterType="all"
            organizationId={undefined}
            action={action}
            customBulkActions={[
              {
                label: 'Satışa Aktar',
                onClick: () => handleTransferToSales(selectedRecordIds),
                icon: <ArrowRightCircle className="w-4 h-4" />,
                color: 'green'
              }
            ]}
            onSelectionChange={setSelectedRecordIds}
            filteredRecords={filteredRecords}
            transferredRecordIds={transferredRecordIds}
          />

          {/* Satış Fiyatı Modal */}
          {showSalesPriceModal && (
            <SalesPriceModal
              isOpen={showSalesPriceModal}
              records={allRecords.filter(record => pendingTransferIds.includes(record.id))}
              onClose={() => {
                setShowSalesPriceModal(false);
                setPendingTransferIds([]);
              }}
              onConfirm={handleSalesPriceConfirm}
            />
          )}

          {/* Ödeme Modal */}
          {showPaymentModal && paymentData && (
            <PaymentModal
              isOpen={showPaymentModal}
              onClose={() => {
                setShowPaymentModal(false);
                setPaymentData(null);
              }}
              onSuccess={() => {
                setShowPaymentModal(false);
                setPaymentData(null);
                // Sayfayı yenile
                window.location.reload();
              }}
              accommodationCount={paymentData.accommodationCount}
              accommodationSaleCount={paymentData.accommodationSaleCount}
              message={paymentData.message}
            />
          )}

          {/* Puantaj Filtre Modalı */}
          {showPuantajFilterModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-100 transform transition-all">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Puantaj Raporu</h2>
                    <p className="text-sm text-gray-500 mt-1">Raporlanacak tarih aralığını belirleyin</p>
                  </div>
                  <button
                    onClick={() => setShowPuantajFilterModal(false)}
                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Hızlı Seçim Butonları */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Hızlı Seçim</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      {
                        label: 'Bu Ay', fn: () => {
                          const now = new Date();
                          const start = new Date(now.getFullYear(), now.getMonth(), 1);
                          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                          const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          setPuantajFilters({ baslangicTarihi: format(start), bitisTarihi: format(end) });
                        }
                      },
                      {
                        label: 'Geçen Ay', fn: () => {
                          const now = new Date();
                          const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                          const end = new Date(now.getFullYear(), now.getMonth(), 0);
                          const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          setPuantajFilters({ baslangicTarihi: format(start), bitisTarihi: format(end) });
                        }
                      },
                      {
                        label: 'Son 3 Ay', fn: () => {
                          const now = new Date();
                          const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                          const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          setPuantajFilters({ baslangicTarihi: format(start), bitisTarihi: format(end) });
                        }
                      },
                      {
                        label: 'Bu Yıl', fn: () => {
                          const now = new Date();
                          const start = new Date(now.getFullYear(), 0, 1);
                          const end = new Date(now.getFullYear(), 11, 31);
                          const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          setPuantajFilters({ baslangicTarihi: format(start), bitisTarihi: format(end) });
                        }
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={item.fn}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 hover:shadow-sm transition-all border border-blue-100 active:scale-95"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="baslangicTarihi" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Başlangıç
                    </label>
                    <input
                      type="date"
                      id="baslangicTarihi"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 shadow-sm outline-none"
                      value={puantajFilters.baslangicTarihi}
                      onChange={(e) => setPuantajFilters(prev => ({ ...prev, baslangicTarihi: e.target.value }))}
                      max={puantajFilters.bitisTarihi || undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="bitisTarihi" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Bitiş
                    </label>
                    <input
                      type="date"
                      id="bitisTarihi"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 shadow-sm outline-none"
                      value={puantajFilters.bitisTarihi}
                      onChange={(e) => setPuantajFilters(prev => ({ ...prev, bitisTarihi: e.target.value }))}
                      min={puantajFilters.baslangicTarihi || undefined}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                  <button
                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    onClick={() => setShowPuantajFilterModal(false)}
                  >
                    Vazgeç
                  </button>
                  <button
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 hover:translate-y-[-1px] active:translate-y-[0px]"
                    onClick={async () => {
                      await generatePuantajRaporu();
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Rapor Oluştur
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
