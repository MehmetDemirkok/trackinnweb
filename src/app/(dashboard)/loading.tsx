export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8"
      aria-busy="true"
      aria-label="Sayfa yükleniyor"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <p className="text-sm text-gray-500">Yükleniyor…</p>
    </div>
  );
}
