'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

export type DashboardUser = {
  id: number;
  email: string;
  name?: string | null;
  role: string;
  companyId?: number | null;
  companyName?: string | null;
  createdAt?: string;
};

type DashboardUserContextValue = {
  user: DashboardUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const DashboardUserContext = createContext<DashboardUserContextValue | null>(null);

export function DashboardUserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/user', { credentials: 'include' });
      if (res.status === 401) {
        const sessionExpiredAlertShown = localStorage.getItem('sessionExpiredAlertShown');
        if (!sessionExpiredAlertShown) {
          localStorage.setItem('sessionExpiredAlertShown', 'true');
          alert('Oturumunuz sona erdi, lütfen tekrar giriş yapın.');
        }
        setUser(null);
        router.replace('/login');
        return;
      }
      if (!res.ok) {
        setUser(null);
        router.replace('/login');
        return;
      }
      localStorage.removeItem('sessionExpiredAlertShown');
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      const sessionExpiredAlertShown = localStorage.getItem('sessionExpiredAlertShown');
      if (!sessionExpiredAlertShown) {
        localStorage.setItem('sessionExpiredAlertShown', 'true');
        alert('Oturumunuz sona erdi, lütfen tekrar giriş yapın.');
      }
      setUser(null);
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const value: DashboardUserContextValue = {
    user,
    loading,
    refresh,
  };

  return (
    <DashboardUserContext.Provider value={value}>{children}</DashboardUserContext.Provider>
  );
}

export function useDashboardUser(): DashboardUserContextValue {
  const ctx = useContext(DashboardUserContext);
  if (!ctx) {
    throw new Error('useDashboardUser yalnızca DashboardUserProvider içinde kullanılabilir.');
  }
  return ctx;
}
