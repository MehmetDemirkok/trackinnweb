"use client";

import { useDashboardUser } from "@/contexts/DashboardUserContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useDashboardUser();

  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)]"
        aria-busy="true"
        aria-label="Oturum doğrulanıyor"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Oturum doğrulanıyor…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

export { AuthGuard };
