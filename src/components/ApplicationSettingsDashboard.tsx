import React, { useState, useEffect } from 'react';
import { ApplicationSettings, User } from '../types.ts';
import {
  DEFAULT_THEME_COLORS,
  THEME_COLOR_PRESETS,
  ThemePreset,
  isValidHex,
  getContrastTextColor,
  applyThemeColors,
} from '../utils/themeColors.ts';

interface ApplicationSettingsDashboardProps {
  currentUser: User | null;
  settings: ApplicationSettings;
  onSaveSettings: (newSettings: ApplicationSettings) => void;
  onCancel?: () => void;
  onLogAction?: (action: string, module: 'settings', details: string, status: 'info' | 'success' | 'warning') => void;
}

const PRIMARY_COLOR_CHIPS = [
  { name: 'Teal Deep (Default)', hex: '#005a71' },
  { name: 'Emerald Kemenag', hex: '#047857' },
  { name: 'Royal Blue', hex: '#1d4ed8' },
  { name: 'Forest Green', hex: '#15803d' },
  { name: 'Indigo Modern', hex: '#4338ca' },
  { name: 'Dark Slate', hex: '#334155' },
];

const SECONDARY_COLOR_CHIPS = [
  { name: 'Terracotta (Default)', hex: '#ab3425' },
  { name: 'Teal Dark', hex: '#0f766e' },
  { name: 'Crimson Rose', hex: '#be123c' },
  { name: 'Coral Orange', hex: '#c2410c' },
  { name: 'Violet Purple', hex: '#7c3aed' },
  { name: 'Amber Bronze', hex: '#b45309' },
];

const ACCENT_COLOR_CHIPS = [
  { name: 'Amber Gold (Default)', hex: '#d97706' },
  { name: 'Emas Kemenag', hex: '#ca8a04' },
  { name: 'Sun Amber', hex: '#f59e0b' },
  { name: 'Bright Gold', hex: '#eab308' },
  { name: 'Cyan Ocean', hex: '#0891b2' },
  { name: 'Mint Emerald', hex: '#10b981' },
];

const TOPBAR_COLOR_CHIPS = [
  { name: 'Teal Deep (Default)', hex: '#005a71' },
  { name: 'Emerald Kemenag', hex: '#065f46' },
  { name: 'Royal Navy', hex: '#1e3a8a' },
  { name: 'Forest Deep', hex: '#14532d' },
  { name: 'Dark Slate', hex: '#1e293b' },
  { name: 'Charcoal Night', hex: '#18181b' },
];

export const ApplicationSettingsDashboard: React.FC<ApplicationSettingsDashboardProps> = ({
  currentUser,
  settings,
  onSaveSettings,
  onCancel,
  onLogAction,
}) => {
  const [formData, setFormData] = useState<ApplicationSettings>({
    applicationName: settings.applicationName || 'Alquran Disabilitas',
    logo: settings.logo || '',
    favicon: settings.favicon || '',
    topbarColor: settings.topbarColor || DEFAULT_THEME_COLORS.topbar,
    primaryColor: settings.primaryColor || DEFAULT_THEME_COLORS.primary,
    secondaryColor: settings.secondaryColor || DEFAULT_THEME_COLORS.secondary,
    accentColor: settings.accentColor || DEFAULT_THEME_COLORS.accent,
    publicRoleLabel: settings.publicRoleLabel || 'Peserta',
    institutionSubtitle: settings.institutionSubtitle || 'Kementerian Agama Republik Indonesia',
    logoSize: settings.logoSize || 'large',
    headerBgImage: settings.headerBgImage || '',
    headerBgOverlay: settings.headerBgOverlay || 'dark',
    logoContainerBg: settings.logoContainerBg || 'white',
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy,
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      applicationName: settings.applicationName || 'Alquran Disabilitas',
      logo: settings.logo || '',
      favicon: settings.favicon || '',
      topbarColor: settings.topbarColor || DEFAULT_THEME_COLORS.topbar,
      primaryColor: settings.primaryColor || DEFAULT_THEME_COLORS.primary,
      secondaryColor: settings.secondaryColor || DEFAULT_THEME_COLORS.secondary,
      accentColor: settings.accentColor || DEFAULT_THEME_COLORS.accent,
      publicRoleLabel: settings.publicRoleLabel || 'Peserta',
      institutionSubtitle: settings.institutionSubtitle || 'Kementerian Agama Republik Indonesia',
      logoSize: settings.logoSize || 'large',
      headerBgImage: settings.headerBgImage || '',
      headerBgOverlay: settings.headerBgOverlay || 'dark',
      logoContainerBg: settings.logoContainerBg || 'white',
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    });
  }, [settings]);

  const handleColorChange = (
    field: 'primaryColor' | 'secondaryColor' | 'accentColor' | 'topbarColor',
    hexValue: string
  ) => {
    const updated = {
      ...formData,
      [field]: hexValue,
    };
    setFormData(updated);
    // Realtime live preview on web
    applyThemeColors(updated);
  };

  const handleApplyPreset = (preset: ThemePreset) => {
    const updated = {
      ...formData,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
      topbarColor: preset.topbar,
    };
    setFormData(updated);
    applyThemeColors(updated);
    showToast('info', `Palet tema "${preset.name}" diterapkan!`);
  };

  const handleSyncTopbarWithPrimary = () => {
    const targetPrimary = formData.primaryColor || DEFAULT_THEME_COLORS.primary;
    const updated = {
      ...formData,
      topbarColor: targetPrimary,
    };
    setFormData(updated);
    applyThemeColors(updated);
    showToast('info', 'Warna Topbar diselaraskan dengan Primary Color.');
  };

  const handleResetToDefaultColors = () => {
    const updated = {
      ...formData,
      primaryColor: DEFAULT_THEME_COLORS.primary,
      secondaryColor: DEFAULT_THEME_COLORS.secondary,
      accentColor: DEFAULT_THEME_COLORS.accent,
      topbarColor: DEFAULT_THEME_COLORS.topbar,
    };
    setFormData(updated);
    applyThemeColors(updated);
    showToast('info', 'Semua warna tema dikembalikan ke pengaturan standar platform.');
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const compressImage = (file: File, maxWidth: number, callback: (result: string) => void) => {
    const reader = new FileReader();
    reader.onerror = () => {
      showToast('error', 'Gagal membaca berkas gambar.');
    };
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => {
        showToast('error', 'Format gambar tidak didukung atau berkas rusak.');
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type.includes('png') ? 'image/png' : 'image/jpeg', 0.85);
          callback(dataUrl);
        } else {
          callback(readerEvent.target?.result as string);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      const maxDim = target === 'favicon' ? 128 : 600;
      compressImage(file, maxDim, (compressedDataUrl) => {
        setFormData(prev => ({ ...prev, [target]: compressedDataUrl }));
        showToast('info', `Gambar ${target} berhasil dipilih dan dioptimalkan`);
      });
      e.target.value = '';
    }
  };

  const handleHeaderBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, 1600, (compressedDataUrl) => {
        setFormData(prev => ({ ...prev, headerBgImage: compressedDataUrl }));
        showToast('info', 'Foto background header berhasil diunggah dan dioptimalkan');
      });
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedPayload: ApplicationSettings = {
        applicationName: formData.applicationName.trim() || 'Alquran Disabilitas',
        logo: formData.logo,
        favicon: formData.favicon,
        topbarColor: formData.topbarColor || DEFAULT_THEME_COLORS.topbar,
        primaryColor: formData.primaryColor || DEFAULT_THEME_COLORS.primary,
        secondaryColor: formData.secondaryColor || DEFAULT_THEME_COLORS.secondary,
        accentColor: formData.accentColor || DEFAULT_THEME_COLORS.accent,
        publicRoleLabel: formData.publicRoleLabel?.trim() || 'Peserta',
        institutionSubtitle: formData.institutionSubtitle?.trim() || 'Kementerian Agama Republik Indonesia',
        logoSize: formData.logoSize || 'large',
        headerBgImage: formData.headerBgImage || '',
        headerBgOverlay: formData.headerBgOverlay || 'dark',
        logoContainerBg: formData.logoContainerBg || 'white',
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.name || 'Super Administrator',
      };

      const res = await fetch('/api/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(text || 'Respon server tidak valid');
      }

      if (res.ok && data.settings) {
        onSaveSettings(data.settings);
        setFormData(data.settings);
        applyThemeColors(data.settings);
        showToast('success', 'Application Setting berhasil disimpan!');
        if (onLogAction) {
          onLogAction(
            'Simpan Application Settings',
            'settings',
            `Pengaturan diubah: Nama="${data.settings.applicationName}", Primary="${data.settings.primaryColor}", Sekunder="${data.settings.secondaryColor}", Aksen="${data.settings.accentColor}", Topbar="${data.settings.topbarColor}".`,
            'success'
          );
        }
      } else {
        showToast('error', data.error || 'Gagal menyimpan pengaturan aplikasi');
      }
    } catch (err: any) {
      console.error('Save settings error:', err);
      showToast('error', err?.message || 'Terjadi kesalahan sistem saat menghubungi server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      applicationName: settings.applicationName || 'Alquran Disabilitas',
      logo: settings.logo || '',
      favicon: settings.favicon || '',
      topbarColor: settings.topbarColor || DEFAULT_THEME_COLORS.topbar,
      primaryColor: settings.primaryColor || DEFAULT_THEME_COLORS.primary,
      secondaryColor: settings.secondaryColor || DEFAULT_THEME_COLORS.secondary,
      accentColor: settings.accentColor || DEFAULT_THEME_COLORS.accent,
      publicRoleLabel: settings.publicRoleLabel || 'Peserta',
      institutionSubtitle: settings.institutionSubtitle || 'Kementerian Agama Republik Indonesia',
      logoSize: settings.logoSize || 'large',
      headerBgImage: settings.headerBgImage || '',
      headerBgOverlay: settings.headerBgOverlay || 'dark',
      logoContainerBg: settings.logoContainerBg || 'white',
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    });
    applyThemeColors(settings);
    showToast('info', 'Perubahan dibatalkan.');
    if (onCancel) onCancel();
  };

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-md text-white flex items-center gap-2 text-[13px] font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-600'
              : notification.type === 'error'
              ? 'bg-red-600'
              : 'bg-blue-600'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[26px]">tune</span>
            <span>Application Setting</span>
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Konfigurasi identitas sistem, nama aplikasi, logo lembaga, favicon tab browser, dan tema warna Topbar.
          </p>
        </div>

        {formData.updatedAt && (
          <div className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            Terakhir diubah: {new Date(formData.updatedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {/* Quick Navigation Tabs for Settings (Sticky Sub-Navbar) */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-xs py-2 border-b border-gray-200 flex items-center justify-between gap-2 overflow-x-auto shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold shrink-0">
          <a
            href="#section-identity"
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-primary hover:border-primary transition-all whitespace-nowrap"
          >
            1. Identitas
          </a>
          <a
            href="#section-logo"
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-primary hover:border-primary transition-all whitespace-nowrap"
          >
            2. Logo & Background
          </a>
          <a
            href="#section-preview"
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-primary hover:border-primary transition-all whitespace-nowrap"
          >
            Live Preview
          </a>
          <a
            href="#section-favicon"
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-primary hover:border-primary transition-all whitespace-nowrap"
          >
            3. Favicon
          </a>
          <a
            href="#section-colors"
            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-primary hover:border-primary transition-all whitespace-nowrap"
          >
            4. Tema Warna
          </a>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-1.5 bg-primary text-white text-[12px] font-bold rounded-lg shadow-xs hover:bg-primary/90 flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
          {/* 1. Application Name */}
          <div id="section-identity">
            <label className="block text-[13px] font-bold text-gray-800 mb-1">
              Application Name
            </label>
            <p className="text-[12px] text-gray-500 mb-2">
              Nama aplikasi yang tampil pada judul halaman, branding sidebar, dan meta tag browser.
            </p>
            <div className="relative max-w-md">
              <input
                type="text"
                required
                value={formData.applicationName}
                onChange={e => setFormData({ ...formData, applicationName: e.target.value })}
                placeholder="Alquran Disabilitas"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 font-semibold text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="absolute right-3 top-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                Default: Alquran Disabilitas
              </span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 2. Logo */}
          <div id="section-logo">
            <label className="block text-[13px] font-bold text-gray-800 mb-1">
              Logo
            </label>
            <p className="text-[12px] text-gray-500 mb-2">
              Logo utama aplikasi yang digunakan pada sidebar, header, dan laporan.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-3 flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Logo Preview"
                    className="h-16 max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                    <span className="material-symbols-outlined text-[28px]">image</span>
                  </div>
                )}
                <span className="text-[10px] text-gray-400 mt-1 font-medium">Preview Logo</span>
              </div>

              <div className="sm:col-span-9 space-y-2">
                <input
                  type="text"
                  value={formData.logo}
                  onChange={e => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://domain.com/logo.png atau URL gambar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] text-gray-800 focus:outline-none focus:border-primary"
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-[12px] font-medium text-gray-700 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Unggah File Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleLogoFile(e, 'logo')}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logo: '/logo-quran.svg' }))}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Gunakan Logo Default
                  </button>
                </div>
              </div>
            </div>

            {/* Logo Size Options */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                Ukuran Logo di Halaman Web Utama
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'normal', label: 'Normal (80px)', desc: 'Ukuran standar' },
                  { id: 'large', label: 'Besar (112px) - Default', desc: 'Ukuran proporsional direkomendasikan' },
                  { id: 'xlarge', label: 'Ekstra Besar (144px)', desc: 'Tampilan logo maksimal' },
                ].map((sizeOpt) => (
                  <button
                    type="button"
                    key={sizeOpt.id}
                    onClick={() => setFormData(prev => ({ ...prev, logoSize: sizeOpt.id as any }))}
                    className={`px-3.5 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                      formData.logoSize === sizeOpt.id
                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'
                    }`}
                  >
                    <div className="text-[13px]">{sizeOpt.label}</div>
                    <div className="text-[11px] text-gray-500 font-normal">{sizeOpt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Foto Background Header Logo Tengah */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-[13px] font-bold text-gray-800">
                  Foto Background Header Logo Tengah (Halaman Web Utama)
                </label>
                <p className="text-[12px] text-gray-500">
                  Ganti background putih default dari logo & header di tengah web utama dengan foto kustom yang diunggah.
                </p>
              </div>
              {formData.headerBgImage && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, headerBgImage: '' }))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 bg-rose-50 hover:bg-rose-100 text-[12px] font-semibold cursor-pointer transition-all self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Hapus Foto Background
                </button>
              )}
            </div>

            {/* Upload & Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                {formData.headerBgImage ? (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                    <img
                      src={formData.headerBgImage}
                      alt="Thumbnail Background"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                        Foto Aktif
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                    <span className="material-symbols-outlined text-[28px] text-gray-400">wallpaper</span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1">Default Polos (Tanpa Foto)</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-8 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-[12px] font-semibold hover:bg-primary/90 cursor-pointer shadow-2xs transition-all">
                    <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                    <span>Unggah Foto Background (JPG/PNG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleHeaderBgFile}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Atau Masukkan URL Gambar:
                  </label>
                  <input
                    type="text"
                    value={formData.headerBgImage || ''}
                    onChange={e => setFormData({ ...formData, headerBgImage: e.target.value })}
                    placeholder="https://contoh.com/foto-masjid-background.jpg"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-800 text-[12px] focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Quick Presets */}
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-gray-600 block mb-1">
                    Pilihan Preset Background Nuansa Islami:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, headerBgImage: '/header-bg-islamic.svg', headerBgOverlay: 'dark' }))}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-400/60 bg-amber-50 text-amber-900 text-[11px] font-semibold hover:bg-amber-100 cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px] text-amber-600">mosque</span>
                      <span>Preset 1: Kubah Emas & Malam Bintang</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, headerBgImage: '/header-bg-kemenag.svg', headerBgOverlay: 'dark' }))}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/60 bg-emerald-50 text-emerald-900 text-[11px] font-semibold hover:bg-emerald-100 cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px] text-emerald-700">stars</span>
                      <span>Preset 2: Hijau Kemenag & Arabesque</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Customization Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
              {/* Option 1: Overlay Text */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">
                  Lapisan Filter / Overlay Teks
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'dark', label: 'Gelap (Kontras)' },
                    { id: 'light', label: 'Terang' },
                    { id: 'none', label: 'Tanpa Filter' },
                  ].map((overlayOpt) => (
                    <button
                      type="button"
                      key={overlayOpt.id}
                      onClick={() => setFormData(prev => ({ ...prev, headerBgOverlay: overlayOpt.id as any }))}
                      className={`px-2 py-1.5 rounded-lg border text-center text-[11px] cursor-pointer transition-all ${
                        formData.headerBgOverlay === overlayOpt.id
                          ? 'border-primary bg-primary text-white font-bold'
                          : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-medium'
                      }`}
                    >
                      {overlayOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Logo Box Background */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">
                  Wadah Logo di Atas Background
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'transparent', label: 'Transparan' },
                    { id: 'white', label: 'Putih Bersih' },
                    { id: 'glass', label: 'Efek Kaca' },
                  ].map((logoBgOpt) => (
                    <button
                      type="button"
                      key={logoBgOpt.id}
                      onClick={() => setFormData(prev => ({ ...prev, logoContainerBg: logoBgOpt.id as any }))}
                      className={`px-2 py-1.5 rounded-lg border text-center text-[11px] cursor-pointer transition-all ${
                        formData.logoContainerBg === logoBgOpt.id
                          ? 'border-primary bg-primary text-white font-bold'
                          : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-medium'
                      }`}
                    >
                      {logoBgOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 4. Label Peserta & Lembaga (Kemenag RI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1">
                Label Peserta (Pengguna Publik)
              </label>
              <p className="text-[12px] text-gray-500 mb-2">
                Menggantikan teks &quot;Pengunjung&quot; menjadi &quot;Peserta&quot; pada halaman web utama dan sidebar.
              </p>
              <input
                type="text"
                required
                value={formData.publicRoleLabel || ''}
                onChange={e => setFormData({ ...formData, publicRoleLabel: e.target.value })}
                placeholder="Peserta"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium text-[13px] focus:outline-none focus:border-primary"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Default: Peserta</span>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-gray-800 mb-1">
                Teks Lembaga / Instansi (Bawah Peserta)
              </label>
              <p className="text-[12px] text-gray-500 mb-2">
                Teks kementerian atau instansi resmi yang muncul tepat di bawah status Peserta.
              </p>
              <input
                type="text"
                required
                value={formData.institutionSubtitle || ''}
                onChange={e => setFormData({ ...formData, institutionSubtitle: e.target.value })}
                placeholder="Kementerian Agama Republik Indonesia"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium text-[13px] focus:outline-none focus:border-primary"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Default: Kementerian Agama Republik Indonesia</span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Live Preview Halaman Web Utama */}
          <div id="section-preview" className="p-4 rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">preview</span>
                <span className="text-[13px] font-bold text-gray-900">
                  Live Preview Halaman Web Utama (Navbar & Header Tengah):
                </span>
              </div>
              <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">
                Navbar selalu tampil di atas header background
              </span>
            </div>

            {/* Mockup Browser Window */}
            <div className="rounded-2xl border border-gray-300 shadow-md overflow-hidden bg-white">
              {/* Browser Address Bar Simulation */}
              <div className="bg-slate-100 px-3.5 py-2 border-b border-gray-200 flex items-center gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 max-w-sm mx-auto bg-white rounded-md px-2.5 py-0.5 text-[10px] text-slate-500 text-center font-mono border border-slate-200 truncate">
                  https://alquran-disabilitas.kemenag.go.id
                </div>
              </div>

              {/* 1. TOP NAVBAR SIMULATION - Always visible when photo is uploaded */}
              <nav
                className="w-full border-b px-4 py-2.5 sm:px-6 flex items-center justify-between transition-colors shadow-2xs"
                style={{
                  backgroundColor: formData.topbarColor || '#ffffff',
                  borderColor: formData.topbarColor && formData.topbarColor !== '#ffffff' ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
                  color: formData.topbarColor && formData.topbarColor !== '#ffffff' ? '#ffffff' : '#0f172a',
                }}
              >
                {/* Logo & Brand Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {formData.logo ? (
                    <img
                      src={formData.logo}
                      alt={formData.applicationName || 'Logo'}
                      className="w-8 h-8 object-contain rounded-lg shrink-0 bg-white/20 p-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] sm:text-[14px] font-bold tracking-tight leading-tight truncate">
                      {formData.applicationName || "Event For Disability to Qur'an"}
                    </span>
                    <span className="text-[10px] sm:text-[11px] opacity-75 font-medium truncate">
                      {formData.institutionSubtitle || "Platform Pelatihan & Pemberdayaan Sahabat Disabilitas"}
                    </span>
                  </div>
                </div>

                {/* Navbar Links & Login */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium opacity-85">
                    <span>Cari Event</span>
                    <span>Peta Lokasi</span>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-[#1e293b] text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs">
                    <span className="material-symbols-outlined text-[13px]">login</span>
                    <span>Masuk</span>
                  </div>
                </div>
              </nav>

              {/* 2. HERO / HEADER LOGO TENGAH SECTION */}
              <div
                className={`flex flex-col items-center justify-center text-center p-6 sm:p-10 relative overflow-hidden transition-all ${
                  formData.headerBgImage
                    ? 'text-white'
                    : 'bg-white text-gray-900'
                }`}
                style={
                  formData.headerBgImage
                    ? {
                        backgroundImage: `url(${formData.headerBgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                {/* Overlay Layer when Background Photo is active in preview */}
                {formData.headerBgImage && (
                  <div
                    className={`absolute inset-0 pointer-events-none transition-all ${
                      formData.headerBgOverlay === 'none'
                        ? 'bg-black/25'
                        : formData.headerBgOverlay === 'light'
                        ? 'bg-white/75 backdrop-blur-[2px]'
                        : 'bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-slate-900/60 backdrop-blur-[1px]'
                    }`}
                  ></div>
                )}

                <div className="relative z-10 mb-3.5 flex items-center justify-center">
                  {formData.logo ? (
                    <div
                      className={`transition-all ${
                        formData.logoContainerBg === 'transparent'
                          ? 'p-1 bg-transparent'
                          : formData.logoContainerBg === 'glass'
                          ? 'p-2 rounded-2xl bg-white/25 backdrop-blur-md border border-white/40 shadow-lg'
                          : 'p-2 rounded-2xl bg-white shadow-md border border-gray-200'
                      }`}
                    >
                      <img
                        src={formData.logo}
                        alt="Preview Web Utama"
                        className={`${
                          formData.logoSize === 'xlarge'
                            ? 'w-32 h-32 sm:w-36 sm:h-36'
                            : formData.logoSize === 'normal'
                            ? 'w-16 h-16 sm:w-20 sm:h-20'
                            : 'w-24 h-24 sm:w-28 sm:h-28'
                        } object-contain transition-all`}
                      />
                    </div>
                  ) : (
                    <div
                      className={`${
                        formData.logoSize === 'xlarge'
                          ? 'w-32 h-32 text-[44px]'
                          : formData.logoSize === 'normal'
                          ? 'w-16 h-16 text-[24px]'
                          : 'w-24 h-24 text-[36px]'
                      } rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-md`}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        menu_book
                      </span>
                    </div>
                  )}
                </div>

                <h2
                  className={`relative z-10 text-[18px] sm:text-[24px] font-extrabold tracking-tight mb-1.5 ${
                    formData.headerBgImage && formData.headerBgOverlay !== 'light'
                      ? 'text-white drop-shadow-md'
                      : 'text-gray-900'
                  }`}
                >
                  {formData.applicationName || 'Alquran Disabilitas'}
                </h2>

                <div
                  className={`relative z-10 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold mb-1.5 shadow-2xs ${
                    formData.headerBgImage && formData.headerBgOverlay !== 'light'
                      ? 'bg-white/20 text-white border border-white/30 backdrop-blur-md'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{formData.publicRoleLabel || 'Peserta'}</span>
                </div>

                <p
                  className={`relative z-10 text-[11px] sm:text-[12px] font-semibold tracking-wider uppercase ${
                    formData.headerBgImage && formData.headerBgOverlay !== 'light'
                      ? 'text-amber-300 drop-shadow-xs font-bold'
                      : 'text-gray-600'
                  }`}
                >
                  {formData.institutionSubtitle || 'Kementerian Agama Republik Indonesia'}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 3. Favicon */}
          <div id="section-favicon">
            <label className="block text-[13px] font-bold text-gray-800 mb-1">
              Favicon
            </label>
            <p className="text-[12px] text-gray-500 mb-2">
              Ikon kecil (16x16 atau 32x32) yang muncul pada tab browser pengguna.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-3 flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                {formData.favicon ? (
                  <img
                    src={formData.favicon}
                    alt="Favicon Preview"
                    className="w-10 h-10 object-contain rounded border border-gray-200 bg-white p-1"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">star</span>
                  </div>
                )}
                <span className="text-[10px] text-gray-400 mt-1 font-medium">Preview Favicon</span>
              </div>

              <div className="sm:col-span-9 space-y-2">
                <input
                  type="text"
                  value={formData.favicon}
                  onChange={e => setFormData({ ...formData, favicon: e.target.value })}
                  placeholder="https://domain.com/favicon.ico atau URL ikon"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] text-gray-800 focus:outline-none focus:border-primary"
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-[12px] font-medium text-gray-700 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Unggah Favicon</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleLogoFile(e, 'favicon')}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, favicon: '/favicon.svg' }))}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Gunakan Favicon Default
                  </button>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 4. Sistem Warna Tema Aplikasi (Primary, Sekunder, Aksen, Topbar) */}
          <div id="section-colors" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">palette</span>
                  <h2 className="text-[15px] font-bold text-gray-900">
                    Manajemen Warna Tema Aplikasi (Color System)
                  </h2>
                </div>
                <p className="text-[12px] text-gray-500 mt-1">
                  Kelola warna utama (Primary), sekunder (Secondary), aksen (Accent), dan Topbar. Semua tombol, badge, navigasi, dan elemen web akan otomatis mengikuti warna yang Anda tentukan.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSyncTopbarWithPrimary}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-[12px] font-semibold hover:bg-primary/10 transition-colors cursor-pointer"
                  title="Samakan warna Topbar dengan warna Primary"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  <span>Sinkronkan Topbar</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToDefaultColors}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-[12px] font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Kembalikan semua warna ke standar default platform"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* 4.A Palet Tema Rekomendasi 1-Klik */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[12px] font-bold text-gray-700">
                  Pilihan Palet Tema Rekomendasi (1-Klik Terapkan):
                </label>
                <span className="text-[11px] text-gray-400">Pilih palet teruji atau tentukan warna sendiri</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {THEME_COLOR_PRESETS.map((preset) => {
                  const isCurrent =
                    formData.primaryColor?.toLowerCase() === preset.primary.toLowerCase() &&
                    formData.secondaryColor?.toLowerCase() === preset.secondary.toLowerCase() &&
                    formData.accentColor?.toLowerCase() === preset.accent.toLowerCase();

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/80 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-bold text-gray-900 line-clamp-1">{preset.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{preset.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100/80">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: preset.primary }}
                            title={`Primary: ${preset.primary}`}
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: preset.secondary }}
                            title={`Secondary: ${preset.secondary}`}
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: preset.accent }}
                            title={`Accent: ${preset.accent}`}
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: preset.topbar }}
                            title={`Topbar: ${preset.topbar}`}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">Terapkan →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4.B Konfigurasi Warna Masing-Masing (Primary, Secondary, Accent, Topbar) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Card 1: Primary Color */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: formData.primaryColor || DEFAULT_THEME_COLORS.primary }}
                      />
                      <h3 className="text-[13px] font-bold text-gray-900">
                        Warna Utama (Primary Color)
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Warna identitas utama: tombol submit/tindakan, tab navigasi aktif, ikon utama, dan highlight fokus.
                    </p>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold uppercase">
                    {formData.primaryColor || DEFAULT_THEME_COLORS.primary}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={isValidHex(formData.primaryColor) ? formData.primaryColor : DEFAULT_THEME_COLORS.primary}
                    onChange={e => handleColorChange('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 shadow-2xs shrink-0"
                    title="Buka Color Picker"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || ''}
                    onChange={e => handleColorChange('primaryColor', e.target.value)}
                    placeholder="#005a71"
                    maxLength={7}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px] font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1.5">Pilihan Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRIMARY_COLOR_CHIPS.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleColorChange('primaryColor', chip.hex)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-all cursor-pointer ${
                          formData.primaryColor?.toLowerCase() === chip.hex.toLowerCase()
                            ? 'border-gray-800 bg-gray-100 font-bold'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: chip.hex }} />
                        <span>{chip.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Secondary Color */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: formData.secondaryColor || DEFAULT_THEME_COLORS.secondary }}
                      />
                      <h3 className="text-[13px] font-bold text-gray-900">
                        Warna Sekunder (Secondary Color)
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Warna pendukung: tombol sekunder/batal, kartu komunitas, pin peta persebaran, dan badge penunjang.
                    </p>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold uppercase">
                    {formData.secondaryColor || DEFAULT_THEME_COLORS.secondary}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={isValidHex(formData.secondaryColor) ? formData.secondaryColor : DEFAULT_THEME_COLORS.secondary}
                    onChange={e => handleColorChange('secondaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 shadow-2xs shrink-0"
                    title="Buka Color Picker"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor || ''}
                    onChange={e => handleColorChange('secondaryColor', e.target.value)}
                    placeholder="#ab3425"
                    maxLength={7}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px] font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1.5">Pilihan Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SECONDARY_COLOR_CHIPS.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleColorChange('secondaryColor', chip.hex)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-all cursor-pointer ${
                          formData.secondaryColor?.toLowerCase() === chip.hex.toLowerCase()
                            ? 'border-gray-800 bg-gray-100 font-bold'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: chip.hex }} />
                        <span>{chip.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3: Accent Color */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: formData.accentColor || DEFAULT_THEME_COLORS.accent }}
                      />
                      <h3 className="text-[13px] font-bold text-gray-900">
                        Warna Aksen (Accent Color)
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Warna penarik perhatian: lencana sorotan khusus, bintang rekomendasi, peringatan visual, dan border aksen.
                    </p>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold uppercase">
                    {formData.accentColor || DEFAULT_THEME_COLORS.accent}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={isValidHex(formData.accentColor) ? formData.accentColor : DEFAULT_THEME_COLORS.accent}
                    onChange={e => handleColorChange('accentColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 shadow-2xs shrink-0"
                    title="Buka Color Picker"
                  />
                  <input
                    type="text"
                    value={formData.accentColor || ''}
                    onChange={e => handleColorChange('accentColor', e.target.value)}
                    placeholder="#d97706"
                    maxLength={7}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px] font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1.5">Pilihan Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCENT_COLOR_CHIPS.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleColorChange('accentColor', chip.hex)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-all cursor-pointer ${
                          formData.accentColor?.toLowerCase() === chip.hex.toLowerCase()
                            ? 'border-gray-800 bg-gray-100 font-bold'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: chip.hex }} />
                        <span>{chip.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 4: Topbar Color */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: formData.topbarColor || DEFAULT_THEME_COLORS.topbar }}
                      />
                      <h3 className="text-[13px] font-bold text-gray-900">
                        Warna Topbar / Header
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Latar belakang bilah navigasi atas (Header). Dapat disamakan dengan Primary Color atau disesuaikan mandiri.
                    </p>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold uppercase">
                    {formData.topbarColor || DEFAULT_THEME_COLORS.topbar}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={isValidHex(formData.topbarColor) ? formData.topbarColor : DEFAULT_THEME_COLORS.topbar}
                    onChange={e => handleColorChange('topbarColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 p-0.5 shadow-2xs shrink-0"
                    title="Buka Color Picker"
                  />
                  <input
                    type="text"
                    value={formData.topbarColor || ''}
                    onChange={e => handleColorChange('topbarColor', e.target.value)}
                    placeholder="#005a71"
                    maxLength={7}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px] font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 font-medium block mb-1.5">Pilihan Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPBAR_COLOR_CHIPS.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleColorChange('topbarColor', chip.hex)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] transition-all cursor-pointer ${
                          formData.topbarColor?.toLowerCase() === chip.hex.toLowerCase()
                            ? 'border-gray-800 bg-gray-100 font-bold'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: chip.hex }} />
                        <span>{chip.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4.C Pratinjau Interaktif Terintegrasi */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-700 text-[18px]">visibility</span>
                  <span className="text-[12px] font-bold text-gray-900">
                    Pratinjau Harmonisasi Komponen Warna (Live Interactive Preview)
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-time Preview Aktif
                </span>
              </div>

              {/* Mock Browser Frame */}
              <div className="rounded-lg border border-gray-300 bg-white overflow-hidden shadow-xs">
                {/* Simulated Header */}
                <div
                  className="px-4 py-3 flex items-center justify-between text-white transition-colors"
                  style={{
                    backgroundColor: formData.topbarColor || DEFAULT_THEME_COLORS.topbar,
                    color: getContrastTextColor(formData.topbarColor || DEFAULT_THEME_COLORS.topbar),
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {formData.logo ? (
                      <img src={formData.logo} alt="Logo" className="w-6 h-6 object-contain" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center font-bold text-[11px]">
                        AD
                      </div>
                    )}
                    <span className="font-bold text-[13px] tracking-tight">
                      {formData.applicationName || 'Alquran Disabilitas'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-white/20 bg-white/10"
                    >
                      {formData.publicRoleLabel || 'Peserta'}
                    </span>
                  </div>
                </div>

                {/* Simulated Content Area */}
                <div className="p-4 bg-gray-50/50 space-y-3.5">
                  {/* Active tab bar simulation */}
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <div
                      className="px-3 py-1 rounded-md text-[11px] font-bold shadow-2xs"
                      style={{
                        backgroundColor: formData.primaryColor || DEFAULT_THEME_COLORS.primary,
                        color: getContrastTextColor(formData.primaryColor || DEFAULT_THEME_COLORS.primary),
                      }}
                    >
                      Katalog Pelatihan (Aktif)
                    </div>
                    <div className="px-3 py-1 text-[11px] font-medium text-gray-500">
                      Peta Komunitas
                    </div>
                    <div className="px-3 py-1 text-[11px] font-medium text-gray-500">
                      Panduan Sistem
                    </div>
                  </div>

                  {/* Buttons & Badges Demonstration */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Primary Button */}
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold shadow-2xs flex items-center gap-1.5 transition-transform"
                      style={{
                        backgroundColor: formData.primaryColor || DEFAULT_THEME_COLORS.primary,
                        color: getContrastTextColor(formData.primaryColor || DEFAULT_THEME_COLORS.primary),
                      }}
                    >
                      <span className="material-symbols-outlined text-[15px]">event</span>
                      <span>Daftar Pelatihan (Primary)</span>
                    </button>

                    {/* Secondary Button */}
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold shadow-2xs flex items-center gap-1.5 transition-transform"
                      style={{
                        backgroundColor: formData.secondaryColor || DEFAULT_THEME_COLORS.secondary,
                        color: getContrastTextColor(formData.secondaryColor || DEFAULT_THEME_COLORS.secondary),
                      }}
                    >
                      <span className="material-symbols-outlined text-[15px]">hub</span>
                      <span>Sentra Komunitas (Secondary)</span>
                    </button>

                    {/* Accent Badge */}
                    <span
                      className="px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-2xs flex items-center gap-1.5"
                      style={{
                        backgroundColor: formData.accentColor || DEFAULT_THEME_COLORS.accent,
                        color: getContrastTextColor(formData.accentColor || DEFAULT_THEME_COLORS.accent),
                      }}
                    >
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      <span>Terakreditasi Kemenag (Accent)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Actions: SAVE | CANCEL */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-5 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-[13px] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-lg font-bold text-[13px] shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[17px]">check</span>
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
