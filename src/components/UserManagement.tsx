import React, { useState } from 'react';
import { User } from '../types.ts';

interface UserManagementProps {
  users: User[];
  currentUser?: User | null;
  onUserUpdated: (updatedUser: User) => void;
  onUserDeleted: (deletedUserId: string) => void;
  onSuperadminCreated: (newUser: User) => void;
  onMitraCreated: (newMitra: User) => void;
  showToast?: (msg: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onUserUpdated,
  onUserDeleted,
  onSuperadminCreated,
  onMitraCreated,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'superadmin' | 'mitra'>('mitra');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [province, setProvince] = useState('Jawa Barat');
  const [city, setCity] = useState('');

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'superadmin' | 'mitra'>('mitra');
  const [editOrgName, setEditOrgName] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAvatar, setEditAvatar] = useState<string | undefined>(undefined);
  const [editBio, setEditBio] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);

  // Deleting user state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const filteredUsers = users.filter((u) => u.role === activeTab);

  // Open Edit Modal with user data populated
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditOrgName(user.organizationName || '');
    setEditProvince(user.province || '');
    setEditCity(user.city || '');
    setEditAvatar(user.avatar || '');
    setEditBio(user.bio || '');
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setIsSavingEdit(false);
  };

  // Profile Photo Upload & Compression (Super Admin only)
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSuperAdmin) {
      alert('Hanya Super Admin yang berhak mengubah foto profil.');
      return;
    }

    setIsCompressingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setEditAvatar(compressedBase64);
        }
        setIsCompressingAvatar(false);
      };
      img.onerror = () => {
        setIsCompressingAvatar(false);
        alert('Gagal memproses gambar foto profil.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    if (!isSuperAdmin) {
      alert('Hanya Super Admin yang berhak mengubah foto profil.');
      return;
    }
    setEditAvatar('');
  };

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSavingEdit(true);
    const payload = {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      role: isSuperAdmin ? editRole : editingUser.role,
      organizationName: editOrgName.trim(),
      province: editProvince.trim(),
      city: editCity.trim(),
      bio: editBio.trim(),
      // Only Super Admin can change avatar
      ...(isSuperAdmin ? { avatar: editAvatar } : {}),
    };

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onUserUpdated(data.user);
        if (showToast) {
          showToast(`Data pengguna "${data.user.name}" berhasil diperbarui.`);
        }
        handleCloseEdit();
      } else {
        alert(data.error || 'Gagal memperbarui data pengguna.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan perubahan pengguna.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (user: User) => {
    if (!isSuperAdmin) {
      alert('Hanya Super Admin yang memiliki hak akses untuk menghapus pengguna.');
      return;
    }

    if (user.role === 'superadmin') {
      const totalSuperadmins = users.filter((u) => u.role === 'superadmin').length;
      if (totalSuperadmins <= 1) {
        alert('Tidak dapat menghapus Super Admin terakhir di sistem!');
        return;
      }
    }

    if (currentUser?.id === user.id) {
      if (
        !confirm(
          `Peringatan: Anda sedang login dengan akun "${user.name}". Menghapus akun ini akan mengakhiri sesi login Anda. Lanjutkan?`
        )
      ) {
        return;
      }
    } else {
      if (
        !confirm(
          `Apakah Anda yakin ingin menghapus pengguna "${user.name}" (${
            user.role === 'superadmin' ? 'Super Admin' : 'Mitra'
          })? Tindakan ini tidak dapat dibatalkan.`
        )
      ) {
        return;
      }
    }

    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        onUserDeleted(user.id);
        if (showToast) {
          showToast(`Pengguna "${user.name}" berhasil dihapus.`);
        }
      } else {
        alert(data.error || 'Gagal menghapus pengguna.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus pengguna.');
    } finally {
      setDeletingId(null);
    }
  };

  // Add User Form Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name,
      email,
      phone,
      organizationName:
        activeTab === 'mitra'
          ? organizationName
          : 'Pusat Layanan Al-Quran Disabilitas Indonesia (PLQDI)',
      province,
      city,
    };

    try {
      const endpoint = activeTab === 'mitra' ? '/api/users/mitra' : '/api/users/superadmin';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        if (activeTab === 'mitra') {
          onMitraCreated(data.user);
        } else {
          onSuperadminCreated(data.user);
        }
        setShowAddForm(false);
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setOrganizationName('');
        setCity('');
        if (showToast) {
          showToast(`Berhasil menambahkan ${data.user.name} sebagai ${activeTab}.`);
        }
      } else {
        alert(data.error || 'Gagal menambahkan user');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
        <button
          onClick={() => {
            setActiveTab('mitra');
            setShowAddForm(false);
          }}
          className={`px-4 py-2 text-[13px] font-semibold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'mitra'
              ? 'bg-surface-container text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          Mitra Penyelenggara ({users.filter((u) => u.role === 'mitra').length})
        </button>
        <button
          onClick={() => {
            setActiveTab('superadmin');
            setShowAddForm(false);
          }}
          className={`px-4 py-2 text-[13px] font-semibold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'superadmin'
              ? 'bg-surface-container text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          Super Admin ({users.filter((u) => u.role === 'superadmin').length})
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-on-surface">
            Daftar {activeTab === 'mitra' ? 'Mitra Penyelenggara' : 'Super Administrator'}
          </h2>
          <p className="text-[12px] text-on-surface-variant">
            {activeTab === 'mitra'
              ? 'Kelola lembaga mitra penyelenggara pelatihan Al-Quran disabilitas se-Indonesia.'
              : 'Kelola akun administrator dengan hak akses penuh sistem.'}
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-primary text-on-primary text-[13px] font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showAddForm ? 'close' : 'add'}
            </span>
            {showAddForm ? 'Batal' : `Tambah ${activeTab === 'mitra' ? 'Mitra' : 'Admin'}`}
          </button>
        )}
      </div>

      {/* Add User Form */}
      {showAddForm && isSuperAdmin && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-[16px] font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">person_add</span>
            Form Tambah {activeTab === 'mitra' ? 'Mitra Baru' : 'Super Admin Baru'}
          </h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-on-surface mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ust. Ahmad Fauzi, M.Pd"
                className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-on-surface mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.org"
                className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-on-surface mb-1.5">
                No WhatsApp
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
              />
            </div>
            {activeTab === 'mitra' && (
              <div>
                <label className="block text-[12px] font-semibold text-on-surface mb-1.5">
                  Nama Lembaga / Yayasan
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Yayasan Sahabat Difabel Mengaji"
                  className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
                />
              </div>
            )}
            <div>
              <label className="block text-[12px] font-semibold text-on-surface mb-1.5">
                Provinsi
              </label>
              <input
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Jawa Barat"
                className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-on-surface mb-1.5">
                Kota / Kabupaten
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kota Bandung"
                className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
              />
            </div>
            <div className="md:col-span-2 pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary text-on-primary text-[13px] font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="px-4 py-3.5 text-[12px] font-semibold text-on-surface-variant">
                  Pengguna
                </th>
                {activeTab === 'mitra' && (
                  <th className="px-4 py-3.5 text-[12px] font-semibold text-on-surface-variant">
                    Lembaga
                  </th>
                )}
                <th className="px-4 py-3.5 text-[12px] font-semibold text-on-surface-variant">
                  Kontak
                </th>
                <th className="px-4 py-3.5 text-[12px] font-semibold text-on-surface-variant">
                  Lokasi
                </th>
                <th className="px-4 py-3.5 text-[12px] font-semibold text-on-surface-variant">
                  Tgl Bergabung
                </th>
                <th className="px-4 py-3.5 text-[12px] font-semibold text-on-surface-variant text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === 'mitra' ? 6 : 5}
                    className="px-4 py-10 text-center text-on-surface-variant text-[13px]"
                  >
                    Belum ada data {activeTab === 'mitra' ? 'Mitra' : 'Super Admin'}.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-surface-container-low/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-outline-variant/40 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[14px] shrink-0 border border-primary/20">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-on-surface leading-snug">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-on-surface-variant truncate">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    {activeTab === 'mitra' && (
                      <td className="px-4 py-3 text-[13px] text-on-surface">
                        <span className="font-medium">{u.organizationName || '-'}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-[13px] text-on-surface">
                      <span className="font-mono text-[12px]">{u.phone}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-on-surface">
                      {u.city ? `${u.city}, ` : ''}
                      {u.province || '-'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-on-surface-variant">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {/* ICON EDIT */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Data Diri & Foto Profil"
                          className="p-1.5 rounded-lg text-primary hover:text-primary-dark hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[19px]">edit</span>
                        </button>

                        {/* ICON HAPUS */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={deletingId === u.id}
                            title="Hapus Pengguna"
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[19px]">
                              {deletingId === u.id ? 'hourglass_empty' : 'delete'}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP MODAL EDIT DATA DIRI & FOTO PROFIL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full border border-outline-variant/30 shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/60">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[24px]">manage_accounts</span>
                <div>
                  <h3 className="text-[16px] font-bold text-on-surface">
                    Edit Data Pengguna
                  </h3>
                  <p className="text-[12px] text-on-surface-variant">
                    {editingUser.name} &bull;{' '}
                    <span className="font-semibold text-primary">
                      {editingUser.role === 'superadmin' ? 'Super Admin' : 'Mitra Penyelenggara'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseEdit}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              {/* BAGIAN FOTO PROFIL */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-on-surface uppercase tracking-wider">
                    Foto Profil Pengguna
                  </label>
                  {isSuperAdmin ? (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Hak Edit: Super Admin
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Terkunci untuk Mitra
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0">
                    {editAvatar ? (
                      <img
                        src={editAvatar}
                        alt="Preview Foto"
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[28px] font-bold border-2 border-primary/30 shadow-xs">
                        {editName ? editName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    {isCompressingAvatar && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-[10px]">
                        Memproses...
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    {isSuperAdmin ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[12px] font-semibold hover:bg-primary/90 cursor-pointer transition-colors shadow-xs">
                            <span className="material-symbols-outlined text-[16px]">upload</span>
                            <span>Unggah Foto Profil</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarFileChange}
                            />
                          </label>

                          {editAvatar && (
                            <button
                              type="button"
                              onClick={handleRemoveAvatar}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-[12px] font-semibold transition-colors cursor-pointer border border-red-200"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              <span>Hapus Foto</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                          Hanya Super Admin yang dapat mengganti foto profil. Format JPG, PNG, atau WEBP.
                        </p>
                      </>
                    ) : (
                      <div className="text-[12px] text-on-surface-variant bg-white/60 p-2 rounded-lg border border-outline-variant/20">
                        <span className="font-semibold text-amber-800">Perhatian:</span> Penggantian foto profil hanya dapat dilakukan oleh Super Admin. Hubungi administrator sistem jika ingin memperbarui foto.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FORM DATA DIRI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Email Akun <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Nomor WhatsApp / Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Peran Pengguna (Role)
                  </label>
                  <select
                    disabled={!isSuperAdmin}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'superadmin' | 'mitra')}
                    className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary bg-surface-container-lowest text-on-surface disabled:opacity-60"
                  >
                    <option value="mitra">Mitra Penyelenggara</option>
                    <option value="superadmin">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Nama Lembaga / Instansi
                  </label>
                  <input
                    type="text"
                    value={editOrgName}
                    onChange={(e) => setEditOrgName(e.target.value)}
                    placeholder="Contoh: Yayasan Sahabat Netra Mengaji"
                    className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={editProvince}
                    onChange={(e) => setEditProvince(e.target.value)}
                    placeholder="Contoh: Jawa Barat"
                    className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Contoh: Kota Bandung"
                    className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold text-on-surface mb-1">
                    Bio / Catatan Khusus
                  </label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Catatan keahlian, tugas, atau profil singkat..."
                    className="w-full px-3 py-2 text-[13px] border border-outline-variant/50 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest text-on-surface"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 rounded-lg border border-outline-variant/50 text-[13px] font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || isCompressingAvatar}
                  className="px-6 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
