import React, { useState } from 'react';
import { TrainingProposal, User } from '../types.ts';

interface EventManagementProps {
  currentUser: User;
  events: TrainingProposal[];
  onEventUpdated: (updatedEvent: TrainingProposal) => void;
  onEventDeleted: (deletedEventId: string) => void;
  onOpenCreateModal?: () => void;
}

export const EventManagement: React.FC<EventManagementProps> = ({
  currentUser,
  events,
  onEventUpdated,
  onEventDeleted,
  onOpenCreateModal,
}) => {
  const isSuperadmin = currentUser.role === 'superadmin';

  // Filter events: Superadmin sees all events, Mitra sees their own events
  const userEvents = isSuperadmin 
    ? events 
    : events.filter(e => e.mitraId === currentUser.id || e.mitraOrg === currentUser.organizationName);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'disetujui' | 'menunggu_persetujuan' | 'ditolak'>('all');

  // Edit modal state
  const [editingEvent, setEditingEvent] = useState<TrainingProposal | null>(null);
  const [editForm, setEditForm] = useState({
    namaKegiatan: '',
    jenisEvent: '',
    deskripsiPelatihan: '',
    lokasiDanAlamat: '',
    provinsi: '',
    kota: '',
    latitude: 0,
    longitude: 0,
    tanggalKegiatan: '',
    targetDanKuotaPeserta: 50,
    kuotaDisetujui: 50,
    status: 'menunggu_persetujuan' as 'menunggu_persetujuan' | 'disetujui' | 'ditolak',
    isAktif: true,
    fotoDokumentasi: [] as string[],
  });

  const [newPhotoInput, setNewPhotoInput] = useState('');

  // Delete modal state
  const [deletingEvent, setDeletingEvent] = useState<TrainingProposal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter logic
  const filteredEvents = userEvents.filter(ev => {
    const matchesSearch = 
      ev.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.mitraOrg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.kota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.jenisEvent.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (ev: TrainingProposal) => {
    setEditingEvent(ev);
    setNewPhotoInput('');
    setEditForm({
      namaKegiatan: ev.namaKegiatan,
      jenisEvent: ev.jenisEvent,
      deskripsiPelatihan: ev.deskripsiPelatihan,
      lokasiDanAlamat: ev.lokasiDanAlamat,
      provinsi: ev.provinsi,
      kota: ev.kota,
      latitude: ev.latitude,
      longitude: ev.longitude,
      tanggalKegiatan: ev.tanggalKegiatan,
      targetDanKuotaPeserta: ev.targetDanKuotaPeserta,
      kuotaDisetujui: ev.kuotaDisetujui || ev.targetDanKuotaPeserta,
      status: ev.status,
      isAktif: ev.isAktif,
      fotoDokumentasi: ev.fotoDokumentasi || [],
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok && data.proposal) {
        onEventUpdated(data.proposal);
        setEditingEvent(null);
        setFeedbackMsg({ type: 'success', text: `Event "${data.proposal.namaKegiatan}" berhasil diperbarui!` });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        alert(data.error || 'Gagal memperbarui event');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan saat memperbarui event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${deletingEvent.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        onEventDeleted(deletingEvent.id);
        setFeedbackMsg({ type: 'success', text: `Event "${deletingEvent.namaKegiatan}" berhasil dihapus!` });
        setDeletingEvent(null);
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        alert(data.error || 'Gagal menghapus event');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-semibold text-on-surface tracking-tight">
              Kelola Event & Pelatihan
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
              {isSuperadmin ? 'Admin Control' : 'Mitra Penyelenggara'}
            </span>
          </div>
          <p className="text-[13px] text-on-surface-variant mt-1 font-medium">
            {isSuperadmin 
              ? 'Pantau, edit spesifikasi kuota, publish ke peta publik, atau hapus kegiatan pelatihan Al-Quran se-Indonesia.'
              : 'Kelola jadwal, perbarui deskripsi fasilitas kegiatan, dan pantau status persetujuan dari Superadmin.'}
          </p>
        </div>

        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-[13px] font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Tambah Event Baru</span>
          </button>
        )}
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-[13px] font-medium ${
          feedbackMsg.type === 'success' 
            ? 'bg-secondary/10 border-secondary/30 text-secondary' 
            : 'bg-error/10 border-error/30 text-error'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {feedbackMsg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Summary Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">Total Event</span>
          <span className="text-[24px] font-semibold text-on-surface">{userEvents.length}</span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">Disetujui & Aktif</span>
          <span className="text-[24px] font-semibold text-primary">
            {userEvents.filter(e => e.status === 'disetujui').length}
          </span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">Menunggu Review</span>
          <span className="text-[24px] font-semibold text-secondary">
            {userEvents.filter(e => e.status === 'menunggu_persetujuan').length}
          </span>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1">Perlu Revisi / Ditolak</span>
          <span className="text-[24px] font-semibold text-error">
            {userEvents.filter(e => e.status === 'ditolak').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari event, mitra, atau kota..."
            className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Semua ({userEvents.length})
          </button>
          <button
            onClick={() => setStatusFilter('disetujui')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'disetujui'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Disetujui ({userEvents.filter(e => e.status === 'disetujui').length})
          </button>
          <button
            onClick={() => setStatusFilter('menunggu_persetujuan')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'menunggu_persetujuan'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Menunggu ({userEvents.filter(e => e.status === 'menunggu_persetujuan').length})
          </button>
          <button
            onClick={() => setStatusFilter('ditolak')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'ditolak'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Ditolak ({userEvents.filter(e => e.status === 'ditolak').length})
          </button>
        </div>
      </div>

      {/* Event Cards & Management Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] text-outline mb-2">event_busy</span>
            <p className="text-[14px] font-medium">Tidak ada kegiatan pelatihan yang sesuai filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {filteredEvents.map((ev) => (
              <div key={ev.id} className="p-5 hover:bg-surface-container-low/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-on-surface border border-outline-variant/30">
                      {ev.jenisEvent}
                    </span>
                    {ev.status === 'disetujui' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        Disetujui & Aktif
                      </span>
                    )}
                    {ev.status === 'menunggu_persetujuan' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Menunggu Persetujuan
                      </span>
                    )}
                    {ev.status === 'ditolak' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-error/10 text-error border border-error/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                        Perlu Revisi
                      </span>
                    )}
                    {ev.isAktif && ev.status === 'disetujui' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700">
                        <span className="material-symbols-outlined text-[12px]">visibility</span>
                        Tayang di Peta
                      </span>
                    )}
                  </div>

                  <h3 className="text-[16px] font-semibold text-on-surface leading-snug">
                    {ev.namaKegiatan}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[12px] text-on-surface-variant font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">corporate_fare</span>
                      {ev.mitraOrg || ev.mitraName}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      {ev.kota}, {ev.provinsi}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                      {ev.tanggalKegiatan}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <span className="material-symbols-outlined text-[15px]">group</span>
                      {ev.jumlahPendaftar || 0} / {ev.kuotaDisetujui || ev.targetDanKuotaPeserta} Kuota
                    </span>
                  </div>

                  <p className="text-[12px] text-on-surface-variant/90 line-clamp-2 leading-relaxed pt-1">
                    {ev.deskripsiPelatihan}
                  </p>

                  {ev.alasanPenolakan && (
                    <div className="p-2.5 bg-error/5 border border-error/20 rounded-lg text-[12px] text-error flex items-start gap-1.5 mt-2">
                      <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
                      <div>
                        <span className="font-bold">Catatan Penolakan: </span>
                        {ev.alasanPenolakan}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  <button
                    onClick={() => handleOpenEdit(ev)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-semibold transition-colors cursor-pointer border border-outline-variant/30"
                    title="Edit spesifikasi event"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">edit</span>
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingEvent(ev)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-error/10 hover:bg-error/20 text-error text-[12px] font-semibold transition-colors cursor-pointer border border-error/20"
                    title="Hapus kegiatan pelatihan"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl max-w-2xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">edit_calendar</span>
                <h3 className="text-[18px] font-semibold text-on-surface">
                  Edit Spesifikasi Kegiatan
                </h3>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">
                  Nama Kegiatan Pelatihan *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.namaKegiatan}
                  onChange={(e) => setEditForm({ ...editForm, namaKegiatan: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Jenis / Fokus Pelatihan *
                  </label>
                  <select
                    value={editForm.jenisEvent}
                    onChange={(e) => setEditForm({ ...editForm, jenisEvent: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="Pelatihan Guru Quran Braille">Pelatihan Guru Quran Braille</option>
                    <option value="Daurah Tilawah Isyarat Tuli">Daurah Tilawah Isyarat Tuli</option>
                    <option value="Workshop Quran Ramah Autisme">Workshop Quran Ramah Autisme</option>
                    <option value="Tadabbur Quran Tunadaksa">Tadabbur Quran Tunadaksa</option>
                    <option value="Standardisasi Pengajar Disabilitas">Standardisasi Pengajar Disabilitas</option>
                    <option value="Pelatihan Inklusif untuk Orang Umum & Pendamping">Pelatihan Inklusif untuk Orang Umum & Pendamping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 15 - 18 Mei 2026"
                    value={editForm.tanggalKegiatan}
                    onChange={(e) => setEditForm({ ...editForm, tanggalKegiatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Kota / Kabupaten *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.kota}
                    onChange={(e) => setEditForm({ ...editForm, kota: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.provinsi}
                    onChange={(e) => setEditForm({ ...editForm, provinsi: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">
                  Lokasi & Alamat Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.lokasiDanAlamat}
                  onChange={(e) => setEditForm({ ...editForm, lokasiDanAlamat: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Target Kuota Peserta *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.targetDanKuotaPeserta}
                    onChange={(e) => setEditForm({ ...editForm, targetDanKuotaPeserta: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Kuota Disetujui
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.kuotaDisetujui}
                    onChange={(e) => setEditForm({ ...editForm, kuotaDisetujui: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {isSuperadmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                  <div>
                    <label className="block text-[12px] font-semibold text-on-surface mb-1">
                      Status Persetujuan (Superadmin)
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                    >
                      <option value="disetujui">Disetujui (Tayang di Web & Peta)</option>
                      <option value="menunggu_persetujuan">Menunggu Persetujuan</option>
                      <option value="ditolak">Ditolak / Perlu Revisi</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-[13px] font-medium text-on-surface select-none">
                      <input
                        type="checkbox"
                        checked={editForm.isAktif}
                        onChange={(e) => setEditForm({ ...editForm, isAktif: e.target.checked })}
                        className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      <span>Publikasikan & Tampilkan di Peta</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1">
                  Deskripsi & Penjelasan Pelatihan Lengkap *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editForm.deskripsiPelatihan}
                  onChange={(e) => setEditForm({ ...editForm, deskripsiPelatihan: e.target.value })}
                  placeholder="Jelaskan silabus materi, profil instruktur, dan persiapan peserta..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* FOTO DOKUMENTASI KEGIATAN */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">photo_camera</span>
                    <span>Foto Dokumentasi Kegiatan Event</span>
                  </label>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {editForm.fotoDokumentasi.length} Foto Tersimpan
                  </span>
                </div>

                {/* Existing Photos Gallery */}
                {editForm.fotoDokumentasi.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {editForm.fotoDokumentasi.map((photoUrl, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-outline-variant/40 bg-surface-container-lowest h-24">
                        <img
                          src={photoUrl}
                          alt={`Dokumentasi ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm({
                              ...editForm,
                              fotoDokumentasi: editForm.fotoDokumentasi.filter((_, i) => i !== idx),
                            });
                          }}
                          className="absolute top-1.5 right-1.5 bg-error/90 hover:bg-error text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                          title="Hapus foto ini"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-on-surface-variant italic">
                    Belum ada foto dokumentasi untuk kegiatan ini. Tambahkan URL foto di bawah.
                  </p>
                )}

                {/* Add Photo Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... (URL Foto Kegiatan)"
                    value={newPhotoInput}
                    onChange={(e) => setNewPhotoInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPhotoInput.trim()) return;
                      setEditForm({
                        ...editForm,
                        fotoDokumentasi: [...editForm.fotoDokumentasi, newPhotoInput.trim()],
                      });
                      setNewPhotoInput('');
                    }}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[12px] font-semibold hover:bg-primary/90 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    Tambah Foto
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const samplePhotos = [
                        'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=800'
                      ];
                      const uniqueNew = samplePhotos.filter(p => !editForm.fotoDokumentasi.includes(p));
                      setEditForm({
                        ...editForm,
                        fotoDokumentasi: [...editForm.fotoDokumentasi, ...uniqueNew],
                      });
                    }}
                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    <span>Isi Contoh Foto Pelatihan Aksesibel</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 text-[13px] font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-[13px] font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[26px]">delete_forever</span>
            </div>

            <h3 className="text-[18px] font-semibold text-on-surface mb-2">
              Hapus Kegiatan Pelatihan?
            </h3>

            <p className="text-[13px] text-on-surface-variant leading-relaxed mb-6 font-medium">
              Apakah Anda yakin ingin menghapus <strong className="text-on-surface font-semibold">"{deletingEvent.namaKegiatan}"</strong>? 
              Tindakan ini tidak dapat dibatalkan dan seluruh data pendaftar terkait event ini akan dihapus.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant/50 text-[13px] font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-error hover:bg-error/90 text-on-error text-[13px] font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>{isSubmitting ? 'Menghapus...' : 'Ya, Hapus Event'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
