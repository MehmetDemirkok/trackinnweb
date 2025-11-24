'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'SIRKET_YONETICISI';
  createdAt: string;
  permissions?: string[];
  companyId?: number;
  company?: {
    name: string;
  };
}

interface Company {
  id: number;
  name: string;
  email: string;
  status: string;
}

type CurrentUser = {
  id: number;
  email: string;
  name?: string;
  role: 'ADMIN' | 'SIRKET_YONETICISI';
  companyId?: number;
  companyName?: string;
};

type NewUser = {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'SIRKET_YONETICISI';
  permissions: string[];
  companyId: number;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const router = useRouter();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected user for edit/delete
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form data
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    name: '',
    password: '',
    role: 'SIRKET_YONETICISI',
    permissions: [],
    companyId: 0
  });

  const [editUser, setEditUser] = useState({
    id: 0,
    name: '',
    role: 'SIRKET_YONETICISI' as 'ADMIN' | 'SIRKET_YONETICISI',
    permissions: [] as string[],
    companyId: 0
  });

  // Arama ve filtreleme
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // İstatistikler
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    sirketYoneticisi: 0
  });

  // İzinler listesi - Dashboard modüllerine göre
  const PERMISSIONS = [
    { key: 'home', label: 'Otel Yönetimi' },
    // { key: 'transfer', label: 'Araç Takip' },
    // { key: 'transfer-sales', label: 'Transfer Satışları' },
    { key: 'accommodation', label: 'Konaklama Satışları' },
    { key: 'user-management', label: 'Kullanıcı Yönetimi' },
    { key: 'logs', label: 'Sistem Logları' },
    { key: 'cariler', label: 'Cariler' },
    { key: 'tedarikciler', label: 'Tedarikçiler' },
  ];

  // Rol seçenekleri - ŞİRKET_YÖNETİCİSİ sadece ŞİRKET_YÖNETİCİSİ oluşturabilir
  const getRoleOptions = () => {
    if (currentUser?.role === 'SIRKET_YONETICISI') {
      return [
        { value: 'SIRKET_YONETICISI', label: 'Şirket Yöneticisi' }
      ];
    }
    return [
      { value: 'ADMIN', label: 'Admin' },
      { value: 'SIRKET_YONETICISI', label: 'Şirket Yöneticisi' }
    ];
  };

  // Şirket seçenekleri - ŞİRKET_YÖNETİCİSİ sadece kendi şirketini görebilir
  const getCompanyOptions = () => {
    if (currentUser?.role === 'SIRKET_YONETICISI') {
      return []; // ŞİRKET_YÖNETİCİSİ için şirket listesi gerekli değil
    }
    return companies;
  };

  useEffect(() => {
    checkCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    // currentUser değiştiğinde şirketleri yükle
    if (currentUser && currentUser.role === 'ADMIN') {
      fetchCompanies();
    }
  }, [currentUser]);

  useEffect(() => {
    // İstatistikleri hesapla
    const total = users?.length || 0;
    const admin = users?.filter(u => u.role === 'ADMIN').length || 0;
    const sirketYoneticisi = users?.filter(u => u.role === 'SIRKET_YONETICISI').length || 0;

    setStats({ total, admin, sirketYoneticisi });
  }, [users]);

  useEffect(() => {
    // Filtreleme ve sıralama
    let filtered = users || [];

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filtresi
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Şirket filtresi
    if (companyFilter !== 'all') {
      filtered = filtered.filter(user => user.companyId === parseInt(companyFilter));
    }

    // Sıralama
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, companyFilter, sortBy, sortOrder]);

  const checkCurrentUser = async () => {
    try {
      const res = await fetch('/api/user', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        let user = data.user;

        // Eğer companyId eksikse, token'ı güncelle
        if (!user.companyId && user.role === 'SIRKET_YONETICISI') {
          console.log('ŞİRKET_YÖNETİCİSİ kullanıcısının companyId bilgisi eksik, token güncelleniyor...');
          const refreshRes = await fetch('/api/user/refresh-token', {
            method: 'POST',
            credentials: 'include'
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            user = refreshData.user;
          } else {
            // Token güncellenemezse, veritabanından çek
            const userRes = await fetch('/api/users', { credentials: 'include' });
            if (userRes.ok) {
              const users = await userRes.json();
              const currentUserFromList = users.find((u: any) => u.id === user.id);
              if (currentUserFromList) {
                user = { ...user, companyId: currentUserFromList.companyId };
              }
            }
          }
        }

        setCurrentUser(user);
      } else {
        console.error('Kullanıcı bilgisi alınamadı:', res.status);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Kullanıcı bilgisi alınamadı:', error);
      setCurrentUser(null);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.error('Kullanıcılar yüklenemedi');
        setUsers([]);
      }
    } catch {
      console.error('Bir hata oluştu');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    // ŞİRKET_YÖNETİCİSİ rolü için şirket listesi gerekli değil
    if (currentUser?.role === 'SIRKET_YONETICISI') {
      return;
    }

    // Sadece ADMIN şirketleri görebilir
    if (currentUser?.role !== 'ADMIN') {
      return;
    }

    try {
      const res = await fetch('/api/companies', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Şirketler yüklenemedi:', errorData.error || res.statusText);
        setCompanies([]);
      }
    } catch (error) {
      console.error('Şirketler yüklenirken hata oluştu:', error);
      setCompanies([]);
    }
  };

  // Modal handlers
  const openAddModal = () => {
    const initialCompanyId = currentUser?.role === 'SIRKET_YONETICISI' ? (currentUser.companyId || 0) : 0;
    setNewUser({
      email: '',
      name: '',
      password: '',
      role: 'SIRKET_YONETICISI',
      permissions: [],
      companyId: initialCompanyId
    });
    setShowAddModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    // Admin rolü için tüm izinleri otomatik olarak ekle
    let permissions = user.permissions || [];
    if (user.role === 'ADMIN') {
      permissions = PERMISSIONS.map(p => p.key);
    }
    setEditUser({
      id: user.id,
      name: user.name || '',
      role: user.role,
      permissions: permissions,
      companyId: user.companyId || 0
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewUser({ email: '', name: '', password: '', role: 'SIRKET_YONETICISI', permissions: [], companyId: 0 });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditUser({ id: 0, name: '', role: 'SIRKET_YONETICISI', permissions: [], companyId: 0 });
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ŞİRKET_YÖNETİCİSİ rolü için user-management ve logs iznini otomatik olarak ekle
      let permissions = newUser.permissions;
      if (newUser.role === 'SIRKET_YONETICISI') {
        if (!permissions.includes('user-management')) {
          permissions = [...permissions, 'user-management'];
        }
        if (!permissions.includes('logs')) {
          permissions = [...permissions, 'logs'];
        }
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newUser,
          permissions: permissions,
          companyId: newUser.companyId === 0 ? null : newUser.companyId
        })
      });

      if (res.ok) {
        const user = await res.json();

        setUsers(prev => [user, ...prev]);
        closeAddModal();
      } else {
        console.error('Kullanıcı eklenirken hata oluştu');
      }
    } catch {
      console.error('Kullanıcı eklenirken hata oluştu');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ŞİRKET_YÖNETİCİSİ rolü için user-management ve logs iznini otomatik olarak ekle
      let permissions = editUser.permissions;
      if (editUser.role === 'SIRKET_YONETICISI') {
        if (!permissions.includes('user-management')) {
          permissions = [...permissions, 'user-management'];
        }
        if (!permissions.includes('logs')) {
          permissions = [...permissions, 'logs'];
        }
      }

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editUser.name,
          role: editUser.role,
          permissions: permissions,
          companyId: editUser.companyId === 0 ? null : editUser.companyId
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();

        setUsers(prev => prev.map(user =>
          user.id === editUser.id ? updatedUser : user
        ));
        closeEditModal();

        // Başarı mesajı göster
        alert('Kullanıcı izinleri başarıyla güncellendi! Değişikliklerin etkili olması için dashboard sayfasını yenileyin (F5).');
      } else {
        console.error('Kullanıcı güncellenirken hata oluştu');
        alert('Kullanıcı güncellenirken hata oluştu!');
      }
    } catch {
      console.error('Kullanıcı güncellenirken hata oluştu');
      alert('Kullanıcı güncellenirken hata oluştu!');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
        closeDeleteModal();
      } else {
        console.error('Kullanıcı silinirken hata oluştu');
      }
    } catch {
      console.error('Kullanıcı silinirken hata oluştu');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
      case 'SIRKET_YONETICISI': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'SIRKET_YONETICISI': return 'Şirket Yöneticisi';
      default: return role;
    }
  };

  const handleSort = (column: 'name' | 'email' | 'role' | 'createdAt') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ column }: { column: 'name' | 'email' | 'role' | 'createdAt' }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortOrder === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Yükleniyor...</p>
      </div>
    </div>
  );

  // Eğer currentUser yüklenmediyse ve loading false ise, hata durumu
  if (!loading && !currentUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kullanıcı Bilgisi Alınamadı</h1>
          <p className="text-gray-600 mb-4">Lütfen sayfayı yenileyin veya tekrar giriş yapın.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }

  // Admin yetkisi kontrolü
  if (currentUser && !['ADMIN', 'SIRKET_YONETICISI'].includes(currentUser.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erişim Kısıtlı</h1>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    );
  }



  return (
    <>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Kullanıcı Yönetimi</h1>
              <p className="text-gray-600">
                {currentUser?.role === 'ADMIN'
                  ? 'Tüm kullanıcıları ve şirketleri yönetin'
                  : 'Kendi şirketinizin kullanıcılarını yönetin'}
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Yeni Kullanıcı Ekle
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admin</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admin}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Şirket Yöneticisi</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sirketYoneticisi}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className={`grid grid-cols-1 ${currentUser?.role === 'ADMIN' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">Tüm Roller</option>
                <option value="ADMIN">Admin</option>
                <option value="SIRKET_YONETICISI">Şirket Yöneticisi</option>
              </select>
            </div>

            {/* Company Filter - Sadece ADMIN için */}
            {currentUser?.role === 'ADMIN' && (
              <div>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="all">Tüm Şirketler</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [column, order] = e.target.value.split('-');
                  setSortBy(column as 'name' | 'email' | 'role' | 'createdAt');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="createdAt-desc">Kayıt Tarihi (Yeni)</option>
                <option value="createdAt-asc">Kayıt Tarihi (Eski)</option>
                <option value="name-asc">Ad (A-Z)</option>
                <option value="name-desc">Ad (Z-A)</option>
                <option value="email-asc">Email (A-Z)</option>
                <option value="email-desc">Email (Z-A)</option>
                <option value="role-asc">Role (A-Z)</option>
                <option value="role-desc">Role (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Kullanıcı Listesi
              </h3>
              <div className="text-sm text-gray-600">
                {filteredUsers.length} / {users.length} kullanıcı
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center justify-between">
                      <span>Kullanıcı Bilgileri</span>
                      <SortIcon column="name" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" onClick={() => handleSort('role')}>
                    <div className="flex items-center justify-between">
                      <span>Role</span>
                      <SortIcon column="role" />
                    </div>
                  </th>
                  {currentUser?.role === 'ADMIN' && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <span>Şirket</span>
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center justify-between">
                      <span>Kayıt Tarihi</span>
                      <SortIcon column="createdAt" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {user.name || 'İsimsiz Kullanıcı'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.companyId ? (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium text-gray-700">
                              {user.company?.name ||
                                companies.find(c => c.id === user.companyId)?.name ||
                                'Bilinmeyen Şirket'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-orange-600 font-medium flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Şirket Atanmamış
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Düzenle
                        </button>
                        {currentUser && user.id !== currentUser.id ? (
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-900 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Sil
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Kendi Hesabınız</span>
                        )}
                        {currentUser && user.id === currentUser.id && (
                          <span className="text-gray-400 text-xs">Mevcut Kullanıcı</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Kullanıcı bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter !== 'all' ? 'Arama kriterlerinizi değiştirmeyi deneyin.' : 'Henüz kullanıcı eklenmemiş.'}
              </p>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    Yeni Kullanıcı Ekle
                  </h2>
                  <button
                    onClick={closeAddModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="kullanici@ornek.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ad Soyad"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Şifre *
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Güçlü bir şifre girin"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'ADMIN' | 'SIRKET_YONETICISI';
                      let newPermissions = newUser.permissions;

                      // Admin rolü seçilirse tüm izinleri ekle
                      if (newRole === 'ADMIN') {
                        newPermissions = PERMISSIONS.map(p => p.key);
                      }

                      setNewUser(prev => ({ ...prev, role: newRole, permissions: newPermissions }));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {getRoleOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Şirket
                  </label>
                  {currentUser?.role === 'SIRKET_YONETICISI' ? (
                    // ŞİRKET_YÖNETİCİSİ için şirket seçimi otomatik ve değiştirilemez
                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {currentUser.companyName || 'Şirket bilgisi yükleniyor...'}
                    </div>
                  ) : (
                    // ADMIN için normal dropdown
                    <select
                      value={newUser.companyId}
                      onChange={(e) => setNewUser(prev => ({ ...prev, companyId: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="0">Şirket Seçin</option>
                      {getCompanyOptions().map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name} ({company.email})
                        </option>
                      ))}
                    </select>
                  )}
                  {newUser.companyId === 0 && currentUser?.role !== 'SIRKET_YONETICISI' && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ Kullanıcının bir şirkete atanması gerekiyor
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Erişim İzinleri</label>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {PERMISSIONS.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newUser.permissions.includes(perm.key)}
                          onChange={(e) => {
                            setNewUser((prev) =>
                              e.target.checked
                                ? { ...prev, permissions: [...prev.permissions, perm.key] }
                                : { ...prev, permissions: prev.permissions.filter((p) => p !== perm.key) }
                            );
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Kullanıcı Ekle
                  </button>
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="btn btn-secondary flex-1"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-blue-100">
              {/* Gradient Başlık */}
              <div className="px-6 py-4 rounded-t-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white drop-shadow">Kullanıcı Düzenle</h2>
                </div>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:text-blue-200 transition-colors rounded-full p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Ad Soyad</label>
                  <input
                    type="text"
                    value={editUser.name}
                    onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ad Soyad"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Role</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'ADMIN' | 'SIRKET_YONETICISI';
                      let newPermissions = editUser.permissions;

                      // Admin rolü seçilirse tüm izinleri ekle
                      if (newRole === 'ADMIN') {
                        newPermissions = PERMISSIONS.map(p => p.key);
                      }

                      setEditUser(prev => ({ ...prev, role: newRole, permissions: newPermissions }));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {getRoleOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Şirket</label>
                  {currentUser?.role === 'SIRKET_YONETICISI' ? (
                    // ŞİRKET_YÖNETİCİSİ için şirket seçimi otomatik ve değiştirilemez
                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {currentUser.companyName || 'Şirket bilgisi yükleniyor...'}
                    </div>
                  ) : (
                    // ADMIN için normal dropdown
                    <select
                      value={editUser.companyId}
                      onChange={(e) => setEditUser(prev => ({ ...prev, companyId: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="0">Şirket Seçin</option>
                      {getCompanyOptions().map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name} ({company.email})
                        </option>
                      ))}
                    </select>
                  )}
                  {editUser.companyId === 0 && currentUser?.role !== 'SIRKET_YONETICISI' && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ Kullanıcının bir şirkete atanması gerekiyor
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Erişim İzinleri</label>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {PERMISSIONS.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editUser.permissions.includes(perm.key)}
                          onChange={(e) => {
                            setEditUser((prev) =>
                              e.target.checked
                                ? { ...prev, permissions: [...prev.permissions, perm.key] }
                                : { ...prev, permissions: prev.permissions.filter((p) => p !== perm.key) }
                            );
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Güncelle
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="btn btn-secondary flex-1"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-red-100">
              {/* Gradient Başlık */}
              <div className="px-6 py-4 rounded-t-2xl bg-gradient-to-r from-red-500 via-pink-500 to-yellow-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-red-100 text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white drop-shadow">Kullanıcı Sil</h2>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="text-white hover:text-red-200 transition-colors rounded-full p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                    <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Kullanıcıyı Sil</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    <strong>{selectedUser.name || selectedUser.email}</strong> kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                  </p>
                  {currentUser && selectedUser.id === currentUser.id && (
                    <div className="bg-red-100 text-red-700 font-bold text-sm mb-2 rounded-lg px-3 py-2 inline-block">Dikkat: Kendi hesabınızı silmek üzeresiniz! Bu işlemden sonra sistemden çıkış yapacaksınız.</div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteUser}
                    className="btn btn-error flex-1 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {currentUser && selectedUser.id === currentUser.id ? 'Evet, KENDİMİ SİL' : 'Evet, Sil'}
                  </button>
                  <button
                    onClick={closeDeleteModal}
                    className="btn btn-secondary flex-1"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}