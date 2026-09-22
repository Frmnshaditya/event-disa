import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  User,
  TrainingProposal,
  Participant,
  QuranCommunity,
  SystemStats,
  DisabilityMaster,
  ApplicationSettings,
  SystemLog
} from './src/types.ts';
import { getDbPool } from './backend/database/mysql.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

let appSettings: ApplicationSettings = {
  applicationName: 'Alquran Disabilitas',
  logo: '',
  favicon: '',
  topbarColor: '#005a71',
  primaryColor: '#005a71',
  secondaryColor: '#ab3425',
  accentColor: '#d97706',
  publicRoleLabel: 'Peserta',
  institutionSubtitle: 'Kementerian Agama Republik Indonesia',
  logoSize: 'large',
  headerBgImage: '',
  headerBgOverlay: 'dark',
  logoContainerBg: 'white',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Super Administrator'
};

// System Activity Logs
let systemLogs: SystemLog[] = [
  {
    id: 'log_01',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    user: 'Ustadz Ahmad Fauzi, M.Pd.I',
    userRole: 'superadmin',
    action: 'Login Super Admin',
    module: 'auth',
    details: 'Autentikasi akun Super Administrator Nasional berhasil.',
    status: 'success'
  },
  {
    id: 'log_02',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    user: 'Sistem Alquran Disabilitas',
    userRole: 'system',
    action: 'Sinkronisasi Master Data',
    module: 'system',
    details: 'Ragam disabilitas dan proposal pelatihan disinkronkan ke database.',
    status: 'info'
  },
  {
    id: 'log_03',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user: 'Dr. Nurul Hidayah, S.Ag',
    userRole: 'superadmin',
    action: 'Verifikasi Event Pelatihan',
    module: 'events',
    details: 'Menyetujui agenda "Daurah Nasional Tilawah Al-Quran Bahasa Isyarat".',
    status: 'success'
  },
  {
    id: 'log_04',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    user: 'Kang Ridwan Sulaeman',
    userRole: 'mitra',
    action: 'Pembaruan Data Lembaga',
    module: 'profile',
    details: 'Memperbarui informasi kontak Yayasan Sahabat Netra Mengaji.',
    status: 'info'
  }
];

// In-Memory Database Store with realistic initial Indonesian seed data
const userPasswords: Record<string, string> = {
  usr_super_1: 'password123',
  usr_super_2: 'password123',
  usr_mitra_1: 'password123',
  usr_mitra_2: 'password123',
  usr_mitra_3: 'password123',
};

let users: User[] = [
  {
    id: 'usr_super_1',
    name: 'Ustadz Ahmad Fauzi, M.Pd.I',
    email: 'superadmin@qurandisabilitas.id',
    role: 'superadmin',
    phone: '081234567890',
    organizationName: 'Pusat Layanan Al-Quran Disabilitas Indonesia (PLQDI)',
    province: 'DKI Jakarta',
    city: 'Jakarta Selatan',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'usr_super_2',
    name: 'Dr. Nurul Hidayah, S.Ag',
    email: 'nurul.superadmin@qurandisabilitas.id',
    role: 'superadmin',
    phone: '081298765432',
    organizationName: 'Kementerian Agama RI - Pokja Disabilitas',
    province: 'DKI Jakarta',
    city: 'Jakarta Pusat',
    createdAt: '2025-01-15T09:30:00Z',
  },
  {
    id: 'usr_mitra_1',
    name: 'Kang Ridwan Sulaeman',
    email: 'mitra.bandung@qurandisabilitas.id',
    role: 'mitra',
    phone: '085712349988',
    organizationName: 'Yayasan Sahabat Netra Mengaji Jawa Barat',
    province: 'Jawa Barat',
    city: 'Kota Bandung',
    createdAt: '2025-02-01T10:00:00Z',
  },
  {
    id: 'usr_mitra_2',
    name: 'Ustadzah Siti Maryam',
    email: 'mitra.jogja@qurandisabilitas.id',
    role: 'mitra',
    phone: '081377889900',
    organizationName: 'Rumah Quran Isyarat Indonesia (RQII)',
    province: 'DI Yogyakarta',
    city: 'Kabupaten Sleman',
    createdAt: '2025-02-12T11:00:00Z',
  },
  {
    id: 'usr_mitra_3',
    name: 'H. Bambang Wicaksono',
    email: 'mitra.surabaya@qurandisabilitas.id',
    role: 'mitra',
    phone: '081911223344',
    organizationName: 'Samara Disability Quranic Center',
    province: 'Jawa Timur',
    city: 'Kota Surabaya',
    createdAt: '2025-02-20T14:15:00Z',
  }
];

let communities: QuranCommunity[] = [
  {
    id: 'comm_1',
    mitraId: 'usr_mitra_1',
    namaMitra: 'Kang Ridwan Sulaeman',
    namaYayasan: 'Yayasan Sahabat Netra Mengaji Jawa Barat',
    namaLembaga: 'Yayasan Sahabat Netra Mengaji',
    kategoriDisabilitas: ['tunanetra'],
    provinsi: 'Jawa Barat',
    kota: 'Kota Bandung',
    alamatLengkap: 'Jl. Sukajadi No. 142, Pasteur, Kec. Sukajadi, Kota Bandung',
    latitude: -6.8892,
    longitude: 107.5944,
    kontakWa: '085712349988',
    kontakEmail: 'sahabatnetra.bdg@gmail.com',
    jumlahSantri: 185,
    fasilitasTersedia: ['Mushaf Braille Standar Kemenag', 'Mesin Ketik Perkins Brailler', 'Audio Pembacaan Ayat Qurani', 'Jalur Pemandu (Guiding Block)'],
    programUnggulan: 'Daurah Tahfidz Braille 30 Juz & Pengkaderan Guru Netra',
    deskripsi: 'Lembaga dakwah quran khusus sahabat disabilitas netra dengan kurikulum tilawah braille dan hafalan mutqin.',
    verified: true,
    activeEventsCount: 2,
  },
  {
    id: 'comm_2',
    mitraId: 'usr_mitra_2',
    namaMitra: 'Ustadzah Siti Maryam',
    namaYayasan: 'Rumah Quran Isyarat Indonesia (RQII)',
    namaLembaga: 'Rumah Quran Isyarat Indonesia (RQII)',
    kategoriDisabilitas: ['tunarungu'],
    provinsi: 'DI Yogyakarta',
    kota: 'Kabupaten Sleman',
    alamatLengkap: 'Jl. Kaliurang KM 9.3, Ngaglik, Kab. Sleman, D.I. Yogyakarta',
    latitude: -7.7188,
    longitude: 110.3981,
    kontakWa: '081377889900',
    kontakEmail: 'rqii.jogja@gmail.com',
    jumlahSantri: 240,
    fasilitasTersedia: ['Penerjemah Bahasa Isyarat (JBI)', 'Modul Visual Tajwid Isyarat', 'Layar Smart TV Berisyarat', 'Kamus Fiqih Isyarat'],
    programUnggulan: 'Metode Tilawah Isyarat Hijaiyah & Kajian Tafsir Tuli',
    deskripsi: 'Pelopor pembelajaran quran ramah teman Tuli di Indonesia berbasis Bahasa Isyarat Indonesia (BISINDO).',
    verified: true,
    activeEventsCount: 1,
  },
  {
    id: 'comm_3',
    mitraId: 'usr_mitra_4',
    namaMitra: 'Ustadz Dimas Aditya',
    namaYayasan: 'Yayasan Tuli Mengaji Jakarta',
    namaLembaga: 'Yayasan Tuli Mengaji Jakarta',
    kategoriDisabilitas: ['tunarungu'],
    provinsi: 'DKI Jakarta',
    kota: 'Jakarta Selatan',
    alamatLengkap: 'Jl. Tebet Barat Dalam Raya No. 58, Tebet, Jakarta Selatan',
    latitude: -6.2383,
    longitude: 106.8494,
    kontakWa: '081288991122',
    kontakEmail: 'tulimengaji.jkt@gmail.com',
    jumlahSantri: 160,
    fasilitasTersedia: ['Studio Video Isyarat', 'JBI Standar Nasional', 'Buku Panduan Hijaiyah Berwarna'],
    programUnggulan: 'Tashih Surat Pendek Teman Tuli & Pelatihan JBI Quran',
    deskripsi: 'Yayasan binaan mitra untuk pembelajaran Al-Quran remaja dan dewasa Tuli se-Jabodetabek dengan pengajar bersertifikat.',
    verified: true,
    activeEventsCount: 1,
  },
  {
    id: 'comm_4',
    mitraId: 'usr_mitra_5',
    namaMitra: 'Drs. H. Syarifudin',
    namaYayasan: 'Yayasan Pesantren Raudhatul Makfufin',
    namaLembaga: 'Pesantren Disabilitas Raudhatul Makfufin',
    kategoriDisabilitas: ['tunanetra'],
    provinsi: 'Banten',
    kota: 'Kota Tangerang Selatan',
    alamatLengkap: 'Jl. Pajajaran No. 11, Buaran Indah, Serpong, Tangerang Selatan',
    latitude: -6.3211,
    longitude: 106.6972,
    kontakWa: '081199332211',
    kontakEmail: 'raudhatulmakfufin@gmail.com',
    jumlahSantri: 320,
    fasilitasTersedia: ['Percetakan Al-Quran Braille Mandiri', 'Perpustakaan Braille', 'Asrama Santri Ramah Netra', 'Lab Komputer Bicara'],
    programUnggulan: 'Pesantren Tahfidz Khusus Tunanetra & Percetakan Mushaf Braille',
    deskripsi: 'Yayasan legendaris mitra pionir percetakan dan pengajaran Al-Quran Braille di Indonesia sejak 1983.',
    verified: true,
    activeEventsCount: 1,
  },
  {
    id: 'comm_5',
    mitraId: 'usr_mitra_3',
    namaMitra: 'H. Bambang Wicaksono',
    namaYayasan: 'Yayasan Samara Disability Quranic Center',
    namaLembaga: 'Samara Disability Quranic Center',
    kategoriDisabilitas: ['multi', 'tunadaksa', 'intelektual_autisme'],
    provinsi: 'Jawa Timur',
    kota: 'Kota Surabaya',
    alamatLengkap: 'Jl. Rungkut Madya No. 89, Gunung Anyar, Kota Surabaya',
    latitude: -7.3255,
    longitude: 112.7845,
    kontakWa: '081911223344',
    kontakEmail: 'samara.disability@gmail.com',
    jumlahSantri: 195,
    fasilitasTersedia: ['Rampa Kursi Roda Standar', 'Ruang Terapi Sensori', 'Al-Quran Digital Sentuh', 'Toilet Aksesibel Khusus'],
    programUnggulan: 'Kelas Quran Multi-Disabilitas & Terapi Religi Anak Istimewa',
    deskripsi: 'Yayasan mitra pusat pembelajaran quran ramah disabilitas fisik, sensorik, dan neurodivergen di Jawa Timur.',
    verified: true,
    activeEventsCount: 1,
  },
  {
    id: 'comm_6',
    mitraId: 'usr_mitra_6',
    namaMitra: 'Ustadz Ahmad Fauzi',
    namaYayasan: 'Yayasan Difabel Mengaji Jawa Tengah',
    namaLembaga: 'Yayasan Difabel Mengaji Jawa Tengah',
    kategoriDisabilitas: ['tunadaksa', 'tunanetra'],
    provinsi: 'Jawa Tengah',
    kota: 'Kota Semarang',
    alamatLengkap: 'Jl. Pemuda No. 104, Sekayu, Kec. Semarang Tengah, Kota Semarang',
    latitude: -6.9744,
    longitude: 110.4194,
    kontakWa: '081544332211',
    kontakEmail: 'difabelmengaji.jateng@gmail.com',
    jumlahSantri: 140,
    fasilitasTersedia: ['Kendaraan Operasional Ramah Kursi Roda', 'Mushaf Braille', 'Meja Mengaji Ergonomis'],
    programUnggulan: 'Mobile Tahsin Difabel Keliling Jawa Tengah',
    deskripsi: 'Yayasan binaan mitra menyediakan kelas quran inklusif jemput bola bagi sahabat disabilitas daksa dan netra.',
    verified: true,
    activeEventsCount: 0,
  },
  {
    id: 'comm_7',
    mitraId: 'usr_mitra_7',
    namaMitra: 'Ustadz Daeng Baso',
    namaYayasan: 'Yayasan Sahabat Tuli & Netra Quran Makassar',
    namaLembaga: 'Yayasan Sahabat Tuli & Netra Quran Makassar',
    kategoriDisabilitas: ['multi', 'tunarungu', 'tunanetra'],
    provinsi: 'Sulawesi Selatan',
    kota: 'Kota Makassar',
    alamatLengkap: 'Jl. Perintis Kemerdekaan KM 10, Tamalanrea, Kota Makassar',
    latitude: -5.1354,
    longitude: 119.4891,
    kontakWa: '082199887766',
    kontakEmail: 'sahabatquran.mks@gmail.com',
    jumlahSantri: 110,
    fasilitasTersedia: ['Juru Bahasa Isyarat Bugis-Makassar', 'Mushaf Braille', 'Gedung Ramah Kursi Roda'],
    programUnggulan: 'Pengkaderan Da\'i Disabilitas Kawasan Indonesia Timur',
    deskripsi: 'Yayasan mitra sentra pembinaan baca tulis quran inklusif pertama di kawasan Sulawesi Selatan.',
    verified: true,
    activeEventsCount: 1,
  },
  {
    id: 'comm_8',
    mitraId: 'usr_mitra_8',
    namaMitra: 'Hj. Nurul Hidayah',
    namaYayasan: 'Yayasan Cinta Quran Disabilitas Banjarbaru',
    namaLembaga: 'Yayasan Cinta Quran Disabilitas Banjarbaru',
    kategoriDisabilitas: ['tunanetra', 'tunarungu'],
    provinsi: 'Kalimantan Selatan',
    kota: 'Kota Banjarbaru',
    alamatLengkap: 'Jl. Ahmad Yani KM 33, Loktabat Selatan, Kota Banjarbaru',
    latitude: -3.4406,
    longitude: 114.8306,
    kontakWa: '085244119900',
    kontakEmail: 'qurandifabel.bjb@gmail.com',
    jumlahSantri: 92,
    fasilitasTersedia: ['Mushaf Braille Juz Amma', 'Papan Belajar Hijaiyah Timbul', 'Ruang Kelas Tenang'],
    programUnggulan: 'Satu Rumah Satu Hafidz Netra & Tuli',
    deskripsi: 'Yayasan mitra wadah silaturahmi dan pelatihan tilawah quran khusus difabel se-Kalimantan Selatan.',
    verified: true,
    activeEventsCount: 0,
  }
];

let proposals: TrainingProposal[] = [
  {
    id: 'ev_001',
    mitraId: 'usr_mitra_1',
    mitraName: 'Kang Ridwan Sulaeman',
    mitraOrg: 'Yayasan Sahabat Netra Mengaji Jawa Barat',
    namaKegiatan: 'Pelatihan Standardisasi Pengajar Al-Quran Braille Nasional Angkatan IV',
    jenisEvent: 'Pelatihan Guru Quran Braille',
    deskripsiPelatihan: 'Program intensif pencetakan 50 guru dan relawan pengajar Al-Quran Braille bersertifikat standar Lajnah Pentashihan Mushaf Al-Quran (LPMQ) Kementerian Agama.',
    lokasiDanAlamat: 'Pusdiklat Balai Besar Rehabilitasi Vokasional Disabilitas, Jl. Cibabat No. 29, Cimahi - Bandung',
    provinsi: 'Jawa Barat',
    kota: 'Kota Bandung',
    latitude: -6.8722,
    longitude: 107.5422,
    tanggalKegiatan: '2026-10-15 s/d 2026-10-18',
    targetDanKuotaPeserta: 50,
    kebutuhanPeserta: ['Mushaf Quran Braille Standar LPMQ', 'Reglet & Stylus Braille', 'Materi Audio Digital', 'Konsumsi & Akomodasi Inklusif'],
    status: 'disetujui',
    tanggalPersetujuan: '2026-03-01T10:00:00Z',
    linkPendaftaran: 'https://ais-dev-y3hved57q7ndxyimyyi6gz-136520433181.asia-east1.run.app/#daftar/ev_001',
    kuotaDisetujui: 50,
    isAktif: true,
    createdAt: '2026-02-28T09:00:00Z',
    jumlahPendaftar: 38,
    fotoDokumentasi: [
      'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'
    ],
  },
  {
    id: 'ev_002',
    mitraId: 'usr_mitra_2',
    mitraName: 'Ustadzah Siti Maryam',
    mitraOrg: 'Rumah Quran Isyarat Indonesia (RQII)',
    namaKegiatan: 'Daurah Nasional Tilawah Al-Quran Bahasa Isyarat bagi Teman Tuli',
    jenisEvent: 'Daurah Quran Bahasa Isyarat',
    deskripsiPelatihan: 'Daurah tilawah Al-Quran metode isyarat BISINDO bagi 80 teman Tuli pemula dan mahir, dilengkapi dengan penguasaan makharijul huruf visual dan tajwid isyarat.',
    lokasiDanAlamat: 'Gedung Convention Hall UIN Sunan Kalijaga, Jl. Marsda Adisucipto, Sleman, Yogyakarta',
    provinsi: 'DI Yogyakarta',
    kota: 'Kabupaten Sleman',
    latitude: -7.7844,
    longitude: 110.3956,
    tanggalKegiatan: '2026-10-24 s/d 2026-10-26',
    targetDanKuotaPeserta: 80,
    kebutuhanPeserta: ['5 Juru Bahasa Isyarat (JBI) Standar', 'Layar Presentasi Proyektor Ganda', 'Modul Visual Tajwid Isyarat', 'Akses Rampa Kursi Roda'],
    status: 'disetujui',
    tanggalPersetujuan: '2026-03-05T14:30:00Z',
    linkPendaftaran: 'https://ais-dev-y3hved57q7ndxyimyyi6gz-136520433181.asia-east1.run.app/#daftar/ev_002',
    kuotaDisetujui: 80,
    isAktif: true,
    createdAt: '2026-03-04T11:15:00Z',
    jumlahPendaftar: 64,
    fotoDokumentasi: [
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80'
    ],
  },
  {
    id: 'ev_003',
    mitraId: 'usr_mitra_3',
    mitraName: 'H. Bambang Wicaksono',
    mitraOrg: 'Samara Disability Quranic Center',
    namaKegiatan: 'Workshop Metode Pembelajaran Quran Ramah Anak Disabilitas Intelektual & Autisme',
    jenisEvent: 'Workshop Quran Inklusif & Neurodivergen',
    deskripsiPelatihan: 'Pelatihan pedagogik bagi orang tua dan ustadz/ustadzah dalam mengajarkan huruf hijaiyah dan hafalan surah pendek menggunakan flashcard sensori dan terapi suara.',
    lokasiDanAlamat: 'Auditorium Asrama Haji Sukolilo, Jl. Manyar Kertoadi No. 1, Surabaya',
    provinsi: 'Jawa Timur',
    kota: 'Kota Surabaya',
    latitude: -7.2891,
    longitude: 112.7812,
    tanggalKegiatan: '2026-11-02 s/d 2026-11-03',
    targetDanKuotaPeserta: 60,
    kebutuhanPeserta: ['Fasilitator Terapi Sensori', 'Ruang Tenang (Quiet Room)', 'Alat Peraga Edukatif Taktil Hijaiyah'],
    status: 'disetujui',
    tanggalPersetujuan: '2026-03-08T09:20:00Z',
    linkPendaftaran: 'https://ais-dev-y3hved57q7ndxyimyyi6gz-136520433181.asia-east1.run.app/#daftar/ev_003',
    kuotaDisetujui: 60,
    isAktif: true,
    createdAt: '2026-03-07T16:00:00Z',
    jumlahPendaftar: 42,
    fotoDokumentasi: [
      'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80'
    ],
  },
  {
    id: 'ev_004',
    mitraId: 'usr_mitra_1',
    mitraName: 'Kang Ridwan Sulaeman',
    mitraOrg: 'Yayasan Sahabat Netra Mengaji Jawa Barat',
    namaKegiatan: 'Tashih Akbar & Pelatihan Tahsin Quran Braille Bersanad Priangan Timur',
    jenisEvent: 'Tashih & Tahsin Quran Braille',
    deskripsiPelatihan: 'Kegiatan tashih hafalan dan pembacaan mushaf braille bagi 40 santri netra berprestasi dari wilayah Garut, Tasikmalaya, dan Ciamis.',
    lokasiDanAlamat: 'Masjid Agung Kota Tasikmalaya, Jl. Mesjid Agung No. 1, Tasikmalaya',
    provinsi: 'Jawa Barat',
    kota: 'Kota Tasikmalaya',
    latitude: -7.3274,
    longitude: 108.2207,
    tanggalKegiatan: '2026-11-15',
    targetDanKuotaPeserta: 40,
    kebutuhanPeserta: ['Mushaf Braille Juz 1-5', 'Relawan Pendamping Mobilitas', 'Sound System Berkualitas Tinggi'],
    status: 'menunggu_persetujuan',
    isAktif: false,
    createdAt: '2026-03-12T08:30:00Z',
    jumlahPendaftar: 0,
    fotoDokumentasi: [
      'https://images.unsplash.com/photo-1584281722572-887e41fa80c8?w=800&auto=format&fit=crop&q=80'
    ],
  },
  {
    id: 'ev_005',
    mitraId: 'usr_mitra_2',
    mitraName: 'Ustadzah Siti Maryam',
    mitraOrg: 'Rumah Quran Isyarat Indonesia (RQII)',
    namaKegiatan: 'Pelatihan Fiqih Thaharah dan Shalat Berisyarat Difabel Daksa & Rungu',
    jenisEvent: 'Pelatihan Fiqih Praktis Isyarat',
    deskripsiPelatihan: 'Kajian praktis tata cara thaharah dan bacaan shalat bagi penyandang disabilitas ganda.',
    lokasiDanAlamat: 'Aula Masjid Jogokariyan, Mantrijeron, Yogyakarta',
    provinsi: 'DI Yogyakarta',
    kota: 'Kota Yogyakarta',
    latitude: -7.8288,
    longitude: 110.3688,
    tanggalKegiatan: '2026-09-30',
    targetDanKuotaPeserta: 35,
    kebutuhanPeserta: ['Akses Kursi Roda', 'JBI Shalat'],
    status: 'ditolak',
    alasanPenolakan: 'Rencana lokasi belum memiliki rampa akses kursi roda yang memadai dan kuota JBI masih kurang dari rasio standar 1:10 peserta. Silakan revisi lokasi atau tambah kebutuhan JBI.',
    isAktif: false,
    createdAt: '2026-03-02T10:00:00Z',
    jumlahPendaftar: 0,
    fotoDokumentasi: [
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb7?w=800&auto=format&fit=crop&q=80'
    ],
  },
  {
    id: 'ev_006',
    mitraId: 'usr_mitra_1',
    mitraName: 'Kang Ridwan Sulaeman',
    mitraOrg: 'Yayasan Sahabat Netra Mengaji Jawa Barat',
    namaKegiatan: 'Sosialisasi Literasi Quran Inklusif & Pelatihan Relawan Mengaji untuk Orang Umum',
    jenisEvent: 'Orang Umum',
    deskripsiPelatihan: 'Terbuka untuk masyarakat umum, mahasiswa, dan relawan: pelatihan dasar pendampingan mengaji, etika berinteraksi dengan sahabat disabilitas, serta pengenalan huruf hijaiyah braille & isyarat.',
    lokasiDanAlamat: 'Pusat Dakwah Islam (Pusdai) Jawa Barat, Jl. Diponegoro No. 63, Cihaur Geulis, Kota Bandung',
    provinsi: 'Jawa Barat',
    kota: 'Kota Bandung',
    latitude: -6.9015,
    longitude: 107.6253,
    tanggalKegiatan: '2026-11-20 s/d 2026-11-22',
    targetDanKuotaPeserta: 100,
    kebutuhanPeserta: ['Modul Panduan Relawan Inklusif', 'Sertifikat Pelatihan', 'Konsumsi & Fasilitas Ramah Umum'],
    status: 'disetujui',
    tanggalPersetujuan: '2026-03-10T08:00:00Z',
    linkPendaftaran: 'https://ais-dev-y3hved57q7ndxyimyyi6gz-136520433181.asia-east1.run.app/#daftar/ev_006',
    kuotaDisetujui: 100,
    isAktif: true,
    createdAt: '2026-03-09T10:00:00Z',
    jumlahPendaftar: 72,
    fotoDokumentasi: [
      'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80'
    ],
  },
  {
    id: 'ev_007',
    mitraId: 'usr_mitra_2',
    mitraName: 'Ustadzah Siti Maryam',
    mitraOrg: 'Rumah Quran Isyarat Indonesia (RQII)',
    namaKegiatan: 'Kajian Akbar Inklusif & Belajar Huruf Hijaiyah Isyarat bagi Orang Umum',
    jenisEvent: 'Orang Umum',
    deskripsiPelatihan: 'Kajian terbuka untuk masyarakat umum bersama dai nasional dan praktisi bahasa isyarat, dilengkapi sesi interaktif belajar 28 abjad hijaiyah isyarat bersama teman Tuli.',
    lokasiDanAlamat: 'Masjid Istiqlal, Ruang Al-Fattah Lt. 1, Gambir, Jakarta Pusat',
    provinsi: 'DKI Jakarta',
    kota: 'Jakarta Pusat',
    latitude: -6.1702,
    longitude: 106.8317,
    tanggalKegiatan: '2026-12-05',
    targetDanKuotaPeserta: 150,
    kebutuhanPeserta: ['Akses Terbuka untuk Orang Umum', 'Juru Bahasa Isyarat', 'Materi Lembar Isyarat Hijaiyah'],
    status: 'disetujui',
    tanggalPersetujuan: '2026-03-11T12:00:00Z',
    linkPendaftaran: 'https://ais-dev-y3hved57q7ndxyimyyi6gz-136520433181.asia-east1.run.app/#daftar/ev_007',
    kuotaDisetujui: 150,
    isAktif: true,
    createdAt: '2026-03-10T14:00:00Z',
    jumlahPendaftar: 110,
    fotoDokumentasi: [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80'
    ],
  }
];

let disabilities: DisabilityMaster[] = [
  {
    id: 'dis_1',
    kode: 'tunanetra',
    nama: 'Tunanetra (Braille)',
    kategoriUtama: 'Sensorik',
    deskripsi: 'Penyandang disabilitas dengan hambatan penglihatan total (blind) atau sebagian (low vision).',
    metodePembelajaran: 'Mushaf Al-Quran Braille Standar LPMQ Kemenag RI, Reglet & Stylus, serta Audio Murottal Tartil Digital.',
    fasilitasRekomendasi: ['Mushaf Al-Quran Braille 30 Juz', 'Reglet dan Stylus Pen', 'Relawan Pendamping Mobilitas', 'Al-Quran Digital Audio Bicara'],
    warnaHex: '#005a71',
    icon: 'visibility_off',
    isAktif: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'dis_2',
    kode: 'tunarungu',
    nama: 'Tunarungu / Tuli (Bahasa Isyarat)',
    kategoriUtama: 'Sensorik',
    deskripsi: 'Penyandang disabilitas dengan hambatan pendengaran dan wicara (Tuli dan Hard of Hearing).',
    metodePembelajaran: 'Metode Tilawah Isyarat berbasis BISINDO (Bahasa Isyarat Indonesia) dan Al-Quran Isyarat Standar Kementerian Agama.',
    fasilitasRekomendasi: ['Juru Bahasa Isyarat (JBI) Berlisensi', 'Layar Monitor Visual Tajwid Ganda', 'Buku Panduan Huruf Hijaiyah Isyarat Berwarna', 'Studio Video Pembelajaran'],
    warnaHex: '#fc6f5a',
    icon: 'sign_language',
    isAktif: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'dis_3',
    kode: 'tunadaksa',
    nama: 'Tunadaksa (Fisik & Motorik)',
    kategoriUtama: 'Fisik',
    deskripsi: 'Penyandang disabilitas dengan keterbatasan fungsi gerak tubuh, anggota gerak, atau koordinasi motorik.',
    metodePembelajaran: 'Pembelajaran fleksibel dengan meja baca ergonomis, dudukan mushaf mekanik, dan teknologi kendali tatapan/suara.',
    fasilitasRekomendasi: ['Rampa / Akses Kursi Roda Standar', 'Meja Mengaji Khusus Kursi Roda', 'Toilet Ramah Difabel', 'Dudukan Mushaf Fleksibel'],
    warnaHex: '#ffb95f',
    icon: 'accessible',
    isAktif: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'dis_4',
    kode: 'intelektual_autisme',
    nama: 'Disabilitas Intelektual & Autisme',
    kategoriUtama: 'Intelektual & Mental',
    deskripsi: 'Individu dengan spektrum autisme, ADHD, Down Syndrome, dan hambatan intelektual perkembangan.',
    metodePembelajaran: 'Flashcard Taktil Hijaiyah Bergambar, Pengulangan Multisensori Terstruktur, dan Terapi Suara Menenangkan.',
    fasilitasRekomendasi: ['Ruang Tenang (Quiet Room Sensori)', 'Flashcard Taktil Hijaiyah', 'Guru Pendamping Khusus (GPK)', 'Soundproofing Akustik'],
    warnaHex: '#81d1f0',
    icon: 'psychology',
    isAktif: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'dis_5',
    kode: 'multi',
    nama: 'Multi-Disabilitas / Ganda',
    kategoriUtama: 'Ganda',
    deskripsi: 'Penyandang disabilitas dengan dua atau lebih ragam hambatan fungsional secara bersamaan (misal Deafblind atau Daksa-Rungu).',
    metodePembelajaran: 'Pendampingan personal 1-on-1 dengan stimulasi taktil-sensori khusus dan komunikasi taktil isyarat sentuh.',
    fasilitasRekomendasi: ['Pendamping Khusus 1-on-1', 'Sarana Multisensori Taktil', 'Peralatan Medis & P3K', 'Ruang Pembelajaran Privat'],
    warnaHex: '#9333ea',
    icon: 'diversity_1',
    isAktif: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'dis_6',
    kode: 'pendamping_umum',
    nama: 'Pendamping & Pengasuh Inklusif',
    kategoriUtama: 'Pendamping',
    deskripsi: 'Keluarga, orang tua, relawan, guru SLB, dan ustadz/ustadzah pembina sahabat disabilitas.',
    metodePembelajaran: 'Training of Trainers (ToT) Pedagogik Inklusif, Etika Interaksi Disabilitas, dan Asesmen Kebutuhan Khusus Santri.',
    fasilitasRekomendasi: ['Buku Panduan Pengasuhan Inklusif', 'Sertifikat Kompetensi Instruktur', 'Alat Peraga Edukasi Demonstrasi'],
    warnaHex: '#059669',
    icon: 'family_restroom',
    isAktif: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

let participants: Participant[] = [
  {
    id: 'pt_01',
    eventId: 'ev_001',
    eventTitle: 'Pelatihan Standardisasi Pengajar Al-Quran Braille Nasional Angkatan IV',
    namaLengkap: 'Fajar Kurniawan',
    noWa: '081233445566',
    email: 'fajar.kurniawan@gmail.com',
    usia: 26,
    kategoriDisabilitas: 'tunanetra',
    kebutuhanFasilitas: ['Mushaf Braille Standar LPMQ', 'Audio Pembacaan Ayat Qurani', 'Jalur Pemandu (Guiding Block)'],
    catatanKhusus: 'Sudah hafal 5 juz secara hafalan audio, ingin memperdalam kaidah baca mushaf braille bersanad.',
    statusKehadiran: 'hadir',
    waktuDaftar: '2026-03-02T11:20:00Z'
  },
  {
    id: 'pt_02',
    eventId: 'ev_001',
    eventTitle: 'Pelatihan Standardisasi Pengajar Al-Quran Braille Nasional Angkatan IV',
    namaLengkap: 'Dewi Anggraeni, S.Pd',
    noWa: '085611223344',
    email: 'dewi.anggraeni@gmail.com',
    usia: 29,
    kategoriDisabilitas: 'pendamping_umum',
    kebutuhanFasilitas: ['Materi Panduan Pengajaran Braille'],
    catatanKhusus: 'Guru SLB bagian A (netra), mendaftar sebagai calon instruktur braille quran.',
    statusKehadiran: 'hadir',
    waktuDaftar: '2026-03-03T09:15:00Z'
  },
  {
    id: 'pt_03',
    eventId: 'ev_002',
    eventTitle: 'Daurah Nasional Tilawah Al-Quran Bahasa Isyarat bagi Teman Tuli',
    namaLengkap: 'Muhammad Ilham Saputra',
    noWa: '081988776655',
    email: 'ilham.tuli@gmail.com',
    usia: 22,
    kategoriDisabilitas: 'tunarungu',
    kebutuhanFasilitas: ['Penerjemah Bahasa Isyarat (JBI)', 'Layar Smart TV Berisyarat'],
    catatanKhusus: 'Menggunakan BISINDO aktif, ingin mempelajari makharijul huruf huruf hijaiyah isyarat.',
    statusKehadiran: 'hadir',
    waktuDaftar: '2026-03-06T13:40:00Z'
  },
  {
    id: 'pt_04',
    eventId: 'ev_002',
    eventTitle: 'Daurah Nasional Tilawah Al-Quran Bahasa Isyarat bagi Teman Tuli',
    namaLengkap: 'Annisa Fitriani',
    noWa: '087811992233',
    email: 'annisa.fitri@gmail.com',
    usia: 24,
    kategoriDisabilitas: 'tunarungu',
    kebutuhanFasilitas: ['Penerjemah Bahasa Isyarat (JBI)', 'Modul Visual Tajwid Isyarat'],
    catatanKhusus: 'Tuli sejak usia 4 tahun, sangat antusias belajar tilawah Juz 30 berisyarat.',
    statusKehadiran: 'terdaftar',
    waktuDaftar: '2026-03-06T15:10:00Z'
  },
  {
    id: 'pt_05',
    eventId: 'ev_003',
    eventTitle: 'Workshop Metode Pembelajaran Quran Ramah Anak Disabilitas Intelektual & Autisme',
    namaLengkap: 'Bunda Rini Astuti (Ibu dari Rayhan, 9 th)',
    noWa: '081299887711',
    email: 'rini.astuti@gmail.com',
    usia: 38,
    kategoriDisabilitas: 'intelektual_autisme',
    kebutuhanFasilitas: ['Ruang Tenang (Quiet Room)', 'Fasilitator Terapi Sensori'],
    catatanKhusus: 'Anak kami autisme non-verbal, respon sangat tenang saat mendengarkan murottal.',
    statusKehadiran: 'terdaftar',
    waktuDaftar: '2026-03-09T10:05:00Z'
  },
  {
    id: 'pt_06',
    eventId: 'ev_001',
    eventTitle: 'Pelatihan Standardisasi Pengajar Al-Quran Braille Nasional Angkatan IV',
    namaLengkap: 'Ahmad Fauzi',
    noWa: '081344556677',
    email: 'ahmad.fauzi@gmail.com',
    usia: 31,
    kategoriDisabilitas: 'tunanetra',
    kebutuhanFasilitas: ['Mushaf Braille Standar LPMQ', 'Papan Reglet & Stylus'],
    catatanKhusus: 'Ingin mengajar mengaji Al-Quran braille untuk anak-anak panti asuhan netra.',
    statusKehadiran: 'hadir',
    waktuDaftar: '2026-03-04T08:30:00Z'
  },
  {
    id: 'pt_07',
    eventId: 'ev_004',
    eventTitle: 'Kajian Tajwid Praktis Teman Tuli & Bimbingan Shalat Berisyarat',
    namaLengkap: 'Bambang Sudarsono',
    noWa: '085299887766',
    email: 'bambang.sudarsono@gmail.com',
    usia: 35,
    kategoriDisabilitas: 'tunadaksa',
    kebutuhanFasilitas: ['Akses Ramah Kursi Roda / Ramp', 'Toilet Aksesibel Difabel'],
    catatanKhusus: 'Pengguna kursi roda manual, siap hadir penuh sesi pembelajaran.',
    statusKehadiran: 'terdaftar',
    waktuDaftar: '2026-03-07T14:20:00Z'
  },
  {
    id: 'pt_08',
    eventId: 'ev_002',
    eventTitle: 'Daurah Nasional Tilawah Al-Quran Bahasa Isyarat bagi Teman Tuli',
    namaLengkap: 'Siti Sarah Mardhiyah',
    noWa: '087766554433',
    email: 'siti.sarah@gmail.com',
    usia: 21,
    kategoriDisabilitas: 'tunarungu',
    kebutuhanFasilitas: ['Penerjemah Bahasa Isyarat (JBI)'],
    catatanKhusus: 'Mahasiswi Tuli semester 4, ingin memperlancar hafalan surah-surah pendek.',
    statusKehadiran: 'terdaftar',
    waktuDaftar: '2026-03-08T11:00:00Z'
  },
  {
    id: 'pt_09',
    eventId: 'ev_003',
    eventTitle: 'Workshop Metode Pembelajaran Quran Ramah Anak Disabilitas Intelektual & Autisme',
    namaLengkap: 'Hendrik Pratama',
    noWa: '081822334455',
    email: 'hendrik.pratama@gmail.com',
    usia: 19,
    kategoriDisabilitas: 'tunadaksa',
    kebutuhanFasilitas: ['Tempat Duduk Khusus Penyangga Punggung', 'Akses Ramp'],
    catatanKhusus: 'Kelemahan fisik motorik tangan dan kaki, antusias belajar tadabbur quran.',
    statusKehadiran: 'terdaftar',
    waktuDaftar: '2026-03-10T16:15:00Z'
  },
  {
    id: 'pt_10',
    eventId: 'ev_001',
    eventTitle: 'Pelatihan Standardisasi Pengajar Al-Quran Braille Nasional Angkatan IV',
    namaLengkap: 'Zulfa Nurul Izzah',
    noWa: '082155667788',
    email: 'zulfa.nurul@gmail.com',
    usia: 27,
    kategoriDisabilitas: 'tunanetra',
    kebutuhanFasilitas: ['Mushaf Braille Standar LPMQ', 'Audio Pembacaan Ayat Qurani'],
    catatanKhusus: 'Alumni SLB-A Cimahi, ingin memperdalam tajwid riwayat Hafs an Asim.',
    statusKehadiran: 'terdaftar',
    waktuDaftar: '2026-03-05T10:45:00Z'
  },
  {
    id: 'pt_11',
    eventId: 'ev_003',
    eventTitle: 'Workshop Metode Pembelajaran Quran Ramah Anak Disabilitas Intelektual & Autisme',
    namaLengkap: 'Ratna Wulandari',
    noWa: '081277665544',
    email: 'ratna.wulan@gmail.com',
    usia: 33,
    kategoriDisabilitas: 'intelektual_autisme',
    kebutuhanFasilitas: ['Ruang Tenang', 'Visual Flashcard Hijaiyah'],
    catatanKhusus: 'Membimbing adik dengan Down Syndrome dalam membaca Iqro.',
    statusKehadiran: 'hadir',
    waktuDaftar: '2026-03-11T09:00:00Z'
  },
  {
    id: 'pt_12',
    eventId: 'ev_004',
    eventTitle: 'Kajian Tajwid Praktis Teman Tuli & Bimbingan Shalat Berisyarat',
    namaLengkap: 'Dodi Priyanto',
    noWa: '085811223399',
    email: 'dodi.priyanto@gmail.com',
    usia: 28,
    kategoriDisabilitas: 'tunanetra',
    kebutuhanFasilitas: ['Audio Qurani', 'Jalur Pemandu'],
    catatanKhusus: 'Baru kehilangan penglihatan 2 tahun lalu, mulai belajar dasar braille.',
    statusKehadiran: 'terdaftar',
    waktuDaftar: '2026-03-11T13:25:00Z'
  }
];

// Current active session simulation: default null (public visitor)
let activeUserId: string | null = null;

// ======================== API ROUTES ========================

// 1. Auth & Roles
app.get('/api/auth/current', (req, res) => {
  if (!activeUserId) {
    return res.json({ user: null });
  }
  const currentUser = users.find(u => u.id === activeUserId);
  res.json({ user: currentUser || null });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi' });
  }
  
  const target = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!target) {
    return res.status(401).json({ error: 'Akun dengan email tersebut tidak ditemukan.' });
  }

  // Password verification with custom user password or standard demo fallbacks
  const storedPassword = userPasswords[target.id] || 'password123';
  if (password && password !== storedPassword && password !== 'password123' && password !== 'admin123' && password !== '123456') {
    return res.status(401).json({ error: 'Kata sandi tidak valid. Periksa kembali kata sandi Anda.' });
  }

  activeUserId = target.id;
  return res.json({ success: true, user: target, message: `Selamat datang kembali, ${target.name}` });
});

// Change Password Endpoint (Integrated for Superadmin and Mitra)
app.post('/api/auth/change-password', (req, res) => {
  const { userId, currentPassword, newPassword, confirmPassword } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID wajib disertakan.' });
  }

  const target = users.find(u => u.id === userId);
  if (!target) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Kata sandi baru minimal harus terdiri dari 6 karakter.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Konfirmasi kata sandi baru tidak sesuai.' });
  }

  const existingPassword = userPasswords[target.id] || 'password123';
  // Validate current password if provided
  if (currentPassword && currentPassword !== existingPassword && currentPassword !== 'password123' && currentPassword !== 'admin123') {
    return res.status(400).json({ error: 'Kata sandi saat ini tidak cocok.' });
  }

  // Update password in store
  userPasswords[target.id] = newPassword;

  // Add system audit log
  const newLog: SystemLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: target.name,
    userRole: target.role,
    action: 'Ganti Kata Sandi',
    module: 'auth',
    details: `Perubahan kata sandi akun ${target.name} (${target.role}) berhasil disimpan.`,
    status: 'success',
  };
  systemLogs.unshift(newLog);

  return res.json({
    success: true,
    message: `Kata sandi untuk ${target.name} berhasil diperbarui.`,
  });
});

app.post('/api/auth/logout', (req, res) => {
  activeUserId = null;
  res.json({ success: true, message: 'Berhasil keluar dari sesi.' });
});

app.post('/api/auth/switch', (req, res) => {
  const { userId } = req.body;
  const target = users.find(u => u.id === userId);
  if (target) {
    activeUserId = target.id;
    return res.json({ success: true, user: target });
  }
  res.status(404).json({ error: 'User tidak ditemukan' });
});

app.post('/api/auth/login-demo', (req, res) => {
  const { role } = req.body;
  const target = users.find(u => u.role === role);
  if (target) {
    activeUserId = target.id;
    return res.json({ success: true, user: target });
  }
  res.status(404).json({ error: 'User peran tidak ditemukan' });
});

// Users Management: Superadmin can create another Superadmin or Mitra
app.get('/api/users', (req, res) => {
  const { role } = req.query;
  let result = users;
  if (role) {
    result = result.filter(u => u.role === role);
  }
  res.json({ users: result });
});

// Superadmin creates another Superadmin
app.post('/api/users/superadmin', (req, res) => {
  const { name, email, phone, organizationName, province, city } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nama dan Email wajib diisi' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email sudah terdaftar dalam sistem' });
  }

  const newUser: User = {
    id: `usr_super_${Date.now()}`,
    name,
    email,
    role: 'superadmin',
    phone: phone || '-',
    organizationName: organizationName || 'Pusat Al-Quran Disabilitas',
    province: province || 'DKI Jakarta',
    city: city || 'Jakarta',
    createdAt: new Date().toISOString()
  };

  users.unshift(newUser);
  res.status(201).json({ success: true, user: newUser });
});

// Superadmin creates a Mitra Account
app.post('/api/users/mitra', (req, res) => {
  const { name, email, phone, organizationName, province, city } = req.body;
  if (!name || !email || !organizationName) {
    return res.status(400).json({ error: 'Nama penanggung jawab, email, dan nama lembaga mitra wajib diisi' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email sudah terdaftar dalam sistem' });
  }

  const newMitra: User = {
    id: `usr_mitra_${Date.now()}`,
    name,
    email,
    role: 'mitra',
    phone: phone || '-',
    organizationName,
    province: province || 'Jawa Barat',
    city: city || 'Bandung',
    createdAt: new Date().toISOString()
  };

  users.unshift(newMitra);
  res.status(201).json({ success: true, user: newMitra });
});

// Update User Profile / Edit Other User (Super Admin or Self)
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const userIdx = users.findIndex(u => u.id === id);
  if (userIdx === -1) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  const { name, email, phone, organizationName, province, city, role, avatar, bio, isLocked } = req.body;

  if (name !== undefined) users[userIdx].name = name;
  if (email !== undefined) users[userIdx].email = email;
  if (phone !== undefined) users[userIdx].phone = phone;
  if (organizationName !== undefined) users[userIdx].organizationName = organizationName;
  if (province !== undefined) users[userIdx].province = province;
  if (city !== undefined) users[userIdx].city = city;
  if (role !== undefined && (role === 'superadmin' || role === 'mitra')) users[userIdx].role = role;
  if (avatar !== undefined) users[userIdx].avatar = avatar;
  if (bio !== undefined) users[userIdx].bio = bio;
  if (isLocked !== undefined) users[userIdx].isLocked = isLocked;

  // Add an audit log entry
  const newLog: SystemLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: users[userIdx].name,
    userRole: users[userIdx].role,
    action: 'Pembaruan Data Pengguna',
    module: 'system',
    details: `Data pengguna ${users[userIdx].name} (${users[userIdx].role}) berhasil diperbarui oleh Super Admin.`,
    status: 'success'
  };
  systemLogs.unshift(newLog);

  res.json({ success: true, user: users[userIdx] });
});

// Delete User (Superadmin only)
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const userIdx = users.findIndex(u => u.id === id);
  if (userIdx === -1) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }

  const targetUser = users[userIdx];
  // Prevent deleting currently active user session or last superadmin
  if (targetUser.role === 'superadmin') {
    const superadminCount = users.filter(u => u.role === 'superadmin').length;
    if (superadminCount <= 1) {
      return res.status(400).json({ error: 'Tidak dapat menghapus Super Admin terakhir sistem.' });
    }
  }

  const deletedName = targetUser.name;
  const deletedRole = targetUser.role;
  users.splice(userIdx, 1);

  // If the deleted user was the logged in user, reset active session
  if (activeUserId === id) {
    activeUserId = users.find(u => u.role === 'superadmin')?.id || null;
  }

  const newLog: SystemLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: 'Super Administrator',
    userRole: 'superadmin',
    action: 'Penghapusan Pengguna',
    module: 'system',
    details: `Pengguna ${deletedName} (${deletedRole === 'superadmin' ? 'Super Admin' : 'Mitra'}) telah dihapus dari sistem.`,
    status: 'warning'
  };
  systemLogs.unshift(newLog);

  res.json({ success: true, message: `Pengguna ${deletedName} berhasil dihapus.` });
});
function mapApplicationSettingsRow(row: any): ApplicationSettings {
  return {
    applicationName: row.application_name || 'Alquran Disabilitas',
    logo: row.logo || '',
    favicon: row.favicon || '',
    topbarColor: row.topbar_color || '#005a71',
    primaryColor: row.primary_color || '#005a71',
    secondaryColor: row.secondary_color || '#ab3425',
    accentColor: row.accent_color || '#d97706',
    publicRoleLabel: row.public_role_label || 'Peserta',
    institutionSubtitle:
      row.institution_subtitle ||
      'Kementerian Agama Republik Indonesia',
    logoSize: row.logo_size || 'large',
    headerBgImage: row.header_bg_image || '',
    headerBgOverlay: row.header_bg_overlay || 'dark',
    logoContainerBg: row.logo_container_bg || 'white',
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at
          ? String(row.updated_at)
          : new Date().toISOString(),
    updatedBy:
      row.updated_by || 'Super Administrator',
  };
}
// ======================== APPLICATION SETTINGS API ========================

/**
 * GET APPLICATION SETTINGS
 *
 * Sumber utama:
 * MySQL -> event_disabilitas_db.application_settings
 *
 * Tidak lagi mengambil dari appSettings in-memory.
 */
app.get('/api/app-settings', async (req, res) => {
  try {
    const pool = await getDbPool();

    if (!pool) {
      return res.status(503).json({
        error: 'Database MySQL tidak tersedia.',
      });
    }

    const [rows] = await pool.execute(`
      SELECT
        id,
        setting_key,
        application_name,
        logo,
        favicon,
        topbar_color,
        primary_color,
        secondary_color,
        accent_color,
        public_role_label,
        institution_subtitle,
        logo_size,
        header_bg_image,
        header_bg_overlay,
        logo_container_bg,
        updated_by,
        updated_at
      FROM application_settings
      WHERE setting_key = 'global_config'
      LIMIT 1
    `);

    const settingsRows = rows as any[];

    if (settingsRows.length === 0) {
      return res.status(404).json({
        error:
          'Application settings belum tersedia di database.',
      });
    }

    const settings = mapApplicationSettingsRow(
      settingsRows[0]
    );

    return res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      '[Application Settings] GET error:',
      error
    );

    return res.status(500).json({
      error:
        'Gagal mengambil application settings dari MySQL.',
    });
  }
});


/**
 * POST APPLICATION SETTINGS
 *
 * Semua perubahan dari Dashboard Super Admin
 * disimpan langsung ke MySQL.
 */
app.post('/api/app-settings', async (req, res) => {
  const {
    applicationName,
    logo,
    favicon,
    topbarColor,
    primaryColor,
    secondaryColor,
    accentColor,
    publicRoleLabel,
    institutionSubtitle,
    logoSize,
    headerBgImage,
    headerBgOverlay,
    logoContainerBg,
    updatedBy,
  } = req.body;

  try {
    const pool = await getDbPool();

    if (!pool) {
      return res.status(503).json({
        error: 'Database MySQL tidak tersedia.',
      });
    }

    /**
     * Ambil konfigurasi lama terlebih dahulu.
     * Field yang tidak dikirim akan dipertahankan.
     */
    const [existingRows] = await pool.execute(`
      SELECT *
      FROM application_settings
      WHERE setting_key = 'global_config'
      LIMIT 1
    `);

    const existing =
      (existingRows as any[])[0] || null;

    const finalSettings = {
      applicationName:
        applicationName !== undefined
          ? String(applicationName).trim()
          : existing?.application_name ||
            'Alquran Disabilitas',

      logo:
        logo !== undefined
          ? String(logo).trim()
          : existing?.logo || '',

      favicon:
        favicon !== undefined
          ? String(favicon).trim()
          : existing?.favicon || '',

      topbarColor:
        topbarColor !== undefined
          ? String(topbarColor).trim()
          : existing?.topbar_color || '#005a71',

      primaryColor:
        primaryColor !== undefined
          ? String(primaryColor).trim()
          : existing?.primary_color || '#005a71',

      secondaryColor:
        secondaryColor !== undefined
          ? String(secondaryColor).trim()
          : existing?.secondary_color || '#ab3425',

      accentColor:
        accentColor !== undefined
          ? String(accentColor).trim()
          : existing?.accent_color || '#d97706',

      publicRoleLabel:
        publicRoleLabel !== undefined
          ? String(publicRoleLabel).trim()
          : existing?.public_role_label || 'Peserta',

      institutionSubtitle:
        institutionSubtitle !== undefined
          ? String(institutionSubtitle).trim()
          : existing?.institution_subtitle ||
            'Kementerian Agama Republik Indonesia',

      logoSize:
        logoSize !== undefined
          ? logoSize
          : existing?.logo_size || 'large',

      headerBgImage:
        headerBgImage !== undefined
          ? String(headerBgImage)
          : existing?.header_bg_image || '',

      headerBgOverlay:
        headerBgOverlay !== undefined
          ? String(headerBgOverlay)
          : existing?.header_bg_overlay || 'dark',

      logoContainerBg:
        logoContainerBg !== undefined
          ? String(logoContainerBg)
          : existing?.logo_container_bg || 'white',

      updatedBy:
        updatedBy !== undefined &&
        String(updatedBy).trim()
          ? String(updatedBy).trim()
          : existing?.updated_by ||
            'Super Administrator',
    };

    await pool.execute(
      `
      INSERT INTO application_settings (
        setting_key,
        application_name,
        logo,
        favicon,
        topbar_color,
        primary_color,
        secondary_color,
        accent_color,
        public_role_label,
        institution_subtitle,
        logo_size,
        header_bg_image,
        header_bg_overlay,
        logo_container_bg,
        updated_by
      )
      VALUES (
        'global_config',
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        application_name = VALUES(application_name),
        logo = VALUES(logo),
        favicon = VALUES(favicon),
        topbar_color = VALUES(topbar_color),
        primary_color = VALUES(primary_color),
        secondary_color = VALUES(secondary_color),
        accent_color = VALUES(accent_color),
        public_role_label = VALUES(public_role_label),
        institution_subtitle = VALUES(institution_subtitle),
        logo_size = VALUES(logo_size),
        header_bg_image = VALUES(header_bg_image),
        header_bg_overlay = VALUES(header_bg_overlay),
        logo_container_bg = VALUES(logo_container_bg),
        updated_by = VALUES(updated_by)
      `,
      [
        finalSettings.applicationName,
        finalSettings.logo,
        finalSettings.favicon,
        finalSettings.topbarColor,
        finalSettings.primaryColor,
        finalSettings.secondaryColor,
        finalSettings.accentColor,
        finalSettings.publicRoleLabel,
        finalSettings.institutionSubtitle,
        finalSettings.logoSize,
        finalSettings.headerBgImage,
        finalSettings.headerBgOverlay,
        finalSettings.logoContainerBg,
        finalSettings.updatedBy,
      ]
    );

    /**
     * Ambil kembali data dari MySQL supaya response
     * benar-benar mencerminkan data yang tersimpan.
     */
    const [savedRows] = await pool.execute(`
      SELECT *
      FROM application_settings
      WHERE setting_key = 'global_config'
      LIMIT 1
    `);

    const savedSettings =
      mapApplicationSettingsRow(
        (savedRows as any[])[0]
      );

    console.log(
      '[Application Settings] Berhasil disimpan ke MySQL.'
    );

    return res.json({
      success: true,
      settings: savedSettings,
    });
  } catch (error) {
    console.error(
      '[Application Settings] POST error:',
      error
    );

    return res.status(500).json({
      error:
        'Gagal menyimpan application settings ke MySQL.',
    });
  }
});
// ======================== SYSTEM ACTIVITY LOGS API ========================
app.get('/api/logs', (req, res) => {
  const { module, status, limit } = req.query;
  let result = [...systemLogs];

  if (module && module !== 'all') {
    result = result.filter(l => l.module === module);
  }
  if (status && status !== 'all') {
    result = result.filter(l => l.status === status);
  }

  const max = limit ? parseInt(limit as string, 10) : 100;
  res.json({ logs: result.slice(0, max), total: result.length });
});

app.post('/api/logs', (req, res) => {
  const { user, userRole, action, module, details, status } = req.body;
  if (!action || !details) {
    return res.status(400).json({ error: 'Action and details are required' });
  }

  const newLog: SystemLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    user: user || 'Pengguna',
    userRole: userRole || 'guest',
    action,
    module: module || 'system',
    details,
    status: status || 'info'
  };

  systemLogs.unshift(newLog);
  if (systemLogs.length > 300) systemLogs.pop(); // keep last 300 logs

  res.status(201).json({ success: true, log: newLog });
});

app.delete('/api/logs', (req, res) => {
  systemLogs = [];
  res.json({ success: true, message: 'Semua logs aktivitas berhasil dihapus' });
});

app.delete('/api/logs/:id', (req, res) => {
  const { id } = req.params;
  const initialCount = systemLogs.length;
  systemLogs = systemLogs.filter(l => l.id !== id);
  if (systemLogs.length < initialCount) {
    res.json({ success: true, message: 'Log berhasil dihapus' });
  } else {
    res.status(404).json({ error: 'Log tidak ditemukan' });
  }
});

// 2. Training Proposals & Events
app.get('/api/events', (req, res) => {
  const { status, mitraId, activeOnly } = req.query;
  let result = [...proposals];

  if (status) {
    result = result.filter(p => p.status === status);
  }
  if (mitraId) {
    result = result.filter(p => p.mitraId === mitraId);
  }
  if (activeOnly === 'true') {
    result = result.filter(p => p.isAktif && p.status === 'disetujui');
  }

  res.json({ events: result });
});

app.get('/api/events/:id', (req, res) => {
  const event = proposals.find(p => p.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event tidak ditemukan' });
  }
  res.json({ event });
});

// Mitra submits training request proposal
app.post('/api/events', (req, res) => {
  const {
    mitraId,
    mitraName,
    mitraOrg,
    namaKegiatan,
    jenisEvent,
    deskripsiPelatihan,
    lokasiDanAlamat,
    provinsi,
    kota,
    latitude,
    longitude,
    tanggalKegiatan,
    targetDanKuotaPeserta,
    kebutuhanPeserta,
    fotoDokumentasi,
  } = req.body;

  if (!namaKegiatan || !jenisEvent || !deskripsiPelatihan || !lokasiDanAlamat || !tanggalKegiatan || !targetDanKuotaPeserta) {
    return res.status(400).json({ error: 'Semua field formulir pelatihan wajib diisi dengan lengkap' });
  }

  const newProposal: TrainingProposal = {
    id: `ev_${Date.now().toString().slice(-5)}`,
    mitraId: mitraId || activeUserId,
    mitraName: mitraName || 'Mitra Penyelenggara',
    mitraOrg: mitraOrg || 'Komunitas Quran Disabilitas',
    namaKegiatan,
    jenisEvent,
    deskripsiPelatihan,
    lokasiDanAlamat,
    provinsi: provinsi || 'Jawa Barat',
    kota: kota || 'Bandung',
    latitude: Number(latitude) || -6.9175,
    longitude: Number(longitude) || 107.6191,
    tanggalKegiatan,
    targetDanKuotaPeserta: Number(targetDanKuotaPeserta),
    kebutuhanPeserta: Array.isArray(kebutuhanPeserta) ? kebutuhanPeserta : [],
    status: 'menunggu_persetujuan',
    isAktif: false,
    createdAt: new Date().toISOString(),
    jumlahPendaftar: 0,
    fotoDokumentasi: Array.isArray(fotoDokumentasi) ? fotoDokumentasi : (fotoDokumentasi ? [fotoDokumentasi] : [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'
    ]),
  };

  proposals.unshift(newProposal);
  res.status(201).json({ success: true, proposal: newProposal });
});

// Edit training proposal or event (Mitra / Superadmin)
app.put('/api/events/:id', (req, res) => {
  const index = proposals.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Permintaan pelatihan tidak ditemukan' });
  }

  const existing = proposals[index];
  const {
    namaKegiatan,
    jenisEvent,
    deskripsiPelatihan,
    lokasiDanAlamat,
    provinsi,
    kota,
    latitude,
    longitude,
    tanggalKegiatan,
    targetDanKuotaPeserta,
    kuotaDisetujui,
    kebutuhanPeserta,
    status,
    isAktif,
    fotoDokumentasi,
  } = req.body;

  let newStatus = existing.status;
  if (status) {
    newStatus = status;
  } else if (existing.status === 'ditolak') {
    newStatus = 'menunggu_persetujuan';
  }

  // Generate link if approved and hasn't got link yet
  let linkPendaftaran = existing.linkPendaftaran;
  if (newStatus === 'disetujui' && !linkPendaftaran) {
    const origin = req.protocol + '://' + req.get('host');
    linkPendaftaran = `${origin}/#daftar/${existing.id}`;
  }

  proposals[index] = {
    ...existing,
    namaKegiatan: namaKegiatan || existing.namaKegiatan,
    jenisEvent: jenisEvent || existing.jenisEvent,
    deskripsiPelatihan: deskripsiPelatihan || existing.deskripsiPelatihan,
    lokasiDanAlamat: lokasiDanAlamat || existing.lokasiDanAlamat,
    provinsi: provinsi || existing.provinsi,
    kota: kota || existing.kota,
    latitude: latitude !== undefined ? Number(latitude) : existing.latitude,
    longitude: longitude !== undefined ? Number(longitude) : existing.longitude,
    tanggalKegiatan: tanggalKegiatan || existing.tanggalKegiatan,
    targetDanKuotaPeserta: targetDanKuotaPeserta ? Number(targetDanKuotaPeserta) : existing.targetDanKuotaPeserta,
    kuotaDisetujui: kuotaDisetujui !== undefined ? Number(kuotaDisetujui) : (existing.kuotaDisetujui || existing.targetDanKuotaPeserta),
    kebutuhanPeserta: kebutuhanPeserta || existing.kebutuhanPeserta,
    status: newStatus,
    linkPendaftaran,
    isAktif: isAktif !== undefined ? Boolean(isAktif) : existing.isAktif,
    alasanPenolakan: newStatus === 'menunggu_persetujuan' || newStatus === 'disetujui' ? undefined : existing.alasanPenolakan,
    fotoDokumentasi: fotoDokumentasi !== undefined 
      ? (Array.isArray(fotoDokumentasi) ? fotoDokumentasi : [fotoDokumentasi]) 
      : existing.fotoDokumentasi,
  };

  res.json({ success: true, proposal: proposals[index] });
});

// Delete training event (Superadmin or Mitra owner)
app.delete('/api/events/:id', (req, res) => {
  const index = proposals.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Event tidak ditemukan' });
  }

  const deleted = proposals.splice(index, 1)[0];
  // Remove participants associated with this event
  participants = participants.filter(pt => pt.eventId !== req.params.id);

  res.json({ success: true, message: `Event "${deleted.namaKegiatan}" berhasil dihapus`, eventId: req.params.id });
});

// Superadmin approves training proposal -> sets target kuota, generates registration link, activates event & shows on Indonesia map
app.post('/api/events/:id/approve', (req, res) => {
  const index = proposals.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Permintaan pelatihan tidak ditemukan' });
  }

  const { targetKuota } = req.body;
  const current = proposals[index];
  const finalKuota = targetKuota ? Number(targetKuota) : current.targetDanKuotaPeserta;
  
  // Link pendaftaran generated
  const origin = req.protocol + '://' + req.get('host');
  const generatedLink = `${origin}/#daftar/${current.id}`;

  proposals[index] = {
    ...current,
    status: 'disetujui',
    kuotaDisetujui: finalKuota,
    linkPendaftaran: generatedLink,
    tanggalPersetujuan: new Date().toISOString(),
    isAktif: true,
    alasanPenolakan: undefined,
  };

  res.json({ success: true, proposal: proposals[index] });
});

// Superadmin rejects training proposal -> records alasan penolakan
app.post('/api/events/:id/reject', (req, res) => {
  const index = proposals.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Permintaan pelatihan tidak ditemukan' });
  }

  const { alasanPenolakan } = req.body;
  if (!alasanPenolakan || !alasanPenolakan.trim()) {
    return res.status(400).json({ error: 'Wajib menyertakan alasan penolakan agar mitra dapat memperbaikinya.' });
  }

  proposals[index] = {
    ...proposals[index],
    status: 'ditolak',
    alasanPenolakan,
    isAktif: false,
  };

  res.json({ success: true, proposal: proposals[index] });
});

// 3. Participants API
app.get('/api/participants', (req, res) => {
  const { eventId, disability } = req.query;
  let result = [...participants];

  if (eventId) {
    result = result.filter(p => p.eventId === eventId);
  }
  if (disability) {
    result = result.filter(p => p.kategoriDisabilitas === disability);
  }

  res.json({ participants: result });
});

// Public registration endpoint
app.post('/api/participants', (req, res) => {
  const {
    eventId,
    namaLengkap,
    noWa,
    email,
    usia,
    kategoriDisabilitas,
    kebutuhanFasilitas,
    catatanKhusus,
  } = req.body;

  if (!eventId || !namaLengkap || !noWa || !kategoriDisabilitas) {
    return res.status(400).json({ error: 'Nama lengkap, Nomor WhatsApp, dan Kategori Disabilitas wajib diisi' });
  }

  const targetEvent = proposals.find(p => p.id === eventId);
  if (!targetEvent) {
    return res.status(404).json({ error: 'Event pelatihan tidak ditemukan' });
  }

  // Quota check
  const eventParticipants = participants.filter(p => p.eventId === eventId);
  const maxQuota = targetEvent.kuotaDisetujui || targetEvent.targetDanKuotaPeserta;
  if (eventParticipants.length >= maxQuota) {
    return res.status(400).json({ error: 'Mohon maaf, kuota pendaftaran untuk pelatihan ini sudah penuh.' });
  }

  const newParticipant: Participant = {
    id: `pt_${Date.now().toString().slice(-6)}`,
    eventId,
    eventTitle: targetEvent.namaKegiatan,
    namaLengkap,
    noWa,
    email: email || `${noWa}@peserta.id`,
    usia: Number(usia) || 25,
    kategoriDisabilitas,
    kebutuhanFasilitas: Array.isArray(kebutuhanFasilitas) ? kebutuhanFasilitas : [],
    catatanKhusus: catatanKhusus || '',
    statusKehadiran: 'terdaftar',
    waktuDaftar: new Date().toISOString()
  };

  participants.unshift(newParticipant);
  targetEvent.jumlahPendaftar = (Number(targetEvent.jumlahPendaftar) || 0) + 1;

  res.status(201).json({
    success: true,
    participant: newParticipant,
    event: targetEvent,
    jumlahPendaftar: targetEvent.jumlahPendaftar
  });
});

// Update attendance status
app.patch('/api/participants/:id/status', (req, res) => {
  const { statusKehadiran } = req.body;
  const participant = participants.find(p => p.id === req.params.id);
  if (!participant) {
    return res.status(404).json({ error: 'Peserta tidak ditemukan' });
  }

  participant.statusKehadiran = statusKehadiran;
  res.json({ success: true, participant });
});

// Update participant full details
app.put('/api/participants/:id', (req, res) => {
  const index = participants.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Peserta tidak ditemukan' });
  }

  const existing = participants[index];
  const {
    namaLengkap,
    noWa,
    email,
    usia,
    kategoriDisabilitas,
    kebutuhanFasilitas,
    catatanKhusus,
    statusKehadiran,
  } = req.body;

  participants[index] = {
    ...existing,
    namaLengkap: namaLengkap || existing.namaLengkap,
    noWa: noWa || existing.noWa,
    email: email || existing.email,
    usia: usia !== undefined ? Number(usia) : existing.usia,
    kategoriDisabilitas: kategoriDisabilitas || existing.kategoriDisabilitas,
    kebutuhanFasilitas: kebutuhanFasilitas || existing.kebutuhanFasilitas,
    catatanKhusus: catatanKhusus !== undefined ? catatanKhusus : existing.catatanKhusus,
    statusKehadiran: statusKehadiran || existing.statusKehadiran,
  };

  res.json({ success: true, participant: participants[index] });
});

// Delete participant
app.delete('/api/participants/:id', (req, res) => {
  const index = participants.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Peserta tidak ditemukan' });
  }

  const deleted = participants.splice(index, 1)[0];
  const targetEvent = proposals.find(p => p.id === deleted.eventId);
  if (targetEvent && targetEvent.jumlahPendaftar > 0) {
    targetEvent.jumlahPendaftar = Math.max(0, targetEvent.jumlahPendaftar - 1);
  }

  res.json({ success: true, message: `Peserta ${deleted.namaLengkap} berhasil dihapus`, participantId: req.params.id });
});

// 4. Disabilities Master Data CRUD
app.get('/api/disabilities', (req, res) => {
  res.json({ disabilities, data: disabilities });
});

app.post('/api/disabilities', (req, res) => {
  const {
    kode,
    nama,
    kategoriUtama,
    deskripsi,
    metodePembelajaran,
    fasilitasRekomendasi,
    warnaHex,
    icon,
  } = req.body;

  if (!kode || !nama) {
    return res.status(400).json({ error: 'Kode dan Nama Kategori Disabilitas wajib diisi' });
  }

  const existing = disabilities.find(d => d.kode.toLowerCase() === kode.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Kode disabilitas "${kode}" sudah ada dalam master data` });
  }

  const newDisability: DisabilityMaster = {
    id: `dis_${Date.now()}`,
    kode: kode.toLowerCase().replace(/\s+/g, '_'),
    nama,
    kategoriUtama: kategoriUtama || 'Sensorik',
    deskripsi: deskripsi || '',
    metodePembelajaran: metodePembelajaran || 'Metode pembelajaran ramah disabilitas standar Kemenag RI',
    fasilitasRekomendasi: Array.isArray(fasilitasRekomendasi) ? fasilitasRekomendasi : [],
    warnaHex: warnaHex || '#005a71',
    icon: icon || 'accessible',
    isAktif: true,
    createdAt: new Date().toISOString(),
  };

  disabilities.push(newDisability);
  res.status(201).json({ success: true, disability: newDisability, item: newDisability });
});

app.put('/api/disabilities/:id', (req, res) => {
  const index = disabilities.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Data disabilitas tidak ditemukan' });
  }

  const existing = disabilities[index];
  const {
    kode,
    nama,
    kategoriUtama,
    deskripsi,
    metodePembelajaran,
    fasilitasRekomendasi,
    warnaHex,
    icon,
    isAktif,
  } = req.body;

  disabilities[index] = {
    ...existing,
    kode: kode ? kode.toLowerCase().replace(/\s+/g, '_') : existing.kode,
    nama: nama || existing.nama,
    kategoriUtama: kategoriUtama || existing.kategoriUtama,
    deskripsi: deskripsi !== undefined ? deskripsi : existing.deskripsi,
    metodePembelajaran: metodePembelajaran || existing.metodePembelajaran,
    fasilitasRekomendasi: Array.isArray(fasilitasRekomendasi) ? fasilitasRekomendasi : existing.fasilitasRekomendasi,
    warnaHex: warnaHex || existing.warnaHex,
    icon: icon || existing.icon,
    isAktif: isAktif !== undefined ? Boolean(isAktif) : existing.isAktif,
  };

  res.json({ success: true, disability: disabilities[index], item: disabilities[index] });
});

app.delete('/api/disabilities/:id', (req, res) => {
  const index = disabilities.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Data disabilitas tidak ditemukan' });
  }

  const deleted = disabilities.splice(index, 1)[0];
  res.json({ success: true, message: `Kategori disabilitas "${deleted.nama}" berhasil dihapus`, id: req.params.id });
});

// 4. Communities / Lembaga Quran Disabilitas se-Indonesia
app.get('/api/communities', (req, res) => {
  const { category, province } = req.query;
  let result = [...communities];

  if (category) {
    result = result.filter(c => c.kategoriDisabilitas.includes(category as any));
  }
  if (province) {
    result = result.filter(c => c.provinsi.toLowerCase() === (province as string).toLowerCase());
  }

  res.json({ communities: result });
});

app.post('/api/communities', (req, res) => {
  const {
    namaLembaga,
    kategoriDisabilitas,
    provinsi,
    kota,
    alamatLengkap,
    latitude,
    longitude,
    kontakWa,
    kontakEmail,
    jumlahSantri,
    fasilitasTersedia,
    programUnggulan,
    deskripsi
  } = req.body;

  if (!namaLembaga || !alamatLengkap || !provinsi || !kota) {
    return res.status(400).json({ error: 'Nama Lembaga, Alamat, Provinsi, dan Kota wajib diisi' });
  }

  const newComm: QuranCommunity = {
    id: `comm_${Date.now()}`,
    namaLembaga,
    kategoriDisabilitas: Array.isArray(kategoriDisabilitas) ? kategoriDisabilitas : ['tunanetra'],
    provinsi,
    kota,
    alamatLengkap,
    latitude: Number(latitude) || -6.2,
    longitude: Number(longitude) || 106.8,
    kontakWa: kontakWa || '08123456789',
    kontakEmail: kontakEmail || '',
    jumlahSantri: Number(jumlahSantri) || 20,
    fasilitasTersedia: Array.isArray(fasilitasTersedia) ? fasilitasTersedia : [],
    programUnggulan: programUnggulan || 'Pembelajaran Al-Quran Disabilitas',
    deskripsi: deskripsi || 'Komunitas Al-Quran ramah disabilitas.',
    verified: true,
    activeEventsCount: 0,
  };

  communities.unshift(newComm);
  res.status(201).json({ success: true, community: newComm });
});

// 5. System Stats & Reports
app.get('/api/reports/summary', (req, res) => {
  const stats: SystemStats = {
    totalProposals: proposals.length,
    approvedEvents: proposals.filter(p => p.status === 'disetujui').length,
    pendingProposals: proposals.filter(p => p.status === 'menunggu_persetujuan').length,
    rejectedProposals: proposals.filter(p => p.status === 'ditolak').length,
    totalParticipants: participants.length,
    totalCommunities: communities.length,
    totalMitra: users.filter(u => u.role === 'mitra').length,
    totalSuperAdmin: users.filter(u => u.role === 'superadmin').length,
  };

  // Demographics breakdown
  const disabilityCounts = {
    tunanetra: participants.filter(p => p.kategoriDisabilitas === 'tunanetra').length,
    tunarungu: participants.filter(p => p.kategoriDisabilitas === 'tunarungu').length,
    tunadaksa: participants.filter(p => p.kategoriDisabilitas === 'tunadaksa').length,
    intelektual_autisme: participants.filter(p => p.kategoriDisabilitas === 'intelektual_autisme').length,
    pendamping_umum: participants.filter(p => p.kategoriDisabilitas === 'pendamping_umum').length,
  };

  // Regional breakdown
  const regionMap: Record<string, number> = {};
  communities.forEach(c => {
    regionMap[c.provinsi] = (regionMap[c.provinsi] || 0) + 1;
  });

  // Real Funnel Stages calculated from participants
  const funnelStages = {
    totalPendaftar: participants.length,
    terverifikasi: participants.filter(p => (p.kebutuhanFasilitas && p.kebutuhanFasilitas.length > 0) || p.noWa).length,
    assessment: participants.filter(p => p.statusKehadiran !== 'batal').length,
    pelatihanAktif: participants.filter(p => p.statusKehadiran === 'terdaftar' || p.statusKehadiran === 'hadir').length,
    lulusSertifikasi: participants.filter(p => p.statusKehadiran === 'hadir').length,
  };

  res.json({
    stats,
    disabilityCounts,
    funnelStages,
    regionBreakdown: regionMap,
    participants,
    events: proposals,
  });
});

// ======================== SERVER & VITE INTEGRATION ========================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Coba koneksi ke MySQL Laragon (jika aktif)
    try {
      await getDbPool();
    } catch (err) {
      // safe fallback
    }
  });
}

startServer();
