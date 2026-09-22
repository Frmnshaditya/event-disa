import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  QuranCommunity, 
  DisabilityType, 
  TrainingProposal,
  DisabilityMaster
} from '../types.ts';

interface PetaPersebaranProps {
  communities: QuranCommunity[];
  events: TrainingProposal[];
  onSelectEventForRegister?: (eventId: string) => void;
  onAddNewCommunity?: (comm: Partial<QuranCommunity>) => void;
  isSuperAdmin?: boolean;
  isEmbedded?: boolean;
  hideAddButton?: boolean;
  disabilities?: DisabilityMaster[];
  initialCategory?: string;
}

export const PetaPersebaran: React.FC<PetaPersebaranProps> = ({
  communities,
  events,
  onSelectEventForRegister,
  onAddNewCommunity,
  isSuperAdmin = false,
  isEmbedded = false,
  hideAddButton = false,
  disabilities = [],
  initialCategory,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<QuranCommunity | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<TrainingProposal | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New community / mitra form state
  const [newCommName, setNewCommName] = useState('');
  const [newCommYayasan, setNewCommYayasan] = useState('');
  const [newCommMitra, setNewCommMitra] = useState('');
  const [newCommCity, setNewCommCity] = useState('');
  const [newCommProvince, setNewCommProvince] = useState('Jawa Barat');
  const [newCommAddress, setNewCommAddress] = useState('');
  const [newCommLat, setNewCommLat] = useState('-6.9175');
  const [newCommLng, setNewCommLng] = useState('107.6191');
  const [newCommPhone, setNewCommPhone] = useState('');
  const [newCommSantri, setNewCommSantri] = useState('50');
  const [newCommCategory, setNewCommCategory] = useState<DisabilityType[]>(['tunanetra']);
  const [newCommProgram, setNewCommProgram] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');

  // Extract unique provinces
  const provinces = Array.from(new Set(communities.map(c => c.provinsi))).sort();

  // Filtered communities
  const filteredCommunities = communities.filter(c => {
    const matchesCategory = selectedCategory === 'all' 
      ? true 
      : c.kategoriDisabilitas?.some(k => {
          const kStr = String(k).toLowerCase();
          const sStr = selectedCategory.toLowerCase();
          return kStr === sStr || sStr.includes(kStr) || kStr.includes(sStr);
        });
    
    const matchesProvince = selectedProvince === 'all' || c.provinsi === selectedProvince;
    
    const matchesSearch = searchQuery.trim() === '' 
      ? true 
      : c.namaLembaga.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.kota.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.programUnggulan.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesProvince && matchesSearch;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      // Centered on Indonesia
      const map = L.map(mapContainerRef.current, {
        center: [-2.5489, 118.0149],
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update Markers when filter/communities change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();

    filteredCommunities.forEach(c => {
      // Determine marker color based on category
      let markerBg = 'bg-primary';
      let badgeLabel = 'Braille Quran';
      if (c.kategoriDisabilitas.includes('tunarungu')) {
        markerBg = 'bg-secondary';
        badgeLabel = 'Quran Isyarat';
      } else if (c.kategoriDisabilitas.includes('tunadaksa')) {
        markerBg = 'bg-tertiary';
        badgeLabel = 'Ramah Daksa';
      } else if (c.kategoriDisabilitas.includes('intelektual_autisme')) {
        markerBg = 'bg-[#8c4a5c]'; // Custom mapped color for aesthetics
        badgeLabel = 'Ramah Autisme';
      } else if (c.kategoriDisabilitas.includes('multi')) {
        markerBg = 'bg-on-surface';
        badgeLabel = 'Inklusif Lengkap';
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center group cursor-pointer">
            <div class="w-10 h-10 rounded-full ${markerBg} text-white flex items-center justify-center shadow-md border-2 border-surface transform transition-transform group-hover:scale-110">
              <span class="material-symbols-outlined text-[20px]">location_on</span>
            </div>
            <div class="absolute -bottom-1 w-2.5 h-2.5 ${markerBg} rotate-45 border-r-2 border-b-2 border-surface"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([c.latitude, c.longitude], { icon: customIcon });

      // Find events hosted by this community/location
      const activeEvent = events.find(e => 
        (e.isAktif || e.status === 'disetujui') && (e.kota.toLowerCase() === c.kota.toLowerCase() || e.lokasiDanAlamat.toLowerCase().includes(c.namaLembaga.toLowerCase()))
      );

      const popupContent = document.createElement('div');
      popupContent.className = 'p-3.5 max-w-[290px] font-sans';
      const displayName = c.namaYayasan || c.namaLembaga;
      popupContent.innerHTML = `
        <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-800 text-[10px] font-bold uppercase tracking-wider w-fit mb-2">
          <span class="material-symbols-outlined text-[13px]">verified</span>
          <span>Yayasan Mitra Terdaftar</span>
        </div>
        <div class="font-bold text-[15px] text-on-surface leading-tight mb-1">${displayName}</div>
        ${c.namaMitra ? `<div class="text-[12px] font-semibold text-primary mb-1 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">person</span><span>Mitra: ${c.namaMitra}</span></div>` : ''}
        <div class="text-[12px] text-on-surface-variant mb-2">${c.kota}, ${c.provinsi}</div>
        <div class="inline-block px-2.5 py-1 text-[10px] font-bold text-white rounded-md uppercase tracking-wider ${markerBg} mb-3">
          ${badgeLabel}
        </div>
        <p class="text-[12px] text-on-surface line-clamp-2 mb-3 leading-relaxed">${c.deskripsi}</p>
        <div class="text-[12px] font-semibold text-primary mb-3 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px]">group</span>
          ${c.jumlahSantri} Santri Difabel Binaan
        </div>
        ${activeEvent ? `
          <div class="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[12px] text-amber-900 font-medium mb-3">
            <div class="flex items-center gap-1.5 text-amber-800 font-bold mb-1">
              <span class="material-symbols-outlined text-[16px] text-amber-600">stars</span>
              <span>Event Pelatihan Terbuka:</span>
            </div>
            <div class="font-semibold text-on-surface line-clamp-2">${activeEvent.namaKegiatan}</div>
            <div class="text-[11px] text-on-surface-variant mt-1">📅 ${activeEvent.tanggalKegiatan}</div>
          </div>
        ` : ''}
      `;

      if (activeEvent) {
        const eventDetailBtn = document.createElement('button');
        eventDetailBtn.className = 'w-full py-2 mb-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[12px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm';
        eventDetailBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">info</span><span>Lihat Penjelasan Event</span>';
        eventDetailBtn.onclick = () => {
          setSelectedEventModal(activeEvent);
        };
        popupContent.appendChild(eventDetailBtn);

        if (onSelectEventForRegister) {
          const registerBtn = document.createElement('button');
          registerBtn.className = 'w-full py-2 mb-2 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[12px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm';
          registerBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">how_to_reg</span><span>Daftar Pelatihan Ini</span>';
          registerBtn.onclick = () => {
            onSelectEventForRegister(activeEvent.id);
          };
          popupContent.appendChild(registerBtn);
        }
      }

      const detailBtn = document.createElement('button');
      detailBtn.className = 'w-full py-2 bg-on-surface hover:bg-on-surface/90 text-surface rounded-xl text-[12px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5';
      detailBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">domain</span><span>Lihat Profil Yayasan Mitra</span>';
      detailBtn.onclick = () => {
        setSelectedCommunity(c);
      };
      popupContent.appendChild(detailBtn);

      marker.bindPopup(popupContent, {
        className: 'custom-popup-wrapper'
      });
      marker.on('click', () => {
        setSelectedCommunity(c);
      });

      markersGroup.addLayer(marker);
    });

    // Also plot direct prominent EVENT MARKERS for all approved/active events
    const activeEventsList = events.filter(e => (e.isAktif || e.status === 'disetujui') && e.latitude && e.longitude);
    activeEventsList.forEach(ev => {
      const eventIcon = L.divIcon({
        className: 'custom-event-marker',
        html: `
          <div class="relative flex items-center justify-center group cursor-pointer animate-pulse">
            <div class="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-lg border-2 border-white transform transition-transform group-hover:scale-125">
              <span class="material-symbols-outlined text-[22px]">event_available</span>
            </div>
            <div class="absolute -bottom-1.5 w-3 h-3 bg-amber-600 rotate-45 border-r-2 border-b-2 border-white"></div>
            <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[9px] font-bold text-white flex items-center justify-center border border-white shadow-sm">
              ★
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });

      const eventMarker = L.marker([ev.latitude, ev.longitude], { 
        icon: eventIcon,
        zIndexOffset: 1200 
      });

      const eventPopup = document.createElement('div');
      eventPopup.className = 'p-3.5 max-w-[290px] font-sans';
      eventPopup.innerHTML = `
        <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 text-[10px] font-bold uppercase tracking-wider w-fit mb-2">
          <span class="material-symbols-outlined text-[13px]">verified</span>
          <span>Agenda Pelatihan Disetujui</span>
        </div>
        <div class="font-bold text-[15px] text-on-surface leading-snug mb-1">${ev.namaKegiatan}</div>
        <div class="text-[12px] text-on-surface-variant font-medium mb-2 flex items-center gap-1">
          <span class="material-symbols-outlined text-[15px]">corporate_fare</span>
          <span>${ev.mitraOrg || ev.mitraName}</span>
        </div>
        <div class="space-y-1 text-[12px] text-on-surface-variant mb-3 bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[15px] text-amber-600">calendar_today</span>
            <span class="font-medium text-on-surface">${ev.tanggalKegiatan}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[15px] text-amber-600">location_on</span>
            <span class="truncate">${ev.kota}, ${ev.provinsi}</span>
          </div>
          <div class="flex items-center gap-1.5 text-primary font-semibold">
            <span class="material-symbols-outlined text-[15px]">group</span>
            <span>${ev.jumlahPendaftar || 0} Terdaftar / ${ev.kuotaDisetujui || ev.targetDanKuotaPeserta} Kuota</span>
          </div>
        </div>
        <p class="text-[12px] text-on-surface line-clamp-2 mb-3 leading-relaxed">${ev.deskripsiPelatihan}</p>
      `;

      const explainBtn = document.createElement('button');
      explainBtn.className = 'w-full py-2.5 mb-2 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[12px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm';
      explainBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">info</span><span>Buka Penjelasan Event Lengkap</span>';
      explainBtn.onclick = () => {
        setSelectedEventModal(ev);
      };
      eventPopup.appendChild(explainBtn);

      if (onSelectEventForRegister) {
        const regBtn = document.createElement('button');
        regBtn.className = 'w-full py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-[12px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5';
        regBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">how_to_reg</span><span>Daftar Pelatihan Ini</span>';
        regBtn.onclick = () => {
          onSelectEventForRegister(ev.id);
        };
        eventPopup.appendChild(regBtn);
      }

      eventMarker.bindPopup(eventPopup, {
        className: 'custom-popup-wrapper'
      });
      eventMarker.on('click', () => {
        setSelectedEventModal(ev);
      });

      markersGroup.addLayer(eventMarker);
    });
  }, [filteredCommunities, events, onSelectEventForRegister]);

  const handleFocusCommunity = (comm: QuranCommunity) => {
    setSelectedCommunity(comm);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([comm.latitude, comm.longitude], 13, {
        duration: 1.2,
      });
    }
  };

  const handleSubmitNewCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName || !newCommAddress || !newCommCity) return;

    if (onAddNewCommunity) {
      onAddNewCommunity({
        namaLembaga: newCommName,
        namaYayasan: newCommYayasan || newCommName,
        namaMitra: newCommMitra || 'Mitra Lembaga',
        kota: newCommCity,
        provinsi: newCommProvince,
        alamatLengkap: newCommAddress,
        latitude: parseFloat(newCommLat) || -6.2,
        longitude: parseFloat(newCommLng) || 106.8,
        kontakWa: newCommPhone || '081234567890',
        jumlahSantri: parseInt(newCommSantri) || 25,
        kategoriDisabilitas: newCommCategory,
        programUnggulan: newCommProgram || 'Pengajaran Al-Quran Disabilitas',
        deskripsi: newCommDesc || 'Lembaga dakwah quran ramah disabilitas.',
        fasilitasTersedia: ['Mushaf Ramah Disabilitas', 'Pengajar Bersertifikat'],
        verified: true,
      });
    }

    setShowAddModal(false);
    // Reset form
    setNewCommName('');
    setNewCommYayasan('');
    setNewCommMitra('');
    setNewCommAddress('');
    setNewCommCity('');
    setNewCommPhone('');
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-md mb-3 tracking-wide uppercase">
            <span className="material-symbols-outlined text-[14px]">public</span>
            {isEmbedded ? 'Peta Persebaran Mitra & Yayasan Quran' : 'Peta Persebaran Mitra & Yayasan'}
          </div>
          <h2 className="text-[26px] md:text-[30px] font-semibold text-on-surface tracking-tight leading-tight">
            Sentra Pembelajaran & Yayasan Mitra Al-Quran Sahabat Disabilitas
          </h2>
          <p className="text-on-surface-variant text-[14px] md:text-[15px] mt-1.5 font-medium max-w-2xl">
            Setiap mitra resmi memiliki yayasan atau lembaga Al-Quran inklusif tersendiri dengan fasilitas terverifikasi bagi sahabat disabilitas dan masyarakat umum.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEmbedded && (
            <button
              onClick={() => {
                document.getElementById('dashboard-event-pelatihan')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface rounded-xl text-[12px] font-semibold transition-colors border border-outline-variant/40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              Ke Dashboard Event
            </button>
          )}

          {!isEmbedded && !hideAddButton && isSuperAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[12px] font-semibold transition-colors shadow-xs self-start md:self-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Tambah Mitra & Yayasan Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search box */}
          <div className="md:col-span-4 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama lembaga, kota, program..."
              className="w-full pl-11 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-[14px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-5 flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                selectedCategory === 'all'
                  ? 'bg-on-surface text-surface border-on-surface'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:border-outline hover:text-on-surface'
              }`}
            >
              Semua Disabilitas ({communities.length})
            </button>

            {disabilities && disabilities.length > 0 ? (
              disabilities.filter(d => d.isAktif).map(d => {
                const isSelected = selectedCategory.toLowerCase() === d.kode.toLowerCase();
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedCategory(d.kode)}
                    className={`px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:border-outline hover:text-on-surface'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: isSelected ? '#ffffff' : (d.warnaHex || '#005a71') }}
                    />
                    <span>{d.nama.split('(')[0].trim()}</span>
                  </button>
                );
              })
            ) : (
              <>
                <button
                  onClick={() => setSelectedCategory('tunanetra')}
                  className={`px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer border ${
                    selectedCategory === 'tunanetra'
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:border-outline hover:text-on-surface'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedCategory === 'tunanetra' ? 'bg-on-primary' : 'bg-primary'}`} />
                  Quran Braille (Netra)
                </button>
                <button
                  onClick={() => setSelectedCategory('tunarungu')}
                  className={`px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer border ${
                    selectedCategory === 'tunarungu'
                      ? 'bg-secondary text-on-secondary border-secondary'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:border-outline hover:text-on-surface'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedCategory === 'tunarungu' ? 'bg-on-secondary' : 'bg-secondary'}`} />
                  Quran Isyarat (Tuli)
                </button>
                <button
                  onClick={() => setSelectedCategory('tunadaksa')}
                  className={`px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer border ${
                    selectedCategory === 'tunadaksa'
                      ? 'bg-tertiary text-on-tertiary border-tertiary'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:border-outline hover:text-on-surface'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedCategory === 'tunadaksa' ? 'bg-on-tertiary' : 'bg-tertiary'}`} />
                  Tuna Daksa
                </button>
              </>
            )}
          </div>

          {/* Province selector */}
          <div className="md:col-span-3">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-[14px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">Seluruh Indonesia ({provinces.length} Provinsi)</option>
              {provinces.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Map & Interactive Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden relative">
            {/* Map Canvas */}
            <div 
              ref={mapContainerRef} 
              className="w-full h-[540px] lg:h-[580px] xl:h-[640px] z-10"
              style={{ minHeight: '540px' }}
            />

            {/* Floating legend */}
            <div className="absolute bottom-5 left-5 z-[400] bg-surface-container-lowest/95 backdrop-blur-md p-4 rounded-xl border border-outline-variant/30 shadow-lg text-[12px]">
              <p className="font-bold text-on-surface mb-2.5 uppercase tracking-wider text-[10px]">Petunjuk Kategori Pin:</p>
              <div className="space-y-2 font-medium text-on-surface-variant">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-primary border border-surface shadow-sm" />
                  <span>Tunanetra (Quran Braille & Audio)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-secondary border border-surface shadow-sm" />
                  <span>Tunarungu / Tuli (Quran Bahasa Isyarat)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-tertiary border border-surface shadow-sm" />
                  <span>Tunadaksa / Ramah Kursi Roda</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#8c4a5c] border border-surface shadow-sm" />
                  <span>Autisme & Disabilitas Intelektual</span>
                </div>
              </div>
            </div>

            {/* Total Pins counter */}
            <div className="absolute top-5 right-5 z-[400] bg-on-surface/90 backdrop-blur-md text-surface px-4 py-2 rounded-xl text-[12px] font-bold shadow-lg flex items-center gap-2 tracking-wide uppercase">
              <span className="material-symbols-outlined text-[16px] text-primary-container">location_city</span>
              {filteredCommunities.length} Titik Mitra & Yayasan
            </div>
          </div>
        </div>

        {/* Sidebar: Detail / Community List */}
        <div className="lg:col-span-4 space-y-4">
          {selectedCommunity ? (
            /* Detailed Community Card */
            <div className="bg-surface-container-lowest rounded-2xl border border-primary/30 shadow-sm p-6 relative animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setSelectedCommunity(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold uppercase tracking-wide mb-2">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Mitra & Yayasan Terverifikasi
              </div>

              <h3 className="text-[20px] font-semibold text-on-surface leading-snug mb-1">
                {selectedCommunity.namaYayasan || selectedCommunity.namaLembaga}
              </h3>

              {selectedCommunity.namaMitra && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[12px] font-semibold mb-3">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  <span>Penanggung Jawab Mitra: {selectedCommunity.namaMitra}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[13px] text-on-surface-variant font-medium mb-4">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>{selectedCommunity.kota}, {selectedCommunity.provinsi}</span>
              </div>

              <div className="py-4 border-t border-outline-variant/20 mb-4">
                <p className="text-[13px] text-on-surface leading-relaxed">
                  {selectedCommunity.deskripsi}
                </p>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4 mb-4 border border-outline-variant/20 space-y-3 text-[12px]">
                <div>
                  <span className="text-outline font-medium block mb-0.5">Program Unggulan:</span>
                  <p className="font-semibold text-on-surface">{selectedCommunity.programUnggulan}</p>
                </div>
                <div>
                  <span className="text-outline font-medium block mb-0.5">Total Santri Difabel Binaan:</span>
                  <p className="font-semibold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    {selectedCommunity.jumlahSantri} Santri
                  </p>
                </div>
              </div>

              {/* Facilities */}
              <div className="mb-5">
                <p className="text-[12px] font-bold text-on-surface uppercase tracking-wider mb-2.5">Fasilitas Aksesibilitas:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCommunity.fasilitasTersedia.map((fas, i) => (
                    <span key={i} className="px-2.5 py-1 bg-surface-container text-on-surface border border-outline-variant/20 rounded-md text-[11px] font-medium">
                      ✓ {fas}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Events Hosted by or near this community */}
              {(() => {
                const activeEvents = events.filter(e => 
                  e.isAktif && (e.kota.toLowerCase() === selectedCommunity.kota.toLowerCase() || e.lokasiDanAlamat.toLowerCase().includes(selectedCommunity.namaLembaga.toLowerCase()))
                );

                if (activeEvents.length > 0) {
                  return (
                    <div className="p-4 bg-primary-container/30 rounded-xl border border-primary/20 mb-5">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-primary mb-3 uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[16px]">stars</span>
                        Pelatihan Terbuka di Sini
                      </div>
                      {activeEvents.map(ev => (
                        <div key={ev.id} className="bg-surface-container-lowest p-3 rounded-xl border border-primary/20 mb-2.5 last:mb-0 shadow-sm">
                          <p className="text-[13px] font-semibold text-on-surface leading-tight mb-1.5">{ev.namaKegiatan}</p>
                          <p className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            {ev.tanggalKegiatan}
                          </p>
                          {onSelectEventForRegister && (
                            <button
                              onClick={() => onSelectEventForRegister(ev.id)}
                              className="mt-3 w-full py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
                            >
                              Daftar Pelatihan Ini
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Actions: Hubungi WA & Buka Alamat */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-outline-variant/20">
                <a
                  href={`https://wa.me/62${selectedCommunity.kontakWa.replace(/^0/, '')}?text=Assalamu'alaikum,%20saya%20ingin%20bertanya%20mengenai%20pembelajaran%20Quran%20disabilitas%20di%20${encodeURIComponent(selectedCommunity.namaLembaga)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-xl text-[12px] font-semibold transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Hubungi WA
                </a>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCommunity.namaLembaga + ' ' + selectedCommunity.alamatLengkap)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/50 text-on-surface rounded-xl text-[12px] font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Buka Maps
                </a>
              </div>
            </div>
          ) : (
            /* Roster List of Communities */
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 max-h-[540px] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-4">
                <h3 className="font-semibold text-[15px] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">corporate_fare</span>
                  Daftar Mitra & Yayasan ({filteredCommunities.length})
                </h3>
                <span className="text-[11px] text-outline font-medium uppercase tracking-wider">Klik untuk fokus</span>
              </div>

              <div className="overflow-y-auto space-y-3 pr-2 flex-1 custom-scrollbar">
                {filteredCommunities.length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant text-[13px]">
                    Tidak ada mitra atau yayasan yang cocok dengan filter pencarian ini.
                  </div>
                ) : (
                  filteredCommunities.map((comm) => (
                    <div
                      key={comm.id}
                      onClick={() => handleFocusCommunity(comm)}
                      className="p-4 rounded-xl border border-outline-variant/30 hover:border-primary/50 bg-surface-container-low hover:bg-primary-container/20 cursor-pointer transition-all text-left group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h4 className="text-[14px] font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors">
                          {comm.namaYayasan || comm.namaLembaga}
                        </h4>
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface whitespace-nowrap">
                          {comm.kategoriDisabilitas.includes('tunanetra') && 'Braille'}
                          {comm.kategoriDisabilitas.includes('tunarungu') && 'Isyarat'}
                          {comm.kategoriDisabilitas.includes('tunadaksa') && 'Daksa'}
                          {comm.kategoriDisabilitas.includes('multi') && 'Inklusif'}
                        </span>
                      </div>
                      {comm.namaMitra && (
                        <p className="text-[11px] text-primary font-medium flex items-center gap-1 mb-1.5">
                          <span className="material-symbols-outlined text-[13px]">person</span>
                          <span>Mitra: {comm.namaMitra}</span>
                        </p>
                      )}
                      <p className="text-[12px] text-on-surface-variant flex items-center gap-1.5 mb-2 font-medium">
                        <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
                        {comm.kota}, {comm.provinsi}
                      </p>
                      <p className="text-[12px] text-on-surface font-medium line-clamp-1 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-primary">stars</span>
                        {comm.programUnggulan}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tambah Lembaga Baru (Superadmin) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 md:p-8 border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-5 border-b border-outline-variant/30 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_business</span>
                </div>
                <h3 className="font-semibold text-on-surface text-[20px]">Tambah Mitra & Yayasan Baru</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 text-outline hover:text-on-surface rounded-full hover:bg-surface-container cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitNewCommunity} className="space-y-5 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-on-surface mb-1.5">Nama Yayasan / Lembaga *</label>
                  <input
                    type="text"
                    required
                    value={newCommYayasan}
                    onChange={(e) => {
                      setNewCommYayasan(e.target.value);
                      if (!newCommName) setNewCommName(e.target.value);
                    }}
                    placeholder="Contoh: Yayasan Sahabat Quran Braille"
                    className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1.5">Penanggung Jawab Mitra *</label>
                  <input
                    type="text"
                    required
                    value={newCommMitra}
                    onChange={(e) => setNewCommMitra(e.target.value)}
                    placeholder="Contoh: Ustadz Ahmad Fauzi"
                    className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1.5">Nama Sentra / Cabang Lembaga *</label>
                <input
                  type="text"
                  required
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  placeholder="Contoh: Sentra Quran Disabilitas Bandung"
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-on-surface mb-1.5">Provinsi *</label>
                  <input
                    type="text"
                    required
                    value={newCommProvince}
                    onChange={(e) => setNewCommProvince(e.target.value)}
                    placeholder="Jawa Barat"
                    className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1.5">Kota / Kabupaten *</label>
                  <input
                    type="text"
                    required
                    value={newCommCity}
                    onChange={(e) => setNewCommCity(e.target.value)}
                    placeholder="Kota Bandung"
                    className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1.5">Alamat Lengkap *</label>
                <textarea
                  required
                  rows={2}
                  value={newCommAddress}
                  onChange={(e) => setNewCommAddress(e.target.value)}
                  placeholder="Jl. Sukajadi No. 10..."
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-on-surface mb-1.5">Latitude</label>
                  <input
                    type="text"
                    value={newCommLat}
                    onChange={(e) => setNewCommLat(e.target.value)}
                    placeholder="-6.9175"
                    className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl font-mono text-[13px] focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1.5">Longitude</label>
                  <input
                    type="text"
                    value={newCommLng}
                    onChange={(e) => setNewCommLng(e.target.value)}
                    placeholder="107.6191"
                    className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl font-mono text-[13px] focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-on-surface mb-1.5">No WhatsApp Kontak</label>
                  <input
                    type="text"
                    value={newCommPhone}
                    onChange={(e) => setNewCommPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-on-surface mb-1.5">Perkiraan Santri Difabel</label>
                  <input
                    type="number"
                    value={newCommSantri}
                    onChange={(e) => setNewCommSantri(e.target.value)}
                    placeholder="50"
                    className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-2">Kategori Disabilitas</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { key: 'tunanetra', label: 'Tunanetra (Braille)' },
                    { key: 'tunarungu', label: 'Tunarungu (Isyarat)' },
                    { key: 'tunadaksa', label: 'Tunadaksa' },
                    { key: 'intelektual_autisme', label: 'Autisme / Intelektual' },
                    { key: 'multi', label: 'Multi-Disabilitas' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 text-[13px] bg-surface-container-low hover:bg-surface-container px-3 py-2 rounded-xl border border-outline-variant/40 cursor-pointer transition-colors font-medium text-on-surface select-none">
                      <input
                        type="checkbox"
                        checked={newCommCategory.includes(item.key as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCommCategory([...newCommCategory, item.key as any]);
                          } else {
                            setNewCommCategory(newCommCategory.filter(k => k !== item.key));
                          }
                        }}
                        className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1.5">Program Unggulan</label>
                <input
                  type="text"
                  value={newCommProgram}
                  onChange={(e) => setNewCommProgram(e.target.value)}
                  placeholder="Contoh: Daurah Tahfidz Braille 30 Juz"
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1.5">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  placeholder="Penjelasan profil lembaga..."
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-on-surface font-semibold hover:bg-surface-container rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Simpan ke Peta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP PENJELASAN EVENT LENGKAP */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl max-w-2xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline-variant/20 mb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 border border-amber-500/30">
                    <span className="material-symbols-outlined text-[15px] text-amber-600">verified</span>
                    Agenda Pelatihan Terbuka
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface border border-outline-variant/30">
                    {selectedEventModal.jenisEvent}
                  </span>
                </div>
                <h3 className="text-[20px] font-semibold text-on-surface leading-snug">
                  {selectedEventModal.namaKegiatan}
                </h3>
                <p className="text-[13px] text-on-surface-variant flex items-center gap-1.5 mt-1 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-primary">corporate_fare</span>
                  <span>Diselenggarakan oleh: <strong>{selectedEventModal.mitraOrg || selectedEventModal.mitraName}</strong></span>
                </p>
              </div>

              <button
                onClick={() => setSelectedEventModal(null)}
                className="p-1.5 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                title="Tutup jendela penjelasan"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">
                  Waktu Pelaksanaan
                </span>
                <div className="text-[13px] font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                  <span>{selectedEventModal.tanggalKegiatan}</span>
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">
                  Lokasi & Wilayah
                </span>
                <div className="text-[13px] font-semibold text-on-surface truncate flex items-center gap-1.5" title={`${selectedEventModal.kota}, ${selectedEventModal.provinsi}`}>
                  <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                  <span className="truncate">{selectedEventModal.kota}, {selectedEventModal.provinsi}</span>
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">
                  Kapasitas Kuota
                </span>
                <div className="text-[13px] font-semibold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                  <span>{selectedEventModal.jumlahPendaftar || 0} / {selectedEventModal.kuotaDisetujui || selectedEventModal.targetDanKuotaPeserta} Peserta</span>
                </div>
              </div>
            </div>

            {/* Content: Penjelasan Lengkap & Fasilitas */}
            <div className="space-y-4 mb-6">
              {/* Alamat Detail */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 text-[13px]">
                  <span className="font-semibold text-on-surface block">Titik Temu & Alamat Lengkap:</span>
                  <span className="text-on-surface-variant">{selectedEventModal.lokasiDanAlamat}</span>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEventModal.lokasiDanAlamat + ' ' + selectedEventModal.kota)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/50 text-on-surface rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">open_in_new</span>
                  <span>Rute Google Maps</span>
                </a>
              </div>

              {/* Deskripsi & Penjelasan Pelatihan */}
              <div>
                <h4 className="text-[14px] font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">menu_book</span>
                  <span>Penjelasan & Rincian Pelatihan:</span>
                </h4>
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 text-[13px] text-on-surface leading-relaxed whitespace-pre-line font-normal">
                  {selectedEventModal.deskripsiPelatihan}
                </div>
              </div>

              {/* Fasilitas & Aksesibilitas */}
              {selectedEventModal.kebutuhanPeserta && selectedEventModal.kebutuhanPeserta.length > 0 && (
                <div>
                  <h4 className="text-[13px] font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">accessible</span>
                    <span>Fasilitas & Pendampingan yang Disediakan:</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEventModal.kebutuhanPeserta.map((keb, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-lg text-[12px] font-semibold text-on-surface border border-outline-variant/30"
                      >
                        <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                        <span>{keb}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const link = selectedEventModal.linkPendaftaran || window.location.origin + `/#daftar/${selectedEventModal.id}`;
                  navigator.clipboard.writeText(link);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 3000);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-outline-variant/50 text-[12px] font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">
                  {copiedLink ? 'done' : 'content_copy'}
                </span>
                <span>{copiedLink ? 'Link Tersalin!' : 'Salin Tautan Registrasi'}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEventModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 text-[13px] font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Tutup
                </button>

                {onSelectEventForRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedEventModal.id;
                      setSelectedEventModal(null);
                      onSelectEventForRegister(id);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-[13px] font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    <span>Daftar Pelatihan Sekarang</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
