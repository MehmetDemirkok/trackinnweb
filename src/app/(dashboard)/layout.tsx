'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserHeader from '@/components/layout/UserHeader';
import AuthGuard from '@/components/layout/AuthGuard';
import PermissionGuard from '@/components/layout/PermissionGuard';
import {
  Home,
  BedDouble,
  Banknote,
  Building2,
  Users,
  UserCircle,
  Truck,
  PieChart,
  Shield,
  X,
  Menu
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar open/close
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar collapsed
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setSidebarCollapsed(collapsed);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const menuItems = [
    {
      name: 'Ana Dashboard',
      path: '/dashboard',
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: 'Konaklama Alış',
      path: '/konaklama-alis',
      icon: <BedDouble className="w-5 h-5" />,
    },
    {
      name: 'Konaklama Satış',
      path: '/konaklama-satis',
      icon: <Banknote className="w-5 h-5" />,
    },
    {
      name: 'Finans',
      path: '/finans',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      name: 'Kullanıcı Yönetimi',
      path: '/admin',
      icon: <Shield className="w-5 h-5" />,
    },
  ];

  return (
    <AuthGuard>
      <PermissionGuard>
        <div className="flex h-screen" style={{ backgroundColor: 'var(--background)' }}>
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
              onClick={toggleSidebar}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`fixed md:static top-0 left-0 h-full shadow-xl md:shadow-none z-50 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              } flex flex-col border-r`}
            style={{
              backgroundColor: 'var(--sidebar-bg)',
              borderColor: 'var(--sidebar-border)',
              width: sidebarCollapsed ? '80px' : '280px'
            }}
          >
            {/* Sidebar Header */}
            <div className="h-16 flex items-center justify-between px-3 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
              {/* Logo Area */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: 'var(--primary)' }}>
                  T
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-col">
                    <span className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>TrackINN</span>
                    <span className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>Web APP</span>
                  </div>
                )}
              </div>

              {/* Hamburger Toggle Button (Desktop) */}
              <button
                onClick={toggleCollapse}
                className="hidden md:block p-1.5 rounded-lg transition-colors flex-shrink-0"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title={sidebarCollapsed ? 'Genişlet' : 'Daralt'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Close Button (Mobile) */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Menu */}
            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                // Special case for dashboard to avoid matching everything
                const isDashboard = item.path === '/dashboard';
                const isExactMatch = pathname === item.path;
                const active = isDashboard ? isExactMatch : isActive;

                return (
                  <Link
                    key={index}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${sidebarCollapsed ? 'justify-center' : ''}`}
                    style={{
                      backgroundColor: active ? 'var(--active-bg)' : 'transparent',
                      color: active ? 'var(--active-text)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    {item.icon}
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Footer - User Profile */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
              {/* UserHeader component handles the user profile display */}
            </div>
          </aside>

          {/* Main Content Wrapper */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Navigation Bar */}
            <header
              className="h-16 border-b flex items-center justify-between px-4 sm:px-8"
              style={{
                backgroundColor: 'var(--header-bg)',
                borderColor: 'var(--header-border)'
              }}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSidebar}
                  className="md:hidden p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold hidden sm:block" style={{ color: 'var(--text-primary)' }}>Yönetim Paneli</h1>
              </div>

              <UserHeader />
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto p-4 sm:p-8" style={{ backgroundColor: 'var(--background)' }}>
              {children}
            </main>
          </div>
        </div>
      </PermissionGuard>
    </AuthGuard>
  );
}
