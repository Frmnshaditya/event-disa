import React, { useState, useEffect } from 'react';
import { DisabilityMaster, User, TrainingProposal, QuranCommunity, Participant } from '../types.ts';

interface DisabilityManagementProps {
  currentUser?: User | null;
  events?: TrainingProposal[];
  communities?: QuranCommunity[];
  participants?: Participant[];
  disabilitiesList?: DisabilityMaster[];
  onDisabilitiesChange?: (updated: DisabilityMaster[]) => void;
  onNavigateToDashboard?: (targetDashboard: 'events' | 'map', categoryFilter?: string) => void;
}

export const DisabilityManagement: React.FC<DisabilityManagementProps> = ({
  currentUser,
  events = [],
  communities = [],
  participants = [],
  disabilitiesList,
  onDisabilitiesChange,
  onNavigateToDashboard,
}) => {
  const [disabilities, setDisabilities] = useState<DisabilityMaster[]>(disabilitiesList || []);
  const [isLoading, setIsLoading] = useState(!disabilitiesList || disabilitiesList.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DisabilityMaster | null>(null);
  const [deletingItem, setDeletingItem] = useState<DisabilityMaster | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    kode: '',
    nama: '',
    kategoriUtama: 'Sensorik' as DisabilityMaster['kategoriUtama'],
    deskripsi: '',
    metodePembelajaran: '',
    fasilitasInput: '',
    icon: 'accessible',
    warnaHex: '#005a71',
    isAktif: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  // Sync if parent passes updated disabilitiesList
  useEffect(() => {
    if (disabilitiesList && disabilitiesList.length > 0) {
      setDisabilities(disabilitiesList);
      setIsLoading(false);
    }
  }, [disabilitiesList]);

  const fetchDisabilities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/disabilities');
      if (res.ok) {
        const data = await res.json();
        const items = data.disabilities || data.data || [];
        setDisabilities(items);
        if (onDisabilitiesChange) {
          onDisabilitiesChange(items);
        }
      }
    } catch (err) {
      console.error('Failed to load disabilities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!disabilitiesList || disabilitiesList.length === 0) {
      fetchDisabilities();
    }
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: DisabilityMaster) => {
    setEditingItem(item);
    setFormData({
      kode: item.kode,
      nama: item.nama,
      kategoriUtama: item.kategoriUtama,
      deskripsi: item.deskripsi,
      metodePembelajaran: item.metodePembelajaran,
      fasilitasInput: (item.fasilitasRekomendasi || []).join(', '),
      icon: item.icon,
      warnaHex: item.warnaHex,
      isAktif: item.isAktif,
    });
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.kode.trim()) {
      alert('Nama dan kode kategori disabilitas wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const facilities = formData.fasilitasInput
        .split(',')
        .map(f => f.trim())
        .filter(Boolean);

      const res = await fetch('/api/disabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: formData.kode.toLowerCase().replace(/\s+/g, '_'),
          nama: formData.nama,
          kategoriUtama: formData.kategoriUtama,
          deskripsi: formData.deskripsi,
          metodePembelajaran: formData.metodePembelajaran,
          fasilitasRekomendasi: facilities,
          icon: formData.icon || 'accessible',
          warnaHex: formData.warnaHex,
          isAktif: formData.isAktif,
        }),
      });

      const data = await res.json();
      const savedItem = data.item || data.disability;
      if (res.ok && savedItem) {
        const updated = [savedItem, ...(Array.isArray(disabilities) ? disabilities : [])];
        setDisabilities(updated);
        if (onDisabilitiesChange) onDisabilitiesChange(updated);
        setIsAddModalOpen(false);
        showNotification('success', `Data "${savedItem.nama}" berhasil ditambahkan.`);
      } else {
        alert(data.error || 'Gagal menambahkan data');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      const facilities = formData.fasilitasInput
        .split(',')
        .map(f => f.trim())
        .filter(Boolean);

      const res = await fetch(`/api/disabilities/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: formData.kode.toLowerCase().replace(/\s+/g, '_'),
          nama: formData.nama,
          kategoriUtama: formData.kategoriUtama,
          deskripsi: formData.deskripsi,
          metodePembelajaran: formData.metodePembelajaran,
          fasilitasRekomendasi: facilities,
          icon: formData.icon,
          warnaHex: formData.warnaHex,
          isAktif: formData.isAktif,
        }),
      });

      const data = await res.json();
      const savedItem = data.item || data.disability;
      if (res.ok && savedItem) {
        const updated = (Array.isArray(disabilities) ? disabilities : []).map(d =>
          d.id === editingItem.id ? savedItem : d
        );
        setDisabilities(updated);
        if (onDisabilitiesChange) onDisabilitiesChange(updated);
        setEditingItem(null);
        showNotification('success', `Data "${savedItem.nama}" berhasil diperbarui.`);
      } else {
        alert(data.error || 'Gagal memperbarui data');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: DisabilityMaster) => {
    try {
      const updatedItem = { ...item, isAktif: !item.isAktif };
      const res = await fetch(`/api/disabilities/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      const data = await res.json();
      const savedItem = data.item || data.disability;
      if (res.ok && savedItem) {
        const updated = (Array.isArray(disabilities) ? disabilities : []).map(d =>
          d.id === item.id ? savedItem : d
        );
        setDisabilities(updated);
        if (onDisabilitiesChange) onDisabilitiesChange(updated);
        showNotification(
          'success',
          `Status "${savedItem.nama}" diubah menjadi: ${savedItem.isAktif ? 'Aktif' : 'Nonaktif'}`
        );
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/disabilities/${deletingItem.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updated = (Array.isArray(disabilities) ? disabilities : []).filter(d => d.id !== deletingItem.id);
        setDisabilities(updated);
        if (onDisabilitiesChange) onDisabilitiesChange(updated);
        showNotification('success', `Data "${deletingItem.nama}" berhasil dihapus.`);
        setDeletingItem(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus data');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan teknis');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to compute concrete relation to Website Utama for a category
  const getRelatedEvents = (item: DisabilityMaster) => {
    const k = item.kode.toLowerCase();
    const nameKeywords = item.nama
      .toLowerCase()
      .replace(/[()/]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 4);

    return events.filter(ev => {
      const text = `${ev.jenisEvent} ${ev.namaKegiatan} ${ev.deskripsiPelatihan} ${ev.kebutuhanPeserta.join(' ')}`.toLowerCase();
      if (text.includes(k)) return true;
      return nameKeywords.some(w => text.includes(w));
    });
  };

  const getRelatedCommunities = (item: DisabilityMaster) => {
    const k = item.kode.toLowerCase();
    return communities.filter(c => {
      if (!c.kategoriDisabilitas) return false;
      return c.kategoriDisabilitas.some(cat => {
        const catStr = String(cat).toLowerCase();
        return catStr === k || k.includes(catStr) || catStr.includes(k);
      });
    });
  };

  const getRelatedParticipants = (item: DisabilityMaster) => {
    const k = item.kode.toLowerCase();
    return participants.filter(p => {
      const pCat = String(p.kategoriDisabilitas || '').toLowerCase();
      return pCat === k || k.includes(pCat) || pCat.includes(k);
    });
  };

  // Safe Disabilities array and Filter logic
  const safeDisabilities = Array.isArray(disabilities) ? disabilities : [];

  const filteredDisabilities = safeDisabilities.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.nama.toLowerCase().includes(query) ||
      item.kode.toLowerCase().includes(query) ||
      item.kategoriUtama.toLowerCase().includes(query) ||
      item.deskripsi.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-md text-white flex items-center gap-2 text-[13px] font-medium ${
            feedback.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {feedback.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="pb-3 border-b border-gray-200">
        <h1 className="text-[22px] font-semibold text-gray-800">
          Kelola Disabilitas
        </h1>
      </div>

      {/* Action Bar: + Add Data on left */}
      <div className="pt-1">
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#007bff] hover:bg-blue-600 text-white rounded-md text-[13px] font-medium shadow-xs transition-colors cursor-pointer"
        >
          <span className="text-[15px] font-bold leading-none">+</span>
          <span>Add Data</span>
        </button>
      </div>

      {/* Main Table Card (matching screenshot structure) */}
      <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5">
        {/* Right-aligned search bar matching screenshot */}
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 border border-gray-300 rounded text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Table layout matching screenshot columns: #, Nama, Relasi, Action */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-700 text-[13px] font-bold">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Nama</th>
                <th className="py-3 px-4 w-44">Kategori Utama</th>
                <th className="py-3 px-4">Relasi Terarah (Website Utama)</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-28 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[13px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                    <p>Memuat data...</p>
                  </td>
                </tr>
              ) : filteredDisabilities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredDisabilities.map((item, index) => {
                  const relEvents = getRelatedEvents(item);
                  const relComms = getRelatedCommunities(item);
                  const relParts = getRelatedParticipants(item);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Row number (#) */}
                      <td className="py-3.5 px-4 font-bold text-gray-800 text-center align-middle">
                        {index + 1}
                      </td>

                      {/* Nama */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-semibold text-gray-900">{item.nama}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">
                            {item.kode}
                          </span>
                          {item.metodePembelajaran && (
                            <span className="truncate max-w-xs text-gray-400">
                              • {item.metodePembelajaran}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kategori Utama */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-medium rounded">
                          {item.kategoriUtama}
                        </span>
                      </td>

                      {/* Relasi Terarah ke Website Utama (Clear direct click-throughs) */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Event Pelatihan Relation Button */}
                          <button
                            type="button"
                            onClick={() => onNavigateToDashboard && onNavigateToDashboard('events', item.nama)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11.5px] font-medium transition-colors cursor-pointer border border-blue-200"
                            title={`Buka Dashboard Event dengan filter "${item.nama}"`}
                          >
                            <span className="material-symbols-outlined text-[13px]">event</span>
                            <span>{relEvents.length} Event</span>
                            <span className="material-symbols-outlined text-[11px]">arrow_outward</span>
                          </button>

                          {/* Peta Komunitas Relation Button */}
                          <button
                            type="button"
                            onClick={() => onNavigateToDashboard && onNavigateToDashboard('map', item.kode)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11.5px] font-medium transition-colors cursor-pointer border border-emerald-200"
                            title={`Buka Dashboard Peta dengan filter "${item.kode}"`}
                          >
                            <span className="material-symbols-outlined text-[13px]">public</span>
                            <span>{relComms.length} Lembaga di Peta</span>
                            <span className="material-symbols-outlined text-[11px]">arrow_outward</span>
                          </button>

                          {/* Santri Terdaftar badge */}
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-[11px] font-medium"
                            title="Jumlah pendaftar santri dengan kategori ini"
                          >
                            <span className="material-symbols-outlined text-[12px]">person</span>
                            <span>{relParts.length} Santri</span>
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                            item.isAktif
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title="Klik untuk mengubah status aktif/nonaktif"
                        >
                          {item.isAktif ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>

                      {/* Action buttons (amber edit and red delete as in screenshot) */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit button (Amber/Orange square) */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="w-7 h-7 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Edit Data"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>

                          {/* Delete button (Red square) */}
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="w-7 h-7 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            title="Hapus Data"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Data */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 border border-gray-200 shadow-xl my-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h3 className="font-semibold text-[16px] text-gray-800">
                {editingItem ? 'Edit Data Disabilitas' : 'Tambah Data Disabilitas'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={editingItem ? handleSaveEdit : handleSaveAdd} className="space-y-3.5 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Kode Master (Unik) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: tunanetra"
                    value={formData.kode}
                    onChange={e => setFormData({ ...formData, kode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-gray-800 font-mono text-[12px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Kategori Utama *</label>
                  <select
                    value={formData.kategoriUtama}
                    onChange={e => setFormData({ ...formData, kategoriUtama: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Sensorik">Sensorik</option>
                    <option value="Fisik">Fisik</option>
                    <option value="Intelektual & Mental">Intelektual & Mental</option>
                    <option value="Ganda">Ganda</option>
                    <option value="Pendamping">Pendamping</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Nama Disabilitas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tunanetra (Braille)"
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat ragam disabilitas..."
                  value={formData.deskripsi}
                  onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Metode Pembelajaran Quran</label>
                <input
                  type="text"
                  placeholder="Contoh: Mushaf Braille Standar LPMQ..."
                  value={formData.metodePembelajaran}
                  onChange={e => setFormData({ ...formData, metodePembelajaran: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Fasilitas Rekomendasi (Pisahkan koma)</label>
                <input
                  type="text"
                  placeholder="Contoh: Mushaf Braille, Audio Quran, JBI"
                  value={formData.fasilitasInput}
                  onChange={e => setFormData({ ...formData, fasilitasInput: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusAktifInput"
                  checked={formData.isAktif}
                  onChange={e => setFormData({ ...formData, isAktif: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="statusAktifInput" className="text-gray-700 font-medium cursor-pointer text-[12.5px]">
                  Aktifkan di filter Dashboard Event & Peta Komunitas
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-3.5 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-[13px] font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#007bff] hover:bg-blue-600 text-white rounded text-[13px] font-medium disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 border border-gray-200 shadow-xl">
            <h3 className="font-bold text-[15px] text-gray-900 mb-2">
              Hapus Data?
            </h3>
            <p className="text-[13px] text-gray-600 mb-4">
              Apakah Anda yakin ingin menghapus <strong>"{deletingItem.nama}"</strong>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-[13px] font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[13px] font-medium disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
