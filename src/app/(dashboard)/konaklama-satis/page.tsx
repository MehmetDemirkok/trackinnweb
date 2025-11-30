'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SalesFolderTree from '@/app/components/SalesFolderTree';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  AlertCircle,
  Edit,
  Trash2,
  FileInput,
  FileOutput,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { robotoBase64 } from '@/lib/fonts/roboto';

interface AccommodationSale {
  id: number;
  accommodationId: number;
  adiSoyadi: string;
  unvani: string;
  ulke: string;
  sehir: string;
  girisTarihi: string;
  cikisTarihi: string;
  odaTipi: string;
  konaklamaTipi: string;
  otelAdi?: string;
  alisFiyati: number;
  toplamAlisFiyati: number;
  satisFiyati: number;
  toplamSatisFiyati: number;
  kar: number;
  karOrani: number;
  musteriAdi?: string;
  musteriCariKodu?: string;
  faturaDurumu: 'BEKLIYOR' | 'KESILDI' | 'IPTAL';
  odemeDurumu: 'ODENMEDI' | 'KISMI_ODENDI' | 'ODENDI';
  notlar?: string;
  odenenTutar: number;
  kalanTutar: number;
  createdAt: string;
}

export default function AccommodationSalesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [sales, setSales] = useState<AccommodationSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<AccommodationSale[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');
  const [showFolders, setShowFolders] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<AccommodationSale | null>(null);
  const [selectedSaleIds, setSelectedSaleIds] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgProfitMargin: 0
  });

  // Puantaj raporu state'leri
  const [showPuantajFilterModal, setShowPuantajFilterModal] = useState(false);
  const [puantajFilters, setPuantajFilters] = useState({
    baslangicTarihi: '',
    bitisTarihi: ''
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/accommodation-sales');
      if (res.ok) {
        const data = await res.json();
        const salesData = data.sales || [];
        setSales(salesData);
        setFilteredSales(salesData);
        calculateStats(salesData);
      }
    } catch (error) {
      console.error('Satış verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (salesData: AccommodationSale[]) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.toplamSatisFiyati, 0);
    const totalProfit = salesData.reduce((sum, sale) => sum + sale.kar, 0);
    const avgProfitMargin = salesData.length > 0
      ? salesData.reduce((sum, sale) => sum + sale.karOrani, 0) / salesData.length
      : 0;

    setStats({
      totalSales: salesData.length,
      totalRevenue,
      totalProfit,
      avgProfitMargin
    });
  };

  const handleFolderSelect = (folder: any) => {
    setSelectedFolderId(folder.id);
    if (folder.records) {
      setFilteredSales(folder.records);
      calculateStats(folder.records);
    } else if (folder.id === 'root') {
      setFilteredSales(sales);
      calculateStats(sales);
    } else {
      setFilteredSales(sales);
      calculateStats(sales);
    }
  };

  const handleEdit = (sale: AccommodationSale) => {
    setEditingSale(sale);
    setShowEditModal(true);
  };

  const handlePaymentStatusChange = async (saleId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/accommodation-sales/${saleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odemeDurumu: newStatus,
        }),
      });

      if (res.ok) {
        // Silently update the list without alert
        fetchSales();
      } else {
        const data = await res.json();
        alert(data.error || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Payment status update error:', error);
      alert('Güncelleme sırasında bir hata oluştu');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu satış kaydını silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/accommodation-sales/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchSales();
        alert('Satış kaydı silindi');
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme işlemi başarısız');
    }
  };

  const handleSelectSale = (id: number) => {
    setSelectedSaleIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(saleId => saleId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedSaleIds.length === filteredSales.length) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(filteredSales.map(sale => sale.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSaleIds.length === 0) {
      alert('Lütfen silmek için en az bir kayıt seçin');
      return;
    }

    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/accommodation-sales/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedSaleIds }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || `${selectedSaleIds.length} kayıt başarıyla silindi`);
        setSelectedSaleIds([]);
        setShowBulkDeleteModal(false);
        fetchSales();
      } else {
        alert(data.error || 'Toplu silme başarısız');
      }
    } catch (error) {
      console.error('Toplu silme hatası:', error);
      alert('Toplu silme sırasında bir hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  };

  // Puantaj raporu modalını açan fonksiyon
  const handlePuantajRaporu = async () => {
    try {
      if (filteredSales.length > 0) {
        const allDates = filteredSales.flatMap((record: any) => [
          new Date(record.girisTarihi),
          new Date(record.cikisTarihi)
        ]);
        const minDate = new Date(Math.min(...allDates.map((date: Date) => date.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((date: Date) => date.getTime())));

        const minDateStr = minDate.toISOString().split('T')[0];
        const maxDateStr = maxDate.toISOString().split('T')[0];

        setPuantajFilters({
          baslangicTarihi: minDateStr,
          bitisTarihi: maxDateStr
        });
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
      let records = filteredSales;

      let startDate = baslangicTarihi ? new Date(baslangicTarihi) : null;
      let endDate = bitisTarihi ? new Date(bitisTarihi) : null;

      if (!startDate || !endDate) {
        const allDates = records.flatMap((record: any) => [
          new Date(record.girisTarihi),
          new Date(record.cikisTarihi)
        ]);
        const minDate = new Date(Math.min(...allDates.map((date: Date) => date.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((date: Date) => date.getTime())));

        if (!startDate) startDate = minDate;
        if (!endDate) endDate = maxDate;
      }

      records = records.filter((record: any) => {
        const recordBaslangic = new Date(record.girisTarihi);
        const recordBitis = new Date(record.cikisTarihi);
        return recordBaslangic <= endDate && recordBitis >= startDate;
      });

      const sortedRecords = [...records].sort((a, b) => {
        const dateA = new Date(a.girisTarihi).getTime();
        const dateB = new Date(b.girisTarihi).getTime();
        return dateA - dateB;
      });

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Satış Puantajı');

      const headers = [
        'Misafir',
        'Ünvan',
        'Otel',
        'Müşteri',
        'Alış Fiy.',
        'Satış Fiy.',
        'Kar',
        'Kar %',
        'Ödeme',
        'Giriş',
        'Çıkış'
      ];

      const dateRange: Date[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      dateRange.forEach(date => {
        headers.push(date.toLocaleDateString('tr-TR'));
      });

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

      sortedRecords.forEach(record => {
        const row = [
          record.adiSoyadi || '',
          record.unvani || '',
          record.otelAdi || '',
          record.musteriAdi || '-',
          record.toplamAlisFiyati || 0,
          record.toplamSatisFiyati || 0,
          record.kar || 0,
          record.karOrani || 0,
          record.odemeDurumu || '-',
          new Date(record.girisTarihi).toLocaleDateString('tr-TR'),
          new Date(record.cikisTarihi).toLocaleDateString('tr-TR')
        ];

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
        dataRow.font = { size: 10, name: 'Arial' };
        dataRow.alignment = { vertical: 'middle', wrapText: true };

        dataRow.getCell(5).numFmt = '#,##0.00 ₺';
        dataRow.getCell(6).numFmt = '#,##0.00 ₺';
        dataRow.getCell(7).numFmt = '#,##0.00 ₺';
        dataRow.getCell(8).numFmt = '0.00%';

        for (let i = 5; i <= 8; i++) {
          dataRow.getCell(i).alignment = { horizontal: 'right', vertical: 'middle' };
        }
        dataRow.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };

        for (let i = 12; i <= headers.length; i++) {
          dataRow.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 15;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 20;
      worksheet.getColumn(5).width = 15;
      worksheet.getColumn(6).width = 15;
      worksheet.getColumn(7).width = 15;
      worksheet.getColumn(8).width = 12;
      worksheet.getColumn(9).width = 15;
      worksheet.getColumn(10).width = 15;
      worksheet.getColumn(11).width = 15;

      for (let i = 12; i <= headers.length; i++) {
        worksheet.getColumn(i).width = 8;
      }

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

      const fileName = `Satis_Puantaj_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.xlsx`;

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

  const handleExportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Satışlar');

    // Başlık
    worksheet.mergeCells('A1:O1');
    worksheet.getCell('A1').value = 'Konaklama Satış Listesi';
    worksheet.getCell('A1').font = { size: 16, bold: true, name: 'Arial' };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    // Başlık satırı
    const headerRow = worksheet.addRow([
      'Misafir',
      'Ünvan',
      'Otel',
      'Giriş',
      'Çıkış',
      'Alış Fiyatı',
      'Satış Fiyatı',
      'Kar',
      'Kar Oranı',
      'Müşteri',
      'Fatura',
      'Ödeme',
      'Ödenen',
      'Kalan'
    ]);
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
    filteredSales.forEach(sale => {
      const row = worksheet.addRow([
        sale.adiSoyadi,
        sale.unvani || '-',
        sale.otelAdi || '-',
        new Date(sale.girisTarihi).toLocaleDateString('tr-TR'),
        new Date(sale.cikisTarihi).toLocaleDateString('tr-TR'),
        sale.toplamAlisFiyati,
        sale.toplamSatisFiyati,
        sale.kar,
        sale.karOrani,
        sale.musteriAdi || '-',
        sale.faturaDurumu,
        sale.odemeDurumu,
        sale.odenenTutar,
        sale.kalanTutar
      ]);
      row.font = { size: 10, name: 'Arial' };
      row.alignment = { vertical: 'middle', wrapText: true };

      // Para birimi formatları
      row.getCell(6).numFmt = '#,##0.00 ₺';
      row.getCell(7).numFmt = '#,##0.00 ₺';
      row.getCell(8).numFmt = '#,##0.00 ₺';
      row.getCell(9).numFmt = '0.00%';
      row.getCell(13).numFmt = '#,##0.00 ₺';
      row.getCell(14).numFmt = '#,##0.00 ₺';

      // Hizalama
      row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(14).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Sütun genişlikleri
    worksheet.getColumn(1).width = 25; // Misafir
    worksheet.getColumn(2).width = 20; // Ünvan
    worksheet.getColumn(3).width = 25; // Otel
    worksheet.getColumn(4).width = 12; // Giriş
    worksheet.getColumn(5).width = 12; // Çıkış
    worksheet.getColumn(6).width = 15; // Alış Fiyatı
    worksheet.getColumn(7).width = 15; // Satış Fiyatı
    worksheet.getColumn(8).width = 15; // Kar
    worksheet.getColumn(9).width = 12; // Kar Oranı
    worksheet.getColumn(10).width = 20; // Müşteri
    worksheet.getColumn(11).width = 15; // Fatura
    worksheet.getColumn(12).width = 15; // Ödeme
    worksheet.getColumn(13).width = 15; // Ödenen
    worksheet.getColumn(14).width = 15; // Kalan

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
      if (rowNumber > 2 && rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' }
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Konaklama_Satislar_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    // Font ekle
    doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

    // PDF metadata ve encoding ayarları
    doc.setProperties({
      title: 'Konaklama Satış Listesi',
      subject: 'Satış Raporu',
      author: 'Yurtsever Konaklama Yönetim Sistemi',
      creator: 'TrackInn Web',
      keywords: 'konaklama, satış, rapor'
    });

    // Türkçe karakter desteği için font ayarları
    doc.setFont('Roboto', 'normal');

    // Başlık
    doc.setFontSize(18);
    doc.setFont('Roboto', 'normal');
    doc.text('Konaklama Satış Listesi', 14, 22);
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    const createDate = `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
    const totalRecords = `Toplam Kayıt: ${filteredSales.length}`;
    doc.text(createDate, 14, 28);
    doc.text(totalRecords, 14, 33);

    const tableData = filteredSales.map(sale => [
      sale.adiSoyadi || '-',
      sale.otelAdi || '-',
      `${parseFloat(sale.toplamAlisFiyati.toFixed(2)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
      `${parseFloat(sale.toplamSatisFiyati.toFixed(2)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
      `${parseFloat(sale.kar.toFixed(2)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`,
      `%${sale.karOrani.toFixed(2)}`,
      sale.odemeDurumu || '-'
    ]);

    autoTable(doc, {
      head: [['Misafir', 'Otel', 'Alış', 'Satış', 'Kar', 'Kar %', 'Ödeme']],
      body: tableData,
      startY: 38,
      styles: {
        fontSize: 10,


        font: 'Roboto',
        fontStyle: 'normal',
        textColor: [0, 0, 0],
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        overflow: 'linebreak',
        cellWidth: 'wrap',
        halign: 'left',
        valign: 'middle',
        lineWidth: 0.2,
        lineColor: [180, 180, 180],
        minCellHeight: 8
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,

        font: 'Roboto',
        halign: 'center',
        valign: 'middle',
        cellPadding: { top: 5, right: 3, bottom: 5, left: 3 },
        lineWidth: 0.2,
        lineColor: [180, 180, 180],
        minCellHeight: 10
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
        textColor: [0, 0, 0]
      },

      columnStyles: {
        0: { halign: 'left', cellWidth: 35, fontSize: 10 },
        1: { halign: 'left', cellWidth: 35, fontSize: 10 },
        2: { halign: 'right', cellWidth: 25, fontSize: 10 },
        3: { halign: 'right', cellWidth: 25, fontSize: 10 },
        4: { halign: 'right', cellWidth: 25, fontSize: 10 },
        5: { halign: 'right', cellWidth: 20, fontSize: 10 },
        6: { halign: 'center', cellWidth: 25, fontSize: 10 }
      },
      margin: { top: 38, right: 10, bottom: 20, left: 10 },
      showHead: 'everyPage',
      pageBreak: 'auto',
      theme: 'striped',
      horizontalPageBreak: false
    });

    // Sayfa numaraları
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('Roboto', 'normal');
      const pageText = `Sayfa ${i} / ${pageCount}`;
      doc.text(
        pageText,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      );
    }

    doc.save(`Konaklama_Satislar_${new Date().toISOString().split('T')[0]}.pdf`);
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

  const getPaymentStatusBadge = (status: string) => {
    const badges = {
      ODENMEDI: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Ödenmedi' },
      KISMI_ODENDI: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Kısmi' },
      ODENDI: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Ödendi' }
    };
    const badge = badges[status as keyof typeof badges] || badges.ODENMEDI;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${badge.color}`}>
        <Icon className="w-2.5 h-2.5" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Konaklama Satış Kayıtları</h1>
          <p className="text-gray-500 mt-1">Satış takibi, fatura ve ödeme yönetimi</p>
        </div>

        <div className="flex gap-3">
          {selectedSaleIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Seçili Kayıtları Sil ({selectedSaleIds.length})
            </button>
          )}
          <button
            onClick={handlePuantajRaporu}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Puantaj Export
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileOutput className="w-4 h-4" />
            Excel Export
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileOutput className="w-4 h-4" />
            PDF Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Satış"
          value={stats.totalSales}
          icon={TrendingUp}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          title="Toplam Ciro"
          value={`₺${stats.totalRevenue.toLocaleString('tr-TR')}`}
          icon={DollarSign}
          colorClass="text-green-600"
          bgClass="bg-green-50"
        />
        <StatCard
          title="Toplam Kar"
          value={`₺${stats.totalProfit.toLocaleString('tr-TR')}`}
          icon={PieChart}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <StatCard
          title="Ort. Kar Oranı"
          value={`%${stats.avgProfitMargin.toFixed(1)}`}
          icon={TrendingUp}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
        />
      </div>

      {/* Main Content - Folder Tree + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder Tree Sidebar */}
        {showFolders && (
          <div className="lg:col-span-1">
            <SalesFolderTree
              records={sales}
              onFolderSelect={handleFolderSelect}
              selectedFolderId={selectedFolderId}
              viewMode="combined"
            />
          </div>
        )}

        {/* Sales Table */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${showFolders ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedFolderId === 'root' ? 'Tüm Satışlar' : `Seçili Klasör (${filteredSales.length} kayıt)`}
              </h2>
            </div>
            <button
              onClick={() => setShowFolders(!showFolders)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
            >
              {showFolders ? 'Klasörleri Gizle' : 'Klasörleri Göster'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={selectedSaleIds.length === filteredSales.length && filteredSales.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                    Misafir
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    Otel / Müşteri
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    Tarihler
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                    Oda
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    Gece
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                    Fiyatlar
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                    Kar
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Ödeme
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">

                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-gray-500">Henüz satış kaydı yok</p>
                        <p className="text-sm text-gray-400 mt-1">Konaklama Alış sayfasından kayıt aktarabilirsiniz</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSaleIds.includes(sale.id)}
                          onChange={() => handleSelectSale(sale.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs font-semibold text-gray-900 truncate">{sale.adiSoyadi}</div>
                        <div className="text-[11px] text-gray-500 truncate">{sale.unvani || '-'}</div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs font-medium text-gray-900 truncate">{sale.otelAdi || '-'}</div>
                        {sale.musteriAdi && (
                          <div className="text-[10px] text-blue-600 truncate">{sale.musteriAdi}</div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-[11px]">
                          <div className="text-gray-900 font-medium whitespace-nowrap">{sale.girisTarihi}</div>
                          <div className="text-gray-500 whitespace-nowrap">{sale.cikisTarihi}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-[11px] text-gray-900 font-medium truncate">{sale.odaTipi || '-'}</div>
                        {sale.konaklamaTipi && (
                          <div className="mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${sale.konaklamaTipi === 'UHD' ? 'bg-purple-100 text-purple-700' :
                              sale.konaklamaTipi === 'FB' ? 'bg-blue-100 text-blue-700' :
                                sale.konaklamaTipi === 'HB' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                              }`}>
                              {sale.konaklamaTipi}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <div className="text-xs font-bold text-gray-900">{sale.numberOfNights || 0}</div>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="text-xs font-semibold text-green-600 whitespace-nowrap">
                          ₺{sale.toplamSatisFiyati?.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] text-gray-500 whitespace-nowrap">
                          ₺{sale.toplamAlisFiyati?.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} alış
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="text-xs font-semibold text-purple-600 whitespace-nowrap">
                          ₺{sale.kar?.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] text-gray-500 whitespace-nowrap">
                          %{sale.karOrani?.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <select
                          value={sale.odemeDurumu}
                          onChange={(e) => handlePaymentStatusChange(sale.id, e.target.value)}
                          className={
                            `text-[10px] font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 transition-all ${sale.odemeDurumu === 'ODENDI'
                              ? 'bg-green-100 text-green-700 focus:ring-green-500'
                              : sale.odemeDurumu === 'KISMI_ODENDI'
                                ? 'bg-yellow-100 text-yellow-700 focus:ring-yellow-500'
                                : 'bg-red-100 text-red-700 focus:ring-red-500'
                            }`
                          }
                        >
                          <option value="ODENMEDI">Ödenmedi</option>
                          <option value="KISMI_ODENDI">Kısmi</option>
                          <option value="ODENDI">Ödendi</option>
                        </select>
                      </td>
                      <td className="px-1 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(sale)}
                            className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-1 rounded transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toplu Silme Onay Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Toplu Silme Onayı</h2>
                <p className="text-sm text-gray-500">Bu işlem geri alınamaz</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <span className="font-semibold text-red-600">{selectedSaleIds.length}</span> adet satış kaydını silmek istediğinizden emin misiniz?
              </p>
              <p className="text-sm text-gray-500">
                Seçili tüm kayıtlar kalıcı olarak silinecektir.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isDeleting}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                İptal
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modalı */}
      {showEditModal && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Satış Kaydını Düzenle</h2>
              <p className="text-sm text-gray-500 mt-1">{editingSale.adiSoyadi} - {editingSale.otelAdi}</p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                try {
                  const res = await fetch(`/api/accommodation-sales/${editingSale.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      satisFiyati: parseFloat(formData.get('satisFiyati') as string),
                      musteriAdi: formData.get('musteriAdi') as string,
                      musteriCariKodu: formData.get('musteriCariKodu') as string,
                      faturaDurumu: formData.get('faturaDurumu') as string,
                      odemeDurumu: formData.get('odemeDurumu') as string,
                      odenenTutar: parseFloat(formData.get('odenenTutar') as string) || 0,
                      notlar: formData.get('notlar') as string,
                    }),
                  });

                  if (res.ok) {
                    alert('Satış kaydı güncellendi');
                    setShowEditModal(false);
                    setEditingSale(null);
                    fetchSales();
                  } else {
                    const data = await res.json();
                    alert(data.error || 'Güncelleme başarısız');
                  }
                } catch (error) {
                  console.error('Update error:', error);
                  alert('Güncelleme sırasında bir hata oluştu');
                }
              }}
              className="p-6 space-y-6"
            >
              {/* Misafir Bilgileri - Read Only */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Konaklama Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Misafir:</span>
                    <p className="font-medium text-gray-900">{editingSale.adiSoyadi}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Otel:</span>
                    <p className="font-medium text-gray-900">{editingSale.otelAdi}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Giriş:</span>
                    <p className="font-medium text-gray-900">{new Date(editingSale.girisTarihi).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Çıkış:</span>
                    <p className="font-medium text-gray-900">{new Date(editingSale.cikisTarihi).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Alış Fiyatı:</span>
                    <p className="font-medium text-gray-900">₺{editingSale.toplamAlisFiyati.toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satış Fiyatı (Gecelik) *
                  </label>
                  <input
                    type="number"
                    name="satisFiyati"
                    step="0.01"
                    min="0"
                    defaultValue={editingSale.satisFiyati}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müşteri Adı
                  </label>
                  <input
                    type="text"
                    name="musteriAdi"
                    defaultValue={editingSale.musteriAdi || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müşteri Cari Kodu
                  </label>
                  <input
                    type="text"
                    name="musteriCariKodu"
                    defaultValue={editingSale.musteriCariKodu || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fatura Durumu *
                  </label>
                  <select
                    name="faturaDurumu"
                    defaultValue={editingSale.faturaDurumu}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="BEKLIYOR">Bekliyor</option>
                    <option value="KESILDI">Kesildi</option>
                    <option value="IPTAL">İptal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ödeme Durumu *
                  </label>
                  <select
                    name="odemeDurumu"
                    defaultValue={editingSale.odemeDurumu}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="ODENMEDI">Ödenmedi</option>
                    <option value="KISMI_ODENDI">Kısmi Ödendi</option>
                    <option value="ODENDI">Ödendi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ödenen Tutar
                  </label>
                  <input
                    type="number"
                    name="odenenTutar"
                    step="0.01"
                    min="0"
                    defaultValue={editingSale.odenenTutar}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notlar
                </label>
                <textarea
                  name="notlar"
                  rows={3}
                  defaultValue={editingSale.notlar || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Satışla ilgili notlar..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSale(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Puantaj Filtre Modalı */}
      {showPuantajFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Puantaj Raporu Filtrele</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="baslangicTarihi" className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  id="baslangicTarihi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={puantajFilters.baslangicTarihi}
                  onChange={(e) => setPuantajFilters(prev => ({ ...prev, baslangicTarihi: e.target.value }))}
                  max={puantajFilters.bitisTarihi || undefined}
                />
              </div>
              <div>
                <label htmlFor="bitisTarihi" className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  id="bitisTarihi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={puantajFilters.bitisTarihi}
                  onChange={(e) => setPuantajFilters(prev => ({ ...prev, bitisTarihi: e.target.value }))}
                  min={puantajFilters.baslangicTarihi || undefined}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowPuantajFilterModal(false)}
              >
                İptal
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={async () => {
                  await generatePuantajRaporu();
                }}
              >
                Rapor Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
