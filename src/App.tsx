import React, { useState, useEffect } from 'react';
import { 
  User, 
  TrainingProposal, 
  Participant, 
  QuranCommunity, 
  DisabilityMaster,
  ApplicationSettings,
  SystemLog
} from './types.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { PublicLandingPage } from './components/PublicLandingPage.tsx';
import { EventCatalogPublic } from './components/EventCatalogPublic.tsx';
import { DashboardMitra } from './components/DashboardMitra.tsx';
import { DashboardSuperadmin } from './components/DashboardSuperadmin.tsx';
import { UserManagement } from './components/UserManagement.tsx';
import { Reports } from './components/Reports.tsx';
import { PetaPersebaran } from './components/PetaPersebaran.tsx';
import { LaravelMysqlDocs } from './components/LaravelMysqlDocs.tsx';
import { EventManagement } from './components/EventManagement.tsx';
import { ParticipantManagement } from './components/ParticipantManagement.tsx';
import { DisabilityManagement } from './components/DisabilityManagement.tsx';
import { ApplicationSettingsDashboard } from './components/ApplicationSettingsDashboard.tsx';
import { LogsModal } from './components/LogsModal.tsx';
import { LoginFormModal } from './components/LoginFormModal.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
import { LoginRequiredNotice } from './components/LoginRequiredNotice.tsx';
import { applyThemeColors } from './utils/themeColors.ts';

export default function App() {
  // Views: 'events' | 'mitra' | 'superadmin' | 'map' | 'laravel_docs' | 'users' | 'reports' | 'manage_events' | 'participants' | 'disabilities' | 'settings'
  const [activeView, setActiveView] = useState<
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
    | 'settings'
  >('events');
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [loginRoleHint, setLoginRoleHint] = useState<'mitra' | 'superadmin' | undefined>(undefined);

  const [users, setUsers] = useState<User[]>([]);
  const [proposals, setProposals] = useState<TrainingProposal[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [communities, setCommunities] = useState<QuranCommunity[]>([]);
  const [disabilities, setDisabilities] = useState<DisabilityMaster[]>(() => {
    try {
      const saved = localStorage.getItem('cached_disabilities');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('Semua');
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>('all');

  // Application Settings state (Default: Alquran Disabilitas)
  const [appSettings, setAppSettings] = useState<ApplicationSettings>({
    applicationName: 'Alquran Disabilitas',
    logo: '/logo-quran.svg',
    favicon: '/favicon.svg',
    topbarColor: '#005a71',
    publicRoleLabel: 'Peserta',
    institutionSubtitle: 'Kementerian Agama Republik Indonesia',
    logoSize: 'large',
    headerBgImage: '',
    headerBgOverlay: 'dark',
    logoContainerBg: 'white',
  });

  // System Logs & Logs Modal state
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Time Period Filter for Dashboard Analytics (Functionalized calendar_today 6 Bulan Terakhir)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6 Bulan Terakhir');

  const [selectedEventIdFromMap, setSelectedEventIdFromMap] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch data
  const loadData = async () => {
    try {
      const authRes = await fetch('/api/auth/current');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.user) setCurrentUser(authData.user);
      }

      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.users) setUsers(usersData.users);
      }

      const eventsRes = await fetch('/api/events');
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (eventsData.events) setProposals(eventsData.events);
      }

      const commRes = await fetch('/api/communities');
      if (commRes.ok) {
        const commData = await commRes.json();
        if (commData.communities) setCommunities(commData.communities);
      }

      const partRes = await fetch('/api/participants');
      if (partRes.ok) {
        const partData = await partRes.json();
        if (partData.participants) setParticipants(partData.participants);
      }

      const disRes = await fetch('/api/disabilities');
      if (disRes.ok) {
        const disData = await disRes.json();
        const items = disData.disabilities || disData.data || [];
        setDisabilities(items);
        try {
          localStorage.setItem('cached_disabilities', JSON.stringify(items));
        } catch (e) {}
      }

      // Load Application Settings
      const settingsRes = await fetch('/api/app-settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.settings) {
          setAppSettings(settingsData.settings);
          updateBrowserBranding(settingsData.settings);
          applyThemeColors(settingsData.settings);
        }
      }

      // Load System Logs
      const logsRes = await fetch('/api/logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.logs) setSystemLogs(logsData.logs);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const updateBrowserBranding = (settings: ApplicationSettings) => {
    if (settings.applicationName) {
      document.title = settings.applicationName;
    }
    if (settings.favicon) {
      const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
      if (existingIcons.length > 0) {
        existingIcons.forEach(icon => {
          icon.href = settings.favicon;
        });
      } else {
        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = settings.favicon;
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    }
  };

  useEffect(() => {
    loadData();

    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#daftar/')) {
        const eventId = hash.replace('#daftar/', '');
        setSelectedEventIdFromMap(eventId);
        setActiveView('events');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleOpenLogin = (roleHint?: 'mitra' | 'superadmin') => {
    setLoginRoleHint(roleHint);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Masuk sebagai ${user.name}`);
    handleLogAction('Login Pengguna', 'auth', `${user.name} (${user.role}) berhasil masuk ke sistem.`, 'success');
    if (user.role === 'superadmin') {
      setActiveView('superadmin');
    } else {
      setActiveView('mitra');
    }
  };

  const handleLogout = async () => {
    const prevUserName = currentUser?.name || 'Pengguna';
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    handleLogAction('Logout Pengguna', 'auth', `${prevUserName} keluar dari sesi akun.`, 'info');
    setCurrentUser(null);
    setActiveView('events');
    showToast('Berhasil keluar.');
  };

  // Proposal callbacks
  const handleProposalApproved = (approved: TrainingProposal) => {
    setProposals(prev => prev.map(p => p.id === approved.id ? approved : p));
    showToast(`Kegiatan "${approved.namaKegiatan}" disetujui.`);
    handleLogAction('Persetujuan Event', 'events', `Super Admin menyetujui usulan event "${approved.namaKegiatan}".`, 'success');
  };

  const handleProposalRejected = (rejected: TrainingProposal) => {
    setProposals(prev => prev.map(p => p.id === rejected.id ? rejected : p));
    showToast(`Kegiatan ditolak.`);
    handleLogAction('Penolakan Event', 'events', `Super Admin menolak usulan event "${rejected.namaKegiatan}".`, 'warning');
  };

  const handleProposalCreated = (newProp: TrainingProposal) => {
    setProposals(prev => [newProp, ...prev]);
    showToast('Usulan kegiatan baru berhasil diajukan.');
    handleLogAction('Pengajuan Event Baru', 'events', `Mitra mengajukan usulan pelatihan baru: "${newProp.namaKegiatan}".`, 'info');
  };

  const handleProposalUpdated = (updated: TrainingProposal) => {
    setProposals(prev => prev.map(p => p.id === updated.id ? updated : p));
    showToast('Perubahan kegiatan berhasil disimpan.');
    handleLogAction('Pembaruan Event', 'events', `Data event "${updated.namaKegiatan}" diperbarui.`, 'info');
  };

  const handleAddNewCommunity = async (commData: Partial<QuranCommunity>) => {
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commData),
      });
      const data = await res.json();
      if (res.ok && data.community) {
        setCommunities(prev => [data.community, ...prev]);
        showToast(`Lembaga "${data.community.namaLembaga}" ditambahkan.`);
        handleLogAction('Registrasi Lembaga Baru', 'system', `Menambahkan lembaga/komunitas: "${data.community.namaLembaga}".`, 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEventDeleted = (deletedId: string) => {
    setProposals(prev => prev.filter(p => p.id !== deletedId));
    setParticipants(prev => prev.filter(pt => pt.eventId !== deletedId));
    showToast('Kegiatan pelatihan berhasil dihapus.');
    handleLogAction('Penghapusan Event', 'events', `Event dengan ID ${deletedId} dihapus dari sistem.`, 'warning');
  };

  const handleRegisterSuccess = (rawParticipant: Participant | { participant: Participant }) => {
    const participant: Participant = (rawParticipant as any)?.participant || rawParticipant;
    if (!participant || !participant.eventId) return;

    setParticipants(prev => [participant, ...prev.filter(p => p.id !== participant.id)]);
    setProposals(prev => prev.map(p => {
      if (p.id === participant.eventId) {
        return { ...p, jumlahPendaftar: (Number(p.jumlahPendaftar) || 0) + 1 };
      }
      return p;
    }));
    handleLogAction('Pendaftaran Peserta', 'participants', `${participant.namaLengkap || 'Peserta'} mendaftar pada kegiatan pelatihan.`, 'success');
  };

  // Activity Log helper
  const handleLogAction = async (
    action: string,
    module: string,
    details: string,
    status: SystemLog['status'] = 'info'
  ) => {
    try {
      const payload = {
        user: currentUser?.name || 'Sistem',
        userRole: currentUser?.role || 'system',
        action,
        module,
        details,
        status,
      };
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.log) {
        setSystemLogs(prev => [data.log, ...prev]);
      }
    } catch (err) {
      console.error('Failed to log action:', err);
    }
  };

  const handleRefreshLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setSystemLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setSystemLogs([]);
        showToast('Semua logs aktivitas berhasil dihapus.');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus logs.');
    }
  };

  const handleDeleteLogItem = async (id: string) => {
    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSystemLogs(prev => prev.filter(l => l.id !== id));
        showToast('Catatan log berhasil dihapus.');
      } else {
        showToast('Gagal menghapus log.');
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat menghapus log.');
    }
  };

  // Profile update handler
  const handleUpdateCurrentUser = (updated: User) => {
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const handleUpdateAnyUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const handleDeleteUser = (deletedId: string) => {
    setUsers(prev => prev.filter(u => u.id !== deletedId));
    if (currentUser?.id === deletedId) {
      setCurrentUser(null);
    }
  };

  // Application Settings update handler
  const handleSaveAppSettings = (newSettings: ApplicationSettings) => {
    setAppSettings(newSettings);
    updateBrowserBranding(newSettings);
    applyThemeColors(newSettings);
    showToast('Pengaturan Aplikasi Disimpan!');
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    showToast(`Rentang analitik disesuaikan: ${period}`);
    handleLogAction('Filter Periode Data', 'system', `Super Admin mengubah filter waktu analitik menjadi: ${period}.`, 'info');
  };

  // Public view matching the user's design image
  if (activeView === 'events') {
    return (
      <div className="w-full min-h-screen bg-white">
        {/* Subtle Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-[13px] font-medium animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Admin Bar if logged in */}
        {currentUser && (
          <div className="sticky top-0 z-50 bg-[#1e293b] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-700 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-medium">Pratinjau Publik Portal Pelatihan & Peta Quran</span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-slate-300 hidden sm:inline">Masuk sebagai: {currentUser.name} ({currentUser.role === 'superadmin' ? 'Super Admin' : 'Mitra'})</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView(currentUser.role === 'superadmin' ? 'superadmin' : 'mitra')}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                <span>Kembali ke Dashboard</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2 py-1 text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        )}

        <PublicLandingPage
          events={proposals}
          communities={communities}
          disabilities={disabilities}
          currentUser={currentUser}
          appSettings={appSettings}
          onOpenLogin={handleOpenLogin}
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToDashboard={() => setActiveView(currentUser?.role === 'superadmin' ? 'superadmin' : 'mitra')}
          onLogAction={handleLogAction}
          selectedEventIdFromMap={selectedEventIdFromMap}
          onClearSelectedEventId={() => setSelectedEventIdFromMap(null)}
        />

        {/* Login Form Modal */}
        <LoginFormModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          defaultRoleHint={loginRoleHint}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen h-dvh flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Subtle Toast Notification */}
      {toastMessage && (
        <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-50 bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs sm:text-[13px] font-medium animate-in fade-in max-w-[90vw]">
          <span className="material-symbols-outlined text-[17px] sm:text-[18px] text-emerald-400 shrink-0">check_circle</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        activeView={activeView}
        currentUser={currentUser}
        appSettings={appSettings}
        onNavigate={setActiveView}
        onOpenLogs={() => setIsLogsModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="md:ml-64 flex-1 flex flex-col min-w-0 h-screen h-dvh w-full overflow-hidden">
        {/* Top Navigation Bar - Always visible and docked */}
        <Header
          activeView={activeView}
          currentUser={currentUser}
          appSettings={appSettings}
          selectedPeriod={selectedPeriod}
          onChangePeriod={handlePeriodChange}
          onNavigate={setActiveView}
          onOpenLogin={handleOpenLogin}
          onLogout={handleLogout}
          onOpenLogs={() => setIsLogsModalOpen(true)}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          unreadLogsCount={systemLogs.length}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        {/* Main View Area - Scrollable Container */}
        <div className="flex-1 w-full overflow-y-auto">
          <main className="w-full p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-6">
          {((activeView as string) === 'events' || (activeView as string) === 'map') && (
            <div className="space-y-5 sm:space-y-8">
              {/* Centered Main Brand Header (Logo Utama di Tengah Web & Background Foto Kustom) */}
              <div
                className={`flex flex-col items-center justify-center text-center py-5 sm:py-7 md:py-8 px-3 sm:px-4 rounded-2xl sm:rounded-3xl border shadow-xs relative overflow-hidden transition-all ${
                  appSettings.headerBgImage
                    ? 'border-white/20 shadow-md text-white'
                    : 'bg-surface-container-lowest/90 border-outline-variant/30 text-on-surface'
                }`}
                style={
                  appSettings.headerBgImage
                    ? {
                        backgroundImage: `url(${appSettings.headerBgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                {/* Overlay Layer when Background Photo is active */}
                {appSettings.headerBgImage && (
                  <div
                    className={`absolute inset-0 pointer-events-none transition-all ${
                      appSettings.headerBgOverlay === 'none'
                        ? 'bg-black/25'
                        : appSettings.headerBgOverlay === 'light'
                        ? 'bg-white/75 backdrop-blur-[2px]'
                        : 'bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-slate-900/60 backdrop-blur-[1px]'
                    }`}
                  ></div>
                )}

                {/* Subtle ambient light glow for default background */}
                {!appSettings.headerBgImage && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-44 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                )}

                {/* Main Logo Centered & Scaled Responsively */}
                <div className="relative z-10 mb-2 sm:mb-3.5 flex items-center justify-center">
                  {appSettings.logo ? (
                    <div
                      className={`transition-all ${
                        appSettings.logoContainerBg === 'transparent'
                          ? 'p-1 bg-transparent'
                          : appSettings.logoContainerBg === 'glass'
                          ? 'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/25 backdrop-blur-md border border-white/40 shadow-lg'
                          : 'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white shadow-md border border-outline-variant/30'
                      }`}
                    >
                      <img
                        src={appSettings.logo}
                        alt={appSettings.applicationName || 'Logo Aplikasi'}
                        className={`${
                          appSettings.logoSize === 'xlarge'
                            ? 'w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36'
                            : appSettings.logoSize === 'normal'
                            ? 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20'
                            : 'w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28'
                        } object-contain transition-all`}
                      />
                    </div>
                  ) : (
                    <div
                      className={`${
                        appSettings.logoSize === 'xlarge'
                          ? 'w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 text-[36px] sm:text-[48px]'
                          : appSettings.logoSize === 'normal'
                          ? 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-[22px] sm:text-[28px]'
                          : 'w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 text-[30px] sm:text-[40px]'
                      } rounded-2xl bg-primary-container text-on-primary flex items-center justify-center font-bold shadow-md`}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        menu_book
                      </span>
                    </div>
                  )}
                </div>

                {/* Application Name */}
                <h1
                  className={`relative z-10 text-xl sm:text-2xl md:text-[28px] font-extrabold tracking-tight mb-1.5 sm:mb-2 ${
                    appSettings.headerBgImage && appSettings.headerBgOverlay !== 'light'
                      ? 'text-white drop-shadow-md'
                      : 'text-on-surface'
                  }`}
                >
                  {appSettings.applicationName || 'Alquran Disabilitas'}
                </h1>

                {/* Peserta Status Badge (Pengganti Pengunjung) */}
                <div
                  className={`relative z-10 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-xs sm:text-[13px] font-bold mb-1.5 sm:mb-2 shadow-2xs ${
                    appSettings.headerBgImage && appSettings.headerBgOverlay !== 'light'
                      ? 'bg-white/20 text-white border border-white/30 backdrop-blur-md'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{appSettings.publicRoleLabel || 'Peserta'}</span>
                </div>

                {/* Subtitle: Kementerian Agama Republik Indonesia */}
                <p
                  className={`relative z-10 text-[11px] sm:text-[13px] font-semibold tracking-wider uppercase max-w-xl ${
                    appSettings.headerBgImage && appSettings.headerBgOverlay !== 'light'
                      ? 'text-amber-300 drop-shadow-xs font-bold'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {appSettings.institutionSubtitle || 'Kementerian Agama Republik Indonesia'}
                </p>
              </div>

              {/* Quick Jump Navigator for the 2 Dashboards */}
              <div className="bg-surface-container-low/90 backdrop-blur-md p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[11px] sm:text-[12px] font-bold text-on-surface-variant uppercase tracking-wider px-1">
                    Halaman Utama:
                  </span>
                  <button
                    onClick={() => {
                      document.getElementById('dashboard-event-pelatihan')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-surface-container-lowest text-primary border border-primary/30 font-semibold text-[11px] sm:text-[13px] shadow-xs hover:bg-primary-container/20 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]">event</span>
                    <span>1. Event Pelatihan</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] sm:text-[11px] font-bold">
                      {proposals.filter(e => e.isAktif && e.status === 'disetujui').length}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById('dashboard-peta-komunitas')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-surface-container-lowest text-secondary border border-secondary/30 font-semibold text-[11px] sm:text-[13px] shadow-xs hover:bg-secondary-container/20 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]">public</span>
                    <span>2. Peta Mitra & Yayasan</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-secondary/10 text-secondary text-[10px] sm:text-[11px] font-bold">
                      {communities.length}
                    </span>
                  </button>
                </div>

                <div className="text-[11px] sm:text-[12px] text-on-surface-variant font-medium flex items-center gap-1.5 px-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sentra & Pelatihan Terverifikasi</span>
                </div>
              </div>

              {/* 1. DASHBOARD EVENT PELATIHAN */}
              <section id="dashboard-event-pelatihan" className="scroll-mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container text-on-primary-container text-[11px] font-bold rounded-lg uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[15px]">event</span>
                    Dashboard 1: Event & Pelatihan Inklusif
                  </div>
                  <button
                    onClick={() => {
                      document.getElementById('dashboard-peta-komunitas')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[12px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lihat Peta Mitra & Yayasan</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  </button>
                </div>

                <EventCatalogPublic
                  events={proposals}
                  onRegisterSuccess={handleRegisterSuccess}
                  selectedEventIdFromMap={selectedEventIdFromMap}
                  onClearSelectedEventId={() => setSelectedEventIdFromMap(null)}
                  disabilities={disabilities}
                  selectedCategoryFilter={eventCategoryFilter}
                  onSelectCategoryFilter={(cat) => setEventCategoryFilter(cat)}
                />
              </section>

              {/* 2. DASHBOARD PETA MITRA & YAYASAN */}
              <section id="dashboard-peta-komunitas" className="scroll-mt-6 border-t-2 border-outline-variant/30 pt-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-lg uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[15px]">map</span>
                    Dashboard 2: Peta Mitra & Yayasan Quran Disabilitas
                  </div>
                  <button
                    onClick={() => {
                      document.getElementById('dashboard-event-pelatihan')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[12px] text-secondary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Kembali ke Atas (Event Pelatihan)</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  </button>
                </div>

                <PetaPersebaran
                  communities={communities}
                  events={proposals}
                  disabilities={disabilities}
                  initialCategory={mapCategoryFilter}
                  onSelectEventForRegister={(eventId) => {
                    setSelectedEventIdFromMap(eventId);
                    document.getElementById('dashboard-event-pelatihan')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onAddNewCommunity={handleAddNewCommunity}
                  isSuperAdmin={currentUser?.role === 'superadmin'}
                  isEmbedded={true}
                />
              </section>
            </div>
          )}

          {activeView === 'mitra' && (
            currentUser ? (
              <DashboardMitra
                currentUser={currentUser}
                proposals={proposals}
                participants={participants}
                onProposalCreated={handleProposalCreated}
                onProposalUpdated={handleProposalUpdated}
                onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
              />
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <LoginRequiredNotice
                  roleRequired="mitra"
                  onOpenLogin={() => handleOpenLogin('mitra')}
                />
              </div>
            )
          )}

          {activeView === 'superadmin' && (
             currentUser?.role === 'superadmin' ? (
              <DashboardSuperadmin
                currentUser={currentUser}
                users={users}
                proposals={proposals}
                participants={participants}
                communities={communities}
                onProposalApproved={handleProposalApproved}
                onProposalRejected={handleProposalRejected}
                onSuperadminCreated={(u) => setUsers(prev => [u, ...prev])}
                onMitraCreated={(m) => setUsers(prev => [m, ...prev])}
                onNavigateToMap={() => setActiveView('map')}
                onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
              />
            ) : currentUser ? (
              <div className="p-8 max-w-md mx-auto text-center mt-8">
                <div className="p-6 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface">
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant mx-auto mb-2">shield_locked</span>
                  <h3 className="font-semibold text-[14px] mb-1">Akses Terbatas</h3>
                  <p className="text-[12px] text-on-surface-variant mb-4">
                    Akun Anda tidak memiliki hak akses Super Admin.
                  </p>
                  <button
                    onClick={() => setActiveView('mitra')}
                    className="px-4 py-2 bg-primary text-on-primary text-[12px] font-semibold rounded-lg hover:bg-primary-container"
                  >
                    Buka Panel Mitra
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <LoginRequiredNotice
                  roleRequired="superadmin"
                  onOpenLogin={() => handleOpenLogin('superadmin')}
                />
              </div>
            )
          )}

          {/* APPLICATION SETTING DASHBOARD */}
          {activeView === 'settings' && (
            currentUser?.role === 'superadmin' ? (
              <ApplicationSettingsDashboard
                currentUser={currentUser}
                onSettingsUpdated={handleSaveAppSettings}
              />
            ) : (
              <div className="p-8 max-w-md mx-auto text-center mt-8">
                <div className="p-6 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface">
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant mx-auto mb-2">admin_panel_settings</span>
                  <h3 className="font-semibold text-[14px] mb-1">Akses Khusus Super Admin</h3>
                  <p className="text-[12px] text-on-surface-variant mb-4">
                    Hanya Super Administrator yang berwenang mengubah Application Setting sistem.
                  </p>
                  <button
                    onClick={() => handleOpenLogin('superadmin')}
                    className="px-4 py-2 bg-primary text-on-primary text-[12px] font-semibold rounded-lg hover:bg-primary-container"
                  >
                    Masuk Sebagai Super Admin
                  </button>
                </div>
              </div>
            )
          )}

          {activeView === 'users' && (
            currentUser ? (
              <UserManagement
                users={users}
                currentUser={currentUser}
                onUserUpdated={handleUpdateAnyUser}
                onUserDeleted={handleDeleteUser}
                onSuperadminCreated={(u) => setUsers(prev => [u, ...prev])}
                onMitraCreated={(m) => setUsers(prev => [m, ...prev])}
                showToast={showToast}
              />
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <LoginRequiredNotice
                  roleRequired="mitra"
                  customTitle="Manajemen Pengguna"
                  customDescription="Silakan masuk dengan akun Super Admin atau Mitra untuk mengakses manajemen pengguna."
                  onOpenLogin={() => handleOpenLogin()}
                />
              </div>
            )
          )}

          {activeView === 'reports' && (
            currentUser ? (
              <Reports onNavigateToParticipants={() => setActiveView('participants')} />
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <LoginRequiredNotice
                  roleRequired="mitra"
                  onOpenLogin={() => handleOpenLogin()}
                />
              </div>
            )
          )}

          {activeView === 'participants' && (
            currentUser ? (
              <ParticipantManagement
                currentUser={currentUser}
                events={proposals}
                disabilities={disabilities}
                onParticipantCreated={(newP) => {
                  setParticipants(prev => [newP, ...prev.filter(p => p.id !== newP.id)]);
                  setProposals(prev => prev.map(p => {
                    if (p.id === newP.eventId) {
                      return { ...p, jumlahPendaftar: (Number(p.jumlahPendaftar) || 0) + 1 };
                    }
                    return p;
                  }));
                }}
                onParticipantDeleted={(pId, eventId) => {
                  setParticipants(prev => prev.filter(p => p.id !== pId));
                  if (eventId) {
                    setProposals(prev => prev.map(p => {
                      if (p.id === eventId) {
                        return { ...p, jumlahPendaftar: Math.max(0, (Number(p.jumlahPendaftar) || 0) - 1) };
                      }
                      return p;
                    }));
                  }
                }}
              />
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <LoginRequiredNotice
                  roleRequired="mitra"
                  customTitle="Data Peserta Pelatihan"
                  customDescription="Hanya Mitra Penyelenggara dan Super Admin yang dapat mengakses basis data peserta."
                  onOpenLogin={() => handleOpenLogin('mitra')}
                />
              </div>
            )
          )}

          {activeView === 'disabilities' && (
            currentUser?.role === 'superadmin' ? (
              <DisabilityManagement
                currentUser={currentUser}
                events={proposals}
                communities={communities}
                participants={participants}
                disabilitiesList={disabilities}
                onDisabilitiesChange={(updated) => {
                  setDisabilities(updated);
                  try {
                    localStorage.setItem('cached_disabilities', JSON.stringify(updated));
                  } catch (e) {}
                }}
                onNavigateToDashboard={(target, categoryFilter) => {
                  setActiveView('events');
                  if (target === 'events') {
                    if (categoryFilter) setEventCategoryFilter(categoryFilter);
                    setTimeout(() => {
                      document.getElementById('dashboard-event-pelatihan')?.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                  } else if (target === 'map') {
                    if (categoryFilter) setMapCategoryFilter(categoryFilter);
                    setTimeout(() => {
                      document.getElementById('dashboard-peta-komunitas')?.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                  }
                }}
              />
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <LoginRequiredNotice
                  roleRequired="superadmin"
                  customTitle="Kelola Disabilitas"
                  customDescription="Hanya Super Admin yang dapat mengakses modul Kelola Disabilitas."
                  onOpenLogin={() => handleOpenLogin('superadmin')}
                />
              </div>
            )
          )}

          {activeView === 'map' && (
            <PetaPersebaran
              communities={communities}
              events={proposals}
              disabilities={disabilities}
              initialCategory={mapCategoryFilter}
              onSelectEventForRegister={(eventId) => {
                setSelectedEventIdFromMap(eventId);
                setActiveView('events');
                setTimeout(() => {
                  document.getElementById('dashboard-event-pelatihan')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              onAddNewCommunity={handleAddNewCommunity}
              isSuperAdmin={currentUser?.role === 'superadmin'}
            />
          )}

          {activeView === 'manage_events' && (
            currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'mitra') ? (
              <EventManagement
                currentUser={currentUser}
                events={proposals}
                onEventUpdated={handleProposalUpdated}
                onEventDeleted={handleEventDeleted}
                onOpenCreateModal={() => setActiveView('mitra')}
              />
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <LoginRequiredNotice
                  roleRequired="mitra"
                  customTitle="Kelola Event Pelatihan"
                  customDescription="Hanya Mitra Penyelenggara dan Super Admin yang dapat mengakses panel pengelolaan event."
                  onOpenLogin={() => handleOpenLogin('mitra')}
                />
              </div>
            )
          )}

          {activeView === 'laravel_docs' && (
            currentUser?.role === 'superadmin' ? (
              <LaravelMysqlDocs />
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <LoginRequiredNotice
                  roleRequired="superadmin"
                  customTitle="Dokumentasi API Khusus Super Admin"
                  customDescription="Dashboard dan dokumentasi teknis API arsitektur Laravel & MySQL hanya dapat diakses oleh Super Administrator."
                  onOpenLogin={() => handleOpenLogin('superadmin')}
                />
              </div>
            )
          )}
        </main>
        </div>
      </div>

      {/* Activity Logs System Modal (User request #3) */}
      <LogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={systemLogs}
        onRefreshLogs={handleRefreshLogs}
        onClearLogs={handleClearLogs}
        onDeleteLogItem={handleDeleteLogItem}
      />

      {/* Login Form Modal */}
      <LoginFormModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        defaultRoleHint={loginRoleHint}
      />

      {/* Change Password Modal (Super Admin & Mitra) */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        onSuccess={(msg) => {
          showToast(msg);
          handleRefreshLogs();
        }}
      />
    </div>
  );
}
