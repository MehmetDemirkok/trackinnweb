"use client";

import { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  Building2,
  Calendar,
  Hotel,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Briefcase
} from 'lucide-react';

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
  projeAdi?: string;
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

interface FolderNode {
  id: string;
  name: string;
  type: 'root' | 'hotel' | 'customer' | 'date' | 'payment' | 'invoice' | 'project';
  icon?: React.ReactNode;
  count: number;
  totalRevenue: number;
  totalProfit: number;
  records?: AccommodationSale[];
  children?: FolderNode[];
  isOpen?: boolean;
}

interface SalesFolderTreeProps {
  records: AccommodationSale[];
  onFolderSelect: (folder: FolderNode) => void;
  selectedFolderId?: string;
  viewMode?: 'hotel' | 'customer' | 'date' | 'payment' | 'invoice' | 'combined' | 'project';
}

export default function SalesFolderTree({
  records,
  onFolderSelect,
  selectedFolderId,
  viewMode = 'combined'
}: SalesFolderTreeProps) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  useEffect(() => {
    const folderStructure = buildFolderStructure(records, viewMode);
    setFolders(folderStructure);
  }, [records, viewMode]);

  const buildFolderStructure = (
    records: AccommodationSale[],
    mode: string
  ): FolderNode[] => {
    const root: FolderNode = {
      id: 'root',
      name: 'Tüm Satışlar',
      type: 'root',
      icon: <FileText className="w-4 h-4" />,
      count: records.length,
      totalRevenue: records.reduce((sum, r) => sum + (r.toplamSatisFiyati || 0), 0),
      totalProfit: records.reduce((sum, r) => sum + (r.kar || 0), 0),
      children: [],
      records: records
    };

    if (mode === 'project' || mode === 'combined') {
      // Proje bazlı klasörleme
      const projectMap = new Map<string, AccommodationSale[]>();

      records.forEach(record => {
        const projectName = record.projeAdi || 'Proje Belirtilmemiş';
        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, []);
        }
        projectMap.get(projectName)!.push(record);
      });

      const projectFolders: FolderNode[] = [];
      
      projectMap.forEach((projectRecords, projectName) => {
        projectFolders.push({
          id: `project-${projectName}`,
          name: projectName,
          type: 'project',
          icon: <Briefcase className="w-4 h-4" />,
          count: projectRecords.length,
          totalRevenue: projectRecords.reduce((sum, r) => sum + (r.toplamSatisFiyati || 0), 0),
          totalProfit: projectRecords.reduce((sum, r) => sum + (r.kar || 0), 0),
          records: projectRecords
        });
      });

      if (projectFolders.length > 0) {
        root.children!.push({
          id: 'by-project',
          name: 'Projelere Göre',
          type: 'root',
          icon: <Briefcase className="w-4 h-4" />,
          count: records.length,
          totalRevenue: root.totalRevenue,
          totalProfit: root.totalProfit,
          children: projectFolders.sort((a, b) => b.count - a.count)
        });
      }
    }

    if (mode === 'hotel' || mode === 'combined') {
      // Otel bazlı klasörleme
      const hotelMap = new Map<string, AccommodationSale[]>();

      records.forEach(record => {
        const hotelName = record.otelAdi || 'Otel Belirtilmemiş';
        if (!hotelMap.has(hotelName)) {
          hotelMap.set(hotelName, []);
        }
        hotelMap.get(hotelName)!.push(record);
      });

      const hotelFolders: FolderNode[] = [];
      
      hotelMap.forEach((hotelRecords, hotelName) => {
        hotelFolders.push({
          id: `hotel-${hotelName}`,
          name: hotelName,
          type: 'hotel',
          icon: <Hotel className="w-4 h-4" />,
          count: hotelRecords.length,
          totalRevenue: hotelRecords.reduce((sum, r) => sum + (r.toplamSatisFiyati || 0), 0),
          totalProfit: hotelRecords.reduce((sum, r) => sum + (r.kar || 0), 0),
          records: hotelRecords
        });
      });

      if (hotelFolders.length > 0) {
        root.children!.push({
          id: 'by-hotel',
          name: 'Otellere Göre',
          type: 'root',
          icon: <Hotel className="w-4 h-4" />,
          count: records.length,
          totalRevenue: root.totalRevenue,
          totalProfit: root.totalProfit,
          children: hotelFolders.sort((a, b) => b.count - a.count)
        });
      }
    }

    if (mode === 'customer' || mode === 'combined') {
      // Müşteri bazlı klasörleme
      const customerMap = new Map<string, AccommodationSale[]>();

      records.forEach(record => {
        const customerName = record.musteriAdi || 'Satış müşterisi belirtilmemiş';
        if (!customerMap.has(customerName)) {
          customerMap.set(customerName, []);
        }
        customerMap.get(customerName)!.push(record);
      });

      const customerFolders: FolderNode[] = [];
      
      customerMap.forEach((customerRecords, customerName) => {
        customerFolders.push({
          id: `customer-${customerName}`,
          name: customerName,
          type: 'customer',
          icon: <Users className="w-4 h-4" />,
          count: customerRecords.length,
          totalRevenue: customerRecords.reduce((sum, r) => sum + (r.toplamSatisFiyati || 0), 0),
          totalProfit: customerRecords.reduce((sum, r) => sum + (r.kar || 0), 0),
          records: customerRecords
        });
      });

      if (customerFolders.length > 0) {
        root.children!.push({
          id: 'by-customer',
          name: 'Müşterilere Göre',
          type: 'root',
          icon: <Users className="w-4 h-4" />,
          count: records.length,
          totalRevenue: root.totalRevenue,
          totalProfit: root.totalProfit,
          children: customerFolders.sort((a, b) => b.count - a.count)
        });
      }
    }

    if (mode === 'payment' || mode === 'combined') {
      // Ödeme durumu bazlı klasörleme
      const paymentMap = new Map<string, AccommodationSale[]>();

      records.forEach(record => {
        const paymentStatus = record.odemeDurumu;
        if (!paymentMap.has(paymentStatus)) {
          paymentMap.set(paymentStatus, []);
        }
        paymentMap.get(paymentStatus)!.push(record);
      });

      const paymentLabels: { [key: string]: string } = {
        'ODENMEDI': 'Ödenmedi',
        'KISMI_ODENDI': 'Kısmi Ödendi',
        'ODENDI': 'Ödendi'
      };

      const paymentFolders: FolderNode[] = [];
      
      paymentMap.forEach((paymentRecords, paymentStatus) => {
        paymentFolders.push({
          id: `payment-${paymentStatus}`,
          name: paymentLabels[paymentStatus] || paymentStatus,
          type: 'payment',
          icon: <CreditCard className="w-4 h-4" />,
          count: paymentRecords.length,
          totalRevenue: paymentRecords.reduce((sum, r) => sum + (r.toplamSatisFiyati || 0), 0),
          totalProfit: paymentRecords.reduce((sum, r) => sum + (r.kar || 0), 0),
          records: paymentRecords
        });
      });

      if (paymentFolders.length > 0) {
        root.children!.push({
          id: 'by-payment',
          name: 'Ödeme Durumuna Göre',
          type: 'root',
          icon: <CreditCard className="w-4 h-4" />,
          count: records.length,
          totalRevenue: root.totalRevenue,
          totalProfit: root.totalProfit,
          children: paymentFolders
        });
      }
    }

    if (mode === 'invoice' || mode === 'combined') {
      // Fatura durumu bazlı klasörleme
      const invoiceMap = new Map<string, AccommodationSale[]>();

      records.forEach(record => {
        const invoiceStatus = record.faturaDurumu;
        if (!invoiceMap.has(invoiceStatus)) {
          invoiceMap.set(invoiceStatus, []);
        }
        invoiceMap.get(invoiceStatus)!.push(record);
      });

      const invoiceLabels: { [key: string]: string } = {
        'BEKLIYOR': 'Bekliyor',
        'KESILDI': 'Kesildi',
        'IPTAL': 'İptal'
      };

      const invoiceFolders: FolderNode[] = [];
      
      invoiceMap.forEach((invoiceRecords, invoiceStatus) => {
        invoiceFolders.push({
          id: `invoice-${invoiceStatus}`,
          name: invoiceLabels[invoiceStatus] || invoiceStatus,
          type: 'invoice',
          icon: <Receipt className="w-4 h-4" />,
          count: invoiceRecords.length,
          totalRevenue: invoiceRecords.reduce((sum, r) => sum + (r.toplamSatisFiyati || 0), 0),
          totalProfit: invoiceRecords.reduce((sum, r) => sum + (r.kar || 0), 0),
          records: invoiceRecords
        });
      });

      if (invoiceFolders.length > 0) {
        root.children!.push({
          id: 'by-invoice',
          name: 'Fatura Durumuna Göre',
          type: 'root',
          icon: <Receipt className="w-4 h-4" />,
          count: records.length,
          totalRevenue: root.totalRevenue,
          totalProfit: root.totalProfit,
          children: invoiceFolders
        });
      }
    }

    if (mode === 'date' || mode === 'combined') {
      // Tarih bazlı klasörleme (ay/yıl)
      const yearMap = new Map<string, Map<number, AccommodationSale[]>>();
      
      records.forEach(record => {
        try {
          const date = new Date(record.girisTarihi);
          if (isNaN(date.getTime())) {
            console.warn('Geçersiz tarih:', record.girisTarihi);
            return;
          }
          
          const year = date.getFullYear().toString();
          const month = date.getMonth(); // 0-11 arası
          
          if (!yearMap.has(year)) {
            yearMap.set(year, new Map());
          }
          
          if (!yearMap.get(year)!.has(month)) {
            yearMap.get(year)!.set(month, []);
          }
          
          yearMap.get(year)!.get(month)!.push(record);
        } catch (error) {
          console.error('Tarih parse hatası:', record.girisTarihi, error);
        }
      });

      const dateFolders: FolderNode[] = [];
      
      // Yılları sırala (en yeni önce)
      const sortedYears = Array.from(yearMap.keys()).sort((a, b) => parseInt(b) - parseInt(a));
      
      const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      
      sortedYears.forEach(year => {
        const monthFolders: FolderNode[] = [];
        const months = yearMap.get(year)!;
        
        // Ayları sırala (en yeni önce)
        const sortedMonths = Array.from(months.keys()).sort((a, b) => b - a);
        
        sortedMonths.forEach(month => {
          const monthRecords = months.get(month)!;
          const monthYear = `${monthNames[month]} ${year}`;
          monthFolders.push({
            id: `month-${year}-${month}`,
            name: monthYear,
            type: 'date',
            icon: <Calendar className="w-4 h-4" />,
            count: monthRecords.length,
            totalRevenue: monthRecords.reduce((sum, r) => sum + (r.toplamSatisFiyati || 0), 0),
            totalProfit: monthRecords.reduce((sum, r) => sum + (r.kar || 0), 0),
            records: monthRecords
          });
        });

        const yearRecords = Array.from(months.values()).flat();
        dateFolders.push({
          id: `year-${year}`,
          name: year,
          type: 'date',
          icon: <Calendar className="w-4 h-4" />,
          count: yearRecords.length,
          totalRevenue: yearRecords.reduce((sum, r) => sum + (r.toplamSatisFiyati || 0), 0),
          totalProfit: yearRecords.reduce((sum, r) => sum + (r.kar || 0), 0),
          children: monthFolders
        });
      });

      if (dateFolders.length > 0) {
        root.children!.push({
          id: 'by-date',
          name: 'Tarihlere Göre',
          type: 'root',
          icon: <Calendar className="w-4 h-4" />,
          count: records.length,
          totalRevenue: root.totalRevenue,
          totalProfit: root.totalProfit,
          children: dateFolders
        });
      }
    }

    return [root];
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolder = (folder: FolderNode, level: number = 0): React.ReactNode => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
            ${isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
            ${level > 0 ? 'ml-4' : ''}
          `}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleFolder(folder.id);
            }
            if (folder.records || !hasChildren) {
              onFolderSelect(folder);
            }
          }}
        >
          {hasChildren && (
            <span className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          {!hasChildren && <span className="w-4 h-4" />}
          
          <span className="flex-shrink-0">
            {folder.icon || (isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />)}
          </span>
          
          <span className="flex-1 truncate font-medium">{folder.name}</span>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{folder.count}</span>
            {folder.totalRevenue > 0 && (
              <span className="text-green-600 font-semibold">
                ₺{folder.totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </span>
            )}
            {folder.totalProfit > 0 && (
              <span className="text-purple-600 font-semibold">
                +₺{folder.totalProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Klasörler</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const root = folders[0];
              if (root) onFolderSelect(root);
            }}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedFolderId === 'root' || !selectedFolderId
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tümü ({records.length})
          </button>
        </div>
      </div>
      
      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {folders.map(folder => renderFolder(folder))}
      </div>
    </div>
  );
}

