'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { User, LogOut, Settings, Building, ChevronDown, Sun, Moon } from 'lucide-react';
import { useDashboardUser } from '@/contexts/DashboardUserContext';

export default function UserHeader() {
  const { user } = useDashboardUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-header-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse h-8 w-8 rounded-full" style={{ backgroundColor: 'var(--muted-background)' }}></div>
        <div className="animate-pulse h-4 w-24 rounded" style={{ backgroundColor: 'var(--muted-background)' }}></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Theme Toggle Button */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg transition-colors"
          style={{ 
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      )}

      <div className="relative user-header-dropdown">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg transition-colors min-w-0"
          style={{ 
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left min-w-0 flex-1 hidden sm:block">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }} title={user.name || user.email}>
              {user.name || user.email}
            </div>
            <div className="text-xs flex items-center" style={{ color: 'var(--text-secondary)' }}>
              <Building className="w-3 h-3 mr-1 flex-shrink-0" />
              {user.companyName ? (
                <span className="truncate" title={user.companyName}>
                  {user.companyName}
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'var(--warning)' }}>Şirket Atanmamış</span>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--primary)' }}>
              {user.role}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 flex-shrink-0 hidden sm:block" style={{ color: 'var(--text-muted)' }} />
        </button>

        {isDropdownOpen && (
          <div 
            className="absolute right-0 mt-2 w-72 rounded-lg shadow-lg border z-50"
            style={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--card-border)' 
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user.name || 'İsimsiz Kullanıcı'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {user.email}
              </div>
              <div className="text-xs mt-1 flex items-center" style={{ color: 'var(--text-secondary)' }}>
                <Building className="w-3 h-3 mr-1 flex-shrink-0" />
                {user.companyName ? (
                  <span className="truncate">{user.companyName}</span>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--warning)' }}>Şirket Atanmamış</span>
                )}
              </div>
              <div className="text-xs mt-1 font-medium" style={{ color: 'var(--primary)' }}>
                {user.role}
              </div>
            </div>
            
            <div className="p-2">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  router.push('/ayarlar');
                }}
                className="w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings className="w-4 h-4 mr-3" />
                Ayarlar
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors"
                style={{ color: 'var(--error)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--error)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--error)';
                }}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Çıkış Yap
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { UserHeader };

