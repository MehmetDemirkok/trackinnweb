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
  Briefcase
} from 'lucide-react';
import { AccommodationRecord } from './AccommodationTableSection';

interface FolderNode {
  id: string;
  name: string;
  type: 'root' | 'organization' | 'hotel' | 'date' | 'munferit' | 'project';
  icon?: React.ReactNode;
  count: number;
  totalCost: number;
  children?: FolderNode[];
  records?: AccommodationRecord[];
  isOpen?: boolean;
}

interface AccommodationFolderTreeProps {
  records: AccommodationRecord[];
  onFolderSelect: (folder: FolderNode) => void;
  selectedFolderId?: string;
  viewMode?: 'organization' | 'hotel' | 'date' | 'combined' | 'project';
}

export default function AccommodationFolderTree({
  records,
  onFolderSelect,
  selectedFolderId,
  viewMode = 'combined'
}: AccommodationFolderTreeProps) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  useEffect(() => {
    const folderStructure = buildFolderStructure(records, viewMode);
    setFolders(folderStructure);
  }, [records, viewMode]);

  const buildFolderStructure = (
    records: AccommodationRecord[],
    mode: string
  ): FolderNode[] => {
    const root: FolderNode = {
      id: 'root',
      name: 'Tüm Kayıtlar',
      type: 'root',
      icon: <FileText className="w-4 h-4" />,
      count: records.length,
      totalCost: records.reduce((sum, r) => sum + (r.toplamUcret || 0), 0),
      children: [],
      records: records
    };

    if (mode === 'organization' || mode === 'combined') {
      // Organizasyon bazlı klasörleme
      const orgMap = new Map<string, AccommodationRecord[]>();
      const munferitRecords: AccommodationRecord[] = [];

      records.forEach(record => {
        if (record.organizationId && record.organization) {
          const orgName = record.organization.name;
          if (!orgMap.has(orgName)) {
            orgMap.set(orgName, []);
          }
          orgMap.get(orgName)!.push(record);
        } else {
          munferitRecords.push(record);
        }
      });

      const orgFolders: FolderNode[] = [];
      
      // Organizasyon klasörleri
      orgMap.forEach((orgRecords, orgName) => {
        orgFolders.push({
          id: `org-${orgName}`,
          name: orgName,
          type: 'organization',
          icon: <Users className="w-4 h-4" />,
          count: orgRecords.length,
          totalCost: orgRecords.reduce((sum, r) => sum + (r.toplamUcret || 0), 0),
          records: orgRecords
        });
      });

      // Münferit klasörü
      if (munferitRecords.length > 0) {
        orgFolders.push({
          id: 'munferit',
          name: 'Münferit Kayıtlar',
          type: 'munferit',
          icon: <FileText className="w-4 h-4" />,
          count: munferitRecords.length,
          totalCost: munferitRecords.reduce((sum, r) => sum + (r.toplamUcret || 0), 0),
          records: munferitRecords
        });
      }

      if (orgFolders.length > 0) {
        root.children!.push({
          id: 'by-organization',
          name: 'Organizasyonlara Göre',
          type: 'root',
          icon: <Building2 className="w-4 h-4" />,
          count: records.length,
          totalCost: root.totalCost,
          children: orgFolders.sort((a, b) => b.count - a.count)
        });
      }
    }

    if (mode === 'project' || mode === 'combined') {
      // Proje bazlı klasörleme
      const projectMap = new Map<string, AccommodationRecord[]>();

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
          totalCost: projectRecords.reduce((sum, r) => sum + (r.toplamUcret || 0), 0),
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
          totalCost: root.totalCost,
          children: projectFolders.sort((a, b) => b.count - a.count)
        });
      }
    }

    if (mode === 'hotel' || mode === 'combined') {
      // Otel bazlı klasörleme
      const hotelMap = new Map<string, AccommodationRecord[]>();

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
          totalCost: hotelRecords.reduce((sum, r) => sum + (r.toplamUcret || 0), 0),
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
          totalCost: root.totalCost,
          children: hotelFolders.sort((a, b) => b.count - a.count)
        });
      }
    }

    if (mode === 'date' || mode === 'combined') {
      // Tarih bazlı klasörleme (ay/yıl)
      const yearMap = new Map<string, Map<number, AccommodationRecord[]>>();
      
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
            totalCost: monthRecords.reduce((sum, r) => sum + (r.toplamUcret || 0), 0),
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
          totalCost: yearRecords.reduce((sum, r) => sum + (r.toplamUcret || 0), 0),
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
          totalCost: root.totalCost,
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
            {folder.totalCost > 0 && (
              <span className="text-green-600 font-semibold">
                ₺{folder.totalCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
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

