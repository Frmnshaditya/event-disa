import React, { useState, useRef, useEffect } from 'react';
import { User, ApplicationSettings } from '../types.ts';
import { QuranEmblemLogo } from './QuranEmblemLogo.tsx';

interface HeaderProps {
  activeView:
    | 'map'
    | 'events'
    | 'mitra'
    | 'superadmin'
    | 'laravel_docs'
    | 'users'
    | 'reports'
    | 'manage_events'
    | 'participants'
    | 'disabilities'
    | 'settings';
  currentUser: User | null;
  appSettings?: ApplicationSettings;
  selectedPeriod?: string;
  onChangePeriod?: (period: string) => void;
  onNavigate: (view: any) => void;
  onOpenLogin: (roleHint?: 'mitra' | 'superadmin') => void;
  onLogout: () => void;
  onOpenLogs: () => void;
  onOpenChangePassword?: () => void;
  unreadLogsCount?: number;
  onToggleMobileMenu?: () => void;
}

const PERIOD_OPTIONS = [
  '1 Bulan Terakhir',
  '3 Bulan Terakhir',
  '6 Bulan Terakhir',
  '1 Tahun Terakhir',
  'Semua Periode',
];

export const Header: React.FC<HeaderProps> = ({
  activeView,
  currentUser,
  appSettings,
  selectedPeriod = '6 Bulan Terakhir',
  onChangePeriod,
  onNavigate,
  onOpenLogin,
  onLogout,
  onOpenLogs,
  onOpenChangePassword,
  unreadLogsCount = 0,
  onToggleMobileMenu,
}) => {
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  // Close period dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'superadmin':
        return 'Beranda: Event For Disability to Qur\'an';
      case 'mitra':
        return 'Beranda: Event For Disability to Qur\'an';
      case 'map':
        return 'Dashboard Peta Mitra & Yayasan';
      case 'events':
        return 'Beranda: Event Pelatihan & Peta Mitra & Yayasan';
      case 'manage_events':
        return 'Kelola Event';
      case 'participants':
        return 'Data & Manajemen Peserta';
      case 'disabilities':
        return 'Kelola Disabilitas';
      case 'users':
        return 'Manajemen User & Mitra';
      case 'reports':
        return 'Laporan & Statistik Sistem';
      case 'laravel_docs':
        return 'Dokumentasi API & Backend';
      case 'settings':
        return 'Application Setting';
      default:
        return 'Beranda: Event For Disability to Qur\'an';
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full shrink-0 bg-[#1e293b] text-white flex items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-700/60 shadow-md transition-colors"
      style={{
        backgroundColor: appSettings?.topbarColor || undefined,
      }}
    >
      {/* Title & Mobile Menu Hamburger & Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          aria-label="Buka Menu Navigasi"
          title="Buka Menu Navigasi"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Brand Logo in Navbar */}
        {appSettings?.logo ? (
          <img
            src={appSettings.logo}
            alt={appSettings.applicationName || 'Logo'}
            className="w-7 h-7 object-contain rounded-md shrink-0 bg-white/10 p-0.5"
          />
        ) : (
          <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0 text-sky-400">
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
          </div>
        )}

        <h1 className="text-[14px] sm:text-[17px] font-bold text-white tracking-tight truncate">
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Action Cluster on Right */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Period dropdown (for Super Admin dashboard) */}
        {activeView === 'superadmin' && (
          <div className="relative" ref={periodDropdownRef}>
            <button
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[12px] font-medium transition-colors cursor-pointer border border-slate-700"
              title="Pilih Rentang Waktu Data"
            >
              <span className="material-symbols-outlined text-[17px] text-sky-400">calendar_today</span>
              <span className="hidden sm:inline">{selectedPeriod}</span>
              <span className="material-symbols-outlined text-[15px]">
                {isPeriodDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isPeriodDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-[12px]">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Pilih Periode:
                </div>
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      if (onChangePeriod) onChangePeriod(opt);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer ${
                      selectedPeriod === opt ? 'font-bold text-[#0284c7] bg-sky-50' : 'text-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedPeriod === opt && (
                      <span className="material-symbols-outlined text-[15px] text-[#0284c7]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOGS BUTTON */}
        {currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'mitra') && (
          <button
            onClick={onOpenLogs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[12px] font-medium transition-colors cursor-pointer relative border border-slate-700"
            title="Buka Logs Aktivitas Sistem"
          >
            <span className="material-symbols-outlined text-[17px] text-amber-400">receipt_long</span>
            <span className="hidden sm:inline">Logs</span>
            {unreadLogsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
        )}

        {/* Quick Portal Switcher to Public Site */}
        <button
          onClick={() => onNavigate('events')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[12px] font-medium transition-colors cursor-pointer border border-slate-700"
          title="Buka Portal Publik & Landing Page"
        >
          <span className="material-symbols-outlined text-[17px] text-emerald-400">public</span>
          <span>Portal Publik</span>
        </button>

        {/* User Status / Login */}
        {!currentUser ? (
          <button
            onClick={() => onOpenLogin()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-bold bg-white text-slate-900 hover:bg-slate-100 transition-colors rounded-lg cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[17px]">login</span>
            <span>Masuk Akun</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 pl-2 sm:ml-1 sm:border-l border-slate-700">
            {/* User badge */}
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/90 text-left border border-slate-700"
              title={`Masuk sebagai ${currentUser.name} (${currentUser.role})`}
            >
              <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                {currentUser.role === 'superadmin' ? 'SA' : 'M'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[12px] font-semibold text-white leading-tight max-w-[120px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-300 leading-tight">
                  {currentUser.role === 'superadmin' ? 'Super Admin' : 'Mitra'}
                </span>
              </div>
            </div>

            {/* Change Password button */}
            {onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[12px] font-medium transition-colors cursor-pointer border border-slate-700"
                title="Ganti Kata Sandi Akun"
              >
                <span className="material-symbols-outlined text-[17px] text-sky-400">lock_reset</span>
                <span className="hidden sm:inline">Ganti Sandi</span>
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-rose-900/40 hover:text-rose-200 transition-colors cursor-pointer border border-transparent hover:border-rose-700"
              title="Keluar Akun"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
