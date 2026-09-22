USE `event_disabilitas_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------
-- USERS
-- Catatan: password disimpan sebagai bcrypt hash.
-- ----------------------------------------------------------
INSERT INTO `users`
(`user_id_string`, `name`, `email`, `password`, `role`,
 `organization_name`, `province`, `city`, `address`, `phone`)
VALUES
('usr_superadmin', 'Ustadz Ahmad Fauzi', 'admin@quran.id',
 '$2b$10$REPLACE_WITH_YOUR_BCRYPT_HASH', 'superadmin',
 'Kementerian Agama Republik Indonesia', NULL, NULL, NULL, NULL),
('usr_mitra_1', 'Nurul Hidayah', 'mitra1@quran.id',
 '$2b$10$REPLACE_WITH_YOUR_BCRYPT_HASH', 'mitra',
 'Yayasan Sahabat Netra Mengaji', NULL, NULL, NULL, NULL),
('usr_mitra_2', 'Budi Prasetyo', 'mitra2@quran.id',
 '$2b$10$REPLACE_WITH_YOUR_BCRYPT_HASH', 'mitra',
 'Komunitas Tuli Mengaji Nusantara', NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `role` = VALUES(`role`),
  `organization_name` = VALUES(`organization_name`);

-- ----------------------------------------------------------
-- MASTER DISABILITAS
-- ----------------------------------------------------------
INSERT INTO `disabilities`
(`disability_id_string`, `kode`, `nama`, `kategori_utama`,
 `deskripsi`, `metode_pembelajaran`, `fasilitas_rekomendasi`,
 `warna_hex`, `icon`, `is_aktif`)
VALUES
('dis_tunanetra', 'tunanetra', 'Tunanetra', 'Sensorik',
 'Peserta didik dengan hambatan penglihatan.',
 'Al-Quran Braille, audio, dan pendampingan membaca.',
 '["Al-Quran Braille","Audio Al-Quran","Pendamping"]',
 '#005a71', 'visibility', TRUE),
('dis_tunarungu', 'tunarungu', 'Tunarungu', 'Sensorik',
 'Peserta didik dengan hambatan pendengaran.',
 'Bahasa isyarat, visual, dan materi tertulis.',
 '["Penerjemah Bahasa Isyarat","Materi Visual","Materi Tertulis"]',
 '#2563eb', 'ear-off', TRUE),
('dis_tunadaksa', 'tunadaksa', 'Tunadaksa', 'Fisik',
 'Peserta didik dengan hambatan mobilitas atau gerak.',
 'Pembelajaran aksesibel dan penyesuaian posisi belajar.',
 '["Ruang Aksesibel","Ramp","Meja Kursi Adaptif"]',
 '#16a34a', 'accessibility', TRUE),
('dis_intelektual_autisme', 'intelektual_autisme',
 'Intelektual / Autisme', 'Intelektual',
 'Peserta didik dengan kebutuhan dukungan intelektual atau spektrum autisme.',
 'Pembelajaran bertahap, terstruktur, berulang, dan visual.',
 '["Media Visual","Pendamping Khusus","Ruang Tenang"]',
 '#d97706', 'brain', TRUE)
ON DUPLICATE KEY UPDATE
  `nama` = VALUES(`nama`),
  `kategori_utama` = VALUES(`kategori_utama`),
  `deskripsi` = VALUES(`deskripsi`),
  `metode_pembelajaran` = VALUES(`metode_pembelajaran`),
  `fasilitas_rekomendasi` = VALUES(`fasilitas_rekomendasi`),
  `is_aktif` = VALUES(`is_aktif`);

-- ----------------------------------------------------------
-- KONFIGURASI APLIKASI
-- ----------------------------------------------------------
INSERT INTO `application_settings`
(`setting_key`, `application_name`, `logo`, `favicon`,
 `topbar_color`, `primary_color`, `secondary_color`, `accent_color`,
 `public_role_label`, `institution_subtitle`, `logo_size`,
 `header_bg_overlay`, `logo_container_bg`, `updated_by`)
VALUES
('global_config', 'Al-Quran Disabilitas', '/logo-quran.svg', '/favicon.svg',
 '#005a71', '#005a71', '#ab3425', '#d97706',
 'Peserta', 'Kementerian Agama Republik Indonesia', 'large',
 'dark', 'white', 'Super Administrator')
ON DUPLICATE KEY UPDATE
  `application_name` = VALUES(`application_name`),
  `updated_by` = VALUES(`updated_by`);

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- VERIFIKASI
-- ==========================================================
SELECT 'users' AS tabel, COUNT(*) AS jumlah FROM `users`
UNION ALL
SELECT 'disabilities', COUNT(*) FROM `disabilities`
UNION ALL
SELECT 'quran_communities', COUNT(*) FROM `quran_communities`
UNION ALL
SELECT 'training_proposals', COUNT(*) FROM `training_proposals`
UNION ALL
SELECT 'participants', COUNT(*) FROM `participants`
UNION ALL
SELECT 'application_settings', COUNT(*) FROM `application_settings`
UNION ALL
SELECT 'system_logs', COUNT(*) FROM `system_logs`;
