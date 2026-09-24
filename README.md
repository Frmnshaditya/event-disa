# AL-Qur-an-Disa: Platform Pelatihan & Peta Quran Disabilitas Indonesia

Sistem Manajemen Pelatihan Al-Quran Ramah Disabilitas, Peta Interaktif Komunitas/Yayasan Quran Disabilitas se-Indonesia, dan Multi-Role Super Admin & Mitra.

---

## 1. Struktur Project

Project ini telah diorganisasi ke dalam struktur modular **frontend** dan **backend**:

```text
AL-Qur-an-Disa/
├── frontend/                     # [FRONTEND] Aplikasi Web Interaktif (React 19, Vite, Tailwind CSS v4)
│   ├── src/                      # Source code antarmuka pengguna
│   │   ├── components/           # Komponen UI (Peta Quran, Manajemen Event, Peserta, Master Data, dll.)
│   │   ├── App.tsx               # Root view router & navigasi state
│   │   ├── main.tsx              # Entry point aplikasi React
│   │   ├── types.ts              # Interface & Type Definitions (TypeScript)
│   │   └── index.css             # Tailwind styling & tema warna Kemenag
│   ├── public/                   # Asset gambar, logo SVG, audio panduan
│   ├── package.json              # Konfigurasi dependensi frontend
│   └── vite.config.ts            # Konfigurasi bundler Vite & API Proxy
│
├── backend/                      # [BACKEND] API Server & Integrasi Database MySQL Laragon
│   ├── config/
│   │   └── database.ts           # Konfigurasi koneksi database MySQL (host, port, user, pass)
│   ├── database/
│   │   ├── schema.sql            # Skrip DDL MySQL siap import (Tabel users, events, participants, dll.)
│   │   ├── seed.sql              # Data awal lengkap (Master disabilitas, lembaga, event)
│   │   └── mysql.ts              # Driver koneksi pool MySQL (mysql2) dengan fallback aman
│   ├── package.json              # Konfigurasi dependensi backend mandiri
│   └── .env.example              # Contoh variabel lingkungan (DB_HOST, DB_USER, DB_PASSWORD)
│
├── server.ts                     # Full-stack runner (Express server + Vite middleware)
├── package.json                  # Root runner (menjalankan frontend & backend sekaligus)
├── vite.config.ts                # Konfigurasi Vite Root
├── index.html                    # Dokumen HTML utama
└── README.md                     # Panduan setup lokal ini
```

---

## 2. Cara Menggunakan di Laptop Lokal (VS Code + Laragon + MySQL)

### A. Persiapan Laragon (MySQL Database)
1. Buka aplikasi **Laragon** di laptop Anda.
2. Klik tombol **"Start All"** untuk menjalankan Apache/Nginx dan **MySQL**.
3. Buka antarmuka database Laragon:
   - Klik tombol **"Database"** di Laragon (membuka HeidiSQL), ATAU
   - Buka browser dan akses `http://localhost/phpmyadmin`.
4. Buat database baru bernama:
   ```sql
   CREATE DATABASE quran_disabilitas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
5. Import skrip database yang sudah disediakan di folder `backend/database/`:
   - **Langkah 1**: Import file `backend/database/schema.sql` (membuat seluruh tabel: `users`, `disabilities`, `quran_communities`, `training_proposals`, `participants`, `application_settings`, `system_logs`).
   - **Langkah 2**: Import file `backend/database/seed.sql` (mengisi data awal superadmin, mitra, komunitas Quran, dan ragam disabilitas).

---

### B. Membuka di Visual Studio Code (VS Code)
1. Buka **Visual Studio Code**.
2. Pilih menu **File > Open Folder...**, lalu pilih folder project `AL-Qur-an-Disa`.
3. Buat file `.env` di root project (atau salin dari `.env.example`):
   ```env
   PORT=3000
   NODE_ENV=development

   # Pengaturan default MySQL Laragon
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_DATABASE=event_disabilitas_db
   ```

---

### C. Menjalankan Project (Pilihan Metode)

#### **Metode 1: Menjalankan Sekaligus (Sangat Direkomendasikan)**
Di terminal VS Code (root folder):
```bash
# 1. Install dependensi
npm install

# 2. Jalankan server full-stack
npm run dev
```
Buka browser di **`http://localhost:3000`**.
- Aplikasi otomatis membaca database MySQL Laragon Anda!
- Jika MySQL belum dinyalakan, sistem otomatis fallback tanpa crash.

---

#### **Metode 2: Menjalankan Terpisah (Frontend & Backend Terpisah)**
Jika Anda ingin memisahkan proses backend dan frontend:

**Terminal 1 (Backend API):**
```bash
cd backend
npm install
npm run dev
```
*(Backend berjalan di port 3000 atau 5000 melayani REST API)*

**Terminal 2 (Frontend React):**
```bash
cd frontend
npm install
npm run dev
```
*(Frontend berjalan di `http://localhost:5173`)*

---

### D. Akun Pengguna Bawaan (Login)

| Role | Email | Password | Hak Akses |
|---|---|---|---|
| **Super Admin** | `admin@quran.id` | `admin123` | Akses penuh: Approve event, Master Data Disabilitas, Audit Log, Branding |
| **Mitra Surabaya** | `mitra.surabaya@quran.id` | `admin123` | Input Lembaga/Komunitas, Ajukan Pelatihan Al-Quran, Kelola Peserta |
| **Mitra Bandung** | `mitra.bandung@quran.id` | `admin123` | Pengajuan Pelatihan & Manajemen Peserta Daerah |

---

### E. Integrasi dengan Framework Laravel (Opsional)
Jika Anda di masa depan ingin mengganti backend Node.js dengan **Laravel PHP** yang ada di Laragon:
- Tabel dan relasi di `backend/database/schema.sql` sudah 100% kompatibel dengan konvensi Eloquent ORM Laravel.
- Anda juga bisa membuka menu **"Panduan Laravel & MySQL"** langsung di dalam aplikasi (bagian bawah dashboard) untuk melihat contoh kode migration, Model Eloquent, Controller, dan Route API Laravel siap pakai.
