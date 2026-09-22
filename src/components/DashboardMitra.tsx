import React, { useState } from 'react';
import { 
  TrainingProposal, 
  Participant, 
  User 
} from '../types.ts';

interface DashboardMitraProps {
  currentUser: User;
  proposals: TrainingProposal[];
  participants: Participant[];
  onProposalCreated: (newProposal: TrainingProposal) => void;
  onProposalUpdated: (updatedProposal: TrainingProposal) => void;
  onOpenChangePassword?: () => void;
}

export const DashboardMitra: React.FC<DashboardMitraProps> = ({
  currentUser,
  proposals,
  participants,
  onProposalCreated,
  onProposalUpdated,
  onOpenChangePassword,
}) => {
  const [activeTab, setActiveTab] = useState<'daftar' | 'ajukan' | 'peserta'>('daftar');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mitra's proposals only
  const myProposals = proposals.filter(p => p.mitraId === currentUser.id || p.mitraOrg === currentUser.organizationName);

  // Form State for "Ajukan Permintaan Pelatihan" (or "Perbaiki Data" when rejected)
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [jenisEvent, setJenisEvent] = useState('Pelatihan Guru Quran Braille');
  const [deskripsiPelatihan, setDeskripsiPelatihan] = useState('');
  const [lokasiDanAlamat, setLokasiDanAlamat] = useState('');
  const [provinsi, setProvinsi] = useState(currentUser.province || 'Jawa Barat');
  const [kota, setKota] = useState(currentUser.city || 'Kota Bandung');
  const [latitude, setLatitude] = useState('-6.9175');
  const [longitude, setLongitude] = useState('107.6191');
  const [tanggalKegiatan, setTanggalKegiatan] = useState('');
  const [targetDanKuotaPeserta, setTargetDanKuotaPeserta] = useState('50');
  const [kebutuhanPeserta, setKebutuhanPeserta] = useState<string[]>([
    'Mushaf Quran Braille Standar LPMQ',
    'Relawan Pendamping Mobilitas',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProposalForParticipants, setSelectedProposalForParticipants] = useState<string>('all');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartPerbaikiData = (proposal: TrainingProposal) => {
    setEditingProposalId(proposal.id);
    setNamaKegiatan(proposal.namaKegiatan);
    setJenisEvent(proposal.jenisEvent);
    setDeskripsiPelatihan(proposal.deskripsiPelatihan);
    setLokasiDanAlamat(proposal.lokasiDanAlamat);
    setProvinsi(proposal.provinsi);
    setKota(proposal.kota);
    setLatitude(proposal.latitude.toString());
    setLongitude(proposal.longitude.toString());
    setTanggalKegiatan(proposal.tanggalKegiatan);
    setTargetDanKuotaPeserta(proposal.targetDanKuotaPeserta.toString());
    setKebutuhanPeserta(proposal.kebutuhanPeserta);
    setActiveTab('ajukan');
  };

  const handleResetForm = () => {
    setEditingProposalId(null);
    setNamaKegiatan('');
    setDeskripsiPelatihan('');
    setLokasiDanAlamat('');
    setTanggalKegiatan('');
    setTargetDanKuotaPeserta('50');
    setKebutuhanPeserta(['Mushaf Quran Braille Standar LPMQ']);
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingProposalId) {
        // Revision of rejected proposal (Perbaiki Data -> Kirim Permintaan ulang)
        const res = await fetch(`/api/events/${editingProposalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaKegiatan,
            jenisEvent,
            deskripsiPelatihan,
            lokasiDanAlamat,
            provinsi,
            kota,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            tanggalKegiatan,
            targetDanKuotaPeserta: parseInt(targetDanKuotaPeserta),
            kebutuhanPeserta,
          }),
        });
        const data = await res.json();
        if (res.ok && data.proposal) {
          onProposalUpdated(data.proposal);
          handleResetForm();
          setActiveTab('daftar');
        } else {
          alert(data.error || 'Gagal merevisi permintaan');
        }
      } else {
        // New Proposal
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mitraId: currentUser.id,
            mitraName: currentUser.name,
            mitraOrg: currentUser.organizationName || 'Lembaga Mitra',
            namaKegiatan,
            jenisEvent,
            deskripsiPelatihan,
            lokasiDanAlamat,
            provinsi,
            kota,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            tanggalKegiatan,
            targetDanKuotaPeserta: parseInt(targetDanKuotaPeserta),
            kebutuhanPeserta,
          }),
        });
        const data = await res.json();
        if (res.ok && data.proposal) {
          onProposalCreated(data.proposal);
          handleResetForm();
          setActiveTab('daftar');
        } else {
          alert(data.error || 'Gagal mengirim permintaan');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter participants for approved proposals
  const myApprovedEventIds = myProposals.filter(p => p.status === 'disetujui').map(p => p.id);
  const myParticipants = participants.filter(pt => {
    if (!myApprovedEventIds.includes(pt.eventId)) return false;
    if (selectedProposalForParticipants !== 'all') {
      return pt.eventId === selectedProposalForParticipants;
    }
    return true;
  });

  return (
    <>
      {/* Header Info */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 md:p-8 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-container text-on-primary-container text-[11px] font-bold rounded-md mb-3 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Portal Mitra Penyelenggara
          </div>
          <h1 className="text-[24px] md:text-[28px] font-semibold text-on-surface tracking-tight leading-tight">
            {currentUser.organizationName || 'Dashboard Mitra Pelatihan'}
          </h1>
          <p className="text-on-surface-variant text-[14px] mt-1.5 font-medium">
            Penanggung Jawab: <strong className="text-on-surface">{currentUser.name}</strong> • Wilayah: {currentUser.city}, {currentUser.province}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {onOpenChangePassword && (
            <button
              onClick={onOpenChangePassword}
              className="inline-flex items-center gap-2 px-4 py-3 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/40 rounded-xl text-[13px] font-semibold shadow-xs transition-colors cursor-pointer"
              title="Ganti Kata Sandi Akun Mitra"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">lock_reset</span>
              Ganti Kata Sandi
            </button>
          )}

          <button
            onClick={() => {
              handleResetForm();
              setActiveTab('ajukan');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[13px] font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Ajukan Permintaan Pelatihan
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <p className="text-[12px] text-outline font-semibold uppercase tracking-wider mb-2">Total Permintaan</p>
          <p className="text-[32px] font-semibold text-on-surface leading-none">{myProposals.length}</p>
        </div>
        <div className="p-5 bg-tertiary-container/30 rounded-xl border border-tertiary-container shadow-sm flex flex-col justify-between">
          <p className="text-[12px] text-on-tertiary-container font-semibold uppercase tracking-wider mb-2">Menunggu Persetujuan</p>
          <p className="text-[32px] font-semibold text-tertiary leading-none">
            {myProposals.filter(p => p.status === 'menunggu_persetujuan').length}
          </p>
        </div>
        <div className="p-5 bg-primary-container/30 rounded-xl border border-primary-container shadow-sm flex flex-col justify-between">
          <p className="text-[12px] text-on-primary-container font-semibold uppercase tracking-wider mb-2">Event Disetujui</p>
          <p className="text-[32px] font-semibold text-primary leading-none">
            {myProposals.filter(p => p.status === 'disetujui').length}
          </p>
        </div>
        <div className="p-5 bg-secondary-container/30 rounded-xl border border-secondary-container shadow-sm flex flex-col justify-between">
          <p className="text-[12px] text-on-secondary-container font-semibold uppercase tracking-wider mb-2">Total Pendaftar</p>
          <p className="text-[32px] font-semibold text-secondary leading-none">{myParticipants.length} <span className="text-[14px]">Peserta</span></p>
        </div>
      </div>

      {/* Tabs matching flow */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3 mb-6 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('daftar')}
          className={`px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'daftar'
              ? 'bg-on-surface text-surface'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          Status Permintaan ({myProposals.length})
        </button>
        <button
          onClick={() => {
            handleResetForm();
            setActiveTab('ajukan');
          }}
          className={`px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ajukan'
              ? 'bg-on-surface text-surface'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          {editingProposalId ? 'Perbaiki Permintaan' : 'Form Permintaan Baru'}
        </button>
        <button
          onClick={() => setActiveTab('peserta')}
          className={`px-4 py-2 text-[13px] font-semibold rounded-full transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'peserta'
              ? 'bg-on-surface text-surface'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">groups</span>
          Data Peserta ({myParticipants.length})
        </button>
      </div>

      {/* TAB 1: DAFTAR STATUS PERMINTAAN PELATIHAN */}
      {activeTab === 'daftar' && (
        <div className="space-y-4">
          {myProposals.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center text-on-surface-variant shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-outline mb-4">calendar_month</span>
              <h3 className="font-semibold text-on-surface text-[16px]">Belum Ada Permintaan Pelatihan</h3>
              <p className="text-[14px] mt-2 max-w-md mx-auto mb-6">
                Sebagai mitra lembaga, Anda dapat mengajukan pelatihan Al-Quran ramah disabilitas (Braille, Isyarat, Daksa, dll.) untuk disetujui Superadmin.
              </p>
              <button
                onClick={() => setActiveTab('ajukan')}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-[13px] font-semibold shadow-sm cursor-pointer"
              >
                Mulai Ajukan Permintaan
              </button>
            </div>
          ) : (
            myProposals.map((prop) => {
              const kuotaMax = prop.kuotaDisetujui || prop.targetDanKuotaPeserta;
              const percentage = Math.min(100, Math.round((prop.jumlahPendaftar / kuotaMax) * 100));

              return (
                <div 
                  key={prop.id}
                  className={`bg-surface-container-lowest rounded-2xl border p-6 shadow-sm transition-all flex flex-col md:flex-row gap-6 ${
                    prop.status === 'ditolak'
                      ? 'border-error/30'
                      : prop.status === 'disetujui'
                      ? 'border-primary/30'
                      : 'border-tertiary/30'
                  }`}
                >
                  <div className="flex-1">
                    {/* Status Chip */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {prop.status === 'menunggu_persetujuan' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-tertiary-container text-on-tertiary-container">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Menunggu Persetujuan Super Admin
                        </span>
                      )}
                      {prop.status === 'disetujui' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-primary-container text-on-primary-container">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Event Disetujui (Aktif di Peta)
                        </span>
                      )}
                      {prop.status === 'ditolak' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-error-container text-on-error-container">
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                          Permintaan Ditolak
                        </span>
                      )}
                      <span className="text-[12px] text-outline font-mono font-medium">ID: {prop.id}</span>
                    </div>

                    <h3 className="text-[18px] font-semibold text-on-surface leading-snug mb-2">
                      {prop.namaKegiatan}
                    </h3>

                    <p className="text-[13px] text-on-surface-variant leading-relaxed mb-4">
                      {prop.deskripsiPelatihan}
                    </p>

                    {/* Event details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] text-on-surface-variant bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 mb-4">
                      <div>
                        <span className="text-outline block font-medium mb-0.5">Tanggal Kegiatan:</span>
                        <span className="font-semibold text-on-surface">{prop.tanggalKegiatan}</span>
                      </div>
                      <div>
                        <span className="text-outline block font-medium mb-0.5">Lokasi:</span>
                        <span className="font-semibold text-on-surface">{prop.lokasiDanAlamat}</span>
                      </div>
                      <div>
                        <span className="text-outline block font-medium mb-0.5">Target & Kuota:</span>
                        <span className="font-semibold text-primary">
                          {prop.kuotaDisetujui || prop.targetDanKuotaPeserta} Orang
                        </span>
                      </div>
                    </div>

                    {/* Kebutuhan Peserta */}
                    <div className="flex flex-wrap gap-2">
                      {prop.kebutuhanPeserta.map((keb, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 bg-surface-container text-on-surface rounded-md font-medium border border-outline-variant/20">
                          ✓ {keb}
                        </span>
                      ))}
                    </div>

                    {/* JIKA DITOLAK */}
                    {prop.status === 'ditolak' && (
                      <div className="mt-5 p-4 rounded-xl bg-error-container border border-error/20 flex flex-col sm:flex-row sm:items-start gap-4">
                        <span className="material-symbols-outlined text-[24px] text-on-error-container shrink-0">error</span>
                        <div className="flex-1">
                          <h4 className="text-[13px] font-bold text-on-error-container mb-1">Alasan Penolakan dari Superadmin:</h4>
                          <p className="text-[13px] text-on-error-container/80 leading-relaxed mb-4">
                            {prop.alasanPenolakan || 'Mohon sesuaikan kuota atau fasilitas aksesibilitas.'}
                          </p>
                          <button
                            onClick={() => handleStartPerbaikiData(prop)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-on-error-container hover:bg-on-error-container/90 text-error-container rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit_document</span>
                            Perbaiki Data & Kirim Ulang
                          </button>
                        </div>
                      </div>
                    )}

                    {/* JIKA DISETUJUI */}
                    {prop.status === 'disetujui' && (
                      <div className="mt-5 p-5 rounded-xl bg-surface-container-low border border-primary/20 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-[12px] font-bold text-on-surface uppercase tracking-wider mb-1">Link Pendaftaran Resmi Peserta:</p>
                            <p className="text-[13px] font-mono font-medium text-primary break-all">
                              {prop.linkPendaftaran || window.location.origin + `/#daftar/${prop.id}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(prop.linkPendaftaran || window.location.origin + `/#daftar/${prop.id}`, prop.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant rounded-xl text-[12px] font-semibold text-on-surface transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {copiedId === prop.id ? 'check' : 'content_copy'}
                              </span>
                              {copiedId === prop.id ? 'Tersalin!' : 'Salin Link'}
                            </button>

                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nTelah dibuka pendaftaran pelatihan Al-Quran Disabilitas: *${prop.namaKegiatan}*.\n\n🗓️ Tanggal: ${prop.tanggalKegiatan}\n📍 Lokasi: ${prop.lokasiDanAlamat}\n👥 Kuota: ${kuotaMax} peserta\n\nSilakan klik tautan resmi untuk mendaftar:\n${prop.linkPendaftaran || window.location.origin + '/#daftar/' + prop.id}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-xl text-[12px] font-semibold transition-colors shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[16px]">share</span>
                              Bagikan ke WA
                            </a>
                          </div>
                        </div>

                        {/* Progress pendaftar */}
                        <div className="pt-2 border-t border-outline-variant/20">
                          <div className="flex justify-between text-[12px] font-medium text-on-surface-variant mb-1.5">
                            <span>Jumlah Pendaftar: <strong className="text-on-surface">{prop.jumlahPendaftar} / {kuotaMax}</strong> ({percentage}%)</span>
                            <button
                              onClick={() => {
                                setSelectedProposalForParticipants(prop.id);
                                setActiveTab('peserta');
                              }}
                              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Lihat Data Peserta</span>
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </button>
                          </div>
                          <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: FORM PERMINTAAN PELATIHAN */}
      {activeTab === 'ajukan' && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 md:p-8 shadow-sm">
          <div className="pb-5 border-b border-outline-variant/30 mb-6">
            <h2 className="text-[20px] font-semibold text-on-surface">
              {editingProposalId ? 'Perbaiki Permintaan Pelatihan (Revisi)' : 'Ajukan Permintaan Penyelenggaraan Pelatihan'}
            </h2>
            <p className="text-[13px] text-on-surface-variant mt-1.5 font-medium">
              Lengkapi formulir spesifikasi kegiatan pelatihan quran disabilitas. Permintaan Anda akan ditinjau oleh Superadmin untuk penetapan kuota & tautan registrasi publik.
            </p>
          </div>

          <form onSubmit={handleSubmitProposal} className="space-y-5 text-[13px]">
            {/* 1. Nama Kegiatan */}
            <div>
              <label className="block font-semibold text-on-surface mb-1.5">
                Nama Kegiatan Pelatihan *
              </label>
              <input
                type="text"
                required
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="Contoh: Daurah Tilawah Al-Quran Isyarat Bersanad Angkatan II"
                className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
              />
            </div>

            {/* 2. Jenis Event */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-semibold text-on-surface mb-1.5">
                  Jenis Event Pelatihan *
                </label>
                <select
                  value={jenisEvent}
                  onChange={(e) => setJenisEvent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                >
                  <option value="Pelatihan Guru Quran Braille">Pelatihan Guru Quran Braille</option>
                  <option value="Daurah Quran Bahasa Isyarat">Daurah Quran Bahasa Isyarat (Tuli)</option>
                  <option value="Workshop Quran Inklusif & Neurodivergen">Workshop Quran Inklusif & Autisme</option>
                  <option value="Tashih & Tahsin Quran Braille">Tashih & Tahsin Quran Braille Bersanad</option>
                  <option value="Pelatihan Fiqih Praktis Isyarat">Pelatihan Fiqih Praktis Isyarat</option>
                  <option value="Tahfidz Difabel Daksa & Mandiri">Tahfidz Difabel Daksa & Mandiri</option>
                  <option value="Pelatihan Inklusif untuk Orang Umum & Pendamping">Pelatihan Inklusif untuk Orang Umum & Pendamping</option>
                </select>
              </div>

              {/* Target Dan Kuota Peserta */}
              <div>
                <label className="block font-semibold text-on-surface mb-1.5">
                  Target & Kuota Peserta (Orang) *
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="500"
                  value={targetDanKuotaPeserta}
                  onChange={(e) => setTargetDanKuotaPeserta(e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                />
              </div>
            </div>

            {/* 3. Deskripsi Pelatihan */}
            <div>
              <label className="block font-semibold text-on-surface mb-1.5">
                Deskripsi Pelatihan & Silabus *
              </label>
              <textarea
                required
                rows={3}
                value={deskripsiPelatihan}
                onChange={(e) => setDeskripsiPelatihan(e.target.value)}
                placeholder="Jelaskan tujuan, materi ajar (tajwid, makharijul huruf, tahsin), dan profil instruktur..."
                className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
              />
            </div>

            {/* 4. Tanggal Kegiatan */}
            <div>
              <label className="block font-semibold text-on-surface mb-1.5">
                Tanggal & Waktu Kegiatan Pelatihan *
              </label>
              <input
                type="text"
                required
                value={tanggalKegiatan}
                onChange={(e) => setTanggalKegiatan(e.target.value)}
                placeholder="Contoh: 2026-10-20 s/d 2026-10-22 (08:00 - 16:00 WIB)"
                className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
              />
            </div>

            {/* 5. Lokasi Dan Alamat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-semibold text-on-surface mb-1.5">
                  Provinsi *
                </label>
                <input
                  type="text"
                  required
                  value={provinsi}
                  onChange={(e) => setProvinsi(e.target.value)}
                  placeholder="Jawa Barat"
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1.5">
                  Kota / Kabupaten *
                </label>
                <input
                  type="text"
                  required
                  value={kota}
                  onChange={(e) => setKota(e.target.value)}
                  placeholder="Kota Bandung"
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-on-surface mb-1.5">
                Lokasi Dan Alamat Lengkap Pelaksanaan *
              </label>
              <textarea
                required
                rows={2}
                value={lokasiDanAlamat}
                onChange={(e) => setLokasiDanAlamat(e.target.value)}
                placeholder="Nama gedung, aula, jalan lengkap, patokan aksesibilitas..."
                className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[14px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-on-surface mb-1.5">Latitude Koordinat Peta</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-6.9175"
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl font-mono focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[13px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-on-surface mb-1.5">Longitude Koordinat Peta</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="107.6191"
                  className="w-full px-4 py-2.5 border border-outline-variant/50 bg-surface-container-lowest rounded-xl font-mono focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none text-[13px]"
                />
              </div>
            </div>

            {/* 6. Kebutuhan Peserta */}
            <div>
              <label className="block font-semibold text-on-surface mb-2">
                Kebutuhan & Fasilitas Peserta Ramah Disabilitas *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Mushaf Quran Braille Standar LPMQ',
                  'Juru Bahasa Isyarat (JBI) Standar',
                  'Akses Rampa Kursi Roda',
                  'Materi Audio Digital & Modul Braille',
                  'Relawan Pendamping Mobilitas',
                  'Ruang Terapi Sensori Tenang',
                  'Akomodasi & Konsumsi Inklusif',
                ].map((keb) => (
                  <label key={keb} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors text-[13px] font-medium text-on-surface select-none">
                    <input
                      type="checkbox"
                      checked={kebutuhanPeserta.includes(keb)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setKebutuhanPeserta([...kebutuhanPeserta, keb]);
                        } else {
                          setKebutuhanPeserta(kebutuhanPeserta.filter(k => k !== keb));
                        }
                      }}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>{keb}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setActiveTab('daftar');
                }}
                className="px-5 py-2.5 text-on-surface font-semibold hover:bg-surface-container rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {isSubmitting 
                  ? 'Mengirim Permintaan...' 
                  : editingProposalId 
                  ? 'Kirim Revisi Permintaan Ulang' 
                  : 'Kirim Permintaan ke Superadmin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PELAKSANAAN PELATIHAN & DATA PESERTA */}
      {activeTab === 'peserta' && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-outline-variant/30 mb-6">
            <div>
              <h2 className="text-[20px] font-semibold text-on-surface">
                Data Peserta Pelatihan Disetujui
              </h2>
              <p className="text-[13px] text-on-surface-variant mt-1.5 font-medium">
                Daftar peserta terdaftar dari link registrasi publik untuk pelaksanaan pelatihan.
              </p>
            </div>

            {/* Filter by event */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-outline font-medium">Filter Event:</span>
              <select
                value={selectedProposalForParticipants}
                onChange={(e) => setSelectedProposalForParticipants(e.target.value)}
                className="px-4 py-2 border border-outline-variant/50 rounded-xl text-[13px] bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="all">Semua Event Saya ({myParticipants.length} Peserta)</option>
                {myProposals.filter(p => p.status === 'disetujui').map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.namaKegiatan.slice(0, 35)}...</option>
                ))}
              </select>
            </div>
          </div>

          {myParticipants.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant text-[14px]">
              Belum ada peserta terdaftar pada event yang dipilih. Pastikan event Anda telah disetujui dan link pendaftaran telah dibagikan ke calon peserta.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-semibold">
                    <th className="p-3.5 rounded-tl-xl">Nama Lengkap</th>
                    <th className="p-3.5">Kategori Disabilitas</th>
                    <th className="p-3.5">Kontak WhatsApp</th>
                    <th className="p-3.5">Kebutuhan Fasilitas</th>
                    <th className="p-3.5">Event Pelatihan</th>
                    <th className="p-3.5">Catatan</th>
                    <th className="p-3.5 rounded-tr-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {myParticipants.map((pt) => (
                    <tr key={pt.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-3.5 font-semibold text-on-surface">{pt.namaLengkap} ({pt.usia} th)</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-primary-container text-on-primary-container uppercase tracking-wide">
                          {pt.kategoriDisabilitas}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-medium">
                        <a 
                          href={`https://wa.me/62${pt.noWa.replace(/^0/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1.5"
                        >
                          {pt.noWa}
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {pt.kebutuhanFasilitas.map((f, i) => (
                            <span key={i} className="text-[11px] bg-surface-container px-2 py-0.5 rounded-md text-on-surface font-medium border border-outline-variant/20">
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-on-surface-variant max-w-xs truncate">{pt.eventTitle || pt.eventId}</td>
                      <td className="p-3.5 text-outline italic max-w-xs truncate">{pt.catatanKhusus || '-'}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-surface-container text-on-surface border border-outline-variant/30 uppercase tracking-wide">
                          {pt.statusKehadiran}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
};
