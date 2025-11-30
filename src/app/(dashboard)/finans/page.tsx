'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale/tr';
import toast from 'react-hot-toast';

interface FinancialTransaction {
  id: number;
  type: 'GELIR' | 'GIDER';
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
  user?: {
    id: number;
    name?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FinancialStats {
  total: number;
  income: number;
  expense: number;
  profit: number;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [stats, setStats] = useState<FinancialStats>({
    total: 0,
    income: 0,
    expense: 0,
    profit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [initialValues, setInitialValues] = useState<{
    type: 'GELIR' | 'GIDER';
    category: string;
    description: string;
    template?: string;
  } | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [page, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/financial-transactions?${params}`);
      const data = await res.json();

      if (res.ok) {
        setTransactions(data.transactions);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || 'Veriler yüklenemedi');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(`/api/financial-transactions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('İşlem başarıyla silindi');
        fetchTransactions();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Bir hata oluştu');
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams({ format });
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/financial-transactions/export?${params}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finans-raporu-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Rapor indiriliyor...');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export işlemi başarısız');
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!filters.search) return transactions;

    const searchLower = filters.search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        (t.user?.name?.toLowerCase().includes(searchLower) || false)
    );
  }, [transactions, filters.search]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    colorClass,
    bgClass,
    trend,
  }: any) => (
    <div
      className="p-6 rounded-xl shadow-sm border transition-all hover:shadow-md"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: bgClass || 'var(--muted-background)' }}
        >
          <Icon className="w-6 h-6" style={{ color: colorClass || 'var(--primary)' }} />
        </div>
        {trend !== undefined && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: trend > 0 ? '#10b981' : '#ef4444',
            }}
          >
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)}
        </h3>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </p>
      </div>
    </div>
  );

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      KONAKLAMA: 'Konaklama',
      TRANSFER: 'Transfer',
      OFIS_GIDERLERI: 'Ofis Giderleri',
      TEDARIKCI_ODEMESI: 'Tedarikçi Ödemesi',
      MAAŞ: 'Maaş',
      VERGI: 'Vergi',
      DİĞER: 'Diğer',
    };
    return labels[category] || category;
  };

  const handleQuickAction = (action: 'INCOMING_TRANSFER' | 'PAYMENT' | 'SUPPLIER_INVOICE' | 'EXPENSE_INVOICE') => {
    const defaults = {
      INCOMING_TRANSFER: {
        type: 'GELIR' as const,
        category: 'DİĞER',
        description: 'Gelen Havale - ',
        template: 'INCOMING_TRANSFER',
      },
      PAYMENT: {
        type: 'GIDER' as const,
        category: 'TEDARIKCI_ODEMESI',
        description: 'Ödeme - ',
        template: 'PAYMENT',
      },
      SUPPLIER_INVOICE: {
        type: 'GIDER' as const,
        category: 'TEDARIKCI_ODEMESI',
        description: 'Fatura - ',
        template: 'SUPPLIER_INVOICE',
      },
      EXPENSE_INVOICE: {
        type: 'GIDER' as const,
        category: 'OFIS_GIDERLERI',
        description: 'Gider - ',
        template: 'EXPENSE_INVOICE',
      },
    };

    setInitialValues(defaults[action]);
    setShowModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Finans Yönetimi
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Gelir, gider ve nakit akışı takibi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--muted-background)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted-background)';
            }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--muted-background)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted-background)';
            }}
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setInitialValues(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <Plus className="w-4 h-4" />
            Yeni İşlem
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleQuickAction('INCOMING_TRANSFER')}
          className="p-4 rounded-xl border transition-all hover:shadow-md text-left flex items-center gap-4 group"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="p-3 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Gelen Havale</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Gelir girişi yap</p>
          </div>
        </button>

        <button
          onClick={() => handleQuickAction('PAYMENT')}
          className="p-4 rounded-xl border transition-all hover:shadow-md text-left flex items-center gap-4 group"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="p-3 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Ödeme Yap</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Gider çıkışı yap</p>
          </div>
        </button>

        <button
          onClick={() => handleQuickAction('SUPPLIER_INVOICE')}
          className="p-4 rounded-xl border transition-all hover:shadow-md text-left flex items-center gap-4 group"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="p-3 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition-colors">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Gelen Fatura</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tedarikçi faturası işle</p>
          </div>
        </button>

        <button
          onClick={() => handleQuickAction('EXPENSE_INVOICE')}
          className="p-4 rounded-xl border transition-all hover:shadow-md text-left flex items-center gap-4 group"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Gider Faturası</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ofis/Genel gider işle</p>
          </div>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Gelir"
          value={stats.income}
          icon={TrendingUp}
          colorClass="#10b981"
          bgClass="rgba(16, 185, 129, 0.1)"
          trend={12}
        />
        <StatCard
          title="Toplam Gider"
          value={stats.expense}
          icon={TrendingDown}
          colorClass="#ef4444"
          bgClass="rgba(239, 68, 68, 0.1)"
          trend={-5}
        />
        <StatCard
          title="Net Kar"
          value={stats.profit}
          icon={PieChart}
          colorClass="#3b82f6"
          bgClass="rgba(59, 130, 246, 0.1)"
          trend={8}
        />
        <StatCard
          title="Toplam İşlem"
          value={stats.total}
          icon={CreditCard}
          colorClass="#f59e0b"
          bgClass="rgba(245, 158, 11, 0.1)"
        />
      </div>

      {/* Filters and Search */}
      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--card-border)',
        }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Ara..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: showFilters ? 'var(--primary)' : 'var(--muted-background)',
              color: showFilters ? 'white' : 'var(--text-secondary)',
            }}
          >
            <Filter className="w-4 h-4" />
            Filtreler
          </button>
          {(filters.type || filters.category || filters.startDate || filters.endDate) && (
            <button
              onClick={() => {
                setFilters({
                  type: '',
                  category: '',
                  startDate: '',
                  endDate: '',
                  search: filters.search,
                });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--muted-background)',
                color: 'var(--text-secondary)',
              }}
            >
              <X className="w-4 h-4" />
              Temizle
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Tüm Tipler</option>
              <option value="GELIR">Gelir</option>
              <option value="GIDER">Gider</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Tüm Kategoriler</option>
              <option value="KONAKLAMA">Konaklama</option>
              <option value="TRANSFER">Transfer</option>
              <option value="OFIS_GIDERLERI">Ofis Giderleri</option>
              <option value="TEDARIKCI_ODEMESI">Tedarikçi Ödemesi</option>
              <option value="MAAŞ">Maaş</option>
              <option value="VERGI">Vergi</option>
              <option value="DİĞER">Diğer</option>
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div
        className="rounded-xl shadow-sm border overflow-hidden"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--card-border)',
        }}
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--primary)' }}></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            İşlem bulunamadı
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--muted-background)' }}>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Tarih
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Tip
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Açıklama
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Tutar
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Kullanıcı
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b transition-colors"
                      style={{ borderColor: 'var(--card-border)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {format(new Date(transaction.date), 'dd.MM.yyyy', { locale: tr })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor:
                              transaction.type === 'GELIR'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(239, 68, 68, 0.1)',
                            color: transaction.type === 'GELIR' ? '#10b981' : '#ef4444',
                          }}
                        >
                          {transaction.type === 'GELIR' ? 'Gelir' : 'Gider'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {getCategoryLabel(transaction.category)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: transaction.type === 'GELIR' ? '#10b981' : '#ef4444' }}>
                        {transaction.type === 'GELIR' ? '+' : '-'}
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {transaction.user?.name || transaction.user?.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setInitialValues(null);
                              setShowModal(true);
                            }}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--primary)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--error)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Sayfa {page} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--muted-background)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--muted-background)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <FinancialTransactionModal
          transaction={editingTransaction}
          initialValues={initialValues}
          onClose={() => {
            setShowModal(false);
            setEditingTransaction(null);
            setInitialValues(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingTransaction(null);
            setInitialValues(null);
            fetchTransactions();
          }}
        />
      )}
    </div>
  );
}

// Financial Transaction Modal Component
function FinancialTransactionModal({
  transaction,
  initialValues,
  onClose,
  onSuccess,
}: {
  transaction: FinancialTransaction | null;
  initialValues: { type: 'GELIR' | 'GIDER'; category: string; description: string; template?: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'GELIR' as 'GELIR' | 'GIDER',
    category: 'KONAKLAMA',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [template, setTemplate] = useState('CUSTOM');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      try {
        const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
        setFormData({
          type: transaction.type,
          category: transaction.category,
          description: transaction.description || '',
          amount: transaction.amount || 0,
          date: format(transactionDate, 'yyyy-MM-dd'),
          notes: transaction.notes || '',
        });
        setTemplate('CUSTOM');
      } catch (error) {
        console.error('Date format error:', error);
        setFormData({
          type: transaction.type,
          category: transaction.category,
          description: transaction.description || '',
          amount: transaction.amount || 0,
          date: new Date().toISOString().split('T')[0],
          notes: transaction.notes || '',
        });
        setTemplate('CUSTOM');
      }
    } else if (initialValues) {
      setFormData({
        type: initialValues.type,
        category: initialValues.category,
        description: initialValues.description,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setTemplate(initialValues.template || 'CUSTOM');
    } else {
      setFormData({
        type: 'GELIR',
        category: 'KONAKLAMA',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setTemplate('CUSTOM');
    }
  }, [transaction, initialValues]);

  const handleTemplateChange = (newTemplate: string) => {
    setTemplate(newTemplate);

    const defaults: any = {
      INCOMING_TRANSFER: {
        type: 'GELIR',
        category: 'DİĞER',
        description: 'Gelen Havale - ',
      },
      PAYMENT: {
        type: 'GIDER',
        category: 'TEDARIKCI_ODEMESI',
        description: 'Ödeme - ',
      },
      SUPPLIER_INVOICE: {
        type: 'GIDER',
        category: 'TEDARIKCI_ODEMESI',
        description: 'Fatura - ',
      },
      EXPENSE_INVOICE: {
        type: 'GIDER',
        category: 'OFIS_GIDERLERI',
        description: 'Gider - ',
      },
    };

    if (defaults[newTemplate]) {
      setFormData(prev => ({
        ...prev,
        ...defaults[newTemplate],
      }));
    } else if (newTemplate === 'CUSTOM') {
      // Keep current values but ensure they are valid
      if (!formData.type) {
        setFormData(prev => ({ ...prev, type: 'GELIR', category: 'KONAKLAMA' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = transaction
        ? `/api/financial-transactions/${transaction.id}`
        : '/api/financial-transactions';
      const method = transaction ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(transaction ? 'İşlem güncellendi' : 'İşlem eklendi');
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {transaction ? 'İşlem Düzenle' : 'Yeni İşlem'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!transaction && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                İşlem Türü
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'CUSTOM', label: 'Serbest', icon: Edit },
                  { id: 'INCOMING_TRANSFER', label: 'Gelen Havale', icon: TrendingUp },
                  { id: 'PAYMENT', label: 'Ödeme', icon: CreditCard },
                  { id: 'SUPPLIER_INVOICE', label: 'Gelen Fatura', icon: FileText },
                  { id: 'EXPENSE_INVOICE', label: 'Gider Faturası', icon: DollarSign },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTemplateChange(item.id)}
                    className={`p-3 rounded-xl border text-sm font-medium flex flex-col items-center justify-center gap-2 transition-all ${template === item.id ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:bg-gray-50'
                      }`}
                    style={{
                      backgroundColor: template === item.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--card)',
                      borderColor: template === item.id ? '#3b82f6' : 'var(--card-border)',
                      color: template === item.id ? '#3b82f6' : 'var(--text-secondary)',
                    }}
                  >
                    <item.icon className={`w-5 h-5 ${template === item.id ? 'text-blue-500' : 'text-gray-400'}`} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Tip *
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  setFormData({ ...formData, type: e.target.value as 'GELIR' | 'GIDER' });
                  setTemplate('CUSTOM');
                }}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)',
                  opacity: template !== 'CUSTOM' ? 0.7 : 1,
                }}
                required
                disabled={template !== 'CUSTOM'}
              >
                <option value="GELIR">Gelir</option>
                <option value="GIDER">Gider</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Kategori *
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  setTemplate('CUSTOM');
                }}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)',
                  opacity: template !== 'CUSTOM' ? 0.7 : 1,
                }}
                required
                disabled={template !== 'CUSTOM'}
              >
                <option value="KONAKLAMA">Konaklama</option>
                <option value="TRANSFER">Transfer</option>
                <option value="OFIS_GIDERLERI">Ofis Giderleri</option>
                <option value="TEDARIKCI_ODEMESI">Tedarikçi Ödemesi</option>
                <option value="MAAŞ">Maaş</option>
                <option value="VERGI">Vergi</option>
                <option value="DİĞER">Diğer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Açıklama *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Tutar *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)',
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Tarih *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-primary)',
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--muted-background)',
                color: 'var(--text-secondary)',
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {loading ? 'Kaydediliyor...' : transaction ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
