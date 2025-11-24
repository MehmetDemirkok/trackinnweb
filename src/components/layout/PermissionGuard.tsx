"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export default function PermissionGuard({ children, requiredPermission }: PermissionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkPermission() {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (res.status === 200) {
          const data = await res.json();
          const user = data.user;

          // Admin rolü için özel kontrol - admin her sayfaya erişebilir
          if (user.role === 'ADMIN') {
            setHasAccess(true);
            setLoading(false);
            return;
          }

          // ŞİRKET_YÖNETİCİSİ rolü için şirket bazlı erişim kontrolü
          if (user.role === 'SIRKET_YONETICISI') {
            // Şirket yönetimi sayfalarına sadece ADMIN erişebilir
            if (pathname.startsWith('/admin/companies')) {
              router.replace("/no-access");
              return;
            }

            // Kullanıcı yönetimi sayfasına ŞİRKET_YÖNETİCİSİ erişebilir (sadece kendi şirketindeki kullanıcılar)
            if (pathname === '/admin') {
              setHasAccess(true);
              setLoading(false);
              return;
            }
            // Şirket yöneticisi tüm operasyonel modüllere erişebilir
            if (pathname.startsWith('/konaklama-alis') || pathname.startsWith('/konaklama-satis') || pathname.startsWith('/finans')) {
              setHasAccess(true);
              setLoading(false);
              return;
            }
          }

          // Dashboard ve login sayfalarına herkes erişebilir
          if (pathname === '/' || pathname === '/login') {
            setHasAccess(true);
            setLoading(false);
            return;
          }

          // Eğer özel bir izin gerekiyorsa kontrol et
          if (requiredPermission) {
            const hasPermission = user.permissions?.includes(requiredPermission) || false;
            if (!hasPermission) {
              // İzin yoksa dashboard'a yönlendir
              router.replace("/");
              return;
            }
          }

          // Sayfa bazlı izin kontrolü - /admin sayfası için özel kontrol
          const pagePermissions: { [key: string]: string } = {
            '/konaklama-alis': 'home',
            '/konaklama-alis/oteller': 'home',
            '/konaklama-satis': 'accommodation',
            '/moduller/transfer': 'transfer',
            '/cariler': 'cariler',
            '/tedarikciler': 'tedarikciler',
            '/admin/logs': 'logs',
          };

          const currentPagePermission = pagePermissions[pathname];
          if (currentPagePermission) {
            const hasPagePermission = user.permissions?.includes(currentPagePermission) || false;
            if (!hasPagePermission) {
              // Sayfa izni yoksa dashboard'a yönlendir
              router.replace("/");
              return;
            }
          }

          setHasAccess(true);
        }
      } catch (err) {
        console.error("İzin kontrolünde hata:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [pathname, router, requiredPermission]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">🚫</div>
          <p className="text-red-600">Bu sayfaya erişim yetkiniz yok.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export { PermissionGuard };
