export type UserRole = 'superadmin' | 'mitra';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  organizationName?: string;
  province?: string;
  city?: string;
  createdAt: string;
  avatar?: string;
  bio?: string;
  isLocked?: boolean;
}

export interface ApplicationSettings {
  applicationName: string;
  logo: string;
  favicon: string;
  topbarColor: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  publicRoleLabel?: string;
  institutionSubtitle?: string;
  logoSize?: 'normal' | 'large' | 'xlarge';
  headerBgImage?: string;
  headerBgOverlay?: 'dark' | 'light' | 'none';
  logoContainerBg?: 'white' | 'transparent' | 'glass';
  updatedAt?: string;
  updatedBy?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: UserRole | 'system' | 'guest';
  action: string;
  module: 'profile' | 'settings' | 'events' | 'disability' | 'participants' | 'auth' | 'system' | 'support' | string;
  details: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

export type DisabilityType = 
  | 'tunanetra' 
  | 'tunarungu' 
  | 'tunadaksa' 
  | 'intelektual_autisme' 
  | 'multi';

export interface TrainingProposal {
  id: string;
  mitraId: string;
  mitraName: string;
  mitraOrg: string;
  namaKegiatan: string;
  jenisEvent: string;
  deskripsiPelatihan: string;
  lokasiDanAlamat: string;
  provinsi: string;
  kota: string;
  latitude: number;
  longitude: number;
  tanggalKegiatan: string;
  targetDanKuotaPeserta: number;
  targetPeserta?: string;
  kebutuhanPeserta: string[];
  status: 'menunggu_persetujuan' | 'disetujui' | 'ditolak';
  alasanPenolakan?: string;
  tanggalPersetujuan?: string;
  linkPendaftaran?: string;
  kuotaDisetujui?: number;
  isAktif: boolean;
  createdAt: string;
  jumlahPendaftar: number;
  fotoDokumentasi?: string[];
}

export interface DisabilityMaster {
  id: string;
  kode: string;
  nama: string;
  kategoriUtama: 'Sensorik' | 'Fisik' | 'Intelektual & Mental' | 'Ganda' | 'Pendamping';
  deskripsi: string;
  metodePembelajaran: string;
  fasilitasRekomendasi: string[];
  warnaHex: string;
  icon: string;
  isAktif: boolean;
  createdAt: string;
}

export interface Participant {
  id: string;
  eventId: string;
  eventTitle?: string;
  namaLengkap: string;
  noWa: string;
  email: string;
  usia: number;
  kategoriDisabilitas: 'tunanetra' | 'tunarungu' | 'tunadaksa' | 'intelektual_autisme' | 'pendamping_umum';
  kebutuhanFasilitas: string[];
  catatanKhusus: string;
  statusKehadiran: 'terdaftar' | 'hadir' | 'batal';
  waktuDaftar: string;
}

export interface QuranCommunity {
  id: string;
  mitraId?: string;
  namaMitra?: string;
  namaYayasan?: string;
  namaLembaga: string;
  kategoriDisabilitas: DisabilityType[];
  provinsi: string;
  kota: string;
  alamatLengkap: string;
  latitude: number;
  longitude: number;
  kontakWa: string;
  kontakEmail?: string;
  jumlahSantri: number;
  fasilitasTersedia: string[];
  programUnggulan: string;
  deskripsi: string;
  verified: boolean;
  activeEventsCount?: number;
}

export interface SystemStats {
  totalProposals: number;
  approvedEvents: number;
  pendingProposals: number;
  rejectedProposals: number;
  totalParticipants: number;
  totalCommunities: number;
  totalMitra: number;
  totalSuperAdmin: number;
}
