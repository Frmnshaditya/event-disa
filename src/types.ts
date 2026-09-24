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
  address?: string;
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
  logoSize?: string;
  headerBgImage?: string;
  headerBgOverlay?: 'dark' | 'light' | 'none' | string;
  logoContainerBg?: 'white' | 'transparent' | 'glass' | string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  userId?: string;
  userName?: string;
  action: string;
  module: string;
  details: string;
  description?: string;
  status: 'success' | 'info' | 'warning' | 'error' | string;
  ipAddress?: string;
  createdAt?: string;
}

export type DisabilityType =
  | 'tunanetra'
  | 'tunarungu'
  | 'tunadaksa'
  | 'intelektual_autisme'
  | 'pendamping_umum'
  | string;

export interface DisabilityMaster {
  id: string;
  kode: string;
  nama: string;
  kategoriUtama: 'Sensorik' | 'Fisik' | 'Intelektual' | 'Mental' | 'Ganda' | string;
  deskripsi: string;
  metodePembelajaran: string;
  fasilitasRekomendasi: string[];
  warnaHex: string;
  icon: string;
  isAktif: boolean;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  description?: string;
}

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
  kuotaDisetujui?: number;
  kebutuhanPeserta: string[];
  status: 'menunggu_persetujuan' | 'disetujui' | 'ditolak';
  isAktif: boolean;
  createdAt?: string;
  tanggalPersetujuan?: string;
  linkPendaftaran?: string;
  alasanPenolakan?: string;
  jumlahPendaftar: number;
  fotoDokumentasi: string[];
  title?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  organizer?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  quota?: number;
  registered?: number;
  updatedAt?: string;
}

export interface Participant {
  id: string;
  eventId: string;
  eventTitle: string;
  namaLengkap: string;
  noWa: string;
  email: string;
  usia: number;
  kategoriDisabilitas: DisabilityType;
  kebutuhanFasilitas: string[];
  catatanKhusus: string;
  statusKehadiran: 'terdaftar' | 'hadir' | 'batal' | 'pending' | string;
  waktuDaftar: string;
  name?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  address?: string;
  province?: string;
  city?: string;
  disabilityType?: string;
  disabilityId?: string;
  organizationName?: string;
  trainingId?: string;
  trainingTitle?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
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
  kontakEmail: string;
  jumlahSantri: number;
  fasilitasTersedia: string[];
  programUnggulan: string;
  deskripsi: string;
  verified: boolean;
  activeEventsCount: number;
  name?: string;
  description?: string;
  leader?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
  memberCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemStats {
  totalProposals?: number;
  approvedEvents?: number;
  pendingProposals?: number;
  rejectedProposals?: number;
  totalParticipants?: number;
  totalCommunities?: number;
  totalMitra?: number;
  totalSuperAdmin?: number;
  totalUsers?: number;
  totalTrainingProposals?: number;
  totalDisabilities?: number;
  activeTrainingProposals?: number;
  pendingParticipants?: number;
  [key: string]: number | undefined;
}