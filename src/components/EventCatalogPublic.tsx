import React, { useState, useEffect, useMemo } from 'react';
import { TrainingProposal, Participant, DisabilityMaster } from '../types.ts';

interface EventCatalogPublicProps {
  events: TrainingProposal[];
  onRegisterSuccess: (participant: Participant) => void;
  selectedEventIdFromMap?: string | null;
  onClearSelectedEventId?: () => void;
  disabilities?: DisabilityMaster[];
  selectedCategoryFilter?: string;
  onSelectCategoryFilter?: (category: string) => void;
}

export const EventCatalogPublic: React.FC<EventCatalogPublicProps> = ({
  events,
  onRegisterSuccess,
  selectedEventIdFromMap,
  onClearSelectedEventId,
  disabilities = [],
  selectedCategoryFilter,
  onSelectCategoryFilter,
}) => {
  const activeEvents = events.filter(e => e.isAktif && e.status === 'disetujui');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(selectedCategoryFilter || 'Semua');
  const [activeModalEvent, setActiveModalEvent] = useState<TrainingProposal | null>(() => {
    if (selectedEventIdFromMap) {
      return activeEvents.find(e => e.id === selectedEventIdFromMap) || null;
    }
    return null;
  });

  // Flow step inside modal: 'detail' | 'form' | 'question_next_event' | 'finished_status'
  const [modalStep, setModalStep] = useState<'detail' | 'form' | 'question_next_event' | 'finished_status'>('detail');

  // Sync if selected from outside (e.g. map or URL hash)
  React.useEffect(() => {
    if (selectedEventIdFromMap) {
      const target = activeEvents.find(e => e.id === selectedEventIdFromMap);
      if (target) {
        setActiveModalEvent(target);
        setModalStep('detail');
      }
    }
  }, [selectedEventIdFromMap, activeEvents]);

  // Form State
  const [namaLengkap, setNamaLengkap] = useState('');
  const [noWa, setNoWa] = useState('');
  const [email, setEmail] = useState('');
  const [usia, setUsia] = useState('');
  const [kategoriDisabilitas, setKategoriDisabilitas] = useState<
    'tunanetra' | 'tunarungu' | 'tunadaksa' | 'intelektual_autisme' | 'pendamping_umum'
  >('tunanetra');
  const [kebutuhanFasilitas, setKebutuhanFasilitas] = useState<string[]>([]);
  const [catatanKhusus, setCatatanKhusus] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRegisteredParticipant, setLastRegisteredParticipant] = useState<Participant | null>(null);

  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Sync if selectedCategoryFilter changes from parent (e.g. from DisabilityManagement)
  useEffect(() => {
    if (selectedCategoryFilter) {
      setSelectedCategory(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  // Active disabilities list from master data
  const activeDisabilities = useMemo(() => {
    return (disabilities || []).filter(d => d.isAktif !== false);
  }, [disabilities]);

  const categories = useMemo(() => {
    if (activeDisabilities.length > 0) {
      return ['Semua', ...activeDisabilities.map(d => d.nama)];
    }
    return ['Semua'];
  }, [activeDisabilities]);

  // Keep selected category valid against current active categories
  useEffect(() => {
    if (selectedCategory !== 'Semua' && !categories.includes(selectedCategory)) {
      setSelectedCategory('Semua');
    }
  }, [categories, selectedCategory]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (onSelectCategoryFilter) onSelectCategoryFilter(cat);
  };

  const filteredEvents = activeEvents.filter(ev => {
    let matchesCategory = true;
    if (selectedCategory !== 'Semua') {
      const selectedDis = activeDisabilities.find(
        d => d.nama.toLowerCase() === selectedCategory.toLowerCase() ||
             d.kode.toLowerCase() === selectedCategory.toLowerCase()
      );
      const evContent = `${ev.jenisEvent || ''} ${ev.targetPeserta || ''} ${ev.namaKegiatan || ''} ${ev.deskripsiPelatihan || ''} ${(ev.kebutuhanPeserta || []).join(' ')}`.toLowerCase();

      if (selectedDis) {
        const codeKey = selectedDis.kode.toLowerCase();
        const nameKeywords = selectedDis.nama
          .toLowerCase()
          .replace(/[()&/]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length >= 3 && !['dan', 'atau', 'ragam', 'disabilitas', 'untuk'].includes(w));
        matchesCategory = evContent.includes(codeKey) || nameKeywords.some(w => evContent.includes(w));
      } else {
        const firstWord = selectedCategory.toLowerCase().split(' ')[0];
        matchesCategory = evContent.includes(firstWord);
      }
    }
    const matchesSearch = searchQuery.trim() === ''
      ? true
      : ev.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.kota.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.mitraOrg.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenDetail = (ev: TrainingProposal) => {
    setActiveModalEvent(ev);
    setModalStep('detail');
    setLastRegisteredParticipant(null);
    setNamaLengkap('');
    setNoWa('');
    setEmail('');
    setUsia('');
    setCatatanKhusus('');
    setKebutuhanFasilitas([]);
  };

  const toggleFasilitas = (item: string) => {
    setKebutuhanFasilitas(prev => 
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    );
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalEvent || !namaLengkap.trim() || !noWa.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeModalEvent.id,
          namaLengkap: namaLengkap.trim(),
          noWa: noWa.trim(),
          email: email.trim() || undefined,
          usia: parseInt(usia) || 25,
          kategoriDisabilitas,
          kebutuhanFasilitas,
          catatanKhusus: catatanKhusus.trim(),
        }),
      });

      const data = await response.json();
      const participantObj: Participant = data.participant || data;
      if (response.ok && (data.participant || data.success)) {
        setLastRegisteredParticipant(participantObj);
        onRegisterSuccess(participantObj);
        if (activeModalEvent) {
          setActiveModalEvent(prev => prev ? {
            ...prev,
            jumlahPendaftar: (Number(prev.jumlahPendaftar) || 0) + 1,
          } : null);
        }
        setModalStep('question_next_event');
      } else {
        alert(data.error || 'Terjadi kendala saat menyimpan pendaftaran.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim formulir pendaftaran. Silakan periksa koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setActiveModalEvent(null);
    setModalStep('detail');
    if (onClearSelectedEventId) onClearSelectedEventId();
  };

  const handleChooseAnotherEvent = () => {
    setActiveModalEvent(null);
    setModalStep('detail');
    if (onClearSelectedEventId) onClearSelectedEventId();
  };

  const handleFinishedRegistration = () => {
    setModalStep('finished_status');
  };

  return (
    <>
      {/* Intro Header */}
      <div className="mb-6 sm:mb-10 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl md:text-[36px] font-semibold text-on-surface tracking-tight leading-tight mb-2 sm:mb-3">
          Temukan Pelatihan Al-Quran<br />yang Tepat Untuk Anda.
        </h1>
        <p className="text-xs sm:text-[14px] md:text-[15px] text-on-surface-variant font-medium">
          Daftar program belajar yang inklusif, ramah disabilitas, dan didampingi langsung oleh ahli bersertifikat nasional.
        </p>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-on-surface text-surface' 
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-80 md:ml-auto">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px] sm:text-[20px]">search</span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lokasi atau nama program..." 
            className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-full text-xs sm:text-[14px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Course Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4">event_busy</span>
          <h3 className="font-semibold text-on-surface text-[16px]">Tidak ada jadwal kegiatan ditemukan</h3>
          <p className="text-[14px] text-on-surface-variant mt-2 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau pilih kategori pelatihan lain.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Semua');
              setSearchQuery('');
            }}
            className="mt-6 px-6 py-2.5 text-[14px] font-semibold text-primary bg-primary-container hover:bg-primary-container/80 rounded-full transition-colors cursor-pointer"
          >
            Tampilkan Seluruh Jadwal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 w-full">
          {filteredEvents.map((event) => {
            const kuotaMax = event.kuotaDisetujui || event.targetDanKuotaPeserta;
            const sisaKuota = Math.max(0, kuotaMax - event.jumlahPendaftar);
            const isAlmostFull = sisaKuota <= 5 && sisaKuota > 0;
            const isFull = sisaKuota === 0;

            return (
              <div key={event.id} className="group bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
                <div className="h-44 bg-surface-container relative overflow-hidden">
                  {event.fotoDokumentasi && event.fotoDokumentasi.length > 0 ? (
                    <>
                      <img
                        src={event.fotoDokumentasi[0]}
                        alt={event.namaKegiatan}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white rounded-md text-[10px] font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">photo_library</span>
                          <span>{event.fotoDokumentasi.length} Dokumentasi</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Decorative placeholder pattern based on design system colors */}
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #005a71 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                      <div className="absolute inset-4 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[48px] text-outline-variant/50">menu_book</span>
                      </div>
                    </>
                  )}

                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 bg-surface-container-lowest/90 backdrop-blur-sm rounded-md text-[11px] font-bold text-primary tracking-wide uppercase shadow-sm">
                      {event.jenisEvent}
                    </span>
                  </div>
                  {isFull ? (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-1 bg-error-container text-on-error-container rounded-md text-[11px] font-bold tracking-wide uppercase shadow-sm">
                        Penuh
                      </span>
                    </div>
                  ) : isAlmostFull ? (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-1 bg-tertiary-container text-on-tertiary-container rounded-md text-[11px] font-bold tracking-wide uppercase shadow-sm">
                        Sisa {sisaKuota}
                      </span>
                    </div>
                  ) : null}
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-[18px] font-semibold text-on-surface leading-tight mb-2 group-hover:text-primary transition-colors">
                    {event.namaKegiatan}
                  </h3>
                  <p className="text-[13px] text-on-surface-variant line-clamp-2 mb-5">
                    {event.deskripsiPelatihan}
                  </p>
                  
                  <div className="mt-auto space-y-2.5">
                    <div className="flex items-center gap-2.5 text-[12px] text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span className="truncate">{event.kota} ({event.lokasiDanAlamat})</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[12px] text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
                      <span>{event.tanggalKegiatan}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[12px] text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-[16px] text-outline">corporate_fare</span>
                      <span className="truncate">{event.mitraOrg}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleOpenDetail(event)}
                    className="mt-6 w-full py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[13px] font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    Daftar Sekarang
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL (Unchanged logic, just styled to match) */}
      {activeModalEvent && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-xl sm:rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-xl p-4 sm:p-6 md:p-8 border border-outline-variant/30 my-3 sm:my-6 transition-all animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 sm:pb-5 border-b border-outline-variant/30 mb-4 sm:mb-6">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-primary bg-primary-container px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md uppercase tracking-wider">
                  {activeModalEvent.jenisEvent}
                </span>
                <h2 className="text-lg sm:text-[20px] font-semibold text-on-surface leading-snug mt-2 sm:mt-3">
                  {activeModalEvent.namaKegiatan}
                </h2>
                <p className="text-xs sm:text-[13px] text-on-surface-variant mt-1">Penyelenggara: {activeModalEvent.mitraOrg}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 sm:p-1.5 text-outline hover:text-on-surface rounded-full hover:bg-surface-container cursor-pointer transition-colors shrink-0"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">close</span>
              </button>
            </div>

            {/* STEP 1: Detail Kegiatan */}
            {modalStep === 'detail' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Deskripsi Pelatihan
                  </h4>
                  <p className="text-[14px] text-on-surface leading-relaxed">
                    {activeModalEvent.deskripsiPelatihan}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                  <div>
                    <span className="text-[12px] text-outline font-medium">Jadwal:</span>
                    <p className="font-semibold text-on-surface text-[13px] mt-0.5">{activeModalEvent.tanggalKegiatan}</p>
                  </div>
                  <div>
                    <span className="text-[12px] text-outline font-medium">Lokasi:</span>
                    <p className="font-semibold text-on-surface text-[13px] mt-0.5">{activeModalEvent.lokasiDanAlamat}, {activeModalEvent.kota}</p>
                  </div>
                  <div>
                    <span className="text-[12px] text-outline font-medium">Kuota Peserta:</span>
                    <p className="font-semibold text-on-surface text-[13px] mt-0.5">
                      {activeModalEvent.kuotaDisetujui || activeModalEvent.targetDanKuotaPeserta} Peserta ({activeModalEvent.jumlahPendaftar} terisi)
                    </p>
                  </div>
                  <div>
                    <span className="text-[12px] text-outline font-medium">Biaya:</span>
                    <p className="font-semibold text-primary text-[13px] mt-0.5">Gratis (Bersertifikat)</p>
                  </div>
                </div>

                {activeModalEvent.kebutuhanPeserta && activeModalEvent.kebutuhanPeserta.length > 0 && (
                  <div>
                    <h4 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                      Fasilitas Aksesibilitas Disediakan:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeModalEvent.kebutuhanPeserta.map((keb, i) => (
                        <span key={i} className="px-3 py-1 bg-surface-container text-on-surface rounded-full text-[12px] font-medium border border-outline-variant/20">
                          ✓ {keb}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Foto Dokumentasi Kegiatan Event */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">photo_library</span>
                      <span>Foto Dokumentasi Kegiatan</span>
                    </h4>
                    {activeModalEvent.fotoDokumentasi && activeModalEvent.fotoDokumentasi.length > 0 && (
                      <span className="text-[11px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">
                        {activeModalEvent.fotoDokumentasi.length} Foto
                      </span>
                    )}
                  </div>

                  {activeModalEvent.fotoDokumentasi && activeModalEvent.fotoDokumentasi.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {activeModalEvent.fotoDokumentasi.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPreviewImage(imgUrl)}
                          className="relative h-24 rounded-xl overflow-hidden border border-outline-variant/30 cursor-pointer group shadow-sm bg-surface-container-low"
                          title="Klik untuk memperbesar foto"
                        >
                          <img
                            src={imgUrl}
                            alt={`Dokumentasi kegiatan ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[22px]">zoom_in</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 text-center">
                      <span className="material-symbols-outlined text-[24px] text-outline mb-1">add_photo_alternate</span>
                      <p className="text-[12px] text-on-surface-variant">Dokumentasi foto kegiatan akan diunggah oleh mitra penyelenggara.</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-2 border-t border-outline-variant/30 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 text-[13px] font-semibold text-on-surface hover:bg-surface-container rounded-xl cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep('form')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[13px] font-semibold shadow-sm cursor-pointer transition-colors"
                  >
                    <span>Lanjut ke Formulir</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Formulir Pendaftaran */}
            {modalStep === 'form' && (
              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-on-surface mb-1.5">
                    Nama Lengkap Peserta *
                  </label>
                  <input
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Contoh: Ahmad Fadli"
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-on-surface mb-1.5">
                      Nomor WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={noWa}
                      onChange={(e) => setNoWa(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-on-surface mb-1.5">
                      Usia (Tahun)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="99"
                      value={usia}
                      onChange={(e) => setUsia(e.target.value)}
                      placeholder="25"
                      className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-on-surface mb-1.5">
                    Kategori Kebutuhan Khusus *
                  </label>
                  <select
                    value={kategoriDisabilitas}
                    onChange={(e) => setKategoriDisabilitas(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                  >
                    {disabilities && disabilities.length > 0 ? (
                      disabilities.filter(d => d.isAktif).map(d => (
                        <option key={d.id} value={d.kode}>
                          {d.nama} ({d.kategoriUtama})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="tunanetra">Tunanetra (Braille / Audio)</option>
                        <option value="tunarungu">Tunarungu / Tuli (Bahasa Isyarat BISINDO)</option>
                        <option value="tunadaksa">Tuna Daksa (Akses Fisik / Kursi Roda)</option>
                        <option value="intelektual_autisme">Disabilitas Intelektual / Autisme</option>
                        <option value="pendamping_umum">Umum / Guru / Pendamping</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Checklist Kebutuhan Tambahan */}
                {activeModalEvent.kebutuhanPeserta && activeModalEvent.kebutuhanPeserta.length > 0 && (
                  <div>
                    <label className="block text-[13px] font-semibold text-on-surface mb-2">
                      Fasilitas yang Anda Butuhkan (Pilihan):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30">
                      {activeModalEvent.kebutuhanPeserta.map((fasilitas, idx) => {
                        const checked = kebutuhanFasilitas.includes(fasilitas);
                        return (
                          <label 
                            key={idx} 
                            className="flex items-center gap-2.5 text-[13px] text-on-surface font-medium cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleFasilitas(fasilitas)}
                              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                            />
                            <span className="truncate">{fasilitas}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-semibold text-on-surface mb-1.5">
                    Catatan Khusus (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={catatanKhusus}
                    onChange={(e) => setCatatanKhusus(e.target.value)}
                    placeholder="Contoh: Butuh penjemputan dari stasiun atau pendampingan khusus..."
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setModalStep('detail')}
                    className="px-5 py-2.5 text-[13px] font-semibold text-on-surface hover:bg-surface-container rounded-xl cursor-pointer transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[13px] font-semibold disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    {isSubmitting ? 'Mengirim...' : 'Kirim Pendaftaran'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Ingin Mengikuti Event Lainnya? */}
            {modalStep === 'question_next_event' && (
              <div className="py-6 text-center">
                <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <h3 className="text-[20px] font-semibold text-on-surface mb-2">
                  Pendaftaran Berhasil Dikirim
                </h3>
                <p className="text-[14px] text-on-surface-variant max-w-sm mx-auto mb-8">
                  Data Anda untuk kegiatan <strong className="text-on-surface font-semibold">"{activeModalEvent.namaKegiatan}"</strong> telah tercatat.
                </p>

                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 max-w-md mx-auto">
                  <p className="font-semibold text-on-surface text-[15px] mb-2">
                    Apakah Anda ingin mengikuti kegiatan pelatihan lainnya?
                  </p>
                  <p className="text-[13px] text-on-surface-variant mb-6">
                    Pilih "Ya" untuk melihat dan memilih jadwal lainnya, atau "Tidak" jika sudah selesai.
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      onClick={handleChooseAnotherEvent}
                      className="py-2.5 px-5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">replay</span>
                      <span>Ya, Pilih Lainnya</span>
                    </button>
                    <button
                      onClick={handleFinishedRegistration}
                      className="py-2.5 px-5 bg-surface-container-lowest border border-outline hover:bg-surface-container text-on-surface rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">done</span>
                      <span>Tidak, Selesai</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Status Selesai */}
            {modalStep === 'finished_status' && (
              <div className="py-6 text-center">
                <div className="w-16 h-16 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[32px]">task_alt</span>
                </div>
                <h3 className="text-[20px] font-semibold text-on-surface mb-2">
                  Pendaftaran Telah Selesai
                </h3>
                <p className="text-[14px] text-on-surface-variant max-w-sm mx-auto mb-8">
                  Panitia akan memverifikasi dan menghubungi Anda via WhatsApp di nomor <strong className="text-on-surface font-semibold">{lastRegisteredParticipant?.noWa || noWa}</strong>.
                </p>

                {lastRegisteredParticipant && (
                  <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30 text-left max-w-md mx-auto mb-8 text-[13px] space-y-3">
                    <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                      <span className="text-outline font-medium">Nomor Registrasi:</span>
                      <span className="font-mono font-bold text-on-surface">{lastRegisteredParticipant.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline font-medium">Nama:</span>
                      <span className="font-semibold text-on-surface">{lastRegisteredParticipant.namaLengkap}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline font-medium">Kegiatan:</span>
                      <span className="font-semibold text-on-surface truncate max-w-[200px]" title={activeModalEvent.namaKegiatan}>{activeModalEvent.namaKegiatan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline font-medium">Jadwal:</span>
                      <span className="font-semibold text-on-surface">{activeModalEvent.tanggalKegiatan}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCloseModal}
                  className="py-3 px-8 bg-on-surface hover:bg-on-surface/90 text-surface rounded-xl text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  Tutup & Kembali ke Beranda
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPreviewImage && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div 
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-white/80 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer flex items-center gap-1.5 text-[13px]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
              <span>Tutup Preview</span>
            </button>
            <img
              src={selectedPreviewImage}
              alt="Preview Dokumentasi Kegiatan"
              referrerPolicy="no-referrer"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/10"
            />
            <p className="text-white/80 text-[12px] mt-3 font-medium text-center">
              Dokumentasi Resmi Kegiatan Al-Quran Ramah Disabilitas
            </p>
          </div>
        </div>
      )}
    </>
  );
};
