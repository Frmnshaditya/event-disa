import React, { useState } from 'react';

export const LaravelMysqlDocs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'migration' | 'models' | 'controllers' | 'routes'>('sql');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sqlSchema = `-- ==========================================================
-- SKEMA DATABASE MYSQL: quran_disabilitas_db
-- Sistem Pelatihan & Peta Persebaran Al-Quran Disabilitas
-- ==========================================================

CREATE DATABASE IF NOT EXISTS quran_disabilitas_db
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE quran_disabilitas_db;

-- 1. Tabel Pengguna (Super Admin & Mitra)
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'mitra') NOT NULL DEFAULT 'mitra',
    phone VARCHAR(30) NULL,
    organization_name VARCHAR(255) NULL,
    province VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabel Komunitas / Lembaga Quran Disabilitas Indonesia
CREATE TABLE quran_communities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    nama_lembaga VARCHAR(255) NOT NULL,
    kategori_disabilitas JSON NOT NULL COMMENT 'Array: ["tunanetra", "tunarungu", "tunadaksa", "intelektual_autisme"]',
    provinsi VARCHAR(100) NOT NULL,
    kota VARCHAR(100) NOT NULL,
    alamat_lengkap TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    kontak_wa VARCHAR(30) NOT NULL,
    kontak_email VARCHAR(255) NULL,
    jumlah_santri INT UNSIGNED NOT NULL DEFAULT 0,
    fasilitas_tersedia JSON NOT NULL COMMENT 'Array fasilitas ramah disabilitas',
    program_unggulan VARCHAR(255) NOT NULL,
    deskripsi TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_community_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Tabel Permintaan Pelatihan / Event
CREATE TABLE training_proposals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mitra_id BIGINT UNSIGNED NOT NULL,
    nama_kegiatan VARCHAR(255) NOT NULL,
    jenis_event VARCHAR(150) NOT NULL,
    deskripsi_pelatihan TEXT NOT NULL,
    lokasi_dan_alamat TEXT NOT NULL,
    provinsi VARCHAR(100) NOT NULL,
    kota VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    tanggal_kegiatan VARCHAR(100) NOT NULL,
    target_dan_kuota_peserta INT UNSIGNED NOT NULL,
    kuota_disetujui INT UNSIGNED NULL,
    kebutuhan_peserta JSON NOT NULL COMMENT 'Array kebutuhan alat/fasilitas disabilitas',
    status ENUM('menunggu_persetujuan', 'disetujui', 'ditolak') NOT NULL DEFAULT 'menunggu_persetujuan',
    alasan_penolakan TEXT NULL,
    tanggal_persetujuan TIMESTAMP NULL,
    link_pendaftaran VARCHAR(255) NULL,
    is_aktif BOOLEAN NOT NULL DEFAULT FALSE,
    jumlah_pendaftar INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_proposal_mitra FOREIGN KEY (mitra_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Tabel Peserta Pelatihan
CREATE TABLE participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    training_proposal_id BIGINT UNSIGNED NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    no_wa VARCHAR(30) NOT NULL,
    email VARCHAR(255) NULL,
    usia INT UNSIGNED NOT NULL,
    kategori_disabilitas ENUM('tunanetra', 'tunarungu', 'tunadaksa', 'intelektual_autisme', 'pendamping_umum') NOT NULL,
    kebutuhan_fasilitas JSON NOT NULL,
    catatan_khusus TEXT NULL,
    status_kehadiran ENUM('terdaftar', 'hadir', 'batal') NOT NULL DEFAULT 'terdaftar',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_participant_event FOREIGN KEY (training_proposal_id) REFERENCES training_proposals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes for optimal performance
CREATE INDEX idx_proposals_status ON training_proposals(status);
CREATE INDEX idx_communities_provinsi ON quran_communities(provinsi);
CREATE INDEX idx_participants_disabilitas ON participants(kategori_disabilitas);
`;

  const laravelMigration = `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Modifikasi tabel users
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['superadmin', 'mitra'])->default('mitra')->after('password');
            $table->string('phone', 30)->nullable()->after('role');
            $table->string('organization_name')->nullable()->after('phone');
            $table->string('province', 100)->nullable()->after('organization_name');
            $table->string('city', 100)->nullable()->after('province');
        });

        // 2. Tabel Komunitas Quran Disabilitas
        Schema::create('quran_communities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nama_lembaga');
            $table->json('kategori_disabilitas');
            $table->string('provinsi', 100);
            $table->string('kota', 100);
            $table->text('alamat_lengkap');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('kontak_wa', 30);
            $table->string('kontak_email')->nullable();
            $table->unsignedInteger('jumlah_santri')->default(0);
            $table->json('fasilitas_tersedia');
            $table->string('program_unggulan');
            $table->text('deskripsi');
            $table->boolean('is_verified')->default(true);
            $table->timestamps();
        });

        // 3. Tabel Permintaan Pelatihan
        Schema::create('training_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_id')->constrained('users')->cascadeOnDelete();
            $table->string('nama_kegiatan');
            $table->string('jenis_event', 150);
            $table->text('deskripsi_pelatihan');
            $table->text('lokasi_dan_alamat');
            $table->string('provinsi', 100);
            $table->string('kota', 100);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('tanggal_kegiatan', 100);
            $table->unsignedInteger('target_dan_kuota_peserta');
            $table->unsignedInteger('kuota_disetujui')->nullable();
            $table->json('kebutuhan_peserta');
            $table->enum('status', ['menunggu_persetujuan', 'disetujui', 'ditolak'])->default('menunggu_persetujuan');
            $table->text('alasan_penolakan')->nullable();
            $table->timestamp('tanggal_persetujuan')->nullable();
            $table->string('link_pendaftaran')->nullable();
            $table->boolean('is_aktif')->default(false);
            $table->unsignedInteger('jumlah_pendaftar')->default(0);
            $table->timestamps();
        });

        // 4. Tabel Peserta
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_proposal_id')->constrained()->cascadeOnDelete();
            $table->string('nama_lengkap');
            $table->string('no_wa', 30);
            $table->string('email')->nullable();
            $table->unsignedInteger('usia');
            $table->enum('kategori_disabilitas', ['tunanetra', 'tunarungu', 'tunadaksa', 'intelektual_autisme', 'pendamping_umum']);
            $table->json('kebutuhan_fasilitas');
            $table->text('catatan_khusus')->nullable();
            $table->enum('status_kehadiran', ['terdaftar', 'hadir', 'batal'])->default('terdaftar');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
        Schema::dropIfExists('training_proposals');
        Schema::dropIfExists('quran_communities');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'phone', 'organization_name', 'province', 'city']);
        });
    }
};`;

  const laravelModels = `// ==========================================
// app/Models/User.php
// ==========================================
namespace App\\Models;

use Illuminate\\Foundation\\Auth\\User as Authenticatable;
use Laravel\\Sanctum\\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name', 'email', 'password', 'role', 
        'phone', 'organization_name', 'province', 'city'
    ];

    protected $hidden = ['password', 'remember_token'];

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isMitra(): bool
    {
        return $this->role === 'mitra';
    }

    public function proposals()
    {
        return $this->hasMany(TrainingProposal::class, 'mitra_id');
    }
}

// ==========================================
// app/Models/TrainingProposal.php
// ==========================================
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class TrainingProposal extends Model
{
    protected $fillable = [
        'mitra_id', 'nama_kegiatan', 'jenis_event', 'deskripsi_pelatihan',
        'lokasi_dan_alamat', 'provinsi', 'kota', 'latitude', 'longitude',
        'tanggal_kegiatan', 'target_dan_kuota_peserta', 'kuota_disetujui',
        'kebutuhan_peserta', 'status', 'alasan_penolakan',
        'tanggal_persetujuan', 'link_pendaftaran', 'is_aktif', 'jumlah_pendaftar'
    ];

    protected $casts = [
        'kebutuhan_peserta' => 'array',
        'is_aktif' => 'boolean',
        'tanggal_persetujuan' => 'datetime',
    ];

    public function mitra()
    {
        return $this->belongsTo(User::class, 'mitra_id');
    }

    public function participants()
    {
        return $this->hasMany(Participant::class);
    }
}

// ==========================================
// app/Models/Participant.php
// ==========================================
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class Participant extends Model
{
    protected $fillable = [
        'training_proposal_id', 'nama_lengkap', 'no_wa', 'email',
        'usia', 'kategori_disabilitas', 'kebutuhan_fasilitas',
        'catatan_khusus', 'status_kehadiran'
    ];

    protected $casts = [
        'kebutuhan_fasilitas' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(TrainingProposal::class, 'training_proposal_id');
    }
}`;

  const laravelControllers = `// ==========================================================
// app/Http/Controllers/Api/SuperAdminController.php
// ==========================================================
namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\User;
use App\\Models\\TrainingProposal;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Hash;

class SuperAdminController extends Controller
{
    // Superadmin membuat akun Superadmin lain
    public function createSuperadmin(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'phone' => 'nullable|string',
            'organization_name' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'superadmin',
            'phone' => $validated['phone'] ?? null,
            'organization_name' => $validated['organization_name'] ?? 'Pusat Quran Disabilitas',
        ]);

        return response()->json(['message' => 'Superadmin berhasil dibuat', 'user' => $user], 201);
    }

    // Superadmin membuat akun Mitra
    public function createMitra(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'organization_name' => 'required|string',
            'phone' => 'nullable|string',
            'province' => 'required|string',
            'city' => 'required|string',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'mitra',
            'organization_name' => $validated['organization_name'],
            'phone' => $validated['phone'] ?? null,
            'province' => $validated['province'],
            'city' => $validated['city'],
        ]);

        return response()->json(['message' => 'Akun Mitra berhasil dibuat', 'user' => $user], 201);
    }

    // Keputusan: Setujui Permintaan Pelatihan
    public function approveProposal(Request $request, $id)
    {
        $proposal = TrainingProposal::findOrFail($id);
        $targetKuota = $request->input('target_kuota', $proposal->target_dan_kuota_peserta);

        $proposal->update([
            'status' => 'disetujui',
            'kuota_disetujui' => $targetKuota,
            'tanggal_persetujuan' => now(),
            'link_pendaftaran' => url('/daftar-event/' . $proposal->id),
            'is_aktif' => true,
            'alasan_penolakan' => null,
        ]);

        return response()->json(['message' => 'Permintaan disetujui & link dibuat', 'proposal' => $proposal]);
    }

    // Keputusan: Tolak Permintaan Pelatihan
    public function rejectProposal(Request $request, $id)
    {
        $request->validate(['alasan_penolakan' => 'required|string']);
        $proposal = TrainingProposal::findOrFail($id);

        $proposal->update([
            'status' => 'ditolak',
            'alasan_penolakan' => $request->alasan_penolakan,
            'is_aktif' => false,
        ]);

        return response()->json(['message' => 'Permintaan ditolak & alasan dikirim ke mitra', 'proposal' => $proposal]);
    }
}`;

  const laravelRoutes = `// ==========================================
// routes/api.php
// ==========================================
use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\Api\\AuthController;
use App\\Http\\Controllers\\Api\\SuperAdminController;
use App\\Http\\Controllers\\Api\\MitraController;
use App\\Http\\Controllers\\Api\\EventPublicController;
use App\\Http\\Controllers\\Api\\CommunityMapController;

// Rute Publik (Peserta & Peta Komunitas)
Route::get('/communities-map', [CommunityMapController::class, 'index']);
Route::get('/events-open', [EventPublicController::class, 'listOpenEvents']);
Route::get('/events/{id}', [EventPublicController::class, 'detailEvent']);
Route::post('/events/{id}/register', [EventPublicController::class, 'registerParticipant']);

// Autentikasi
Route::post('/login', [AuthController::class, 'login']);

// Rute Terproteksi
Route::middleware('auth:sanctum')->group(function () {
    // Superadmin Only
    Route::middleware('role:superadmin')->group(function () {
        Route::post('/superadmin/create-superadmin', [SuperAdminController::class, 'createSuperadmin']);
        Route::post('/superadmin/create-mitra', [SuperAdminController::class, 'createMitra']);
        Route::get('/superadmin/proposals', [SuperAdminController::class, 'listProposals']);
        Route::post('/superadmin/proposals/{id}/approve', [SuperAdminController::class, 'approveProposal']);
        Route::post('/superadmin/proposals/{id}/reject', [SuperAdminController::class, 'rejectProposal']);
        Route::get('/superadmin/participants', [SuperAdminController::class, 'allParticipants']);
        Route::get('/superadmin/reports/export', [SuperAdminController::class, 'exportReport']);
    });

    // Mitra Only
    Route::middleware('role:mitra')->group(function () {
        Route::get('/mitra/my-proposals', [MitraController::class, 'index']);
        Route::post('/mitra/proposals', [MitraController::class, 'store']);
        Route::put('/mitra/proposals/{id}/revise', [MitraController::class, 'update']);
        Route::get('/mitra/proposals/{id}/participants', [MitraController::class, 'listParticipants']);
    });
});`;

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-container text-on-primary-container text-[11px] font-bold rounded-md mb-3 tracking-wide uppercase">
              <span className="material-symbols-outlined text-[14px]">dns</span>
              Arsitektur Sistem Terintegrasi
            </div>
            <h1 className="text-[24px] md:text-[28px] font-semibold text-on-surface tracking-tight leading-tight">
              Spesifikasi Laravel PHP & MySQL
            </h1>
            <p className="text-on-surface-variant text-[14px] mt-2 max-w-3xl font-medium">
              Aplikasi ini menjalankan sistem interaktif langsung berbasis React & Node.js Express full-stack. Seluruh skema tabel MySQL, migrasi Laravel, model Eloquent, controller, dan rute API telah dirancang presisi sesuai alur <strong className="text-on-surface">Superadmin, Mitra, dan Peserta</strong>.
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(sqlSchema, 'all_sql')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[13px] font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copiedKey === 'all_sql' ? 'check' : 'content_copy'}
            </span>
            {copiedKey === 'all_sql' ? 'Tersalin!' : 'Salin SQL MySQL'}
          </button>
        </div>

        {/* Stack comparison badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-outline-variant/30">
          <div className="flex items-center gap-3.5 p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-[#E0F7FA] text-[#00838F] flex items-center justify-center font-bold text-[13px]">
              React
            </div>
            <div>
              <p className="text-[12px] text-outline font-semibold uppercase tracking-wider mb-0.5">Front-End UI</p>
              <p className="text-[13px] font-bold text-on-surface">React 19 + Tailwind</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-primary flex items-center justify-center font-bold text-[13px]">
              Node
            </div>
            <div>
              <p className="text-[12px] text-outline font-semibold uppercase tracking-wider mb-0.5">Runtime Dev & API</p>
              <p className="text-[13px] font-bold text-on-surface">Node.js + TSX</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-error-container text-error flex items-center justify-center font-bold text-[13px]">
              PHP
            </div>
            <div>
              <p className="text-[12px] text-outline font-semibold uppercase tracking-wider mb-0.5">Produksi / Ekspor</p>
              <p className="text-[13px] font-bold text-on-surface">Laravel 11 & MySQL 8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-outline-variant/30 pb-3 mb-6 hide-scrollbar">
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'sql' 
              ? 'bg-on-surface text-surface' 
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">database</span>
          Schema MySQL
        </button>
        <button
          onClick={() => setActiveTab('migration')}
          className={`px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'migration' 
              ? 'bg-on-surface text-surface' 
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">layers</span>
          Migrations
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'models' 
              ? 'bg-on-surface text-surface' 
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">data_object</span>
          Models
        </button>
        <button
          onClick={() => setActiveTab('controllers')}
          className={`px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'controllers' 
              ? 'bg-on-surface text-surface' 
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">code</span>
          Controllers
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'routes' 
              ? 'bg-on-surface text-surface' 
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">route</span>
          Routes
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-[#0f1115] rounded-2xl border border-[#1e2329] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 bg-[#14171c] border-b border-[#1e2329]">
          <div className="flex items-center gap-2.5 text-[12px] font-mono font-medium text-outline">
            <div className="flex gap-1.5 mr-3">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[#8b949e]">
              {activeTab === 'sql' && 'database/schema.sql'}
              {activeTab === 'migration' && 'database/migrations/...php'}
              {activeTab === 'models' && 'app/Models/*.php'}
              {activeTab === 'controllers' && 'app/Http/Controllers/Api/*.php'}
              {activeTab === 'routes' && 'routes/api.php'}
            </span>
          </div>

          <button
            onClick={() => {
              const textMap = {
                sql: sqlSchema,
                migration: laravelMigration,
                models: laravelModels,
                controllers: laravelControllers,
                routes: laravelRoutes,
              };
              copyToClipboard(textMap[activeTab], activeTab);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copiedKey === activeTab ? 'check' : 'content_copy'}
            </span>
            {copiedKey === activeTab ? 'Tersalin!' : 'Salin Kode'}
          </button>
        </div>

        <div className="p-6 overflow-x-auto text-[13px] font-mono text-[#c9d1d9] leading-relaxed max-h-[600px] overflow-y-auto custom-scrollbar">
          <pre className="tab-size-4">
            {activeTab === 'sql' && sqlSchema}
            {activeTab === 'migration' && laravelMigration}
            {activeTab === 'models' && laravelModels}
            {activeTab === 'controllers' && laravelControllers}
            {activeTab === 'routes' && laravelRoutes}
          </pre>
        </div>
      </div>
    </div>
  );
};
