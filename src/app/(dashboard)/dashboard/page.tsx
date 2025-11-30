'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  BedDouble,
  TrendingUp,
  Activity,
  Calendar,
  Bell,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Hotel,
  CreditCard,
  PieChart,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale/tr';

interface DashboardStats {
  summary: {
    totalAccommodations: number;
    thisMonthAccommodations: number;
    accommodationGrowth: number;
    activeGuests: number;
    totalCost: number;
    thisMonthCost: number;
    totalSales: number;
    thisMonthSales: number;
    totalRevenue: number;
    thisMonthRevenue: number;
    totalProfit: number;
    thisMonthProfit: number;
    hotelCount: number;
  };
  dailyStats: Array<{
    date: string;
    label: string;
    accommodations: number;
    sales: number;
    revenue: number;
  }>;
  monthlyStats: Array<{
    month: string;
    accommodations: number;
    sales: number;
    revenue: number;
  }>;
  recentActivities: Array<{
    type: string;
    id: number;
    title: string;
    description: string;
    date: string;
  }>;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kullanıcı bilgisi
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserName(data.user.name || data.user.email);
        }
      })
      .catch((err) => console.error(err));

    // Dashboard istatistikleri
    fetch('/api/dashboard/stats')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Stats fetch failed');
        }
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard stats error:', err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    colorClass,
    bgClass,
    trend,
    trendValue,
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
          <Icon className={`w-6 h-6`} style={{ color: colorClass || 'var(--primary)' }} />
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {trend > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            ) : trend < 0 ? (
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            ) : null}
            {trend !== 0 && (
              <span
                className={`text-xs font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {Math.abs(trendValue || 0)}%
              </span>
            )}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {value}
        </h3>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--text-secondary)' }}>Veriler yüklenemedi.</p>
      </div>
    );
  }

  const { summary, dailyStats, monthlyStats, recentActivities } = stats;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div
        className="rounded-2xl p-8 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        }}
      >
        <h1 className="text-3xl font-bold mb-2 text-white">Hoş Geldiniz, {userName}</h1>
        <p className="text-white/90">
          Yurtsever Yönetim Paneli'ne hoş geldiniz. Günlük operasyonlarınızı buradan takip
          edebilirsiniz.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Konaklama"
          value={formatNumber(summary.totalAccommodations)}
          subtitle={`Bu ay: ${formatNumber(summary.thisMonthAccommodations)}`}
          icon={BedDouble}
          colorClass="#3b82f6"
          bgClass="rgba(59, 130, 246, 0.1)"
          trend={summary.accommodationGrowth}
          trendValue={summary.accommodationGrowth}
        />
        <StatCard
          title="Aktif Misafirler"
          value={formatNumber(summary.activeGuests)}
          subtitle="Bugün konaklayan"
          icon={Users}
          colorClass="#8b5cf6"
          bgClass="rgba(139, 92, 246, 0.1)"
        />
        <StatCard
          title="Toplam Gelir"
          value={formatCurrency(summary.totalRevenue)}
          subtitle={`Bu ay: ${formatCurrency(summary.thisMonthRevenue)}`}
          icon={DollarSign}
          colorClass="#10b981"
          bgClass="rgba(16, 185, 129, 0.1)"
        />
        <StatCard
          title="Toplam Kar"
          value={formatCurrency(summary.totalProfit)}
          subtitle={`Bu ay: ${formatCurrency(summary.thisMonthProfit)}`}
          icon={TrendingUp}
          colorClass="#f59e0b"
          bgClass="rgba(245, 158, 11, 0.1)"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Satış"
          value={formatNumber(summary.totalSales)}
          subtitle={`Bu ay: ${formatNumber(summary.thisMonthSales)}`}
          icon={CreditCard}
          colorClass="#06b6d4"
          bgClass="rgba(6, 182, 212, 0.1)"
        />
        <StatCard
          title="Toplam Maliyet"
          value={formatCurrency(summary.totalCost)}
          subtitle={`Bu ay: ${formatCurrency(summary.thisMonthCost)}`}
          icon={PieChart}
          colorClass="#ef4444"
          bgClass="rgba(239, 68, 68, 0.1)"
        />
        <StatCard
          title="Aktif Oteller"
          value={formatNumber(summary.hotelCount)}
          subtitle="Farklı otel sayısı"
          icon={Hotel}
          colorClass="#8b5cf6"
          bgClass="rgba(139, 92, 246, 0.1)"
        />
        <StatCard
          title="Kar Oranı"
          value={
            summary.totalRevenue > 0
              ? `${((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1)}%`
              : '0%'
          }
          subtitle="Toplam kar oranı"
          icon={BarChart3}
          colorClass="#10b981"
          bgClass="rgba(16, 185, 129, 0.1)"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Günlük İstatistikler */}
        <div
          className="rounded-xl shadow-sm border p-6"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--card-border)',
          }}
        >
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            Son 7 Günün İstatistikleri
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyStats}>
              <defs>
                <linearGradient id="colorAccommodations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                stroke="var(--card-border)"
              />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--card-border)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="accommodations"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorAccommodations)"
                name="Konaklama"
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorSales)"
                name="Satış"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Aylık Gelir */}
        <div
          className="rounded-xl shadow-sm border p-6"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--card-border)',
          }}
        >
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            Son 6 Ayın Geliri
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                stroke="var(--card-border)"
              />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} stroke="var(--card-border)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => formatCurrency(value)}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="revenue" fill="#10b981" name="Gelir (₺)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div
          className="lg:col-span-2 rounded-xl shadow-sm border p-6"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              Son Aktiviteler
            </h2>
          </div>

          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-start gap-4 pb-4 border-b last:border-0"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor:
                        activity.type === 'accommodation'
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'rgba(139, 92, 246, 0.1)',
                    }}
                  >
                    {activity.type === 'accommodation' ? (
                      <BedDouble
                        className="w-5 h-5"
                        style={{ color: activity.type === 'accommodation' ? '#3b82f6' : '#8b5cf6' }}
                      />
                    ) : (
                      <CreditCard
                        className="w-5 h-5"
                        style={{ color: activity.type === 'accommodation' ? '#3b82f6' : '#8b5cf6' }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {activity.title}
                    </h4>
                    <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {activity.description}
                    </p>
                    <span className="text-xs mt-2 block" style={{ color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(activity.date), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                Henüz aktivite bulunmuyor.
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div
          className="rounded-xl shadow-sm border p-6"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--card-border)',
          }}
        >
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <PieChart className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            Özet İstatistikler
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Toplam Kayıt
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatNumber(summary.totalAccommodations + summary.totalSales)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Bu Ay Kayıt
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatNumber(summary.thisMonthAccommodations + summary.thisMonthSales)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Ortalama Gelir
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {summary.totalSales > 0
                  ? formatCurrency(summary.totalRevenue / summary.totalSales)
                  : formatCurrency(0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Ortalama Kar
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {summary.totalSales > 0
                  ? formatCurrency(summary.totalProfit / summary.totalSales)
                  : formatCurrency(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
