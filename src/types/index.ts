// User Types
export interface User {
  id: number;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SIRKET_YONETICISI = 'SIRKET_YONETICISI'
}

// Accommodation Types
export interface Accommodation {
  id: number;
  adiSoyadi: string;
  unvani: string;
  ulke: string;
  sehir: string;
  girisTarihi: string;
  cikisTarihi: string;
  odaTipi: string;
  konaklamaTipi: string;

  gecelikUcret: number;
  toplamUcret: number;
  organizasyonAdi?: string;
  otelAdi?: string;
  kurumCari?: string;
  numberOfNights?: number;
}

// Hotel Types
export interface Hotel {
  id: number;
  adi: string;
  adres: string;
  sehir: string;
  ulke: string;
  telefon?: string;
  email?: string;
  website?: string;
  yildizSayisi: number;
  puan: number;
  aciklama?: string;
  durum: HotelDurum;
  createdAt: Date;
  updatedAt: Date;
}

export enum HotelDurum {
  AKTIF = 'AKTIF',
  PASIF = 'PASIF'
}

// Transfer Types
export interface Vehicle {
  id: string;
  plaka: string;
  marka: string;
  model: string;
  yolcuKapasitesi: number;
  durum: VehicleDurum;
  enlem: number;
  boylam: number;
  sonGuncelleme: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum VehicleDurum {
  MUSAIT = 'MUSAIT',
  TRANSFERDE = 'TRANSFERDE',
  BAKIMDA = 'BAKIMDA',
  ARIZALI = 'ARIZALI'
}

export interface Driver {
  id: string;
  ad: string;
  soyad: string;
  telefon: string;
  ehliyetSinifi: string;
  atananAracId?: string;
  durum: DriverDurum;
  ehliyetSiniflari: string[];
  srcBelgeleri: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum DriverDurum {
  MUSAIT = 'MUSAIT',
  TRANSFERDE = 'TRANSFERDE',
  IZINDE = 'IZINDE'
}

export interface Transfer {
  id: string;
  baslangicNoktasi: string;
  bitisNoktasi: string;
  baslangicTarihi: Date;
  bitisTarihi: Date;
  yolcuSayisi: number;
  durum: TransferDurum;
  fiyat: number;
  tahsisli: boolean;
  aracId?: string;
  soforId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransferDurum {
  PLANLANDI = 'PLANLANDI',
  DEVAM_EDIYOR = 'DEVAM_EDIYOR',
  TAMAMLANDI = 'TAMAMLANDI',
  IPTAL_EDILDI = 'IPTAL_EDILDI'
}

// Customer & Supplier Types
export interface Customer {
  id: number;
  adiSoyadi: string;
  telefon: string;
  email?: string;
  adres?: string;
  tip: CustomerTip;
  durum: CustomerDurum;
  createdAt: Date;
  updatedAt: Date;
}

export enum CustomerTip {
  BIREYSEL = 'BIREYSEL',
  KURUMSAL = 'KURUMSAL'
}

export enum CustomerDurum {
  AKTIF = 'AKTIF',
  PASIF = 'PASIF'
}

export interface Supplier {
  id: number;
  firmaAdi: string;
  yetkiliKisi: string;
  telefon: string;
  email?: string;
  adres?: string;
  hizmetAlani: string;
  durum: SupplierDurum;
  createdAt: Date;
  updatedAt: Date;
}

export enum SupplierDurum {
  AKTIF = 'AKTIF',
  PASIF = 'PASIF'
}

// Log Types
export interface Log {
  id: number;
  action: string;
  modelName: string;
  recordId: number;
  recordData: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  validation?: any;
}

// Table Types
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: (record: T) => boolean;
}
