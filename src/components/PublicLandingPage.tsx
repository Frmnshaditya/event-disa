import React, { useState, useMemo } from 'react';
import { TrainingProposal, Participant, QuranCommunity, DisabilityMaster, User, ApplicationSettings } from '../types.ts';
import { QuranEmblemLogo } from './QuranEmblemLogo.tsx';
import { PetaPersebaran } from './PetaPersebaran.tsx';

interface PublicLandingPageProps {
  events: TrainingProposal[];
  communities: QuranCommunity[];
  disabilities?: DisabilityMaster[];
  currentUser: User | null;
  appSettings?: ApplicationSettings;
  onOpenLogin: (roleHint?: 'mitra' | 'superadmin') => void;
  onRegisterSuccess: (participant: Participant) => void;
  onNavigateToDashboard?: () => void;
  onLogAction?: (action: string, module: string, detail: string, status?: 'info' | 'success' | 'warning' | 'error') => void;
  selectedEventIdFromMap?: string | null;
  onClearSelectedEventId?: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  events,
  communities,
  disabilities = [],
  currentUser,
  appSettings,
  onOpenLogin,
  onRegisterSuccess,
  onNavigateToDashboard,
  onLogAction,
  selectedEventIdFromMap,
  onClearSelectedEventId,
}) => {
  const activeEvents = useMemo(() => events.filter(e => e.isAktif && e.status === 'disetujui'), [events]);

  // Search & Filter States
  const [heroSearch, setHeroSearch] = useState('');
  const [heroLocation, setHeroLocation] = useState('');
  
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterDisability, setFilterDisability] = useState('Semua');
  const [filterCity, setFilterCity] = useState('Semua');
  
  const [facilityJBI, setFacilityJBI] = useState(false);
  const [facilityWheelchair, setFacilityWheelchair] = useState(false);
  const [facilityBraille, setFacilityBraille] = useState(false);
  const [facilityOnline, setFacilityOnline] = useState(false);

  // Map Filter state
  const [mapSearch, setMapSearch] = useState('');
  const [mapCategory, setMapCategory] = useState<'all' | 'tunanetra' | 'tunarungu' | 'tunadaksa' | 'intelektual'>('all');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactTopic, setContactTopic] = useState('Informasi Pendaftaran Event');
  const [contactMessage, setContactMessage] = useState('');
  const [contactDisabilityFormat, setContactDisabilityFormat] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Articles Modal State
  const [isArticlesModalOpen, setIsArticlesModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<{ title: string; category: string; content: string; date: string } | null>(null);

  // Registration & Detail Modal State
  const [activeModalEvent, setActiveModalEvent] = useState<TrainingProposal | null>(null);
  const [modalStep, setModalStep] = useState<'detail' | 'form' | 'finished_status'>('detail');
  const [regName, setRegName] = useState('');
  const [regWa, setRegWa] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regDisability, setRegDisability] = useState<string>('tunanetra');
  const [regFacilities, setRegFacilities] = useState<string[]>([]);
  const [regNotes, setRegNotes] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [lastRegistered, setLastRegistered] = useState<Participant | null>(null);

  // Active disabilities list from master data
  const activeDisabilities = useMemo(() => {
    if (disabilities && disabilities.length > 0) {
      return disabilities.filter(d => d.isAktif !== false);
    }
    return [];
  }, [disabilities]);

  // Keep regDisability in sync with available active disabilities
  React.useEffect(() => {
    if (activeDisabilities.length > 0 && !activeDisabilities.some(d => d.kode === regDisability)) {
      setRegDisability(activeDisabilities[0].kode);
    }
  }, [activeDisabilities, regDisability]);

  // If event selected from outside
  React.useEffect(() => {
    if (selectedEventIdFromMap) {
      const target = activeEvents.find(e => e.id === selectedEventIdFromMap);
      if (target) {
        setActiveModalEvent(target);
        setModalStep('detail');
        if (onClearSelectedEventId) onClearSelectedEventId();
      }
    }
  }, [selectedEventIdFromMap, activeEvents, onClearSelectedEventId]);

  // Cities extracted
  const cities = useMemo(() => {
    const list = Array.from(new Set(activeEvents.map(e => e.kota).filter(Boolean)));
    return ['Semua', ...list];
  }, [activeEvents]);

  // Filtered Events logic
  const filteredEvents = useMemo(() => {
    return activeEvents.filter(ev => {
      // Hero search
      if (heroSearch.trim()) {
        const query = heroSearch.toLowerCase();
        const matchesHero = ev.namaKegiatan.toLowerCase().includes(query) ||
                            ev.deskripsiPelatihan.toLowerCase().includes(query) ||
                            ev.jenisEvent.toLowerCase().includes(query);
        if (!matchesHero) return false;
      }
      if (heroLocation.trim()) {
        const loc = heroLocation.toLowerCase();
        const matchesLoc = ev.kota.toLowerCase().includes(loc) ||
                           ev.lokasiDanAlamat.toLowerCase().includes(loc);
        if (!matchesLoc) return false;
      }

      // Filter box keyword
      if (filterKeyword.trim()) {
        const query = filterKeyword.toLowerCase();
        const matchesKw = ev.namaKegiatan.toLowerCase().includes(query) ||
                          ev.deskripsiPelatihan.toLowerCase().includes(query);
        if (!matchesKw) return false;
      }

      // Filter category
      if (filterCategory !== 'Semua') {
        const cat = filterCategory.toLowerCase();
        const evCat = (ev.jenisEvent || '').toLowerCase();
        const evTarget = (ev.targetPeserta || '').toLowerCase();
        const evTitle = (ev.namaKegiatan || '').toLowerCase();
        const evDesc = (ev.deskripsiPelatihan || '').toLowerCase();

        if (cat === 'orang umum' || cat === 'umum') {
          const isUmum = evCat.includes('umum') || evTarget.includes('umum') || evTitle.includes('umum') || evDesc.includes('umum');
          if (!isUmum) return false;
        } else if (!evCat.includes(cat)) {
          return false;
        }
      }

      // Filter disability
      if (filterDisability !== 'Semua') {
        const selectedDis = activeDisabilities.find(
          d => d.kode.toLowerCase() === filterDisability.toLowerCase() ||
               d.nama.toLowerCase() === filterDisability.toLowerCase() ||
               d.id === filterDisability
        );

        const evContent = `${ev.jenisEvent || ''} ${ev.targetPeserta || ''} ${ev.namaKegiatan || ''} ${ev.deskripsiPelatihan || ''} ${(ev.kebutuhanPeserta || []).join(' ')}`.toLowerCase();

        if (selectedDis) {
          const codeKey = selectedDis.kode.toLowerCase();
          const nameKeywords = selectedDis.nama
            .toLowerCase()
            .replace(/[()&/]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 3 && !['dan', 'atau', 'ragam', 'disabilitas', 'untuk'].includes(w));

          const matches = evContent.includes(codeKey) || nameKeywords.some(w => evContent.includes(w));
          if (!matches) return false;
        } else {
          const query = filterDisability.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!evContent.includes(query)) return false;
        }
      }

      // Filter city
      if (filterCity !== 'Semua') {
        if (ev.kota.toLowerCase() !== filterCity.toLowerCase()) {
          return false;
        }
      }

      // Checkbox facilities
      if (facilityJBI) {
        const hasJBI = ev.kebutuhanPeserta.some(k => k.toLowerCase().includes('isyarat') || k.toLowerCase().includes('jbi'));
        if (!hasJBI) return false;
      }
      if (facilityWheelchair) {
        const hasWheelchair = ev.kebutuhanPeserta.some(k => k.toLowerCase().includes('kursi roda') || k.toLowerCase().includes('ramp'));
        if (!hasWheelchair) return false;
      }
      if (facilityBraille) {
        const hasBraille = ev.kebutuhanPeserta.some(k => k.toLowerCase().includes('braille') || k.toLowerCase().includes('netra'));
        if (!hasBraille) return false;
      }
      if (facilityOnline) {
        const isOnline = ev.lokasiDanAlamat.toLowerCase().includes('online') || ev.lokasiDanAlamat.toLowerCase().includes('daring') || ev.namaKegiatan.toLowerCase().includes('online');
        if (!isOnline) return false;
      }

      return true;
    });
  }, [
    activeEvents,
    heroSearch,
    heroLocation,
    filterKeyword,
    filterCategory,
    filterDisability,
    filterCity,
    facilityJBI,
    facilityWheelchair,
    facilityBraille,
    facilityOnline,
  ]);

  const handleOpenDetailModal = (ev: TrainingProposal, step: 'detail' | 'form' = 'detail') => {
    setActiveModalEvent(ev);
    setModalStep(step);
    setLastRegistered(null);
    setRegName('');
    setRegWa('');
    setRegEmail('');
    setRegAge('');
    setRegNotes('');
    setRegFacilities([]);
  };

  const toggleRegFacility = (facility: string) => {
    setRegFacilities(prev =>
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    );
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalEvent || !regName.trim() || !regWa.trim()) return;

    setIsSubmittingReg(true);
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeModalEvent.id,
          namaLengkap: regName.trim(),
          noWa: regWa.trim(),
          email: regEmail.trim(),
          usia: regAge ? parseInt(regAge, 10) : undefined,
          kategoriDisabilitas: regDisability,
          kebutuhanFasilitas: regFacilities,
          catatanKhusus: regNotes.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mendaftarkan peserta.');
      }

      const resData = await response.json();
      const newParticipant: Participant = resData.participant || resData;
      setLastRegistered(newParticipant);
      onRegisterSuccess(newParticipant);

      // Instantly update active modal event quota so popup counter increases
      if (activeModalEvent) {
        setActiveModalEvent(prev => prev ? {
          ...prev,
          jumlahPendaftar: (Number(prev.jumlahPendaftar) || 0) + 1,
        } : null);
      }
      setModalStep('finished_status');

      if (onLogAction) {
        onLogAction(
          'Pendaftaran Mandiri Peserta',
          'participants',
          `Peserta "${newParticipant.namaLengkap}" berhasil mendaftar pada kegiatan "${activeModalEvent.namaKegiatan}".`,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengirim pendaftaran. Silakan coba kembali.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSuccess(true);
      if (onLogAction) {
        onLogAction(
          'Pesan Kontak Layanan',
          'support',
          `Pengunjung "${contactName}" (${contactEmail}) mengirim pertanyaan tentang "${contactTopic}".`,
          'info'
        );
      }
      setTimeout(() => {
        setContactSuccess(false);
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setContactMessage('');
        setContactDisabilityFormat(false);
      }, 3500);
    }, 800);
  };

  const articlesData = [
    {
      title: 'Panduan Mudah Mengenal Al-Quran Braille Standar Indonesia',
      category: 'Disabilitas Netra',
      date: '15 September 2024',
      content:
        'Al-Quran Braille di Indonesia mengacu pada standar resmi Kementerian Agama RI dengan sistem 6 titik timbul yang memudahkan para tunanetra membaca dengan sentuhan ujung jari. Pelajari tanda harakat, tajwid braille, dan panduan dasar belajarnya di sini.',
    },
    {
      title: 'Metode Pembelajaran Huruf Hijaiyah Isyarat (BISINDO & SIBI)',
      category: 'Disabilitas Rungu / Tuli',
      date: '10 September 2024',
      content:
        'Pembelajaran Al-Quran bagi teman Tuli kini semakin inklusif berkat pengembangan isyarat hijaiyah dan tafsir isyarat Al-Quran. Melalui visualisasi makhraj huruf dan ekspresi gerak tangan, pemahaman makna ayat suci dapat dicapai dengan komprehensif.',
    },
    {
      title: 'Standarisasi Aksesibilitas Fisik Rumah Quran & Masjid Inklusif',
      category: 'Disabilitas Daksa & Fisik',
      date: '02 September 2024',
      content:
        'Mewujudkan rumah quran ramah disabilitas daksa mencakup pembuatan ramp dengan kemiringan maksimal 1:12, handrail pemandu, pintu minimal lebar 90cm, dan toilet wudhu ramah kursi roda.',
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-white text-slate-800">
      {/* 1. TOP NAVBAR - Matching reference image exactly */}
      <nav
        className="sticky top-0 z-40 w-full border-b transition-colors shadow-2xs"
        style={{
          backgroundColor: appSettings?.topbarColor || '#ffffff',
          borderColor: appSettings?.topbarColor && appSettings.topbarColor !== '#ffffff' ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
          color: appSettings?.topbarColor && appSettings.topbarColor !== '#ffffff' ? '#ffffff' : '#1e293b',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            {appSettings?.logo ? (
              <img
                src={appSettings.logo}
                alt={appSettings.applicationName || 'Logo Aplikasi'}
                className="w-10 h-10 object-contain rounded-xl shadow-xs bg-white/20 p-0.5"
              />
            ) : (
              <QuranEmblemLogo size="md" />
            )}
            <div className="flex flex-col">
              <span
                className={`font-bold text-[17px] sm:text-[19px] tracking-tight leading-tight ${
                  appSettings?.topbarColor && appSettings.topbarColor !== '#ffffff' ? 'text-white' : 'text-slate-900'
                }`}
              >
                {appSettings?.applicationName || "Event for Disability to Qur'an"}
              </span>
              <span
                className={`text-[11px] font-medium hidden sm:inline ${
                  appSettings?.topbarColor && appSettings.topbarColor !== '#ffffff' ? 'text-white/80' : 'text-slate-500'
                }`}
              >
                {appSettings?.institutionSubtitle || "Platform Pelatihan & Pemberdayaan Sahabat Disabilitas"}
              </span>
            </div>
          </div>

          {/* Nav Items & Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div
              className={`hidden lg:flex items-center gap-6 text-[14px] font-medium ${
                appSettings?.topbarColor && appSettings.topbarColor !== '#ffffff' ? 'text-white/90' : 'text-slate-600'
              }`}
            >
              <a href="#tentang-kami" className="hover:opacity-80 transition-opacity">
                Tentang Kami
              </a>
              <a href="#katalog-event" className="hover:opacity-80 transition-opacity">
                Cari Event
              </a>
              <a href="#peta-lokasi" className="hover:opacity-80 transition-opacity">
                Peta Lokasi
              </a>
              <a href="#kontak-kami" className="hover:opacity-80 transition-opacity">
                Kontak
              </a>
              <button
                type="button"
                onClick={() => setIsArticlesModalOpen(true)}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                Artikel
              </button>
            </div>

            {/* Language Flag Dropdown Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-slate-200/40 text-xs font-semibold">
              <span className="text-[16px]">🇮🇩</span>
              <span className="hidden sm:inline">ID</span>
            </div>

            {/* Login / Dashboard Button */}
            {currentUser ? (
              <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1e293b] text-white hover:bg-slate-800 rounded-xl text-[13px] sm:text-[14px] font-semibold transition-all shadow-xs cursor-pointer border border-white/10"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Dashboard ({currentUser.role === 'superadmin' ? 'Super Admin' : 'Mitra'})</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenLogin()}
                className={`px-5 py-2.5 rounded-xl text-[13px] sm:text-[14px] font-semibold transition-all cursor-pointer shadow-2xs border ${
                  appSettings?.topbarColor && appSettings.topbarColor !== '#ffffff'
                    ? 'bg-white text-slate-900 border-white hover:bg-slate-100'
                    : 'bg-white border-slate-300 hover:border-slate-400 text-slate-800 hover:bg-slate-50'
                }`}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION - With dynamic background support when set in ApplicationSettings */}
      <div
        className={`w-full relative transition-all ${
          appSettings?.headerBgImage ? 'py-12 md:py-16' : 'pt-12 pb-16'
        }`}
        style={
          appSettings?.headerBgImage
            ? {
                backgroundImage: `url(${appSettings.headerBgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : undefined
        }
      >
        {/* Overlay Layer when Background Photo is active */}
        {appSettings?.headerBgImage && (
          <div
            className={`absolute inset-0 pointer-events-none transition-all ${
              appSettings.headerBgOverlay === 'none'
                ? 'bg-black/35'
                : appSettings.headerBgOverlay === 'light'
                ? 'bg-white/85 backdrop-blur-[2px]'
                : 'bg-gradient-to-t from-slate-950/90 via-slate-950/75 to-slate-900/65 backdrop-blur-[1px]'
            }`}
          />
        )}

        <section className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Navy Pill Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium mb-6 shadow-sm ${
              appSettings?.headerBgImage && appSettings.headerBgOverlay !== 'light'
                ? 'bg-white/20 text-white backdrop-blur-md border border-white/30'
                : 'bg-[#1e293b] text-white'
            }`}
          >
            <span>{appSettings?.institutionSubtitle || 'Platform Pelatihan & Pemberdayaan Sahabat Disabilitas'}</span>
          </div>

          {/* Large Bold Headline */}
          <h1
            className={`text-3xl sm:text-5xl md:text-[54px] font-extrabold tracking-tight leading-[1.15] mb-5 ${
              appSettings?.headerBgImage && appSettings.headerBgOverlay !== 'light'
                ? 'text-white drop-shadow-md'
                : 'text-slate-900'
            }`}
          >
            Temukan Event dan Pelatihan <br className="hidden sm:inline" />
            <span
              className={
                appSettings?.headerBgImage && appSettings.headerBgOverlay !== 'light'
                  ? 'text-amber-300'
                  : 'text-slate-900'
              }
            >
              Inklusif untuk Semua
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-[14px] sm:text-[16px] max-w-3xl leading-relaxed mb-8 ${
              appSettings?.headerBgImage && appSettings.headerBgOverlay !== 'light'
                ? 'text-slate-100 drop-shadow-xs font-medium'
                : 'text-slate-600'
            }`}
          >
            Menghubungkan Sahabat Netra, Tuli, Daksa, dan neurodivergen dengan rumah quran, pesantren khusus, dan mitra yayasan penyelenggara pelatihan di seluruh nusantara.
          </p>

          {/* Search Bar Container - Pill Card with Divided Inputs */}
          <div className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-lg flex flex-col sm:flex-row items-center gap-2">
            {/* Search Events Keyword */}
            <div className="flex items-center gap-3 px-3.5 py-1.5 w-full sm:w-1/2">
              <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">search</span>
              <input
                type="text"
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
                placeholder="Search events"
                className="w-full bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-[1px] h-8 bg-slate-200" />

            {/* Location Input */}
            <div className="flex items-center gap-3 px-3.5 py-1.5 w-full sm:w-1/2">
              <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">location_on</span>
              <input
                type="text"
                value={heroLocation}
                onChange={e => setHeroLocation(e.target.value)}
                placeholder="Taman Mini / Kota"
                className="w-full bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Search Button */}
            <button
              onClick={() => {
                const el = document.getElementById('katalog-event');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl sm:rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 font-medium"
              aria-label="Cari Event"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span className="sm:hidden text-sm">Cari Event</span>
            </button>
          </div>
        </section>
      </div>

      {/* 3. SECTION: TENTANG DISABILITY EVENT PLATFORM */}
      <section id="tentang-kami" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-100">
        {/* Section Pill Badge */}
        <div className="mb-4">
          <span className="inline-block px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[12px] font-semibold tracking-wide">
            Tentang Disability Event Platform
          </span>
        </div>

        {/* Headline & Description */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          <div className="lg:col-span-7">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Membangun Jembatan Peluang Setara Bagi Sahabat Disabilitas
            </h2>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed mb-4">
              Platform inklusif nasional yang didedikasikan untuk mempertemukan sahabat disabilitas dengan peluang pelatihan kerja, pengembangan kompetensi digital, pemberdayaan komunitas, dan kegiatan Al-Quran inklusif di seluruh Nusantara.
            </p>
            <div>
              <a
                href="#katalog-event"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1e293b] text-white hover:bg-slate-800 text-[13px] font-semibold transition-all shadow-xs"
              >
                <span>Jelajahi Event Pelatihan</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>

        {/* 3 Counter Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center">
            <span className="block text-4xl sm:text-5xl font-extrabold text-slate-900 mb-2">
              {activeEvents.length > 0 ? activeEvents.length : 18}
            </span>
            <span className="text-[13px] font-medium text-slate-600">Akses Gratis & Ramah</span>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center">
            <span className="block text-4xl sm:text-5xl font-extrabold text-slate-900 mb-2">
              {activeDisabilities.length > 0 ? activeDisabilities.length : (disabilities.length > 0 ? disabilities.length : 2)}
            </span>
            <span className="text-[13px] font-medium text-slate-600">Ragam Fasilitas Aksesibilitas</span>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center">
            <span className="block text-4xl sm:text-5xl font-extrabold text-slate-900 mb-2">
              {new Set(communities.map(c => c.provinsi)).size || 8}
            </span>
            <span className="text-[13px] font-medium text-slate-600">Cakupan Provinsi & Wilayah</span>
          </div>
        </div>

        {/* Two Cards: Visi Kami & Misi Kami */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Visi Kami */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="material-symbols-outlined text-[#0284c7] text-[24px]">visibility</span>
              <h3 className="text-[19px] sm:text-[21px] font-bold text-slate-900">Visi Kami</h3>
            </div>
            <p className="text-[14px] text-slate-600 leading-relaxed">
              Mewujudkan ekosistem Indonesia yang mandiri, berkeadilan, dan ramah disabilitas, di mana setiap individu memiliki kesempatan yang setara untuk belajar, mengasah keterampilan vokasional, menumbuhkan kepemimpinan, dan meraih masa depan yang bermartabat.
            </p>
          </div>

          {/* Misi Kami */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="material-symbols-outlined text-[#0284c7] text-[24px]">flag</span>
              <h3 className="text-[19px] sm:text-[21px] font-bold text-slate-900">Misi Kami</h3>
            </div>
            <ul className="space-y-3 text-[14px] text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span><strong>Mempermudah Akses Informasi:</strong> Menyediakan katalog kegiatan terpusat dengan filter akomodasi aksesibilitas yang transparan.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span><strong>Standarisasi Fasilitas Inklusif:</strong> Membimbing mitra dalam mempersiapkan JBI, materi Braille, dan jalur kursi roda.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span><strong>Peta Quran Terpadu:</strong> Menjembatani sahabat disabilitas dengan rumah tahfidz dan pengajar Al-Quran inklusif.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. SECTION: DUKUNGAN FASILITAS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full bg-slate-50/70 border-t border-b border-slate-200/70">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2">
            DUKUNGAN FASILITAS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
            Dukungan Fasilitas Sesuai Ragam Disabilitas
          </h2>
          <p className="text-[14px] text-slate-600">
            Kebutuhan setiap peserta unik. Platform kami memfasilitasi kebutuhan spesifik berikut:
          </p>
        </div>

        {/* Feature Cards dynamically mapped from activeDisabilities */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${activeDisabilities.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2 max-w-4xl mx-auto'} gap-6`}>
          {activeDisabilities.length > 0 ? (
            activeDisabilities.map((dis, idx) => {
              const iconMap: Record<string, { icon: string; bg: string; text: string }> = {
                tunanetra: { icon: 'visibility', bg: 'bg-amber-50', text: 'text-amber-700' },
                tunarungu: { icon: 'hearing', bg: 'bg-sky-50', text: 'text-sky-700' },
                tunadaksa: { icon: 'accessible', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                intelektual_autisme: { icon: 'psychology', bg: 'bg-indigo-50', text: 'text-indigo-700' },
              };
              const style = iconMap[dis.kode] || {
                icon: dis.icon || (dis.kategoriUtama === 'Sensorik' ? 'visibility' : dis.kategoriUtama === 'Fisik' ? 'accessible' : 'psychology'),
                bg: idx % 2 === 0 ? 'bg-amber-50' : 'bg-sky-50',
                text: idx % 2 === 0 ? 'text-amber-700' : 'text-sky-700',
              };

              return (
                <div key={dis.id || dis.kode} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col hover:border-slate-300 transition-all">
                  <div className={`w-12 h-12 rounded-xl ${style.bg} ${style.text} flex items-center justify-center mb-4`}>
                    <span className="material-symbols-outlined text-[26px]">{style.icon}</span>
                  </div>
                  <h4 className="text-[16px] font-bold text-slate-900 mb-2">{dis.nama}</h4>
                  <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
                    {dis.deskripsi || dis.metodePembelajaran || 'Aksesibilitas dan fasilitas ramah peserta disabilitas.'}
                  </p>
                  {dis.fasilitasRekomendasi && dis.fasilitasRekomendasi.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      {dis.fasilitasRekomendasi.slice(0, 3).map((f, fi) => (
                        <span key={fi} className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-slate-500">
              <p className="text-[14px]">Belum ada data ragam disabilitas yang aktif.</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. SECTION: EKSPLORASI PELATIHAN INKLUSIF - KATALOG EVENT */}
      <section id="katalog-event" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
            EKSPLORASI PELATIHAN INKLUSIF
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Katalog Event & Pelatihan Disabilitas
          </h2>
          <p className="text-[14px] text-slate-600">
            Temukan pelatihan yang sesuai dengan minat dan kebutuhan aksesibilitas Anda di seluruh Indonesia.
          </p>
        </div>

        {/* Filter Card: "Saring Berdasarkan Kebutuhan" */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-slate-700 text-[20px]">tune</span>
            <h3 className="text-[15px] font-bold text-slate-900">Saring Berdasarkan Kebutuhan</h3>
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {/* Kata Kunci */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Kata Kunci</label>
              <input
                type="text"
                value={filterKeyword}
                onChange={e => setFilterKeyword(e.target.value)}
                placeholder="Judul pelatihan..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
              />
            </div>

            {/* Kategori Event */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Kategori Event</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-slate-800"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Teknologi">Teknologi & Digital</option>
                <option value="Tahfidz">Tahfidz & Quran</option>
                <option value="Vokasional">Kriya & Vokasional</option>
                <option value="Bahasa">Bahasa & Isyarat</option>
                <option value="Orang Umum">Orang Umum / Publik</option>
              </select>
            </div>

            {/* Fokus Disabilitas */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Fokus Disabilitas</label>
              <select
                value={filterDisability}
                onChange={e => setFilterDisability(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-slate-800"
              >
                <option value="Semua">Semua Disabilitas ({activeDisabilities.length})</option>
                {activeDisabilities.map(dis => (
                  <option key={dis.id || dis.kode} value={dis.kode}>
                    {dis.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Kota / Pelaksanaan */}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Kota / Pelaksanaan</label>
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-slate-800"
              >
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Second Row: Checkboxes & Apply Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={facilityJBI}
                  onChange={e => setFacilityJBI(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 w-4 h-4 cursor-pointer"
                />
                <span>Juru Bahasa Isyarat</span>
              </label>

              <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={facilityWheelchair}
                  onChange={e => setFacilityWheelchair(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 w-4 h-4 cursor-pointer"
                />
                <span>Akses Kursi Roda</span>
              </label>

              <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={facilityBraille}
                  onChange={e => setFacilityBraille(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 w-4 h-4 cursor-pointer"
                />
                <span>Materi Braille</span>
              </label>

              <label className="flex items-center gap-2 text-[12px] font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={facilityOnline}
                  onChange={e => setFacilityOnline(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 w-4 h-4 cursor-pointer"
                />
                <span>Bisa Online / Daring</span>
              </label>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setFilterKeyword('');
                  setFilterCategory('Semua');
                  setFilterDisability('Semua');
                  setFilterCity('Semua');
                  setFacilityJBI(false);
                  setFacilityWheelchair(false);
                  setFacilityBraille(false);
                  setFacilityOnline(false);
                  setHeroSearch('');
                  setHeroLocation('');
                }}
                className="px-3.5 py-2 text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  // Re-triggers useMemo
                }}
                className="px-5 py-2 bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl text-[12px] font-semibold transition-all cursor-pointer shadow-xs"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>

        {/* Found Count text */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-slate-600">
            Ditemukan <strong className="text-slate-900">{filteredEvents.length}</strong> event pelatihan
          </span>
        </div>

        {/* Event Cards Grid (3 Columns) */}
        {filteredEvents.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-slate-400 mb-3">event_busy</span>
            <h4 className="text-[16px] font-bold text-slate-800">Tidak ada event yang sesuai</h4>
            <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau ubah pilihan filter fasilitas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => {
              const kuotaMax = event.kuotaDisetujui || event.targetDanKuotaPeserta;
              const sisaKuota = Math.max(0, kuotaMax - event.jumlahPendaftar);

              return (
                <div
                  key={event.id}
                  className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  {/* Card Header Content */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Top Row: Category Pill & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-[11px] font-bold">
                        {event.jenisEvent}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                        Aktif
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[17px] font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                      {event.namaKegiatan}
                    </h3>

                    {/* Description */}
                    <p className="text-[13px] text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {event.deskripsiPelatihan}
                    </p>

                    {/* Metadata List */}
                    <div className="space-y-2 mt-auto pt-3 border-t border-slate-100 text-[12px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">location_on</span>
                        <span className="truncate">{event.kota} ({event.lokasiDanAlamat})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">calendar_today</span>
                        <span>{event.tanggalKegiatan}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">group</span>
                        <span className="font-semibold text-slate-700">
                          Kuota: {event.jumlahPendaftar} / {kuotaMax} peserta
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100">
                      {event.kebutuhanPeserta.slice(0, 3).map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Actions Row: Detail & Daftar */}
                    <div className="grid grid-cols-2 gap-2 mt-5">
                      <button
                        onClick={() => handleOpenDetailModal(event, 'detail')}
                        className="py-2.5 px-3 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 rounded-xl text-[13px] font-bold transition-colors cursor-pointer text-center"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleOpenDetailModal(event, 'form')}
                        className="py-2.5 px-3 bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl text-[13px] font-bold transition-colors cursor-pointer text-center shadow-xs"
                      >
                        Daftar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. SECTION: SENTRA PEMBELAJARAN AL-QURAN SAHABAT DISABILITAS (MAP + MITRA & YAYASAN LIST) */}
      <section id="peta-lokasi" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-100">
        <div className="mb-8">
          <div className="inline-block px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[12px] font-semibold mb-3">
            Peta Persebaran Mitra & Yayasan Quran Disabilitas Indonesia
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Sentra Pembelajaran Al-Quran Sahabat Disabilitas
          </h2>
          <p className="text-[14px] text-slate-600 max-w-3xl">
            Menghubungkan sahabat Netra, Tuli, Daksa, dan neurodivergen dengan mitra pesantren dan yayasan penyelenggara pelatihan di seluruh nusantara.
          </p>
        </div>

        {/* Embedded Interactive Map System */}
        <PetaPersebaran
          communities={communities}
          events={events}
          disabilities={disabilities}
          isEmbedded={true}
          hideAddButton={true}
          isSuperAdmin={currentUser?.role === 'superadmin'}
          onSelectEventForRegister={eventId => {
            const ev = activeEvents.find(e => e.id === eventId);
            if (ev) handleOpenDetailModal(ev, 'form');
          }}
        />
      </section>

      {/* 7. SECTION: HUBUNGI TIM DISABILITY EVENT */}
      <section id="kontak-kami" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-100">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Hubungi Tim Disability Event
          </h2>
          <p className="text-[14px] text-slate-600">
            Punya pertanyaan mengenai pendaftaran event, kendala aksesibilitas fasilitas, atau ingin berkolaborasi sebagai mitra penyelenggara? Kami siap membantu dengan sepenuh hati.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: "Kirim Pesan Langsung" */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-[18px] font-bold text-slate-900 mb-1">Kirim Pesan Langsung</h3>
            <p className="text-[12px] text-slate-500 mb-6">
              Isi formulir di bawah ini. Tim kami menyediakan format balasan yang disesuaikan dengan preferensi aksesibilitas Anda.
            </p>

            {contactSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-medium flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                <span>Terima kasih! Pesan Anda telah kami terima dan tim aksesibilitas kami akan segera merespon.</span>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="Nama Anda..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Alamat Email *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="+62 8..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1">Topik / Keperluan</label>
                    <select
                      value={contactTopic}
                      onChange={e => setContactTopic(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-slate-800"
                    >
                      <option value="Informasi Pendaftaran Event">Informasi Pendaftaran Event</option>
                      <option value="Konsultasi Fasilitas Aksesibilitas">Konsultasi Fasilitas Aksesibilitas</option>
                      <option value="Kolaborasi Mitra Penyelenggara">Kolaborasi Mitra Penyelenggara</option>
                      <option value="Bantuan Teknis Platform">Bantuan Teknis Platform</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1">Isi Pesan *</label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    placeholder="Tuliskan pertanyaan atau kebutuhan Anda di sini..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-slate-800"
                  />
                </div>

                {/* Accessibility Checkbox */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="flex items-start gap-2.5 text-[12px] text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactDisabilityFormat}
                      onChange={e => setContactDisabilityFormat(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-800 w-4 h-4 cursor-pointer"
                    />
                    <span>
                      <strong>Saya memerlukan format respon ramah disabilitas:</strong> Aktifkan jika Anda menginginkan respon dalam format khusus pesan teks WhatsApp untuk Tuli, atau rekaman suara untuk Netra.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full py-3 bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl text-[14px] font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>{contactLoading ? 'Mengirim Pesan...' : 'Kirim Pesan'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Cards: "Kanal Kontak Resmi" */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">chat</span>
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">Layanan Telepon & WhatsApp</h4>
                <p className="text-[13px] text-slate-600 font-semibold mt-0.5">+62 812-3456-7890</p>
                <p className="text-[11px] text-slate-500 mt-1">Dukungan teks khusus pesan ramah Tuli dan pesan suara Netra.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">mail</span>
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">Email Bantuan & Informasi</h4>
                <p className="text-[13px] text-slate-600 font-semibold mt-0.5">halo@disabilityevent.id</p>
                <p className="text-[11px] text-slate-500 mt-1">Respon maksimal 1x24 jam pada hari kerja.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">apartment</span>
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">Sekretariat & Kantor Layanan</h4>
                <p className="text-[13px] text-slate-600 mt-0.5">
                  Pusat Layanan Inklusif & Disabilitas, Gedung Bait Al-Qur'an dan Museum Istiqlal, Jakarta Pusat.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">schedule</span>
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">Jam Operasional</h4>
                <p className="text-[13px] text-slate-600 mt-0.5">Senin - Jumat: 08.00 - 17.00 WIB</p>
                <p className="text-[11px] text-slate-500 mt-1">Sabtu, Minggu & Hari Libur Nasional: Tutup</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER - Exactly matching the image */}
      <footer className="bg-[#162033] text-white pt-16 pb-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
            {/* Brand column (span 2) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                {appSettings?.logo ? (
                  <img
                    src={appSettings.logo}
                    alt={appSettings.applicationName || 'Logo Aplikasi'}
                    className="w-10 h-10 object-contain rounded-xl bg-white p-1"
                  />
                ) : (
                  <QuranEmblemLogo size="md" />
                )}
                <span className="text-[18px] font-bold text-white tracking-tight">
                  {appSettings?.applicationName || "Event for Disability to Qur'an"}
                </span>
              </div>
              <p className="text-[13px] text-slate-400 leading-relaxed max-w-sm">
                Menghubungkan Sahabat Netra, Tuli, Daksa, dan neurodivergen dengan mitra pesantren dan yayasan penyelenggara pelatihan di seluruh nusantara.
              </p>
              <div className="pt-2 text-xs text-slate-400">
                <span className="inline-block px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-medium">
                  Versi Rilis 2.4.0 (Inklusif)
                </span>
              </div>
            </div>

            {/* Column 1: Navigasi Utama */}
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-300 mb-4">
                NAVIGASI UTAMA
              </h4>
              <ul className="space-y-2.5 text-[13px] text-slate-400">
                <li><a href="#katalog-event" className="hover:text-white transition-colors">Cari Event & Pelatihan</a></li>
                <li><a href="#peta-lokasi" className="hover:text-white transition-colors">Peta Persebaran Lokasi</a></li>
                <li><a href="#peta-lokasi" className="hover:text-white transition-colors">Peta Mitra & Yayasan Quran Disabilitas</a></li>
                <li><a href="#tentang-kami" className="hover:text-white transition-colors">Tentang Kami & Prinsip Inklusi</a></li>
                <li><a href="#kontak-kami" className="hover:text-white transition-colors">Kontak & Bantuan Layanan</a></li>
              </ul>
            </div>

            {/* Column 2: Aksesibilitas */}
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-300 mb-4">
                AKSESIBILITAS
              </h4>
              <ul className="space-y-2.5 text-[13px] text-slate-400">
                <li>Juru Bahasa Isyarat (BISINDO)</li>
                <li>Dokumen Braille & Audio Description</li>
                <li>Jalur Kursi Roda & Toilet Inklusif</li>
                <li>Pendamping Ramah Sensorik</li>
                <li>Screen Reader & Navigasi Terstruktur</li>
              </ul>
            </div>

            {/* Column 3: Layanan Bantuan */}
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-300 mb-4">
                LAYANAN BANTUAN
              </h4>
              <ul className="space-y-2.5 text-[13px] text-slate-400">
                <li>WhatsApp Hotline Disabilitas</li>
                <li>Email Dukungan</li>
                <li>Alamat Sekretariat Layanan Inklusif</li>
                <li>
                  <button
                    onClick={() => onOpenLogin()}
                    className="text-sky-400 hover:underline cursor-pointer"
                  >
                    Login Khusus Mitra & Super Admin
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-slate-400">
            <div>
              © 2026 Disability Event Platform Indonesia. Seluruh hak cipta dilindungi.
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Didedikasikan dengan</span>
              <span className="text-rose-500">❤️</span>
              <span>untuk kemandirian dan kemaslahatan disabilitas Indonesia.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 9. ARTICLES MODAL */}
      {isArticlesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[24px] text-[#0284c7]">article</span>
                <h3 className="text-[18px] font-bold text-slate-900">Artikel & Panduan Inklusi</h3>
              </div>
              <button
                onClick={() => {
                  setIsArticlesModalOpen(false);
                  setSelectedArticle(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {selectedArticle ? (
              <div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-[12px] font-semibold text-sky-600 hover:underline flex items-center gap-1 mb-3 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Kembali ke daftar artikel</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-[11px] font-bold">
                  {selectedArticle.category}
                </span>
                <h4 className="text-[20px] font-bold text-slate-900 mt-2 mb-1">{selectedArticle.title}</h4>
                <p className="text-[12px] text-slate-400 mb-4">{selectedArticle.date}</p>
                <div className="text-[14px] text-slate-700 leading-relaxed space-y-3">
                  <p>{selectedArticle.content}</p>
                  <p>
                    Kementerian Agama dan lembaga mitra terus memperluas jaringan pendampingan dan cetakan mushaf ramah disabilitas di seluruh wilayah Indonesia agar tidak ada sahabat disabilitas yang tertinggal dalam mengakses ilmu Al-Quran.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {articlesData.map((art, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedArticle(art)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 transition-all cursor-pointer"
                  >
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                      {art.category}
                    </span>
                    <h4 className="text-[15px] font-bold text-slate-900 mt-1.5 mb-1 hover:text-sky-700 transition-colors">
                      {art.title}
                    </h4>
                    <p className="text-[12px] text-slate-500 line-clamp-2">{art.content}</p>
                    <span className="text-[11px] text-slate-400 mt-2 block">{art.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. DETAIL & REGISTRATION MODAL (PRESERVED ALL WORKING FEATURES) */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 my-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-[11px] font-bold uppercase tracking-wider">
                  {activeModalEvent.jenisEvent}
                </span>
                <h3 className="text-[18px] sm:text-[20px] font-bold text-slate-900 mt-1 leading-snug">
                  {activeModalEvent.namaKegiatan}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body: Detail vs Form vs Success */}
            {modalStep === 'detail' && (
              <div className="space-y-4">
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  {activeModalEvent.deskripsiPelatihan}
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-[13px] text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                    <span><strong>Lokasi:</strong> {activeModalEvent.lokasiDanAlamat}, {activeModalEvent.kota}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span>
                    <span><strong>Waktu:</strong> {activeModalEvent.tanggalKegiatan}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">corporate_fare</span>
                    <span><strong>Penyelenggara:</strong> {activeModalEvent.mitraOrg}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">group</span>
                    <span><strong>Kuota:</strong> {activeModalEvent.jumlahPendaftar} / {activeModalEvent.kuotaDisetujui || activeModalEvent.targetDanKuotaPeserta} peserta</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-bold text-slate-800 mb-2">Fasilitas Akomodasi Yang Disediakan:</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeModalEvent.kebutuhanPeserta.map((f, i) => (
                      <span key={i} className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-[12px] font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                        <span>{f}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    onClick={() => setActiveModalEvent(null)}
                    className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => setModalStep('form')}
                    className="px-6 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl text-[13px] font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Daftar Sekarang
                  </button>
                </div>
              </div>
            )}

            {modalStep === 'form' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="text-[13px] text-slate-600 bg-sky-50 border border-sky-200 p-3 rounded-xl">
                  Formulir pendaftaran gratis untuk peserta disabilitas atau pendamping.
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Nama sesuai KTP/identitas..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1">Nomor WhatsApp Aktif *</label>
                    <input
                      type="text"
                      required
                      value={regWa}
                      onChange={e => setRegWa(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1">Email (Opsional)</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1">Usia (Tahun)</label>
                    <input
                      type="number"
                      value={regAge}
                      onChange={e => setRegAge(e.target.value)}
                      placeholder="Contoh: 22"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-1">Ragam Disabilitas *</label>
                    <select
                      value={regDisability}
                      onChange={e => setRegDisability(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-slate-800"
                    >
                      {activeDisabilities.length > 0 ? (
                        activeDisabilities.map(dis => (
                          <option key={dis.id || dis.kode} value={dis.kode}>
                            {dis.nama} ({dis.kategoriUtama})
                          </option>
                        ))
                      ) : (
                        <option value="umum">Peserta Pelatihan</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Kebutuhan Fasilitas Tambahan</label>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    {[
                      'Juru Bahasa Isyarat',
                      'Materi Cetak Braille',
                      'Akses Kursi Roda & Ramp',
                      'Pendamping Khusus',
                      'Screen Reader Support',
                      'Format Teks Digital',
                    ].map(f => (
                      <label key={f} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={regFacilities.includes(f)}
                          onChange={() => toggleRegFacility(f)}
                          className="rounded text-slate-900"
                        />
                        <span className="truncate">{f}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">Catatan Khusus (Opsional)</label>
                  <textarea
                    rows={2}
                    value={regNotes}
                    onChange={e => setRegNotes(e.target.value)}
                    placeholder="Contoh: Memerlukan penjemputan dari stasiun terdekat..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalStep('detail')}
                    className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReg}
                    className="px-6 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl text-[13px] font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReg ? 'Menyimpan...' : 'Kirim Pendaftaran'}
                  </button>
                </div>
              </form>
            )}

            {modalStep === 'finished_status' && lastRegistered && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <h4 className="text-[20px] font-bold text-slate-900">Pendaftaran Berhasil Terkirim!</h4>
                <p className="text-[13px] text-slate-600 max-w-sm mx-auto">
                  Selamat <strong>{lastRegistered.namaLengkap}</strong>, data Anda telah tercatat dengan ID Pendaftaran:
                </p>
                <div className="p-3 bg-slate-100 rounded-xl font-mono text-[14px] font-bold text-slate-800 inline-block">
                  {lastRegistered.id}
                </div>
                <p className="text-[12px] text-slate-500 max-w-md mx-auto">
                  Panitia kegiatan dari <strong>{activeModalEvent.mitraOrg}</strong> akan menghubungi Anda melalui nomor WhatsApp ({lastRegistered.noWa}) untuk konfirmasi jadwal dan pendampingan akomodasi.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setActiveModalEvent(null)}
                    className="px-8 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white rounded-xl text-[13px] font-bold transition-all cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
