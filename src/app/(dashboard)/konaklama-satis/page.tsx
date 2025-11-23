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
  Clock
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
      KISMI_ODENDI: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Kısmi Ödendi' },
      ODENDI: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Ödendi' }
    };
    const badge = badges[status as keyof typeof badges] || badges.ODENMEDI;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedSaleIds.length === filteredSales.length && filteredSales.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Misafir</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Otel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alış</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satış</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödeme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
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
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSaleIds.includes(sale.id)}
                          onChange={() => handleSelectSale(sale.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{sale.adiSoyadi}</div>
                          <div className="text-sm text-gray-500">{sale.unvani}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.otelAdi || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.girisTarihi} - {sale.cikisTarihi}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₺{sale.toplamAlisFiyati.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₺{sale.toplamSatisFiyati.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-purple-600">
                          ₺{sale.kar.toLocaleString('tr-TR')}
                        </div>
                        <div className="text-xs text-gray-500">%{sale.karOrani.toFixed(1)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.musteriAdi || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(sale.odemeDurumu)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(sale)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="text-red-600 hover:text-red-900"
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
    </div>
  );
}
