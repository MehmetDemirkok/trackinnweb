"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Users, Info } from 'lucide-react';

export type SalesTransferCustomer = {
  musteriAdi: string;
  musteriCariKodu: string;
};

export type SalesTransferPayload = {
  prices: Record<number, { satisFiyati: number; toplamSatisFiyati: number }>;
  customers: Record<number, SalesTransferCustomer>;
};

interface SalesPriceModalProps {
  isOpen: boolean;
  records: Array<{
    id: number;
    adiSoyadi: string;
    toplamUcret: number;
    numberOfNights?: number;
    kurumCari?: string;
  }>;
  onClose: () => void;
  onConfirm: (payload: SalesTransferPayload) => void;
}

const emptyCustomer = (): SalesTransferCustomer => ({
  musteriAdi: '',
  musteriCariKodu: '',
});

export default function SalesPriceModal({ isOpen, records, onClose, onConfirm }: SalesPriceModalProps) {
  const [prices, setPrices] = useState<Record<number, { satisFiyati: number; toplamSatisFiyati: number }>>({});
  const [customers, setCustomers] = useState<Record<number, SalesTransferCustomer>>({});
  const [skipAll, setSkipAll] = useState(false);
  const [bulkMusteri, setBulkMusteri] = useState('');
  const [bulkCari, setBulkCari] = useState('');

  const recordsKey = useMemo(() => records.map((r) => r.id).join(','), [records]);

  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<number, SalesTransferCustomer> = {};
    records.forEach((r) => {
      initial[r.id] = {
        musteriAdi: r.kurumCari?.trim() || '',
        musteriCariKodu: '',
      };
    });
    setCustomers(initial);
    setPrices({});
    setSkipAll(false);
    setBulkMusteri('');
    setBulkCari('');
  }, [isOpen, recordsKey, records]);

  if (!isOpen) return null;

  const handlePriceChange = (id: number, field: 'satisFiyati' | 'toplamSatisFiyati', value: string) => {
    const numValue = parseFloat(value) || 0;
    setPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: numValue,
      },
    }));
  };

  const handleCustomerChange = (id: number, field: keyof SalesTransferCustomer, value: string) => {
    setCustomers((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || emptyCustomer()),
        [field]: value,
      },
    }));
  };

  const applyBulkToAll = () => {
    setCustomers((prev) => {
      const next = { ...prev };
      records.forEach((r) => {
        next[r.id] = {
          musteriAdi: bulkMusteri.trim(),
          musteriCariKodu: bulkCari.trim(),
        };
      });
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm({
      prices: skipAll ? {} : prices,
      customers,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Satışa aktar</h2>
              <p className="text-sm text-gray-500 mt-1">
                {records.length} kayıt — fiyatları ve <span className="font-medium text-gray-700">kime sattığınızı</span> girin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Kapat"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="flex gap-3 p-3 sm:p-4 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">Kısa not (iş pratiği)</p>
              <p>
                <span className="font-semibold">Konaklayan</span> (misafir) alış kaydından gelir; faturalandırdığınız veya
                ücreti tahsil ettiğiniz taraf genelde <span className="font-semibold">satış müşterisi</span>dir (acenta, kurum,
                farklı şirket vb.). Boş bırakırsanız, alışta girdiğiniz <span className="font-semibold">cari</span> varsa otomatik
                önerilir; yine de kontrol edin.
              </p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipAll}
                onChange={(e) => setSkipAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-yellow-800">
                Satış fiyatlarını şimdilik boş aktar (sonradan satış sayfasından düzenleyebilirsiniz)
              </span>
            </label>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/80">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-800">Tüm seçili kayıtlara aynı satış müşterisini uygula</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Satış müşterisi (ünvan / firma / kişi)</label>
                <input
                  type="text"
                  value={bulkMusteri}
                  onChange={(e) => setBulkMusteri(e.target.value)}
                  placeholder="Örn. X Acentası, Y A.Ş."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cari kodu / referans (isteğe bağlı)</label>
                <input
                  type="text"
                  value={bulkCari}
                  onChange={(e) => setBulkCari(e.target.value)}
                  placeholder="Örn. cari kodu, sipariş no"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={applyBulkToAll}
              className="text-sm px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-800"
            >
              Bu müşteriyi tüm satırlara yaz
            </button>
          </div>

          <div className="space-y-4">
            {records.map((record) => {
              const recordPrices = prices[record.id] || { satisFiyati: 0, toplamSatisFiyati: 0 };
              const nights = record.numberOfNights && record.numberOfNights > 0 ? record.numberOfNights : 1;
              const gecelikUcret = record.toplamUcret / nights;
              const cust = customers[record.id] || emptyCustomer();

              return (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">Konaklayan: {record.adiSoyadi}</h3>
                      <p className="text-sm text-gray-500">
                        Alış toplamı: ₺{record.toplamUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        {record.numberOfNights ? ` (${record.numberOfNights} gece)` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Satış müşterisi *</label>
                      <input
                        type="text"
                        value={cust.musteriAdi}
                        onChange={(e) => handleCustomerChange(record.id, 'musteriAdi', e.target.value)}
                        placeholder={record.kurumCari ? `Öneri: ${record.kurumCari}` : 'Kime sattınız?'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cari kodu / referans</label>
                      <input
                        type="text"
                        value={cust.musteriCariKodu}
                        onChange={(e) => handleCustomerChange(record.id, 'musteriCariKodu', e.target.value)}
                        placeholder="İsteğe bağlı"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {!skipAll && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gecelik satış fiyatı (₺)</label>
                        <input
                          type="number"
                          value={recordPrices.satisFiyati || ''}
                          onChange={(e) => handlePriceChange(record.id, 'satisFiyati', e.target.value)}
                          placeholder={gecelikUcret.toFixed(2)}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Toplam satış fiyatı (₺)</label>
                        <input
                          type="number"
                          value={recordPrices.toplamSatisFiyati || ''}
                          onChange={(e) => handlePriceChange(record.id, 'toplamSatisFiyati', e.target.value)}
                          placeholder={record.toplamUcret.toFixed(2)}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {skipAll ? 'Aktar' : 'Fiyat ve müşteri bilgisiyle aktar'}
          </button>
        </div>
      </div>
    </div>
  );
}
