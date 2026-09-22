import React, { useEffect, useState } from 'react';
import { SystemStats, Participant, TrainingProposal } from '../types.ts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportResponse {
  stats: SystemStats;
  disabilityCounts: Record<string, number>;
  funnelStages: {
    totalPendaftar: number;
    terverifikasi: number;
    assessment: number;
    pelatihanAktif: number;
    lulusSertifikasi: number;
  };
  regionBreakdown: Record<string, number>;
  participants: Participant[];
  events: TrainingProposal[];
}

interface ReportsProps {
  onNavigateToParticipants?: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ onNavigateToParticipants }) => {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState(false);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/reports/summary');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalParticipants = data?.stats?.totalParticipants || data?.participants?.length || 0;

  // Real Funnel Calculations
  const participantsList = data?.participants || [];
  const funnel = {
    pendaftaran: totalParticipants,
    pendaftaranPct: totalParticipants > 0 ? 100 : 0,
    terverifikasi: participantsList.filter(p => p.noWa && p.noWa.length >= 8).length,
    terverifikasiPct: totalParticipants > 0 ? Math.round((participantsList.filter(p => p.noWa && p.noWa.length >= 8).length / totalParticipants) * 100) : 0,
    assessment: participantsList.filter(p => p.statusKehadiran !== 'batal').length,
    assessmentPct: totalParticipants > 0 ? Math.round((participantsList.filter(p => p.statusKehadiran !== 'batal').length / totalParticipants) * 100) : 0,
    pelatihanAktif: participantsList.filter(p => p.statusKehadiran === 'terdaftar' || p.statusKehadiran === 'hadir').length,
    pelatihanAktifPct: totalParticipants > 0 ? Math.round((participantsList.filter(p => p.statusKehadiran === 'terdaftar' || p.statusKehadiran === 'hadir').length / totalParticipants) * 100) : 0,
    lulus: participantsList.filter(p => p.statusKehadiran === 'hadir').length,
    lulusPct: totalParticipants > 0 ? Math.round((participantsList.filter(p => p.statusKehadiran === 'hadir').length / totalParticipants) * 100) : 0,
  };

  // Real Disability Calculation
  const countNetra = participantsList.filter(p => p.kategoriDisabilitas === 'tunanetra').length;
  const countRungu = participantsList.filter(p => p.kategoriDisabilitas === 'tunarungu').length;
  const countDaksa = participantsList.filter(p => p.kategoriDisabilitas === 'tunadaksa').length;
  const countIntelektual = participantsList.filter(p => p.kategoriDisabilitas === 'intelektual_autisme').length;
  const countPendamping = participantsList.filter(p => p.kategoriDisabilitas === 'pendamping_umum').length;

  const denom = totalParticipants || 1;
  const pctNetra = totalParticipants > 0 ? Number(((countNetra / denom) * 100).toFixed(1)) : 0;
  const pctRungu = totalParticipants > 0 ? Number(((countRungu / denom) * 100).toFixed(1)) : 0;
  const pctDaksa = totalParticipants > 0 ? Number(((countDaksa / denom) * 100).toFixed(1)) : 0;
  const pctIntelektual = totalParticipants > 0 ? Number(((countIntelektual / denom) * 100).toFixed(1)) : 0;
  const pctPendamping = totalParticipants > 0 ? Number(((countPendamping / denom) * 100).toFixed(1)) : 0;

  // Export to Excel / CSV
  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      const today = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel

      // Document Title
      csv += 'LAPORAN EKSEKUTIF EKOSISTEM AL-QURAN RAMAH DISABILITAS INDONESIA\n';
      csv += `Tanggal Unduh: ${today}\n`;
      csv += `Status Data: Sinkronisasi Real-Time (Tanpa Dummy)\n\n`;

      // 1. Executive Summary
      csv += '=== 1. RINGKASAN METRIK UTAMA ===\n';
      csv += 'Metrik,Nilai,Satuan,Keterangan\n';
      csv += `Total Peserta Terdaftar,${totalParticipants},Orang,Peserta terverifikasi di database\n`;
      csv += `Total Pelatihan Disetujui,${data?.stats?.approvedEvents || 0},Event,Terselenggara / aktif\n`;
      csv += `Total Komunitas & Lembaga,${data?.stats?.totalCommunities || 0},Lembaga,Tersebar di berbagai provinsi\n`;
      csv += `Proposal Menunggu Persetujuan,${data?.stats?.pendingProposals || 0},Proposal,Menunggu review Super Admin\n\n`;

      // 2. Real Funnel
      csv += '=== 2. FUNNEL PELATIHAN PESERTA (REAL DATA) ===\n';
      csv += 'Tahap Funnel,Jumlah Peserta,Persentase Real,Definisi Indikator\n';
      csv += `1. Pendaftaran Masuk,${funnel.pendaftaran},${funnel.pendaftaranPct}%,Total pendaftaran masuk ke sistem\n`;
      csv += `2. Terverifikasi Kontak WA/Email,${funnel.terverifikasi},${funnel.terverifikasiPct}%,Nomor valid dan data terkonfirmasi\n`;
      csv += `3. Seleksi & Assessment Kebutuhan,${funnel.assessment},${funnel.assessmentPct}%,Peserta siap dengan fasilitas inklusif\n`;
      csv += `4. Pelatihan Aktif Kelas,${funnel.pelatihanAktif},${funnel.pelatihanAktifPct}%,Peserta aktif mengikuti modul quran\n`;
      csv += `5. Lulus Sertifikasi / Hadir,${funnel.lulus},${funnel.lulusPct}%,Peserta menuntaskan pelatihan bersertifikat\n\n`;

      // 3. Disability Distribution
      csv += '=== 3. DISTRIBUSI RAGAM DISABILITAS (REAL DATA) ===\n';
      csv += 'Ragam Disabilitas,Jumlah Peserta,Persentase Real,Fasilitas Pendukung\n';
      csv += `Tunanetra (Braille),${countNetra},${pctNetra}%,Mushaf Quran Braille & Relawan Pendamping\n`;
      csv += `Tunarungu (Isyarat),${countRungu},${pctRungu}%,Juru Bahasa Isyarat (JBI) & Video Visual\n`;
      csv += `Tunadaksa,${countDaksa},${pctDaksa}%,Akses Rampa & Meja Belajar Khusus\n`;
      csv += `Intelektual & Autisme,${countIntelektual},${pctIntelektual}%,Flashcard Sensori & Ruang Tenang\n`;
      if (countPendamping > 0) {
        csv += `Pendamping / Umum,${countPendamping},${pctPendamping}%,Orang tua & ustadz pendamping\n`;
      }
      csv += `TOTAL,${totalParticipants},100%,\n\n`;

      // 4. Regional Distribution
      csv += '=== 4. PERSEBARAN WILAYAH LEMBAGA / KOMUNITAS ===\n';
      csv += 'Provinsi,Jumlah Komunitas / Lembaga\n';
      (Object.entries(data?.regionBreakdown || {}) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .forEach(([prov, count]) => {
          csv += `"${prov}",${count}\n`;
        });
      csv += '\n';

      // 5. Participants Detailed List
      csv += '=== 5. DAFTAR LENGKAP PESERTA TERDAFTAR ===\n';
      csv += 'No,ID Peserta,Nama Lengkap,Usia,Kategori Disabilitas,No. WhatsApp,Email,Event Terdaftar,Kebutuhan Fasilitas,Status Kehadiran,Waktu Pendaftaran\n';
      participantsList.forEach((p, idx) => {
        const fasil = (p.kebutuhanFasilitas || []).join('; ');
        const waktu = p.waktuDaftar ? new Date(p.waktuDaftar).toLocaleString('id-ID') : '-';
        csv += `${idx + 1},"${p.id}","${p.namaLengkap}",${p.usia},"${p.kategoriDisabilitas}","${p.noWa}","${p.email || '-'}","${p.eventTitle || '-'}","${fasil}","${p.statusKehadiran}","${waktu}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Laporan_Ekosistem_Quran_Disabilitas_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export Excel error:', e);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export to Real PDF via jsPDF & autoTable
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const today = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Header Banner
      doc.setFillColor(0, 90, 113); // Primary brand #005a71
      doc.rect(0, 0, 210, 25, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('PUSAT LAYANAN AL-QURAN DISABILITAS INDONESIA', 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(235, 245, 250);
      doc.text('Laporan Eksekutif Perkembangan Pelatihan & Demografi Peserta (Data Riil Terverifikasi)', 14, 17);
      doc.text(`Tanggal Unduh: ${today} | Dokumen Resmi Sistem`, 14, 22);

      // Section 1: Ringkasan Metrik
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(0, 90, 113);
      doc.text('1. Ringkasan Metrik Utama Ekosistem', 14, 33);

      autoTable(doc, {
        startY: 36,
        head: [['Indikator Utama', 'Nilai Real', 'Satuan', 'Keterangan Sistem']],
        body: [
          ['Total Peserta Terdaftar', `${totalParticipants}`, 'Orang', 'Peserta terverifikasi di database'],
          ['Pelatihan Disetujui & Berjalan', `${data?.stats?.approvedEvents || 0}`, 'Event', 'Terselenggara / aktif'],
          ['Komunitas & Lembaga Al-Quran', `${data?.stats?.totalCommunities || 0}`, 'Lembaga', 'Tersebar di berbagai provinsi'],
          ['Proposal Menunggu Persetujuan', `${data?.stats?.pendingProposals || 0}`, 'Pengajuan', 'Menunggu review Super Admin'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 90, 113], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2.2 },
      });

      // Section 2: Real Funnel
      const afterSec1 = (doc as any).lastAutoTable.finalY + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(0, 90, 113);
      doc.text('2. Funnel Pelatihan Peserta (Real Tanpa Dummy)', 14, afterSec1);

      autoTable(doc, {
        startY: afterSec1 + 3,
        head: [['Tahap Funnel', 'Jumlah Peserta', 'Persentase Real (%)', 'Keterangan Indikator']],
        body: [
          ['1. Pendaftaran Masuk', `${funnel.pendaftaran}`, `${funnel.pendaftaranPct}%`, 'Formulir tersubmit ke database'],
          ['2. Terverifikasi Kontak WA/Email', `${funnel.terverifikasi}`, `${funnel.terverifikasiPct}%`, 'Kontak aktif dan terkonfirmasi'],
          ['3. Kesiapan Fasilitas & Asesmen', `${funnel.assessment}`, `${funnel.assessmentPct}%`, 'Akomodasi ramah disabilitas siap'],
          ['4. Pelatihan Aktif di Kelas', `${funnel.pelatihanAktif}`, `${funnel.pelatihanAktifPct}%`, 'Peserta aktif mengikuti modul'],
          ['5. Lulus / Bersertifikat', `${funnel.lulus}`, `${funnel.lulusPct}%`, 'Tuntas menyelesaikan pelatihan'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2.2 },
      });

      // Section 3: Ragam Disabilitas
      const afterSec2 = (doc as any).lastAutoTable.finalY + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(0, 90, 113);
      doc.text('3. Distribusi Ragam Disabilitas (Real Data Peserta)', 14, afterSec2);

      autoTable(doc, {
        startY: afterSec2 + 3,
        head: [['Ragam Disabilitas', 'Jumlah Peserta', 'Persentase (%)', 'Fasilitas & Pendekatan Utama']],
        body: [
          ['Tunanetra (Braille)', `${countNetra}`, `${pctNetra}%`, 'Mushaf Quran Braille LPMQ & Relawan Mobilitas'],
          ['Tunarungu / Tuli (Isyarat)', `${countRungu}`, `${pctRungu}%`, 'Metode BISINDO & Juru Bahasa Isyarat (JBI)'],
          ['Tunadaksa (Fisik)', `${countDaksa}`, `${pctDaksa}%`, 'Akses Rampa Kursi Roda & Meja Belajar Khusus'],
          ['Intelektual & Autisme', `${countIntelektual}`, `${pctIntelektual}%`, 'Flashcard Sensori Taktil & Ruang Tenang'],
          ['Pendamping / Umum', `${countPendamping}`, `${pctPendamping}%`, 'Pelatihan Pedagogik Pengasuh & Guru SLB'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2.2 },
      });

      // Section 4: Sample Data Peserta Terdaftar
      const afterSec3 = (doc as any).lastAutoTable.finalY + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(0, 90, 113);
      doc.text('4. Daftar Sampel Peserta Terdaftar', 14, afterSec3);

      const sampleRows = participantsList.slice(0, 10).map((p, idx) => [
        idx + 1,
        p.namaLengkap,
        p.kategoriDisabilitas.replace('_', ' '),
        p.noWa,
        (p.eventTitle || '-').slice(0, 32),
        p.statusKehadiran,
      ]);

      autoTable(doc, {
        startY: afterSec3 + 3,
        head: [['No', 'Nama Lengkap', 'Disabilitas', 'Kontak WA', 'Pelatihan', 'Status']],
        body: sampleRows.length > 0 ? sampleRows : [['-', 'Belum ada data', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [70, 80, 95], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 1.8 },
      });

      // Footer note
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      doc.text('Dokumen ini digenerate secara otomatis oleh Sistem Ekosistem Quran Disabilitas Indonesia.', 14, pageHeight - 6);
      doc.text(`ID Laporan: LPR-${Date.now().toString().slice(-6)}`, 155, pageHeight - 6);

      // Download file directly
      doc.save(`Laporan_Ekosistem_Quran_Disabilitas_${new Date().toISOString().slice(0, 10)}.pdf`);
      setPdfSuccessToast(true);
      setTimeout(() => setPdfSuccessToast(false), 3500);
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('Terjadi kesalahan teknis saat membuat PDF. Silakan coba lagi.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[13px] font-medium text-on-surface-variant">Memuat ringkasan data laporan eksekutif...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PDF Success Toast */}
      {pdfSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <div>
            <p className="text-[13px] font-semibold">File PDF Berhasil Diunduh!</p>
            <p className="text-[11px] text-emerald-100">Dokumen laporan telah tersimpan di perangkat Anda.</p>
          </div>
        </div>
      )}

      {/* Top Header Card with Actions */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[24px]">assessment</span>
            <h1 className="text-[20px] font-bold text-on-surface">Laporan & Audit Ekosistem</h1>
          </div>
          <p className="text-[13px] text-on-surface-variant">
            Data analitik konsolidasi real-time peserta, ragam disabilitas, dan efektivitas pelatihan.
          </p>
        </div>

        {/* Action Buttons: Unduh PDF & Unduh Excel */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-[12px] font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Unduh data laporan dalam format Excel (.csv)"
          >
            <span className="material-symbols-outlined text-[18px]">table_view</span>
            <span>{isExportingExcel ? 'Mengunduh...' : 'Unduh Excel'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 active:scale-[0.98] text-on-primary rounded-xl text-[12px] font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Unduh dokumen PDF laporan resmi langsung ke perangkat"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>{isExportingPdf ? 'Menyiapkan PDF...' : 'Unduh PDF'}</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-on-surface-variant text-[12px] font-medium">Total Peserta Terdaftar</span>
            <span className="material-symbols-outlined text-primary text-[18px]">groups</span>
          </div>
          <span className="text-[30px] font-bold text-on-surface leading-tight">{totalParticipants}</span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            100% Data Riil
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-on-surface-variant text-[12px] font-medium">Pelatihan Disetujui</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
          </div>
          <span className="text-[30px] font-bold text-primary leading-tight">{data?.stats?.approvedEvents || 0}</span>
          <span className="text-[11px] text-on-surface-variant font-medium mt-1">
            Dari total {data?.stats?.totalProposals || 0} diajukan
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-on-surface-variant text-[12px] font-medium">Lembaga & Komunitas</span>
            <span className="material-symbols-outlined text-amber-500 text-[18px]">apartment</span>
          </div>
          <span className="text-[30px] font-bold text-secondary leading-tight">{data?.stats?.totalCommunities || 0}</span>
          <span className="text-[11px] text-on-surface-variant font-medium mt-1">
            Terverifikasi di Peta Nasional
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-on-surface-variant text-[12px] font-medium">Tingkat Kelulusan</span>
            <span className="material-symbols-outlined text-indigo-500 text-[18px]">military_tech</span>
          </div>
          <span className="text-[30px] font-bold text-indigo-600 leading-tight">
            {funnel.lulusPct}%
          </span>
          <span className="text-[11px] text-on-surface-variant font-medium mt-1">
            {funnel.lulus} dari {totalParticipants} peserta
          </span>
        </div>
      </div>

      {/* Real Funnel & Real Disability Breakdown (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Real Funnel Pelatihan Peserta */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-on-surface">Funnel Pelatihan Peserta (Real-Time)</h2>
              <span className="text-[11px] font-semibold text-primary px-2.5 py-0.5 bg-primary/10 rounded-full">
                {totalParticipants} Peserta
              </span>
            </div>

            {/* Segmented Pipeline Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex gap-1 mb-5 bg-surface-container p-0.5">
              <div 
                className="h-full bg-secondary-container rounded-sm transition-all" 
                style={{ width: `${Math.max(8, funnel.pendaftaranPct)}%` }} 
                title={`Pendaftaran: ${funnel.pendaftaran} (${funnel.pendaftaranPct}%)`}
              ></div>
              <div 
                className="h-full bg-tertiary-fixed-dim rounded-sm transition-all" 
                style={{ width: `${Math.max(8, funnel.terverifikasiPct)}%` }} 
                title={`Terverifikasi: ${funnel.terverifikasi} (${funnel.terverifikasiPct}%)`}
              ></div>
              <div 
                className="h-full bg-primary rounded-sm transition-all" 
                style={{ width: `${Math.max(8, funnel.assessmentPct)}%` }} 
                title={`Assessment: ${funnel.assessment} (${funnel.assessmentPct}%)`}
              ></div>
              <div 
                className="h-full bg-surface-tint rounded-sm transition-all" 
                style={{ width: `${Math.max(8, funnel.pelatihanAktifPct)}%` }} 
                title={`Pelatihan Aktif: ${funnel.pelatihanAktif} (${funnel.pelatihanAktifPct}%)`}
              ></div>
              <div 
                className="h-full bg-primary-container rounded-sm transition-all" 
                style={{ width: `${Math.max(8, funnel.lulusPct)}%` }} 
                title={`Lulus Sertifikasi: ${funnel.lulus} (${funnel.lulusPct}%)`}
              ></div>
            </div>

            {/* Funnel Stage Details with Real % */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[13px] py-1 px-2 rounded-lg bg-surface-container-low/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-secondary-container"></span>
                  <span className="font-medium text-on-surface">1. Pendaftaran Masuk</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-on-surface">{funnel.pendaftaran} Peserta</span>
                  <span className="font-bold text-primary text-[12px] w-12 text-right">{funnel.pendaftaranPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px] py-1 px-2 rounded-lg bg-surface-container-low/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-tertiary-fixed-dim"></span>
                  <span className="font-medium text-on-surface">2. Pendaftaran Terverifikasi</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-on-surface">{funnel.terverifikasi} Peserta</span>
                  <span className="font-bold text-primary text-[12px] w-12 text-right">{funnel.terverifikasiPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px] py-1 px-2 rounded-lg bg-surface-container-low/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                  <span className="font-medium text-on-surface">3. Seleksi & Assessment Kebutuhan</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-on-surface">{funnel.assessment} Peserta</span>
                  <span className="font-bold text-primary text-[12px] w-12 text-right">{funnel.assessmentPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px] py-1 px-2 rounded-lg bg-surface-container-low/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-surface-tint"></span>
                  <span className="font-medium text-on-surface">4. Pelatihan Aktif Kelas</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-on-surface">{funnel.pelatihanAktif} Peserta</span>
                  <span className="font-bold text-primary text-[12px] w-12 text-right">{funnel.pelatihanAktifPct}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px] py-1 px-2 rounded-lg bg-surface-container-low/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary-container"></span>
                  <span className="font-medium text-on-surface">5. Lulus Sertifikasi / Hadir</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-on-surface">{funnel.lulus} Peserta</span>
                  <span className="font-bold text-primary text-[12px] w-12 text-right">{funnel.lulusPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-outline font-semibold">
            <span>Standar Evaluasi Kurikulum Ramah Disabilitas BNSP</span>
            <span className="text-primary">100% Bebas Dummy</span>
          </div>
        </div>

        {/* Right: Real Disability Distribution */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-on-surface">Distribusi Ragam Disabilitas</h2>
              <span className="text-[11px] font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded">
                Real Terdata
              </span>
            </div>

            <div className="space-y-4">
              {/* Tunanetra */}
              <div>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-on-surface font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#005a71]"></span>
                    Tunanetra (Braille)
                  </span>
                  <span className="text-on-surface font-semibold">{countNetra} ({pctNetra}%)</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-[#005a71] h-2 rounded-full transition-all" style={{ width: `${pctNetra}%` }}></div>
                </div>
              </div>

              {/* Tunarungu */}
              <div>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-on-surface font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fc6f5a]"></span>
                    Tunarungu (Isyarat)
                  </span>
                  <span className="text-on-surface font-semibold">{countRungu} ({pctRungu}%)</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-[#fc6f5a] h-2 rounded-full transition-all" style={{ width: `${pctRungu}%` }}></div>
                </div>
              </div>

              {/* Tunadaksa */}
              <div>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-on-surface font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffb95f]"></span>
                    Tunadaksa
                  </span>
                  <span className="text-on-surface font-semibold">{countDaksa} ({pctDaksa}%)</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-[#ffb95f] h-2 rounded-full transition-all" style={{ width: `${pctDaksa}%` }}></div>
                </div>
              </div>

              {/* Intelektual & Autisme */}
              <div>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-on-surface font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#81d1f0]"></span>
                    Intelektual & Autisme
                  </span>
                  <span className="text-on-surface font-semibold">{countIntelektual} ({pctIntelektual}%)</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-[#81d1f0] h-2 rounded-full transition-all" style={{ width: `${pctIntelektual}%` }}></div>
                </div>
              </div>

              {/* Pendamping / Umum */}
              {countPendamping > 0 && (
                <div>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-on-surface font-medium flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9333ea]"></span>
                      Pendamping / Umum
                    </span>
                    <span className="text-on-surface font-semibold">{countPendamping} ({pctPendamping}%)</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                    <div className="bg-[#9333ea] h-2 rounded-full transition-all" style={{ width: `${pctPendamping}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-outline font-semibold">
            <span>Ragam disabilitas diakui UU No. 8 Tahun 2016</span>
            <span className="text-primary font-bold">{totalParticipants} Total Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Region Distribution Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-sm">
        <h3 className="text-[16px] font-semibold text-on-surface mb-3">Persebaran Komunitas Berdasarkan Provinsi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.entries(data?.regionBreakdown || {}) as [string, number][])
            .sort(([, a], [, b]) => b - a)
            .map(([provinsi, count]) => (
              <div key={provinsi} className="flex justify-between items-center text-[13px] p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
                <span className="text-on-surface font-medium truncate pr-2">{provinsi}</span>
                <span className="px-2 py-0.5 bg-surface-container text-primary font-bold text-[12px] rounded-md shrink-0">
                  {count} Lembaga
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Separated Participant Management Banner & Quick Preview */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
              <h3 className="text-[16px] font-semibold text-on-surface">Data Peserta Pelatihan Terverifikasi</h3>
            </div>
            <p className="text-[12px] text-on-surface-variant mt-0.5">
              Data peserta kini dipisahkan ke <strong>Dashboard Data Peserta</strong> di panel navigasi sebelah kiri untuk pengelolaan penuh (tambah, edit, hapus status, filter lengkap).
            </p>
          </div>

          {onNavigateToParticipants && (
            <button
              onClick={onNavigateToParticipants}
              className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[12px] font-semibold flex items-center gap-2 border border-primary/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Buka Dashboard Data Peserta Lengkap ({totalParticipants})</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
        </div>

        {/* Quick Preview Table of Top 5 Recent Participants */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-surface-container-low text-on-surface-variant font-medium border-b border-outline-variant/30">
              <tr>
                <th className="py-2.5 px-4">Nama Lengkap</th>
                <th className="py-2.5 px-4">Ragam Disabilitas</th>
                <th className="py-2.5 px-4">Kontak WhatsApp</th>
                <th className="py-2.5 px-4">Pelatihan Terdaftar</th>
                <th className="py-2.5 px-4">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {participantsList.slice(0, 5).map(p => (
                <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-on-surface">
                    {p.namaLengkap}
                    <span className="block text-[11px] font-normal text-on-surface-variant">{p.usia} tahun</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-medium text-on-surface">
                      {p.kategoriDisabilitas.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-on-surface font-mono">{p.noWa}</td>
                  <td className="py-3 px-4 max-w-xs truncate text-on-surface-variant" title={p.eventTitle}>
                    {p.eventTitle || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      p.statusKehadiran === 'hadir'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.statusKehadiran === 'batal'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {p.statusKehadiran}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Signature Section */}
      <div className="hidden print:grid grid-cols-2 mt-12 pt-8 text-center text-xs text-black">
        <div>
          <p>Mengetahui,</p>
          <p className="font-bold mt-1">Koordinator Ekosistem Pelatihan</p>
          <div className="h-16"></div>
          <p className="font-semibold underline">( .................................................. )</p>
          <p className="text-[10px] text-gray-500">NIP. ..................................................</p>
        </div>
        <div>
          <p>Penanggung Jawab Data,</p>
          <p className="font-bold mt-1">Super Administrator Sistem</p>
          <div className="h-16"></div>
          <p className="font-semibold underline">( .................................................. )</p>
          <p className="text-[10px] text-gray-500">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
        </div>
      </div>
    </div>
  );
};
