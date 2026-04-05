'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DatePickerWithQuickSelect from './DatePickerWithQuickSelect';
import AutocompleteInput from './AutocompleteInput';

interface QuickAddRowProps {
    onAddRecord: (record: any) => void;
}

export default function QuickAddRow({ onAddRecord }: QuickAddRowProps) {
    const [quickFormData, setQuickFormData] = useState({
        adiSoyadi: '',
        unvani: '',
        girisTarihi: '',
        cikisTarihi: '',
        odaTipi: 'Single Oda',
        konaklamaTipi: 'BB',
        gecelikUcret: '',
        toplamUcret: '',
        otelAdi: '',
        projeAdi: '',
        kurumCari: '',
        numberOfNights: 0,
    });

    // Autocomplete suggestions
    const [hotelNames, setHotelNames] = useState<string[]>([]);
    const [cariNames, setCariNames] = useState<string[]>([]);

    // Otel isimlerini ve cari isimlerini yükle
    useEffect(() => {
        const fetchHotelNames = async () => {
            try {
                const res = await fetch('/api/accommodation/hotel-names');
                if (res.ok) {
                    const data = await res.json();
                    setHotelNames(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Otel isimleri yüklenirken hata:', error);
            }
        };

        const fetchCariNames = async () => {
            try {
                const res = await fetch('/api/cariler');
                if (res.ok) {
                    const data = await res.json();
                    const cariler = Array.isArray(data) ? data : [];
                    // Cari isimlerini formatla (ad soyad veya şirket adı)
                    const names = cariler.map((cari: any) => {
                        if (cari.sirket) return cari.sirket;
                        if (cari.ad && cari.soyad) return `${cari.ad} ${cari.soyad}`;
                        if (cari.ad) return cari.ad;
                        return cari.id;
                    }).filter(Boolean);
                    setCariNames(names);
                }
            } catch (error) {
                console.error('Cari isimleri yüklenirken hata:', error);
            }
        };

        fetchHotelNames();
        fetchCariNames();
    }, []);

    // Gece sayısını ve toplam ücreti hesapla
    useEffect(() => {
        if (quickFormData.girisTarihi && quickFormData.cikisTarihi) {
            const checkIn = new Date(quickFormData.girisTarihi);
            const checkOut = new Date(quickFormData.cikisTarihi);
            
            // Tarih geçerliliğini kontrol et
            if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
                setQuickFormData(prev => ({
                    ...prev,
                    numberOfNights: 0,
                    toplamUcret: ''
                }));
                return;
            }

            const diffTime = checkOut.getTime() - checkIn.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const nights = diffDays > 0 ? diffDays : 0;

            // Gecelik ücreti parse et (string veya number olabilir)
            const gecelikUcret = typeof quickFormData.gecelikUcret === 'string' 
                ? parseFloat(quickFormData.gecelikUcret) || 0
                : quickFormData.gecelikUcret || 0;

            if (nights > 0 && gecelikUcret > 0) {
                const total = nights * gecelikUcret;
                setQuickFormData(prev => ({
                    ...prev,
                    numberOfNights: nights,
                    toplamUcret: total.toFixed(2)
                }));
            } else {
                setQuickFormData(prev => ({
                    ...prev,
                    numberOfNights: nights,
                    toplamUcret: nights > 0 && gecelikUcret > 0 ? (nights * gecelikUcret).toFixed(2) : ''
                }));
            }
        } else {
            setQuickFormData(prev => ({
                ...prev,
                numberOfNights: 0,
                toplamUcret: ''
            }));
        }
    }, [quickFormData.girisTarihi, quickFormData.cikisTarihi, quickFormData.gecelikUcret]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setQuickFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleQuickAdd = async () => {
        // Validation
        if (!quickFormData.adiSoyadi || !quickFormData.unvani || !quickFormData.girisTarihi ||
            !quickFormData.cikisTarihi || !quickFormData.otelAdi) {
            alert('Lütfen tüm gerekli alanları doldurun!');
            return;
        }

        const gecelikUcret = parseFloat(quickFormData.gecelikUcret);
        if (isNaN(gecelikUcret) || gecelikUcret <= 0) {
            alert('Gecelik ücret 0\'dan büyük olmalıdır!');
            return;
        }

        try {
            const response = await fetch('/api/accommodation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adiSoyadi: quickFormData.adiSoyadi,
                    unvani: quickFormData.unvani,
                    girisTarihi: quickFormData.girisTarihi,
                    cikisTarihi: quickFormData.cikisTarihi,
                    odaTipi: quickFormData.odaTipi,
                    konaklamaTipi: quickFormData.konaklamaTipi,
                    gecelikUcret: parseFloat(quickFormData.gecelikUcret),
                    toplamUcret: parseFloat(quickFormData.toplamUcret),
                    otelAdi: quickFormData.otelAdi,
                    projeAdi: quickFormData.projeAdi || undefined,
                    kurumCari: quickFormData.kurumCari || undefined,
                    numberOfNights: quickFormData.numberOfNights,
                    ulke: 'Türkiye',
                    sehir: '',
                    isMunferit: false,
                }),
            });

            if (response.ok) {
                const newRecord = await response.json();
                onAddRecord(newRecord);

                // Form'u temizle
                setQuickFormData({
                    adiSoyadi: '',
                    unvani: '',
                    girisTarihi: '',
                    cikisTarihi: '',
                    odaTipi: 'Single Oda',
                    konaklamaTipi: 'BB',
                    gecelikUcret: '',
                    toplamUcret: '',
                    otelAdi: '',
                    projeAdi: '',
                    kurumCari: '',
                    numberOfNights: 0,
                });

                // Sayfayı yenile
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Hata: ${error.error || 'Kayıt eklenemedi'}`);
            }
        } catch (error) {
            console.error('Quick add error:', error);
            alert('Kayıt eklenirken bir hata oluştu!');
        }
    };

    return (
        <div className="bg-[var(--muted-background)] border-2 border-[var(--card-border)] rounded-lg p-4 mt-4" style={{
            background: 'linear-gradient(to right, var(--muted-background), var(--card))'
        }}>
            <div className="flex items-center gap-2 mb-3">
                <Plus className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <h3 className="font-semibold text-[var(--text-primary)]">Hızlı Kayıt Ekle</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3">
                {/* Adı Soyadı */}
                <div className="xl:col-span-3">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Adı Soyadı *</label>
                    <input
                        type="text"
                        name="adiSoyadi"
                        value={quickFormData.adiSoyadi}
                        onChange={handleInputChange}
                        placeholder="Adı Soyadı"
                        className="w-full px-3 py-2 border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder:text-[var(--text-muted)]"
                    />
                </div>

                {/* Unvanı */}
                <div className="xl:col-span-3">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Unvanı *</label>
                    <input
                        type="text"
                        name="unvani"
                        value={quickFormData.unvani}
                        onChange={handleInputChange}
                        placeholder="Unvanı"
                        className="w-full px-3 py-2 border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder:text-[var(--text-muted)]"
                    />
                </div>

                {/* Giriş Tarihi */}
                <div className="xl:col-span-2">
                    <DatePickerWithQuickSelect
                        value={quickFormData.girisTarihi}
                        onChange={(value) => {
                            setQuickFormData(prev => ({ ...prev, girisTarihi: value }));
                        }}
                        label="Giriş Tarihi *"
                        maxDate={quickFormData.cikisTarihi || undefined}
                        required
                    />
                </div>

                {/* Çıkış Tarihi */}
                <div className="xl:col-span-2">
                    <DatePickerWithQuickSelect
                        value={quickFormData.cikisTarihi}
                        onChange={(value) => {
                            setQuickFormData(prev => ({ ...prev, cikisTarihi: value }));
                        }}
                        label="Çıkış Tarihi *"
                        minDate={quickFormData.girisTarihi || undefined}
                        required
                    />
                </div>

                {/* Oda Tipi + Konaklama Tipi */}
                <div className="sm:col-span-2 xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Oda Tipi</label>
                        <select
                            name="odaTipi"
                            value={quickFormData.odaTipi}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="Single Oda">Single Oda</option>
                            <option value="Double Oda">Double Oda</option>
                            <option value="Twin Oda">Twin Oda</option>
                            <option value="Suite">Suite</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Konaklama Tipi</label>
                        <select
                            name="konaklamaTipi"
                            value={quickFormData.konaklamaTipi}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="BB">BB (Oda Kahvaltı)</option>
                            <option value="HB">HB (Yarım Pansiyon)</option>
                            <option value="FB">FB (Tam Pansiyon)</option>
                            <option value="UHD">UHD (Her Şey Dahil)</option>
                        </select>
                    </div>
                </div>

                {/* Gecelik Ücret */}
                <div className="xl:col-span-2">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Gecelik Ücret *</label>
                    <input
                        type="number"
                        name="gecelikUcret"
                        value={quickFormData.gecelikUcret}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder:text-[var(--text-muted)]"
                    />
                </div>

                {/* Toplam Ücret (Otomatik) */}
                <div className="xl:col-span-2">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Toplam Ücret</label>
                    <input
                        type="text"
                        value={quickFormData.toplamUcret ? `₺${parseFloat(quickFormData.toplamUcret).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₺0,00'}
                        disabled
                        readOnly
                        className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--muted-background)] text-[var(--text-secondary)] text-sm font-semibold cursor-not-allowed"
                    />
                    {quickFormData.numberOfNights > 0 && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            {quickFormData.numberOfNights} gece × ₺{parseFloat(quickFormData.gecelikUcret || '0').toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    )}
                </div>

                {/* Otel Adı */}
                <div className="xl:col-span-3">
                    <AutocompleteInput
                        value={quickFormData.otelAdi}
                        onChange={(value) => setQuickFormData(prev => ({ ...prev, otelAdi: value }))}
                        suggestions={hotelNames}
                        placeholder="Otel Adı"
                        label="Otel Adı"
                        required
                        name="otelAdi"
                    />
                </div>

                {/* Proje Adı */}
                <div className="xl:col-span-3">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Proje Adı</label>
                    <input
                        type="text"
                        name="projeAdi"
                        value={quickFormData.projeAdi || ''}
                        onChange={handleInputChange}
                        placeholder="Proje Adı"
                        className="w-full px-3 py-2 border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder:text-[var(--text-muted)]"
                    />
                </div>

                {/* Cari */}
                <div className="xl:col-span-3">
                    <AutocompleteInput
                        value={quickFormData.kurumCari}
                        onChange={(value) => setQuickFormData(prev => ({ ...prev, kurumCari: value }))}
                        suggestions={cariNames}
                        placeholder="Cari Seçin"
                        label="Cari"
                        name="kurumCari"
                    />
                </div>

                {/* Kaydet Butonu */}
                <div className="sm:col-span-2 xl:col-span-2 flex items-end">
                    <button
                        onClick={handleQuickAdd}
                        className="w-full h-[42px] px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Kayıt Oluştur
                    </button>
                </div>
            </div>
        </div>
    );
}
