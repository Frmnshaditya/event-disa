import React from 'react';
import { User, ApplicationSettings } from '../types.ts';
import { QuranEmblemLogo } from './QuranEmblemLogo.tsx';

interface SidebarProps {
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
  onNavigate: (view: any) => void;
  onOpenLogs?: () => void;
  onOpenChangePassword?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  currentUser,
  appSettings,
  onNavigate,
  onOpenLogs,
  onOpenChangePassword,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const roleName = currentUser?.role === 'superadmin' ? 'Super Admin' : currentUser ? 'Mitra' : 'Peserta';

  const handleItemClick = (action: () => void) => {
    action();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isItemActive = (viewKey: string) => {
    if (viewKey === 'dashboard') {
      return activeView === 'superadmin' || activeView === 'mitra';
    }
    return activeView === viewKey;
  };

  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left cursor-pointer ${
      isActive
        ? 'bg-[#e0f2fe] text-[#0369a1] font-bold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full bg-white select-none">
      {/* Top Brand & Profiles */}
      <div className="overflow-y-auto pr-1">
        {/* Brand Header matching the image */}
        <div className="flex items-center justify-between gap-2.5 px-2 py-4 mb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            {appSettings?.logo ? (
              <img
                src={appSettings.logo}
                alt={appSettings.applicationName || 'Logo'}
                className="w-8 h-8 object-contain rounded-lg shrink-0"
              />
            ) : (
              <QuranEmblemLogo size="sm" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[13.5px] font-bold text-slate-900 tracking-tight leading-tight truncate">
                {appSettings?.applicationName || "Event For Disability to Qur'an"}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                <span>{roleName}</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
              aria-label="Tutup Menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="space-y-1 px-1">
          {/* Dashboard Utama */}
          {currentUser && (
            <button
              onClick={() => handleItemClick(() => onNavigate(currentUser.role === 'superadmin' ? 'superadmin' : 'mitra'))}
              className={navItemClass(isItemActive('dashboard'))}
            >
              <span className={`material-symbols-outlined text-[19px] ${isItemActive('dashboard') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
                dashboard
              </span>
              <span>Dashboard Utama</span>
            </button>
          )}

          {/* Application Setting (Super Admin) */}
          {currentUser?.role === 'superadmin' && (
            <button
              onClick={() => handleItemClick(() => onNavigate('settings'))}
              className={navItemClass(isItemActive('settings'))}
            >
              <span className={`material-symbols-outlined text-[19px] ${isItemActive('settings') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
                tune
              </span>
              <span>Application Setting</span>
            </button>
          )}

          {/* KATALOG & PETA Group */}
          <div className="pt-3 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
              Katalog & Peta
            </span>
          </div>

          {/* Event Pelatihan */}
          <button
            onClick={() => handleItemClick(() => onNavigate('events'))}
            className={navItemClass(isItemActive('events'))}
          >
            <span className={`material-symbols-outlined text-[19px] ${isItemActive('events') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
              event
            </span>
            <span>Event Pelatihan</span>
          </button>

          {/* Peta Mitra & Yayasan */}
          <button
            onClick={() => handleItemClick(() => {
              if (activeView === 'events') {
                document.getElementById('peta-lokasi')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                onNavigate('events');
                setTimeout(() => {
                  document.getElementById('peta-lokasi')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            })}
            className={navItemClass(isItemActive('map'))}
          >
            <span className={`material-symbols-outlined text-[19px] ${isItemActive('map') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
              public
            </span>
            <span>Peta Mitra & Yayasan</span>
          </button>

          {/* KELOLA & MASTER Group */}
          <div className="pt-3 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
              Kelola & Master
            </span>
          </div>

          {/* Kelola Event */}
          {currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'mitra') && (
            <button
              onClick={() => handleItemClick(() => onNavigate('manage_events'))}
              className={navItemClass(isItemActive('manage_events'))}
            >
              <span className={`material-symbols-outlined text-[19px] ${isItemActive('manage_events') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
                edit_calendar
              </span>
              <span>Kelola Event</span>
            </button>
          )}

          {/* Data Peserta */}
          {currentUser && (
            <button
              onClick={() => handleItemClick(() => onNavigate('participants'))}
              className={navItemClass(isItemActive('participants'))}
            >
              <span className={`material-symbols-outlined text-[19px] ${isItemActive('participants') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
                badge
              </span>
              <span>Data Peserta</span>
            </button>
          )}

          {/* Kelola Disabilitas (Superadmin only) */}
          {currentUser?.role === 'superadmin' && (
            <button
              onClick={() => handleItemClick(() => onNavigate('disabilities'))}
              className={navItemClass(isItemActive('disabilities'))}
            >
              <span className={`material-symbols-outlined text-[19px] ${isItemActive('disabilities') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
                diversity_1
              </span>
              <span>Kelola Disabilitas</span>
            </button>
          )}

          {/* Manajemen Pengguna (Superadmin only) */}
          {currentUser?.role === 'superadmin' && (
            <button
              onClick={() => handleItemClick(() => onNavigate('users'))}
              className={navItemClass(isItemActive('users'))}
            >
              <span className={`material-symbols-outlined text-[19px] ${isItemActive('users') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
                group
              </span>
              <span>Manajemen Pengguna</span>
            </button>
          )}

          {/* Laporan & Statistik (Superadmin only) */}
          {currentUser?.role === 'superadmin' && (
            <button
              onClick={() => handleItemClick(() => onNavigate('reports'))}
              className={navItemClass(isItemActive('reports'))}
            >
              <span className={`material-symbols-outlined text-[19px] ${isItemActive('reports') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
                assessment
              </span>
              <span>Laporan & Statistik</span>
            </button>
          )}

          {/* Ganti Password */}
          {currentUser && onOpenChangePassword && (
            <button
              onClick={() => handleItemClick(onOpenChangePassword)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px] text-slate-500">
                lock_reset
              </span>
              <span>Ganti Password</span>
            </button>
          )}

          {/* Logs Sistem */}
          {currentUser && onOpenLogs && (
            <button
              onClick={() => handleItemClick(onOpenLogs)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px] text-slate-500">
                receipt_long
              </span>
              <span>Logs Sistem</span>
            </button>
          )}

          {/* Dokumentasi API */}
          {currentUser?.role === 'superadmin' && (
            <button
              onClick={() => handleItemClick(() => onNavigate('laravel_docs'))}
              className={navItemClass(isItemActive('laravel_docs'))}
            >
              <span className={`material-symbols-outlined text-[19px] ${isItemActive('laravel_docs') ? 'text-[#0284c7]' : 'text-slate-500'}`}>
                api
              </span>
              <span>Dokumentasi API</span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer Side Nav matching the image with "Logo Sistem" */}
      <div className="border-t border-slate-200 p-3 shrink-0">
        <div className="px-3 py-2.5 flex items-center justify-between text-slate-600 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700 text-base">verified</span>
            <span className="text-[12px] font-semibold text-slate-700">Logo Sistem</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 font-bold text-emerald-800">
            Aktif
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 z-40 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shadow-xs">
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
            aria-label="Tutup Overlay"
          />
          {/* Drawer Box */}
          <aside className="relative z-10 h-screen w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
