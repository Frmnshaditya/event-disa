import 'dotenv/config';
import express from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
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

// Current active session simulation: default null (public visitor)
let activeUserId: string | null = null;


// ======================== API ROUTES ========================

function jsonParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}

function mapDbUser(row: any): User {
  return {
    id: String(row.id ?? row.user_id_string ?? ''),
    name: row.name ?? '',
    email: row.email ?? '',
    role: row.role === 'superadmin' ? 'superadmin' : 'mitra',
    phone: row.phone ?? '',
    organizationName: row.organizationName ?? row.organization_name ?? undefined,
    province: row.province ?? undefined,
    city: row.city ?? undefined,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    avatar: row.avatar ?? undefined,
  };
}

function mapDbDisability(row: any): DisabilityMaster {
  return {
    id: String(row.disability_id_string ?? row.id),
    kode: row.kode ?? '',
    nama: row.nama ?? '',
    kategoriUtama: row.kategori_utama ?? '',
    deskripsi: row.deskripsi ?? '',
    metodePembelajaran: row.metode_pembelajaran ?? '',
    fasilitasRekomendasi: jsonParse<string[]>(row.fasilitas_rekomendasi, []),
    warnaHex: row.warna_hex ?? '#005a71',
    icon: row.icon ?? 'accessible',
    isAktif: Boolean(row.is_aktif),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapDbCommunity(row: any): QuranCommunity {
  return {
    id: String(row.community_id_string ?? row.id),
    namaLembaga: row.nama_lembaga ?? '',
    kategoriDisabilitas: jsonParse<string[]>(row.kategori_disabilitas, []),
    provinsi: row.provinsi ?? '',
    kota: row.kota ?? '',
    alamatLengkap: row.alamat_lengkap ?? '',
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    kontakWa: row.kontak_wa ?? '',
    kontakEmail: row.kontak_email ?? '',
    jumlahSantri: Number(row.jumlah_santri ?? 0),
    fasilitasTersedia: jsonParse<string[]>(row.fasilitas_tersedia, []),
    programUnggulan: row.program_unggulan ?? '',
    deskripsi: row.deskripsi ?? '',
    verified: Boolean(row.is_verified),
    activeEventsCount: Number(row.activeEventsCount ?? 0),
  };
}

function mapDbEvent(row: any): TrainingProposal {
  return {
    id: String(row.proposal_id_string ?? row.id),
    mitraId: row.mitra_id_string ?? undefined,
    mitraName: row.mitraName ?? undefined,
    mitraOrg: row.mitraOrg ?? row.mitra_org ?? '',
    namaKegiatan: row.nama_kegiatan ?? '',
    jenisEvent: row.jenis_event ?? '',
    deskripsiPelatihan: row.deskripsi_pelatihan ?? '',
    lokasiDanAlamat: row.lokasi_dan_alamat ?? '',
    provinsi: row.provinsi ?? '',
    kota: row.kota ?? '',
    latitude: row.latitude === null ? undefined : Number(row.latitude),
    longitude: row.longitude === null ? undefined : Number(row.longitude),
    tanggalKegiatan: row.tanggal_kegiatan ?? '',
    targetDanKuotaPeserta: Number(row.target_dan_kuota_peserta ?? 0),
    kuotaDisetujui: row.kuota_disetujui == null ? undefined : Number(row.kuota_disetujui),
    kebutuhanPeserta: jsonParse<string[]>(row.kebutuhan_peserta, []),
    status: row.status ?? 'menunggu_persetujuan',
    alasanPenolakan: row.alasan_penolakan ?? undefined,
    tanggalPersetujuan: row.tanggal_persetujuan ? new Date(row.tanggal_persetujuan).toISOString() : undefined,
    linkPendaftaran: row.link_pendaftaran ?? undefined,
    isAktif: Boolean(row.is_aktif),
    jumlahPendaftar: Number(row.jumlah_pendaftar ?? 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    fotoDokumentasi: jsonParse<string[]>(row.foto_dokumentasi, []),
  };
}

function mapDbParticipant(row: any): Participant {
  return {
    id: String(row.participant_id_string ?? row.id),
    eventId: row.event_id_string ?? '',
    eventTitle: row.eventTitle ?? '',
    namaLengkap: row.nama_lengkap ?? '',
    noWa: row.no_wa ?? '',
    email: row.email ?? '',
    usia: Number(row.usia ?? 0),
    kategoriDisabilitas: row.kategori_disabilitas ?? '',
    kebutuhanFasilitas: jsonParse<string[]>(row.kebutuhan_fasilitas, []),
    catatanKhusus: row.catatan_khusus ?? '',
    statusKehadiran: row.status_kehadiran ?? 'terdaftar',
    waktuDaftar: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

async function getPool() {
  const pool = await getDbPool();
  if (!pool) throw new Error('Database MySQL tidak tersedia.');
  return pool;
}

async function addSystemLog(user: string, userRole: string, action: string, module: string, details: string, status: SystemLog['status'] = 'info') {
  try {
    const pool = await getPool();
    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await pool.query(
      `INSERT INTO system_logs
        (log_id_string, user, user_role, action, module, details, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, user || 'Sistem', userRole || 'system', action, module, details, status]
    );
  } catch (error) {
    console.error('[System Log] error:', error);
  }
}

async function getUserById(userId: string) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT user_id_string AS id, name, email, role, phone,
            organization_name AS organizationName, province, city, address, avatar,
            created_at AS createdAt
     FROM users WHERE user_id_string = ? LIMIT 1`,
    [userId]
  );
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return mapDbUser(rows[0]);
}

// ======================== AUTH ========================

app.get('/api/auth/current', async (req, res) => {
  try {
    if (!activeUserId) return res.json({ user: null });
    const user = await getUserById(activeUserId);
    if (!user) activeUserId = null;
    return res.json({ user });
  } catch (error) {
    console.error('[Auth Current] error:', error);
    return res.status(500).json({ error: 'Gagal membaca sesi pengguna dari MySQL.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });

    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT user_id_string AS id, name, email, password, role, phone,
              organization_name AS organizationName, province, city, address, avatar,
              created_at AS createdAt
       FROM users WHERE LOWER(email) = ? LIMIT 1`,
      [email]
    );
    if (!Array.isArray(rows) || rows.length === 0) return res.status(401).json({ error: 'Akun dengan email tersebut tidak ditemukan.' });

    const dbUser = rows[0] as any;
    if (!dbUser.password || !(await bcrypt.compare(password, dbUser.password))) {
      return res.status(401).json({ error: 'Kata sandi tidak valid. Periksa kembali kata sandi Anda.' });
    }

    activeUserId = String(dbUser.id);
    const { password: _password, ...safeUser } = dbUser;
    await addSystemLog(dbUser.name, dbUser.role, 'Login', 'auth', `Pengguna ${dbUser.email} berhasil login.`, 'success');
    return res.json({ success: true, user: safeUser, message: `Selamat datang kembali, ${dbUser.name}` });
  } catch (error) {
    console.error('[Auth Login] error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat proses login.' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, confirmPassword } = req.body ?? {};
    if (!userId) return res.status(400).json({ error: 'User ID wajib disertakan.' });
    if (!newPassword || String(newPassword).length < 6) return res.status(400).json({ error: 'Kata sandi baru minimal harus terdiri dari 6 karakter.' });
    if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Konfirmasi kata sandi baru tidak sesuai.' });

    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT user_id_string AS id, name, role, password FROM users WHERE user_id_string = ? LIMIT 1`,
      [String(userId)]
    );
    if (!Array.isArray(rows) || rows.length === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

    const target = rows[0] as any;
    if (!currentPassword || !(await bcrypt.compare(currentPassword, target.password))) {
      return res.status(400).json({ error: 'Kata sandi saat ini tidak cocok.' });
    }

    const newHash = await bcrypt.hash(String(newPassword), 12);
    await pool.query('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id_string = ?', [newHash, String(userId)]);
    await addSystemLog(target.name, target.role, 'Perubahan Password', 'auth', `Password pengguna ${target.name} diperbarui.`, 'success');
    return res.json({ success: true, message: `Kata sandi untuk ${target.name} berhasil diperbarui.` });
  } catch (error) {
    console.error('[Auth Change Password] error:', error);
    return res.status(500).json({ error: 'Gagal memperbarui kata sandi.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  activeUserId = null;
  return res.json({ success: true, message: 'Berhasil keluar dari sesi.' });
});

app.post('/api/auth/switch', async (req, res) => {
  try {
    const { userId } = req.body ?? {};
    if (!userId) return res.status(400).json({ error: 'User ID wajib disertakan.' });
    const user = await getUserById(String(userId));
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan di MySQL.' });
    activeUserId = String(userId);
    return res.json({ success: true, user });
  } catch (error) {
    console.error('[Auth Switch] error:', error);
    return res.status(500).json({ error: 'Gagal mengganti pengguna aktif.' });
  }
});

// ======================== USERS ========================

app.get('/api/users', async (req, res) => {
  try {
    const pool = await getPool();
    const role = typeof req.query.role === 'string' ? req.query.role : '';
    const params: string[] = [];
    let sql = `SELECT user_id_string AS id, name, email, role, phone,
                      organization_name AS organizationName, province, city, address, avatar,
                      created_at AS createdAt
               FROM users`;
    if (role === 'superadmin' || role === 'mitra') {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    sql += ' ORDER BY created_at DESC, id DESC';
    const [rows] = await pool.query(sql, params);
    return res.json({ users: Array.isArray(rows) ? rows.map(mapDbUser) : [] });
  } catch (error) {
    console.error('[Users GET] error:', error);
    return res.status(500).json({ error: 'Gagal mengambil data pengguna dari MySQL.' });
  }
});

async function createUserAccount(req: express.Request, res: express.Response, role: User['role']) {
  try {
    const { name, email, phone, organizationName, province, city } = req.body ?? {};
    if (!name || !email) return res.status(400).json({ error: 'Nama dan Email wajib diisi.' });
    if (role === 'mitra' && !organizationName) return res.status(400).json({ error: 'Nama lembaga mitra wajib diisi.' });

    const pool = await getPool();
    const cleanEmail = String(email).trim().toLowerCase();
    const [existing] = await pool.query('SELECT user_id_string FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
    if (Array.isArray(existing) && existing.length) return res.status(409).json({ error: 'Email sudah terdaftar dalam sistem.' });

    const id = `usr_${role}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const hash = await bcrypt.hash('password123', 12);
    await pool.query(
      `INSERT INTO users (user_id_string, name, email, password, role, phone, organization_name, province, city)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, String(name).trim(), cleanEmail, hash, role, phone || null, organizationName || null, province || null, city || null]
    );
    const user = await getUserById(id);
    await addSystemLog('Super Administrator', 'superadmin', 'Tambah Pengguna', 'system', `Akun ${user?.name ?? name} dibuat.`, 'success');
    return res.status(201).json({ success: true, user, initialPassword: 'password123', message: 'Akun berhasil dibuat. Password awal: password123.' });
  } catch (error) {
    console.error('[Users POST] error:', error);
    return res.status(500).json({ error: 'Gagal membuat akun pengguna di MySQL.' });
  }
}

app.post('/api/users/superadmin', (req, res) => createUserAccount(req, res, 'superadmin'));
app.post('/api/users/mitra', (req, res) => createUserAccount(req, res, 'mitra'));

app.put('/api/users/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const pool = await getPool();
    const current = await getUserById(id);
    if (!current) return res.status(404).json({ error: 'User tidak ditemukan di MySQL.' });

    const body = req.body ?? {};
    const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : current.email;
    const role = body.role === 'superadmin' || body.role === 'mitra' ? body.role : current.role;

    const [dupe] = await pool.query(
      'SELECT user_id_string FROM users WHERE LOWER(email) = ? AND user_id_string <> ? LIMIT 1',
      [email, id]
    );
    if (Array.isArray(dupe) && dupe.length) return res.status(409).json({ error: 'Email sudah digunakan oleh pengguna lain.' });

    await pool.query(
      `UPDATE users SET name=?, email=?, phone=?, organization_name=?, province=?, city=?, role=?, avatar=?, updated_at=CURRENT_TIMESTAMP
       WHERE user_id_string=?`,
      [
        body.name !== undefined ? String(body.name).trim() : current.name,
        email,
        body.phone !== undefined ? String(body.phone).trim() : current.phone || null,
        body.organizationName !== undefined ? String(body.organizationName).trim() : current.organizationName || null,
        body.province !== undefined ? String(body.province).trim() : current.province || null,
        body.city !== undefined ? String(body.city).trim() : current.city || null,
        role,
        body.avatar !== undefined ? body.avatar : current.avatar || null,
        id
      ]
    );

    const updated = await getUserById(id);
    await addSystemLog(updated?.name || current.name, updated?.role || current.role, 'Pembaruan Data Pengguna', 'system', `Data pengguna diperbarui di MySQL.`, 'success');
    return res.json({ success: true, user: updated });
  } catch (error) {
    console.error('[Users PUT] error:', error);
    return res.status(500).json({ error: 'Gagal memperbarui pengguna di MySQL.' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const pool = await getPool();
    const target = await getUserById(id);
    if (!target) return res.status(404).json({ error: 'User tidak ditemukan di MySQL.' });

    if (target.role === 'superadmin') {
      const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE role='superadmin'`);
      const count = Number((countRows as any[])[0]?.total ?? 0);
      if (count <= 1) return res.status(400).json({ error: 'Superadmin terakhir tidak boleh dihapus.' });
    }

    await pool.query('DELETE FROM users WHERE user_id_string = ?', [id]);
    await addSystemLog('Super Administrator', 'superadmin', 'Penghapusan Pengguna', 'system', `Pengguna ${target.name} dihapus dari MySQL.`, 'warning');
    return res.json({ success: true, message: `Pengguna ${target.name} berhasil dihapus.` });
  } catch (error) {
    console.error('[Users DELETE] error:', error);
    return res.status(500).json({ error: 'Gagal menghapus pengguna dari MySQL.' });
  }
});

// ======================== APPLICATION SETTINGS ========================

const DEFAULT_APP_SETTINGS: ApplicationSettings = {
  applicationName: 'Alquran Disabilitas',
  logo: '/logo-quran.svg',
  favicon: '/favicon.svg',
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
  updatedBy: 'Super Administrator',
};

function mapDbAppSettings(row: any): ApplicationSettings {
  return {
    applicationName: row.application_name ?? DEFAULT_APP_SETTINGS.applicationName,
    logo: row.logo ?? DEFAULT_APP_SETTINGS.logo,
    favicon: row.favicon ?? DEFAULT_APP_SETTINGS.favicon,
    topbarColor: row.topbar_color ?? DEFAULT_APP_SETTINGS.topbarColor,
    primaryColor: row.primary_color ?? DEFAULT_APP_SETTINGS.primaryColor,
    secondaryColor: row.secondary_color ?? DEFAULT_APP_SETTINGS.secondaryColor,
    accentColor: row.accent_color ?? DEFAULT_APP_SETTINGS.accentColor,
    publicRoleLabel: row.public_role_label ?? DEFAULT_APP_SETTINGS.publicRoleLabel,
    institutionSubtitle: row.institution_subtitle ?? DEFAULT_APP_SETTINGS.institutionSubtitle,
    logoSize: row.logo_size ?? DEFAULT_APP_SETTINGS.logoSize,
    headerBgImage: row.header_bg_image ?? DEFAULT_APP_SETTINGS.headerBgImage,
    headerBgOverlay: row.header_bg_overlay ?? DEFAULT_APP_SETTINGS.headerBgOverlay,
    logoContainerBg: row.logo_container_bg ?? DEFAULT_APP_SETTINGS.logoContainerBg,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : DEFAULT_APP_SETTINGS.updatedAt,
    updatedBy: row.updated_by ?? DEFAULT_APP_SETTINGS.updatedBy,
  };
}

app.get('/api/app-settings', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT application_name, logo, favicon, topbar_color, primary_color, secondary_color,
              accent_color, public_role_label, institution_subtitle, logo_size,
              header_bg_image, header_bg_overlay, logo_container_bg, updated_by, updated_at
       FROM application_settings WHERE setting_key='global_config' LIMIT 1`
    );
    const settings = Array.isArray(rows) && rows.length ? mapDbAppSettings(rows[0]) : DEFAULT_APP_SETTINGS;
    return res.json({ settings });
  } catch (error) {
    console.error('[App Settings GET] error:', error);
    return res.status(500).json({ error: 'Gagal mengambil Application Settings dari MySQL.' });
  }
});

app.post('/api/app-settings', async (req, res) => {
  try {
    const body = req.body ?? {};
    const applicationName = String(body.applicationName ?? '').trim();
    if (!applicationName) return res.status(400).json({ error: 'Nama aplikasi wajib diisi.' });

    const pool = await getPool();
    const values = [
      applicationName,
      body.logo ?? DEFAULT_APP_SETTINGS.logo,
      body.favicon ?? DEFAULT_APP_SETTINGS.favicon,
      body.topbarColor ?? DEFAULT_APP_SETTINGS.topbarColor,
      body.primaryColor ?? DEFAULT_APP_SETTINGS.primaryColor,
      body.secondaryColor ?? DEFAULT_APP_SETTINGS.secondaryColor,
      body.accentColor ?? DEFAULT_APP_SETTINGS.accentColor,
      body.publicRoleLabel ?? DEFAULT_APP_SETTINGS.publicRoleLabel,
      body.institutionSubtitle ?? DEFAULT_APP_SETTINGS.institutionSubtitle,
      body.logoSize ?? DEFAULT_APP_SETTINGS.logoSize,
      body.headerBgImage ?? '',
      body.headerBgOverlay ?? DEFAULT_APP_SETTINGS.headerBgOverlay,
      body.logoContainerBg ?? DEFAULT_APP_SETTINGS.logoContainerBg,
      body.updatedBy ?? 'Super Administrator',
    ];

    await pool.query(
      `INSERT INTO application_settings
        (setting_key, application_name, logo, favicon, topbar_color, primary_color, secondary_color,
         accent_color, public_role_label, institution_subtitle, logo_size, header_bg_image,
         header_bg_overlay, logo_container_bg, updated_by)
       VALUES ('global_config', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        application_name=VALUES(application_name), logo=VALUES(logo), favicon=VALUES(favicon),
        topbar_color=VALUES(topbar_color), primary_color=VALUES(primary_color),
        secondary_color=VALUES(secondary_color), accent_color=VALUES(accent_color),
        public_role_label=VALUES(public_role_label), institution_subtitle=VALUES(institution_subtitle),
        logo_size=VALUES(logo_size), header_bg_image=VALUES(header_bg_image),
        header_bg_overlay=VALUES(header_bg_overlay), logo_container_bg=VALUES(logo_container_bg),
        updated_by=VALUES(updated_by), updated_at=CURRENT_TIMESTAMP`,
      values
    );

    const [rows] = await pool.query(
      `SELECT application_name, logo, favicon, topbar_color, primary_color, secondary_color,
              accent_color, public_role_label, institution_subtitle, logo_size,
              header_bg_image, header_bg_overlay, logo_container_bg, updated_by, updated_at
       FROM application_settings WHERE setting_key='global_config' LIMIT 1`
    );
    const settings = Array.isArray(rows) && rows.length ? mapDbAppSettings(rows[0]) : DEFAULT_APP_SETTINGS;
    await addSystemLog(String(body.updatedBy || 'Super Administrator'), 'superadmin', 'Pembaruan Application Setting', 'settings', `Pengaturan aplikasi disimpan ke MySQL: ${applicationName}.`, 'success');
    return res.json({ success: true, settings });
  } catch (error) {
    console.error('[App Settings POST] error:', error);
    return res.status(500).json({ error: 'Gagal menyimpan Application Settings ke MySQL.', details: error instanceof Error ? error.message : String(error) });
  }
});

// ======================== LOGS ========================

app.get('/api/logs', async (req, res) => {
  try {
    const pool = await getPool();
    const module = typeof req.query.module === 'string' ? req.query.module : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    const params: any[] = [];
    let sql = `SELECT log_id_string AS id, timestamp, user, user_role AS userRole, action, module, details, status FROM system_logs`;
    const where: string[] = [];
    if (module && module !== 'all') { where.push('module = ?'); params.push(module); }
    if (status && status !== 'all') { where.push('status = ?'); params.push(status); }
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    const [rows] = await pool.query(sql, params);
    return res.json({ logs: rows, total: Array.isArray(rows) ? rows.length : 0 });
  } catch (error) {
    console.error('[Logs GET] error:', error);
    return res.status(500).json({ error: 'Gagal mengambil log dari MySQL.' });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const { user, userRole, action, module, details, status } = req.body ?? {};
    if (!action || !details) return res.status(400).json({ error: 'Action and details are required' });
    const pool = await getPool();
    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await pool.query(
      `INSERT INTO system_logs (log_id_string, user, user_role, action, module, details, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, user || 'Pengguna', userRole || 'guest', action, module || 'system', details, status || 'info']
    );
    return res.status(201).json({ success: true, log: { id, timestamp: new Date().toISOString(), user, userRole, action, module, details, status } });
  } catch (error) {
    console.error('[Logs POST] error:', error);
    return res.status(500).json({ error: 'Gagal menyimpan log ke MySQL.' });
  }
});

app.delete('/api/logs', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.query('DELETE FROM system_logs');
    return res.json({ success: true, message: 'Semua logs aktivitas berhasil dihapus.' });
  } catch (error) {
    console.error('[Logs DELETE] error:', error);
    return res.status(500).json({ error: 'Gagal menghapus logs dari MySQL.' });
  }
});

app.delete('/api/logs/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const [result] = await pool.query('DELETE FROM system_logs WHERE log_id_string = ?', [String(req.params.id)]);
    if ((result as any).affectedRows === 0) return res.status(404).json({ error: 'Log tidak ditemukan.' });
    return res.json({ success: true, message: 'Log berhasil dihapus.' });
  } catch (error) {
    console.error('[Logs DELETE ID] error:', error);
    return res.status(500).json({ error: 'Gagal menghapus log dari MySQL.' });
  }
});

// ======================== EVENTS ========================

async function getEventById(id: string) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT tp.*, u.name AS mitraName, u.organization_name AS mitraOrg
     FROM training_proposals tp
     LEFT JOIN users u ON u.id = tp.mitra_id
     WHERE tp.proposal_id_string = ? LIMIT 1`,
    [id]
  );
  return Array.isArray(rows) && rows.length ? mapDbEvent(rows[0]) : null;
}

app.get('/api/events', async (req, res) => {
  try {
    const pool = await getPool();
    const { status, mitraId, activeOnly } = req.query;
    const params: any[] = [];
    const where: string[] = [];

    if (typeof status === 'string' && status !== 'all') { where.push('tp.status = ?'); params.push(status); }
    if (typeof mitraId === 'string' && mitraId) { where.push('tp.mitra_id_string = ?'); params.push(mitraId); }
    if (activeOnly === 'true') { where.push('tp.is_aktif = 1'); }

    let sql = `SELECT tp.*, u.name AS mitraName, u.organization_name AS mitraOrg
               FROM training_proposals tp
               LEFT JOIN users u ON u.id = tp.mitra_id`;
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' ORDER BY tp.created_at DESC, tp.id DESC';

    const [rows] = await pool.query(sql, params);
    return res.json({ events: Array.isArray(rows) ? rows.map(mapDbEvent) : [] });
  } catch (error) {
    console.error('[Events GET] error:', error);
    return res.status(500).json({ error: 'Gagal mengambil event dari MySQL.' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await getEventById(String(req.params.id));
    if (!event) return res.status(404).json({ error: 'Event tidak ditemukan.' });
    return res.json({ event, proposal: event });
  } catch (error) {
    console.error('[Event GET] error:', error);
    return res.status(500).json({ error: 'Gagal mengambil event dari MySQL.' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const body = req.body ?? {};
    const required = ['namaKegiatan', 'jenisEvent', 'deskripsiPelatihan', 'lokasiDanAlamat', 'provinsi', 'kota', 'tanggalKegiatan'];
    for (const key of required) {
      if (!body[key]) return res.status(400).json({ error: `${key} wajib diisi.` });
    }

    const pool = await getPool();
    const proposalId = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    let mitraNumericId: number | null = null;
    let mitraIdString: string | null = body.mitraId ? String(body.mitraId) : null;
    if (mitraIdString) {
      const [uRows] = await pool.query('SELECT id FROM users WHERE user_id_string = ? LIMIT 1', [mitraIdString]);
      if (Array.isArray(uRows) && uRows.length) mitraNumericId = Number((uRows as any[])[0].id);
      else return res.status(400).json({ error: 'Mitra tidak ditemukan di MySQL.' });
    }

    await pool.query(
      `INSERT INTO training_proposals
       (proposal_id_string, mitra_id, mitra_id_string, nama_kegiatan, jenis_event, deskripsi_pelatihan,
        lokasi_dan_alamat, provinsi, kota, latitude, longitude, tanggal_kegiatan,
        target_dan_kuota_peserta, kuota_disetujui, kebutuhan_peserta, status,
        alasan_penolakan, tanggal_persetujuan, link_pendaftaran, is_aktif, jumlah_pendaftar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'menunggu_persetujuan', NULL, NULL, NULL, FALSE, 0)`,
      [
        proposalId, mitraNumericId, mitraIdString, body.namaKegiatan, body.jenisEvent, body.deskripsiPelatihan,
        body.lokasiDanAlamat, body.provinsi, body.kota,
        body.latitude == null ? null : Number(body.latitude),
        body.longitude == null ? null : Number(body.longitude),
        String(body.tanggalKegiatan),
        Number(body.targetDanKuotaPeserta || 0),
        body.kuotaDisetujui == null ? null : Number(body.kuotaDisetujui),
        JSON.stringify(Array.isArray(body.kebutuhanPeserta) ? body.kebutuhanPeserta : []),
      ]
    );

    const event = await getEventById(proposalId);
    await addSystemLog('Pengguna', 'system', 'Tambah Event', 'events', `Event ${body.namaKegiatan} dibuat di MySQL.`, 'success');
    return res.status(201).json({ success: true, proposal: event, event });
  } catch (error) {
    console.error('[Events POST] error:', error);
    return res.status(500).json({ error: 'Gagal menyimpan event ke MySQL.', details: error instanceof Error ? error.message : String(error) });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const current = await getEventById(id);
    if (!current) return res.status(404).json({ error: 'Event tidak ditemukan.' });
    const body = req.body ?? {};
    const pool = await getPool();

    let mitraNumericId: number | null = null;
    let mitraIdString = body.mitraId !== undefined ? (body.mitraId ? String(body.mitraId) : null) : (current.mitraId ?? null);
    if (mitraIdString) {
      const [uRows] = await pool.query('SELECT id FROM users WHERE user_id_string = ? LIMIT 1', [mitraIdString]);
      if (!Array.isArray(uRows) || !uRows.length) return res.status(400).json({ error: 'Mitra tidak ditemukan di MySQL.' });
      mitraNumericId = Number((uRows as any[])[0].id);
    }

    const newStatus = ['menunggu_persetujuan', 'disetujui', 'ditolak'].includes(body.status) ? body.status : current.status;
    const foto = body.fotoDokumentasi !== undefined ? (Array.isArray(body.fotoDokumentasi) ? body.fotoDokumentasi : [body.fotoDokumentasi]) : current.fotoDokumentasi;

    await pool.query(
      `UPDATE training_proposals SET
        mitra_id=?, mitra_id_string=?, nama_kegiatan=?, jenis_event=?, deskripsi_pelatihan=?,
        lokasi_dan_alamat=?, provinsi=?, kota=?, latitude=?, longitude=?, tanggal_kegiatan=?,
        target_dan_kuota_peserta=?, kuota_disetujui=?, kebutuhan_peserta=?, status=?,
        alasan_penolakan=?, link_pendaftaran=?, is_aktif=?, updated_at=CURRENT_TIMESTAMP
       WHERE proposal_id_string=?`,
      [
        mitraNumericId,
        mitraIdString,
        body.namaKegiatan ?? current.namaKegiatan,
        body.jenisEvent ?? current.jenisEvent,
        body.deskripsiPelatihan ?? current.deskripsiPelatihan,
        body.lokasiDanAlamat ?? current.lokasiDanAlamat,
        body.provinsi ?? current.provinsi,
        body.kota ?? current.kota,
        body.latitude !== undefined ? Number(body.latitude) : current.latitude ?? null,
        body.longitude !== undefined ? Number(body.longitude) : current.longitude ?? null,
        body.tanggalKegiatan ?? current.tanggalKegiatan,
        body.targetDanKuotaPeserta !== undefined ? Number(body.targetDanKuotaPeserta) : current.targetDanKuotaPeserta,
        body.kuotaDisetujui !== undefined ? Number(body.kuotaDisetujui) : current.kuotaDisetujui ?? null,
        JSON.stringify(body.kebutuhanPeserta !== undefined ? body.kebutuhanPeserta : current.kebutuhanPeserta),
        newStatus,
        newStatus === 'ditolak' ? (body.alasanPenolakan ?? current.alasanPenolakan ?? null) : null,
        body.linkPendaftaran !== undefined ? body.linkPendaftaran : current.linkPendaftaran ?? null,
        body.isAktif !== undefined ? Boolean(body.isAktif) : current.isAktif,
        id
      ]
    );

    const event = await getEventById(id);
    return res.json({ success: true, proposal: event, event });
  } catch (error) {
    console.error('[Events PUT] error:', error);
    return res.status(500).json({ error: 'Gagal memperbarui event di MySQL.', details: error instanceof Error ? error.message : String(error) });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const pool = await getPool();
    const event = await getEventById(id);
    if (!event) return res.status(404).json({ error: 'Event tidak ditemukan.' });

    const [result] = await pool.query('DELETE FROM training_proposals WHERE proposal_id_string = ?', [id]);
    if ((result as any).affectedRows === 0) return res.status(404).json({ error: 'Event tidak ditemukan.' });
    return res.json({ success: true, message: `Event "${event.namaKegiatan}" berhasil dihapus`, eventId: id });
  } catch (error) {
    console.error('[Events DELETE] error:', error);
    return res.status(500).json({ error: 'Gagal menghapus event dari MySQL.', details: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/events/:id/approve', async (req, res) => {
  try {
    const id = String(req.params.id);
    const event = await getEventById(id);
    if (!event) return res.status(404).json({ error: 'Permintaan pelatihan tidak ditemukan.' });

    const quota = Number(req.body?.targetKuota || event.targetDanKuotaPeserta);
    const origin = req.protocol + '://' + req.get('host');
    const link = `${origin}/#daftar/${id}`;
    const pool = await getPool();

    await pool.query(
      `UPDATE training_proposals
       SET status='disetujui', kuota_disetujui=?, link_pendaftaran=?,
           tanggal_persetujuan=CURRENT_TIMESTAMP, is_aktif=TRUE,
           alasan_penolakan=NULL, updated_at=CURRENT_TIMESTAMP
       WHERE proposal_id_string=?`,
      [quota, link, id]
    );
    const updated = await getEventById(id);
    await addSystemLog('Super Administrator', 'superadmin', 'Verifikasi Event Pelatihan', 'events', `Event ${updated?.namaKegiatan ?? id} disetujui.`, 'success');
    return res.json({ success: true, proposal: updated, event: updated });
  } catch (error) {
    console.error('[Events APPROVE] error:', error);
    return res.status(500).json({ error: 'Gagal menyetujui event.' });
  }
});

app.post('/api/events/:id/reject', async (req, res) => {
  try {
    const id = String(req.params.id);
    const reason = String(req.body?.alasanPenolakan ?? '').trim();
    if (!reason) return res.status(400).json({ error: 'Wajib menyertakan alasan penolakan agar mitra dapat memperbaikinya.' });

    const event = await getEventById(id);
    if (!event) return res.status(404).json({ error: 'Permintaan pelatihan tidak ditemukan.' });
    const pool = await getPool();

    await pool.query(
      `UPDATE training_proposals SET status='ditolak', alasan_penolakan=?, is_aktif=FALSE, updated_at=CURRENT_TIMESTAMP
       WHERE proposal_id_string=?`,
      [reason, id]
    );
    const updated = await getEventById(id);
    await addSystemLog('Super Administrator', 'superadmin', 'Penolakan Event Pelatihan', 'events', `Event ${event.namaKegiatan} ditolak.`, 'warning');
    return res.json({ success: true, proposal: updated, event: updated });
  } catch (error) {
    console.error('[Events REJECT] error:', error);
    return res.status(500).json({ error: 'Gagal menolak event.' });
  }
});

// ======================== PARTICIPANTS ========================

async function getParticipantById(id: string) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT p.*, tp.nama_kegiatan AS eventTitle
     FROM participants p
     LEFT JOIN training_proposals tp ON tp.proposal_id_string = p.event_id_string
     WHERE p.participant_id_string = ? LIMIT 1`,
    [id]
  );
  return Array.isArray(rows) && rows.length ? mapDbParticipant(rows[0]) : null;
}

app.get('/api/participants', async (req, res) => {
  try {
    const pool = await getPool();
    const params: any[] = [];
    const where: string[] = [];
    if (typeof req.query.eventId === 'string' && req.query.eventId) { where.push('p.event_id_string = ?'); params.push(req.query.eventId); }
    if (typeof req.query.disability === 'string' && req.query.disability) { where.push('p.kategori_disabilitas = ?'); params.push(req.query.disability); }

    let sql = `SELECT p.*, tp.nama_kegiatan AS eventTitle
               FROM participants p
               LEFT JOIN training_proposals tp ON tp.proposal_id_string=p.event_id_string`;
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' ORDER BY p.created_at DESC, p.id DESC';

    const [rows] = await pool.query(sql, params);
    return res.json({ participants: Array.isArray(rows) ? rows.map(mapDbParticipant) : [] });
  } catch (error) {
    console.error('[Participants GET] error:', error);
    return res.status(500).json({ error: 'Gagal mengambil peserta dari MySQL.' });
  }
});

app.post('/api/participants', async (req, res) => {
  try {
    const body = req.body ?? {};
    const { eventId, namaLengkap, noWa, email, usia, kategoriDisabilitas, kebutuhanFasilitas, catatanKhusus } = body;
    if (!eventId || !namaLengkap || !noWa || !kategoriDisabilitas) {
      return res.status(400).json({ error: 'Nama lengkap, Nomor WhatsApp, dan Kategori Disabilitas wajib diisi' });
    }

    const pool = await getPool();
    const [eventRows] = await pool.query(
      `SELECT id, proposal_id_string, nama_kegiatan, COALESCE(kuota_disetujui, target_dan_kuota_peserta) AS maxQuota,
              jumlah_pendaftar, is_aktif, status
       FROM training_proposals WHERE proposal_id_string=? LIMIT 1`,
      [String(eventId)]
    );
    if (!Array.isArray(eventRows) || !eventRows.length) return res.status(404).json({ error: 'Event pelatihan tidak ditemukan' });

    const event = eventRows[0] as any;
    const maxQuota = Number(event.maxQuota || 0);
    if (maxQuota > 0 && Number(event.jumlah_pendaftar || 0) >= maxQuota) {
      return res.status(400).json({ error: 'Mohon maaf, kuota pendaftaran untuk pelatihan ini sudah penuh.' });
    }

    const participantId = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fasilitas = Array.isArray(kebutuhanFasilitas) ? kebutuhanFasilitas : [];

    await pool.query(
      `INSERT INTO participants
       (participant_id_string, training_proposal_id, event_id_string, nama_lengkap, no_wa, email, usia,
        kategori_disabilitas, kebutuhan_fasilitas, catatan_khusus, status_kehadiran)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'terdaftar')`,
      [
        participantId, Number(event.id), String(eventId), String(namaLengkap).trim(), String(noWa).trim(),
        email ? String(email).trim() : `${String(noWa).trim()}@peserta.id`,
        Number(usia || 0), String(kategoriDisabilitas), JSON.stringify(fasilitas), catatanKhusus || null
      ]
    );
    await pool.query('UPDATE training_proposals SET jumlah_pendaftar = jumlah_pendaftar + 1 WHERE id = ?', [Number(event.id)]);

    const participant = await getParticipantById(participantId);
    const updatedEvent = await getEventById(String(eventId));
    return res.status(201).json({ success: true, participant, event: updatedEvent, jumlahPendaftar: updatedEvent?.jumlahPendaftar ?? 0 });
  } catch (error) {
    console.error('[Participants POST] error:', error);
    return res.status(500).json({ error: 'Gagal menyimpan peserta ke MySQL.', details: error instanceof Error ? error.message : String(error) });
  }
});

app.patch('/api/participants/:id/status', async (req, res) => {
  try {
    const id = String(req.params.id);
    const status = req.body?.statusKehadiran;
    if (!['terdaftar', 'hadir', 'batal'].includes(status)) return res.status(400).json({ error: 'Status kehadiran tidak valid.' });

    const pool = await getPool();
    const participant = await getParticipantById(id);
    if (!participant) return res.status(404).json({ error: 'Peserta tidak ditemukan.' });
    await pool.query('UPDATE participants SET status_kehadiran=?, updated_at=CURRENT_TIMESTAMP WHERE participant_id_string=?', [status, id]);
    return res.json({ success: true, participant: await getParticipantById(id) });
  } catch (error) {
    console.error('[Participants STATUS] error:', error);
    return res.status(500).json({ error: 'Gagal memperbarui status peserta.' });
  }
});

app.put('/api/participants/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const current = await getParticipantById(id);
    if (!current) return res.status(404).json({ error: 'Peserta tidak ditemukan.' });
    const body = req.body ?? {};
    const pool = await getPool();

    await pool.query(
      `UPDATE participants SET
        nama_lengkap=?, no_wa=?, email=?, usia=?, kategori_disabilitas=?,
        kebutuhan_fasilitas=?, catatan_khusus=?, status_kehadiran=?, updated_at=CURRENT_TIMESTAMP
       WHERE participant_id_string=?`,
      [
        body.namaLengkap ?? current.namaLengkap,
        body.noWa ?? current.noWa,
        body.email ?? current.email,
        body.usia !== undefined ? Number(body.usia) : current.usia,
        body.kategoriDisabilitas ?? current.kategoriDisabilitas,
        JSON.stringify(body.kebutuhanFasilitas !== undefined ? body.kebutuhanFasilitas : current.kebutuhanFasilitas),
        body.catatanKhusus !== undefined ? body.catatanKhusus : current.catatanKhusus,
        body.statusKehadiran ?? current.statusKehadiran,
        id
      ]
    );
    return res.json({ success: true, participant: await getParticipantById(id) });
  } catch (error) {
    console.error('[Participants PUT] error:', error);
    return res.status(500).json({ error: 'Gagal memperbarui peserta di MySQL.' });
  }
});

app.delete('/api/participants/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const participant = await getParticipantById(id);
    if (!participant) return res.status(404).json({ error: 'Peserta tidak ditemukan.' });

    const pool = await getPool();
    const [result] = await pool.query('DELETE FROM participants WHERE participant_id_string=?', [id]);
    if ((result as any).affectedRows) {
      await pool.query(
        `UPDATE training_proposals SET jumlah_pendaftar=GREATEST(jumlah_pendaftar - 1, 0)
         WHERE proposal_id_string=?`,
        [participant.eventId]
      );
    }
    return res.json({ success: true, message: `Peserta ${participant.namaLengkap} berhasil dihapus`, participantId: id });
  } catch (error) {
    console.error('[Participants DELETE] error:', error);
    return res.status(500).json({ error: 'Gagal menghapus peserta dari MySQL.' });
  }
});

// ======================== DISABILITIES ========================

app.get('/api/disabilities', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT id, disability_id_string, kode, nama, kategori_utama, deskripsi,
              metode_pembelajaran, fasilitas_rekomendasi, warna_hex, icon, is_aktif, created_at
       FROM disabilities ORDER BY created_at DESC, id DESC`
    );
    const disabilities = Array.isArray(rows) ? rows.map(mapDbDisability) : [];
    return res.json({ disabilities, data: disabilities });
  } catch (error) {
    console.error('[Disabilities GET] error:', error);
    return res.status(500).json({ error: 'Gagal mengambil kategori disabilitas dari MySQL.' });
  }
});

app.post('/api/disabilities', async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.kode || !body.nama) return res.status(400).json({ error: 'Kode dan Nama Kategori Disabilitas wajib diisi' });

    const pool = await getPool();
    const kode = String(body.kode).trim().toLowerCase().replace(/\s+/g, '_');
    const [existing] = await pool.query('SELECT id FROM disabilities WHERE LOWER(kode)=? LIMIT 1', [kode]);
    if (Array.isArray(existing) && existing.length) return res.status(409).json({ error: `Kode disabilitas "${kode}" sudah ada dalam master data` });

    const id = `dis_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await pool.query(
      `INSERT INTO disabilities
       (disability_id_string, kode, nama, kategori_utama, deskripsi, metode_pembelajaran,
        fasilitas_rekomendasi, warna_hex, icon, is_aktif)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        id, kode, String(body.nama).trim(), body.kategoriUtama || 'Sensorik',
        body.deskripsi || '', body.metodePembelajaran || 'Metode pembelajaran ramah disabilitas standar Kemenag RI',
        JSON.stringify(Array.isArray(body.fasilitasRekomendasi) ? body.fasilitasRekomendasi : []),
        body.warnaHex || '#005a71', body.icon || 'accessible'
      ]
    );
    const [rows] = await pool.query('SELECT * FROM disabilities WHERE disability_id_string=? LIMIT 1', [id]);
    const disability = Array.isArray(rows) && rows.length ? mapDbDisability(rows[0]) : null;
    return res.status(201).json({ success: true, disability, item: disability });
  } catch (error) {
    console.error('[Disabilities POST] error:', error);
    return res.status(500).json({ error: 'Gagal menyimpan kategori disabilitas ke MySQL.', details: error instanceof Error ? error.message : String(error) });
  }
});

app.put('/api/disabilities/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const pool = await getPool();
    const [currentRows] = await pool.query('SELECT * FROM disabilities WHERE disability_id_string=? LIMIT 1', [id]);
    if (!Array.isArray(currentRows) || !currentRows.length) return res.status(404).json({ error: 'Data disabilitas tidak ditemukan' });

    const current = currentRows[0] as any;
    const body = req.body ?? {};
    const kode = body.kode !== undefined ? String(body.kode).trim().toLowerCase().replace(/\s+/g, '_') : current.kode;

    const [dupe] = await pool.query('SELECT id FROM disabilities WHERE LOWER(kode)=? AND disability_id_string<>? LIMIT 1', [kode, id]);
    if (Array.isArray(dupe) && dupe.length) return res.status(409).json({ error: `Kode disabilitas "${kode}" sudah digunakan.` });

    await pool.query(
      `UPDATE disabilities SET
       kode=?, nama=?, kategori_utama=?, deskripsi=?, metode_pembelajaran=?,
       fasilitas_rekomendasi=?, warna_hex=?, icon=?, is_aktif=?, updated_at=CURRENT_TIMESTAMP
       WHERE disability_id_string=?`,
      [
        kode,
        body.nama ?? current.nama,
        body.kategoriUtama ?? current.kategori_utama,
        body.deskripsi !== undefined ? body.deskripsi : current.deskripsi,
        body.metodePembelajaran ?? current.metode_pembelajaran,
        JSON.stringify(body.fasilitasRekomendasi !== undefined ? body.fasilitasRekomendasi : jsonParse<string[]>(current.fasilitas_rekomendasi, [])),
        body.warnaHex ?? current.warna_hex,
        body.icon ?? current.icon,
        body.isAktif !== undefined ? Boolean(body.isAktif) : Boolean(current.is_aktif),
        id
      ]
    );
    const [rows] = await pool.query('SELECT * FROM disabilities WHERE disability_id_string=? LIMIT 1', [id]);
    const disability = Array.isArray(rows) && rows.length ? mapDbDisability(rows[0]) : null;
    return res.json({ success: true, disability, item: disability });
  } catch (error) {
    console.error('[Disabilities PUT] error:', error);
    return res.status(500).json({ error: 'Gagal memperbarui kategori disabilitas di MySQL.', details: error instanceof Error ? error.message : String(error) });
  }
});

app.delete('/api/disabilities/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const pool = await getPool();
    const [rows] = await pool.query('SELECT nama FROM disabilities WHERE disability_id_string=? LIMIT 1', [id]);
    if (!Array.isArray(rows) || !rows.length) return res.status(404).json({ error: 'Data disabilitas tidak ditemukan' });

    try {
      const [result] = await pool.query('DELETE FROM disabilities WHERE disability_id_string=?', [id]);
      if ((result as any).affectedRows === 0) return res.status(404).json({ error: 'Data disabilitas tidak ditemukan' });
      return res.json({ success: true, message: `Kategori disabilitas "${(rows[0] as any).nama}" berhasil dihapus`, id });
    } catch (dbError: any) {
      if (dbError?.code === 'ER_ROW_IS_REFERENCED_2' || dbError?.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).json({
          error: 'Kategori disabilitas masih digunakan oleh data lain sehingga tidak dapat dihapus. Nonaktifkan kategori tersebut terlebih dahulu.',
          code: dbError.code
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('[Disabilities DELETE] error:', error);
    return res.status(500).json({ error: 'Gagal menghapus kategori disabilitas dari MySQL.', details: error instanceof Error ? error.message : String(error) });
  }
});

// ======================== COMMUNITIES ========================

app.get('/api/communities', async (req, res) => {
  try {
    const pool = await getPool();
    const params: any[] = [];
    const where: string[] = [];
    if (typeof req.query.category === 'string' && req.query.category) {
      where.push('JSON_CONTAINS(kategori_disabilitas, ?)');
      params.push(JSON.stringify(String(req.query.category)));
    }
    if (typeof req.query.province === 'string' && req.query.province) {
      where.push('LOWER(provinsi)=LOWER(?)');
      params.push(req.query.province);
    }

    let sql = `SELECT qc.*, COUNT(tp.id) AS activeEventsCount
               FROM quran_communities qc
               LEFT JOIN training_proposals tp ON tp.provinsi=qc.provinsi AND tp.is_aktif=1`;
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ` GROUP BY qc.id ORDER BY qc.created_at DESC, qc.id DESC`;

    const [rows] = await pool.query(sql, params);
    return res.json({ communities: Array.isArray(rows) ? rows.map(mapDbCommunity) : [] });
  } catch (error) {
    console.error('[Communities GET] error:', error);
    return res.status(500).json({ error: 'Gagal mengambil komunitas dari MySQL.' });
  }
});

app.post('/api/communities', async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.namaLembaga || !body.alamatLengkap || !body.provinsi || !body.kota) {
      return res.status(400).json({ error: 'Nama Lembaga, Alamat, Provinsi, dan Kota wajib diisi' });
    }

    const pool = await getPool();
    let numericUserId: number | null = null;
    const userIdString = body.userId ? String(body.userId) : null;
    if (userIdString) {
      const [uRows] = await pool.query('SELECT id FROM users WHERE user_id_string=? LIMIT 1', [userIdString]);
      if (!Array.isArray(uRows) || !uRows.length) return res.status(400).json({ error: 'Pengguna pemilik komunitas tidak ditemukan.' });
      numericUserId = Number((uRows as any[])[0].id);
    }

    const id = `comm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await pool.query(
      `INSERT INTO quran_communities
       (community_id_string, user_id, nama_lembaga, kategori_disabilitas, provinsi, kota,
        alamat_lengkap, latitude, longitude, kontak_wa, kontak_email, jumlah_santri,
        fasilitas_tersedia, program_unggulan, deskripsi, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        id, numericUserId, String(body.namaLembaga).trim(),
        JSON.stringify(Array.isArray(body.kategoriDisabilitas) ? body.kategoriDisabilitas : []),
        String(body.provinsi), String(body.kota), String(body.alamatLengkap),
        Number(body.latitude || 0), Number(body.longitude || 0),
        String(body.kontakWa || ''), body.kontakEmail || null, Number(body.jumlahSantri || 0),
        JSON.stringify(Array.isArray(body.fasilitasTersedia) ? body.fasilitasTersedia : []),
        String(body.programUnggulan || ''), String(body.deskripsi || '')
      ]
    );
    const [rows] = await pool.query('SELECT * FROM quran_communities WHERE community_id_string=? LIMIT 1', [id]);
    const community = Array.isArray(rows) && rows.length ? mapDbCommunity(rows[0]) : null;
    return res.status(201).json({ success: true, community });
  } catch (error) {
    console.error('[Communities POST] error:', error);
    return res.status(500).json({ error: 'Gagal menyimpan komunitas ke MySQL.', details: error instanceof Error ? error.message : String(error) });
  }
});

// ======================== REPORTS ========================

app.get('/api/reports/summary', async (req, res) => {
  try {
    const pool = await getPool();

    const [statsRows] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM training_proposals) AS totalProposals,
        (SELECT COUNT(*) FROM training_proposals WHERE status='disetujui') AS approvedEvents,
        (SELECT COUNT(*) FROM training_proposals WHERE status='menunggu_persetujuan') AS pendingProposals,
        (SELECT COUNT(*) FROM training_proposals WHERE status='ditolak') AS rejectedProposals,
        (SELECT COUNT(*) FROM participants) AS totalParticipants,
        (SELECT COUNT(*) FROM quran_communities) AS totalCommunities,
        (SELECT COUNT(*) FROM users WHERE role='mitra') AS totalMitra,
        (SELECT COUNT(*) FROM users WHERE role='superadmin') AS totalSuperAdmin`
    );
    const statsRow = (statsRows as any[])[0] ?? {};

    const [participantsRows] = await pool.query(
      `SELECT p.*, tp.nama_kegiatan AS eventTitle
       FROM participants p LEFT JOIN training_proposals tp ON tp.proposal_id_string=p.event_id_string
       ORDER BY p.created_at DESC`
    );
    const reportParticipants = Array.isArray(participantsRows) ? participantsRows.map(mapDbParticipant) : [];

    const [eventsRows] = await pool.query(
      `SELECT tp.*, u.name AS mitraName, u.organization_name AS mitraOrg
       FROM training_proposals tp LEFT JOIN users u ON u.id=tp.mitra_id
       ORDER BY tp.created_at DESC`
    );
    const reportEvents = Array.isArray(eventsRows) ? eventsRows.map(mapDbEvent) : [];

    const [communityRows] = await pool.query(`SELECT provinsi, COUNT(*) AS total FROM quran_communities GROUP BY provinsi`);
    const regionBreakdown: Record<string, number> = {};
    for (const row of communityRows as any[]) regionBreakdown[row.provinsi] = Number(row.total);

    const disabilityRows = await pool.query(
      `SELECT kategori_disabilitas, COUNT(*) AS total FROM participants GROUP BY kategori_disabilitas`
    );
    const disabilityCounts: Record<string, number> = {};
    for (const row of disabilityRows[0] as any[]) disabilityCounts[row.kategori_disabilitas] = Number(row.total);

    const funnelStages = {
      totalPendaftar: reportParticipants.length,
      terverifikasi: reportParticipants.filter(p => p.kebutuhanFasilitas.length > 0 || Boolean(p.noWa)).length,
      assessment: reportParticipants.filter(p => p.statusKehadiran !== 'batal').length,
      pelatihanAktif: reportParticipants.filter(p => p.statusKehadiran === 'terdaftar' || p.statusKehadiran === 'hadir').length,
      lulusSertifikasi: reportParticipants.filter(p => p.statusKehadiran === 'hadir').length,
    };

    const stats: SystemStats = {
      totalProposals: Number(statsRow.totalProposals || 0),
      approvedEvents: Number(statsRow.approvedEvents || 0),
      pendingProposals: Number(statsRow.pendingProposals || 0),
      rejectedProposals: Number(statsRow.rejectedProposals || 0),
      totalParticipants: Number(statsRow.totalParticipants || 0),
      totalCommunities: Number(statsRow.totalCommunities || 0),
      totalMitra: Number(statsRow.totalMitra || 0),
      totalSuperAdmin: Number(statsRow.totalSuperAdmin || 0),
    };

    return res.json({ stats, disabilityCounts, funnelStages, regionBreakdown, participants: reportParticipants, events: reportEvents });
  } catch (error) {
    console.error('[Reports Summary] error:', error);
    return res.status(500).json({ error: 'Gagal membuat ringkasan laporan.' });
  }
});

async function ensureInitialPasswords() {
  try {
    const pool = await getPool();
    const initialHash = await bcrypt.hash('password123', 12);
    const [rows] = await pool.query(
      `SELECT user_id_string, password FROM users
       WHERE password IS NULL OR password='' OR password LIKE '%REPLACE_WITH_%' OR password NOT LIKE '$2%'`
    );
    for (const row of rows as any[]) {
      await pool.query('UPDATE users SET password=? WHERE user_id_string=?', [initialHash, row.user_id_string]);
      console.log(`[Auth] Password awal password123 diterapkan ke akun ${row.user_id_string}.`);
    }
  } catch (error) {
    console.error('[Auth] Gagal memeriksa password awal:', error);
  }
}

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
    try {
      await getDbPool();
      await ensureInitialPasswords();
      console.log('[MySQL] Database siap dan tersinkronisasi.');
    } catch (err) {
      console.error('[MySQL] Koneksi database gagal:', err);
    }
  });
}

startServer();
