"use client";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/layout/AuthGuard";

interface Log {
  id: number;
  action: string;
  modelName: string;
  recordId: number;
  recordData: string;
  userId: number | null;
  user?: { name?: string; email: string };
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

function LogsPageContent() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterAction, setFilterAction] = useState("");
  const [filterModel, setFilterModel] = useState("");

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== 'ADMIN') {
            window.location.href = '/dashboard'; // Yetkisiz ise dashboard'a at
            return;
          }
          fetchLogs(); // Yetkili ise logları çek
        }
      } catch (error) {
        console.error('Yetki kontrolü hatası:', error);
      }
    };

    checkAccess();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/logs");
      if (!response.ok) {
        throw new Error("Loglar alınamadı");
      }
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const showLogDetail = (log: Log) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const filteredLogs = logs?.filter(log => {
    return (
      (filterAction === "" || log.action === filterAction) &&
      (filterModel === "" || log.modelName === filterModel)
    );
  }) || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sistem Logları</h1>

      {error && <div className="bg-red-100 p-3 mb-4 rounded text-red-700">{error}</div>}

      <div className="mb-4 flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">İşlem Türü</label>
          <select
            className="border rounded p-2 w-full"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="DELETE">Silme</option>
            <option value="UPDATE">Güncelleme</option>
            <option value="CREATE">Oluşturma</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <select
            className="border rounded p-2 w-full"
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
          >
            <option value="">Tümü</option>
            <option value="Accommodation">Konaklama</option>
            <option value="Sale">Satış</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-4">Yükleniyor...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">ID</th>
                <th className="py-2 px-4 border">İşlem</th>
                <th className="py-2 px-4 border">Model</th>
                <th className="py-2 px-4 border">Kayıt ID</th>
                <th className="py-2 px-4 border">Kullanıcı</th>
                <th className="py-2 px-4 border">Tarih</th>
                <th className="py-2 px-4 border">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">{log.id}</td>
                  <td className="py-2 px-4 border">
                    <span className={
                      log.action === 'DELETE' ? 'text-red-600 font-medium' :
                        log.action === 'UPDATE' ? 'text-blue-600 font-medium' :
                          'text-green-600 font-medium'
                    }>
                      {log.action === 'DELETE' ? 'Silme' :
                        log.action === 'UPDATE' ? 'Güncelleme' :
                          'Oluşturma'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border">
                    {log.modelName === 'Accommodation' ? 'Konaklama' : 'Satış'}
                  </td>
                  <td className="py-2 px-4 border">{log.recordId}</td>
                  <td className="py-2 px-4 border">
                    {log.user ? (log.user.name || log.user.email) : 'Bilinmiyor'}
                  </td>
                  <td className="py-2 px-4 border">
                    {new Date(log.createdAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="py-2 px-4 border">
                    <button
                      onClick={() => showLogDetail(log)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detay Modal */}
      {detailModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Log Detayı</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="font-medium">ID:</p>
                <p>{selectedLog.id}</p>
              </div>
              <div>
                <p className="font-medium">İşlem:</p>
                <p className={
                  selectedLog.action === 'DELETE' ? 'text-red-600 font-medium' :
                    selectedLog.action === 'UPDATE' ? 'text-blue-600 font-medium' :
                      'text-green-600 font-medium'
                }>
                  {selectedLog.action === 'DELETE' ? 'Silme' :
                    selectedLog.action === 'UPDATE' ? 'Güncelleme' :
                      'Oluşturma'}
                </p>
              </div>
              <div>
                <p className="font-medium">Model:</p>
                <p>{selectedLog.modelName === 'Accommodation' ? 'Konaklama' : 'Satış'}</p>
              </div>
              <div>
                <p className="font-medium">Kayıt ID:</p>
                <p>{selectedLog.recordId}</p>
              </div>
              <div>
                <p className="font-medium">Kullanıcı:</p>
                <p>{selectedLog.user ? (selectedLog.user.name || selectedLog.user.email) : 'Bilinmiyor'}</p>
              </div>
              <div>
                <p className="font-medium">Tarih:</p>
                <p>{new Date(selectedLog.createdAt).toLocaleString('tr-TR')}</p>
              </div>
              <div>
                <p className="font-medium">IP Adresi:</p>
                <p>{selectedLog.ipAddress || 'Bilinmiyor'}</p>
              </div>
              <div>
                <p className="font-medium">Tarayıcı:</p>
                <p className="truncate">{selectedLog.userAgent || 'Bilinmiyor'}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-medium mb-2">Kayıt Verisi:</p>
              <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.recordData), null, 2);
                  } catch {
                    return selectedLog.recordData;
                  }
                })()}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LogsPage() {
  return <LogsPageContent />;
}