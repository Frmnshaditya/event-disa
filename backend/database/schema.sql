*-- ==========================================================*

*-- SKEMA DATABASE MYSQL UNTUK LARAGON & VS CODE*

*-- Proyek: AL-Qur-an-Disa*

*-- Sistem Manajemen Pelatihan & Peta Persebaran Al-Quran Disabilitas*

*-- ==========================================================*

*-- 1. Buat Database jika belum ada*

CREATE DATABASE IF NOT EXISTS `event_disabilitas_db`

CHARACTER SET utf8mb4

COLLATE utf8mb4_unicode_ci;

USE `event_disabilitas_db`;

-- Matikan cek foreign key sementara saat inisialisasi tabel

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------

-- 2. TABEL: users (Super Admin & Mitra Pelaksana)

-- ----------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (

  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  `user_id_string` VARCHAR(50) NOT NULL UNIQUE,

  `name` VARCHAR(255) NOT NULL,

  `email` VARCHAR(255) NOT NULL UNIQUE,

  `password` VARCHAR(255) NOT NULL,

  `role` ENUM('superadmin', 'mitra') NOT NULL DEFAULT 'mitra',

  `phone` VARCHAR(30) NULL,

  `organization_name` VARCHAR(255) NULL,

  `province` VARCHAR(100) NULL,

  `city` VARCHAR(100) NULL,

  `address` TEXT NULL,

  `avatar` VARCHAR(255) NULL,

  `remember_token` VARCHAR(100) NULL,

  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_users_role` (`role`),

  INDEX `idx_users_email` (`email`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------

-- 3. TABEL: disabilities (Master Data Ragam Disabilitas)

-- ----------------------------------------------------------

DROP TABLE IF EXISTS `disabilities`;

CREATE TABLE `disabilities` (

  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  `disability_id_string` VARCHAR(50) NOT NULL UNIQUE,

  `kode` VARCHAR(100) NOT NULL UNIQUE,

  `nama` VARCHAR(255) NOT NULL,

  `kategori_utama` VARCHAR(100) NOT NULL,

  `deskripsi` TEXT NULL,

  `metode_pembelajaran` TEXT NULL,

  `fasilitas_rekomendasi` JSON NULL,

  `warna_hex` VARCHAR(20) DEFAULT '#005a71',

  `icon` VARCHAR(100) DEFAULT 'visibility',

  `is_aktif` BOOLEAN NOT NULL DEFAULT TRUE,

  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_disabilities_is_aktif` (`is_aktif`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------

-- 4. TABEL: quran_communities (Peta Lembaga & Komunitas Quran)

-- ----------------------------------------------------------

DROP TABLE IF EXISTS `quran_communities`;

CREATE TABLE `quran_communities` (

  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  `community_id_string` VARCHAR(50) NOT NULL UNIQUE,

  `user_id` BIGINT UNSIGNED NULL,

  `nama_lembaga` VARCHAR(255) NOT NULL,

  `kategori_disabilitas` JSON NOT NULL COMMENT 'Array kategori disabilitas binaan',

  `provinsi` VARCHAR(100) NOT NULL,

  `kota` VARCHAR(100) NOT NULL,

  `alamat_lengkap` TEXT NOT NULL,

  `latitude` DECIMAL(10, 8) NOT NULL,

  `longitude` DECIMAL(11, 8) NOT NULL,

  `kontak_wa` VARCHAR(30) NOT NULL,

  `kontak_email` VARCHAR(255) NULL,

  `jumlah_santri` INT UNSIGNED NOT NULL DEFAULT 0,

  `fasilitas_tersedia` JSON NOT NULL,

  `program_unggulan` VARCHAR(255) NOT NULL,

  `deskripsi` TEXT NOT NULL,

  `is_verified` BOOLEAN NOT NULL DEFAULT TRUE,

  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_communities_provinsi` (`provinsi`),

  INDEX `idx_communities_kota` (`kota`),

  CONSTRAINT `fk_community_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------

-- 5. TABEL: training_proposals (Event & Pengajuan Pelatihan)

-- ----------------------------------------------------------

DROP TABLE IF EXISTS `training_proposals`;

CREATE TABLE `training_proposals` (

  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  `proposal_id_string` VARCHAR(50) NOT NULL UNIQUE,

  `mitra_id` BIGINT UNSIGNED NULL,

  `mitra_id_string` VARCHAR(50) NULL,

  `nama_kegiatan` VARCHAR(255) NOT NULL,

  `jenis_event` VARCHAR(150) NOT NULL,

  `deskripsi_pelatihan` TEXT NOT NULL,

  `lokasi_dan_alamat` TEXT NOT NULL,

  `provinsi` VARCHAR(100) NOT NULL,

  `kota` VARCHAR(100) NOT NULL,

  `latitude` DECIMAL(10, 8) NULL,

  `longitude` DECIMAL(11, 8) NULL,

  `tanggal_kegiatan` VARCHAR(100) NOT NULL,

  `target_dan_kuota_peserta` INT UNSIGNED NOT NULL,

  `kuota_disetujui` INT UNSIGNED NULL,

  `kebutuhan_peserta` JSON NOT NULL,

  `status` ENUM('menunggu_persetujuan', 'disetujui', 'ditolak') NOT NULL DEFAULT 'menunggu_persetujuan',

  `alasan_penolakan` TEXT NULL,

  `tanggal_persetujuan` TIMESTAMP NULL,

  `link_pendaftaran` VARCHAR(255) NULL,

  `is_aktif` BOOLEAN NOT NULL DEFAULT FALSE,

  `jumlah_pendaftar` INT UNSIGNED NOT NULL DEFAULT 0,

  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_proposals_status` (`status`),

  INDEX `idx_proposals_is_aktif` (`is_aktif`),

  CONSTRAINT `fk_proposal_mitra` FOREIGN KEY (`mitra_id`) REFERENCES `users` (`id`) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------

-- 6. TABEL: participants (Pendaftaran Peserta Pelatihan)

-- ----------------------------------------------------------

DROP TABLE IF EXISTS `participants`;

CREATE TABLE `participants` (

  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  `participant_id_string` VARCHAR(50) NOT NULL UNIQUE,

  `training_proposal_id` BIGINT UNSIGNED NULL,

  `event_id_string` VARCHAR(50) NOT NULL,

  `nama_lengkap` VARCHAR(255) NOT NULL,

  `no_wa` VARCHAR(30) NOT NULL,

  `email` VARCHAR(255) NULL,

  `usia` INT UNSIGNED NOT NULL,

  `kategori_disabilitas` VARCHAR(100) NOT NULL,

  `kebutuhan_fasilitas` JSON NOT NULL,

  `catatan_khusus` TEXT NULL,

  `status_kehadiran` ENUM('terdaftar', 'hadir', 'batal') NOT NULL DEFAULT 'terdaftar',

  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_participants_event` (`event_id_string`),

  INDEX `idx_participants_status` (`status_kehadiran`),

  CONSTRAINT `fk_participant_proposal` FOREIGN KEY (`training_proposal_id`) REFERENCES `training_proposals` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------

-- 7. TABEL: application_settings (Konfigurasi Aplikasi & Branding)

-- ----------------------------------------------------------

DROP TABLE IF EXISTS `application_settings`;

CREATE TABLE `application_settings` (

  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  `setting_key` VARCHAR(100) NOT NULL UNIQUE DEFAULT 'global_config',

  `application_name` VARCHAR(255) NOT NULL DEFAULT 'Alquran Disabilitas',

  `logo` VARCHAR(255) DEFAULT '/logo-quran.svg',

  `favicon` VARCHAR(255) DEFAULT '/favicon.svg',

  `topbar_color` VARCHAR(30) DEFAULT '#005a71',

  `primary_color` VARCHAR(30) DEFAULT '#005a71',

  `secondary_color` VARCHAR(30) DEFAULT '#ab3425',

  `accent_color` VARCHAR(30) DEFAULT '#d97706',

  `public_role_label` VARCHAR(100) DEFAULT 'Peserta',

  `institution_subtitle` VARCHAR(255) DEFAULT 'Kementerian Agama Republik Indonesia',

  `logo_size` ENUM('small', 'medium', 'large') DEFAULT 'large',

  `header_bg_image` VARCHAR(255) NULL,

  `header_bg_overlay` VARCHAR(50) DEFAULT 'dark',

  `logo_container_bg` VARCHAR(50) DEFAULT 'white',

  `updated_by` VARCHAR(255) DEFAULT 'Super Administrator',

  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------

-- 8. TABEL: system_logs (Log Aktivitas Sistem)

-- ----------------------------------------------------------

DROP TABLE IF EXISTS `system_logs`;

CREATE TABLE `system_logs` (

  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  `log_id_string` VARCHAR(50) NOT NULL UNIQUE,

  `timestamp` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  `user` VARCHAR(255) NOT NULL,

  `user_role` VARCHAR(50) NOT NULL,

  `action` VARCHAR(255) NOT NULL,

  `module` VARCHAR(100) NOT NULL,

  `details` TEXT NOT NULL,

  `status` ENUM('success', 'info', 'warning', 'error') NOT NULL DEFAULT 'info',

  INDEX `idx_logs_timestamp` (`timestamp`),

  INDEX `idx_logs_module` (`module`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hidupkan kembali foreign key checks

SET FOREIGN_KEY_CHECKS = 1;
