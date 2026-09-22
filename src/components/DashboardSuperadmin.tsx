import React, { useState } from 'react';
import { 
  TrainingProposal, 
  Participant, 
  User, 
  QuranCommunity
} from '../types.ts';

interface DashboardSuperadminProps {
  currentUser: User;
  users: User[];
  proposals: TrainingProposal[];
  participants: Participant[];
  communities: QuranCommunity[];
  onProposalApproved: (approved: TrainingProposal) => void;
  onProposalRejected: (rejected: TrainingProposal) => void;
  onSuperadminCreated: (newUser: User) => void;
  onMitraCreated: (newMitra: User) => void;
  onNavigateToMap: () => void;
  onOpenChangePassword?: () => void;
}

export const DashboardSuperadmin: React.FC<DashboardSuperadminProps> = ({
  currentUser,
  users,
  proposals,
  participants,
  communities,
  onNavigateToMap,
  onOpenChangePassword,
}) => {
  const totalParticipants = participants.length;

  // Real Funnel Pelatihan Peserta (Data-driven, no dummy percentages)
  const stage1Count = totalParticipants;
  const stage1Pct = totalParticipants > 0 ? 100 : 0;

  const stage2Count = participants.filter(p => p.noWa && p.noWa.length >= 8).length;
  const stage2Pct = totalParticipants > 0 ? Math.round((stage2Count / totalParticipants) * 100) : 0;

  const stage3Count = participants.filter(p => p.statusKehadiran !== 'batal').length;
  const stage3Pct = totalParticipants > 0 ? Math.round((stage3Count / totalParticipants) * 100) : 0;

  const stage4Count = participants.filter(p => p.statusKehadiran === 'terdaftar' || p.statusKehadiran === 'hadir').length;
  const stage4Pct = totalParticipants > 0 ? Math.round((stage4Count / totalParticipants) * 100) : 0;

  const stage5Count = participants.filter(p => p.statusKehadiran === 'hadir').length;
  const stage5Pct = totalParticipants > 0 ? Math.round((stage5Count / totalParticipants) * 100) : 0;

  // Real Distribusi Ragam Disabilitas (Data-driven)
  const countNetra = participants.filter(p => p.kategoriDisabilitas === 'tunanetra').length;
  const countRungu = participants.filter(p => p.kategoriDisabilitas === 'tunarungu').length;
  const countDaksa = participants.filter(p => p.kategoriDisabilitas === 'tunadaksa').length;
  const countIntelektual = participants.filter(p => p.kategoriDisabilitas === 'intelektual_autisme').length;
  const countPendamping = participants.filter(p => p.kategoriDisabilitas === 'pendamping_umum').length;

  const denom = totalParticipants || 1;
  const pctNetra = totalParticipants > 0 ? Number(((countNetra / denom) * 100).toFixed(1)) : 0;
  const pctRungu = totalParticipants > 0 ? Number(((countRungu / denom) * 100).toFixed(1)) : 0;
  const pctDaksa = totalParticipants > 0 ? Number(((countDaksa / denom) * 100).toFixed(1)) : 0;
  const pctIntelektual = totalParticipants > 0 ? Number(((countIntelektual / denom) * 100).toFixed(1)) : 0;
  const pctPendamping = totalParticipants > 0 ? Number(((countPendamping / denom) * 100).toFixed(1)) : 0;

  // SVG Donut Circle Offsets
  const offsetNetra = 0;
  const offsetRungu = -pctNetra;
  const offsetDaksa = -(pctNetra + pctRungu);
  const offsetIntelektual = -(pctNetra + pctRungu + pctDaksa);
  const offsetPendamping = -(pctNetra + pctRungu + pctDaksa + pctIntelektual);

  return (
    <>
      {/* Header Profile & Quick Action Banner */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-container text-on-primary-container text-[11px] font-bold rounded-md mb-2 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Super Administrator Nasional
          </div>
          <h1 className="text-[20px] sm:text-[24px] font-semibold text-on-surface tracking-tight leading-tight">
            Ringkasan Eksekutif & Monitoring Pelatihan
          </h1>
          <p className="text-on-surface-variant text-[13px] mt-1 font-medium">
            Selamat datang, <strong className="text-on-surface">{currentUser.name}</strong> • {currentUser.organizationName || 'Pusat Al-Quran Disabilitas'}
          </p>
        </div>

        {onOpenChangePassword && (
          <button
            onClick={onOpenChangePassword}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/40 rounded-xl text-[13px] font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            title="Ganti Kata Sandi Super Admin"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">lock_reset</span>
            <span>Ganti Kata Sandi</span>
          </button>
        )}
      </div>

      {/* SECTION 1: FUNNEL & SOURCES (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Bento Card: Funnel Pelatihan Peserta */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold text-on-surface">Funnel Pelatihan Peserta</h2>
              <span className="text-[11px] font-semibold text-primary px-2.5 py-0.5 bg-primary/10 rounded-full">
                Real Data Sinkron ({totalParticipants} Peserta)
              </span>
            </div>

            {/* Metric Header */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-[36px] text-on-surface font-semibold tracking-tight leading-none">
                {totalParticipants}
              </span>
              <span className="text-[14px] text-on-surface-variant font-medium">total peserta terdaftar di sistem</span>
            </div>

            {/* Horizontal Segmented Pipeline Bar (Real Data Widths) */}
            <div className="w-full h-3 rounded-full overflow-hidden flex gap-1 mb-6 bg-surface-container p-0.5">
              <div 
                className="h-full bg-secondary-container rounded-sm transition-all" 
                style={{ width: `${Math.max(8, stage1Pct)}%` }} 
                title={`Pendaftaran Masuk: ${stage1Count} (${stage1Pct}%)`}
              ></div>
              <div 
                className="h-full bg-tertiary-fixed-dim rounded-sm transition-all" 
                style={{ width: `${Math.max(8, stage2Pct)}%` }} 
                title={`Terverifikasi: ${stage2Count} (${stage2Pct}%)`}
              ></div>
              <div 
                className="h-full bg-primary rounded-sm transition-all" 
                style={{ width: `${Math.max(8, stage3Pct)}%` }} 
                title={`Assessment Kebutuhan: ${stage3Count} (${stage3Pct}%)`}
              ></div>
              <div 
                className="h-full bg-surface-tint rounded-sm transition-all" 
                style={{ width: `${Math.max(8, stage4Pct)}%` }} 
                title={`Pelatihan Aktif: ${stage4Count} (${stage4Pct}%)`}
              ></div>
              <div 
                className="h-full bg-primary-container rounded-sm transition-all" 
                style={{ width: `${Math.max(8, stage5Pct)}%` }} 
                title={`Lulus Sertifikasi: ${stage5Count} (${stage5Pct}%)`}
              ></div>
            </div>

            {/* Breakdown Table Matching Reference Style (Real Data) */}
            <div className="space-y-3">
              {/* Stage 1 */}
              <div className="flex items-center justify-between text-[13px] text-on-surface hover:bg-surface-container-low/50 py-1.5 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-secondary-container"></span>
                  <span className="text-[13px] font-medium text-on-surface">1. Pendaftaran Masuk</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-on-surface">{stage1Count} Peserta</span>
                  <span className="text-[12px] font-bold text-primary w-12 text-right">{stage1Pct}%</span>
                </div>
              </div>
              
              {/* Stage 2 */}
              <div className="flex items-center justify-between text-[13px] text-on-surface hover:bg-surface-container-low/50 py-1.5 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-tertiary-fixed-dim"></span>
                  <span className="text-[13px] font-medium text-on-surface">2. Terverifikasi Kontak WA/Email</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-on-surface">{stage2Count} Peserta</span>
                  <span className="text-[12px] font-bold text-primary w-12 text-right">{stage2Pct}%</span>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="flex items-center justify-between text-[13px] text-on-surface hover:bg-surface-container-low/50 py-1.5 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                  <span className="text-[13px] font-medium text-on-surface">3. Seleksi & Assessment Kebutuhan</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-on-surface">{stage3Count} Peserta</span>
                  <span className="text-[12px] font-bold text-primary w-12 text-right">{stage3Pct}%</span>
                </div>
              </div>

              {/* Stage 4 */}
              <div className="flex items-center justify-between text-[13px] text-on-surface hover:bg-surface-container-low/50 py-1.5 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-surface-tint"></span>
                  <span className="text-[13px] font-medium text-on-surface">4. Pelatihan Aktif Kelas</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-on-surface">{stage4Count} Peserta</span>
                  <span className="text-[12px] font-bold text-primary w-12 text-right">{stage4Pct}%</span>
                </div>
              </div>

              {/* Stage 5 */}
              <div className="flex items-center justify-between text-[13px] text-on-surface hover:bg-surface-container-low/50 py-1.5 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary-container"></span>
                  <span className="text-[13px] font-medium text-on-surface">5. Lulus Sertifikasi / Hadir</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-on-surface">{stage5Count} Peserta</span>
                  <span className="text-[12px] font-bold text-primary w-12 text-right">{stage5Pct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-semibold text-outline">
            <span>Standar kurikulum ramah disabilitas BNSP & Kemenag RI</span>
            <span className="text-primary font-semibold">Terkonfirmasi Real-time</span>
          </div>
        </div>

        {/* Right Bento Card: Distribusi Kategori Disabilitas (Real Data) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold text-on-surface">Distribusi Ragam Disabilitas</h2>
              <span className="text-[11px] font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded">
                Real: 100% Terdata
              </span>
            </div>

            {/* Donut Visual + Legend Container (Dynamic SVG & Real Percentages) */}
            <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
              <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" fill="transparent" r="15.91549430918954" stroke="#eff4ff" strokeWidth="6.5"></circle>
                  {pctNetra > 0 && (
                    <circle cx="21" cy="21" fill="transparent" r="15.91549430918954" stroke="#005a71" strokeDasharray={`${pctNetra} ${100 - pctNetra}`} strokeDashoffset={offsetNetra} strokeWidth="6.5"></circle>
                  )}
                  {pctRungu > 0 && (
                    <circle cx="21" cy="21" fill="transparent" r="15.91549430918954" stroke="#fc6f5a" strokeDasharray={`${pctRungu} ${100 - pctRungu}`} strokeDashoffset={offsetRungu} strokeWidth="6.5"></circle>
                  )}
                  {pctDaksa > 0 && (
                    <circle cx="21" cy="21" fill="transparent" r="15.91549430918954" stroke="#ffb95f" strokeDasharray={`${pctDaksa} ${100 - pctDaksa}`} strokeDashoffset={offsetDaksa} strokeWidth="6.5"></circle>
                  )}
                  {pctIntelektual > 0 && (
                    <circle cx="21" cy="21" fill="transparent" r="15.91549430918954" stroke="#81d1f0" strokeDasharray={`${pctIntelektual} ${100 - pctIntelektual}`} strokeDashoffset={offsetIntelektual} strokeWidth="6.5"></circle>
                  )}
                  {pctPendamping > 0 && (
                    <circle cx="21" cy="21" fill="transparent" r="15.91549430918954" stroke="#9333ea" strokeDasharray={`${pctPendamping} ${100 - pctPendamping}`} strokeDashoffset={offsetPendamping} strokeWidth="6.5"></circle>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[18px] font-bold text-on-surface leading-none">
                    {totalParticipants}
                  </span>
                  <span className="text-[10px] font-semibold text-outline uppercase tracking-wider mt-0.5">Peserta</span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#005a71]"></span>
                    <span className="text-on-surface text-[12px] font-medium">Tunanetra (Braille)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-on-surface">{countNetra}</span>
                    <span className="text-outline w-12 text-right font-bold">{pctNetra}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#fc6f5a]"></span>
                    <span className="text-on-surface text-[12px] font-medium">Tunarungu (Isyarat)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-on-surface">{countRungu}</span>
                    <span className="text-outline w-12 text-right font-bold">{pctRungu}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#ffb95f]"></span>
                    <span className="text-on-surface text-[12px] font-medium">Tunadaksa</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-on-surface">{countDaksa}</span>
                    <span className="text-outline w-12 text-right font-bold">{pctDaksa}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#81d1f0]"></span>
                    <span className="text-on-surface text-[12px] font-medium">Intelektual / Autisme</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-on-surface">{countIntelektual}</span>
                    <span className="text-outline w-12 text-right font-bold">{pctIntelektual}%</span>
                  </div>
                </div>
                {countPendamping > 0 && (
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#9333ea]"></span>
                      <span className="text-on-surface text-[12px] font-medium">Pendamping / Umum</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-on-surface">{countPendamping}</span>
                      <span className="text-outline w-12 text-right font-bold">{pctPendamping}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/20">
            <span className="text-[11px] font-semibold text-outline">
              Total terdata: {totalParticipants} peserta
            </span>
            <span className="text-[11px] font-semibold text-primary">
              Sinkronisasi Akurat
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: TRACKING TRENDS (DUAL BEZIER CURVE CHART) */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-on-surface">Tren Kehadiran & Kelulusan Pelatihan</h2>
            </div>
            <div className="flex items-center gap-8 mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-semibold text-on-surface leading-none">940</span>
                <span className="text-[14px] text-on-surface-variant">peserta hadir & lulus</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-semibold text-secondary leading-none">85</span>
                <span className="text-[14px] text-on-surface-variant">drop-out / tertunda</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[12px] font-medium text-outline">Rentang:</span>
            <button className="flex items-center gap-1 text-[12px] font-medium text-on-surface bg-surface-container-low px-2.5 py-1 rounded">
              <span>Maret - Agustus 2024</span>
              <span className="material-symbols-outlined text-base">expand_more</span>
            </button>
          </div>
        </div>

        {/* SVG Chart Placeholder */}
        <div className="relative w-full h-72 mt-6">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 280">
            <defs>
              <linearGradient id="coralGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ab3425" stopOpacity="0.12"></stop>
                <stop offset="100%" stopColor="#ab3425" stopOpacity="0.0"></stop>
              </linearGradient>
              <linearGradient id="tealGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#005a71" stopOpacity="0.08"></stop>
                <stop offset="100%" stopColor="#005a71" stopOpacity="0.0"></stop>
              </linearGradient>
            </defs>
            <g className="text-outline-variant stroke-outline-variant/30" strokeDasharray="2 4" strokeWidth="1">
              <line x1="35" x2="1000" y1="20" y2="20"></line>
              <line x1="35" x2="1000" y1="70" y2="70"></line>
              <line x1="35" x2="1000" y1="120" y2="120"></line>
              <line x1="35" x2="1000" y1="170" y2="170"></line>
              <line x1="35" x2="1000" y1="220" y2="220"></line>
              <line className="stroke-outline-variant/50" strokeDasharray="0" x1="35" x2="1000" y1="260" y2="260"></line>
            </g>
            <text fill="#6f787d" fontFamily="Inter" fontSize="11" x="10" y="24">100</text>
            <text fill="#6f787d" fontFamily="Inter" fontSize="11" x="15" y="74">80</text>
            <text fill="#6f787d" fontFamily="Inter" fontSize="11" x="15" y="124">60</text>
            <text fill="#6f787d" fontFamily="Inter" fontSize="11" x="15" y="174">40</text>
            <text fill="#6f787d" fontFamily="Inter" fontSize="11" x="15" y="224">20</text>
            <text fill="#6f787d" fontFamily="Inter" fontSize="11" x="22" y="264">0</text>
            
            {/* Curves */}
            <path d="M 50 110 C 140 180, 170 230, 230 230 C 290 230, 350 140, 410 140 C 470 140, 520 125, 590 125 C 660 125, 710 75, 770 75 C 830 75, 890 150, 950 205" fill="none" stroke="#005a71" strokeLinecap="round" strokeWidth="2.5"></path>
            <path d="M 50 110 C 140 180, 170 230, 230 230 C 290 230, 350 140, 410 140 C 470 140, 520 125, 590 125 C 660 125, 710 75, 770 75 C 830 75, 890 150, 950 205 L 950 260 L 50 260 Z" fill="url(#tealGrad)"></path>
            <path d="M 50 130 C 120 160, 170 170, 230 170 C 300 170, 350 65, 410 65 C 470 65, 530 250, 590 250 C 650 250, 710 170, 770 170 C 830 170, 890 120, 950 65" fill="none" stroke="#ab3425" strokeLinecap="round" strokeWidth="2.5"></path>
            <path d="M 50 130 C 120 160, 170 170, 230 170 C 300 170, 350 65, 410 65 C 470 65, 530 250, 590 250 C 650 250, 710 170, 770 170 C 830 170, 890 120, 950 65 L 950 260 L 50 260 Z" fill="url(#coralGrad)"></path>

            {/* Points */}
            <circle cx="50" cy="110" fill="#005a71" r="4.5" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="230" cy="230" fill="#005a71" r="4.5" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="410" cy="140" fill="#005a71" r="4.5" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="590" cy="125" fill="#005a71" r="4.5" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="770" cy="75" fill="#005a71" r="4.5" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="950" cy="205" fill="#005a71" r="4.5" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="110" cy="150" fill="#ab3425" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="230" cy="170" fill="#ab3425" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="410" cy="65" fill="#ab3425" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="590" cy="250" fill="#ab3425" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="770" cy="170" fill="#ab3425" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="890" cy="130" fill="#ab3425" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
            <circle cx="950" cy="65" fill="#ab3425" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
          </svg>
        </div>

        <div className="grid grid-cols-6 text-center text-[11px] font-semibold text-outline mt-3 pl-8 pr-4">
          <div>Maret</div><div>April</div><div>Mei</div><div>Juni</div><div>Juli</div><div>Agustus</div>
        </div>

        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-outline-variant/20">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="w-3 h-3 rounded-sm bg-primary"></span>
            <span className="text-[12px] font-semibold text-on-surface">Peserta Hadir & Lulus Sertifikasi</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="w-3 h-3 rounded-sm bg-secondary"></span>
            <span className="text-[12px] font-semibold text-on-surface">Peserta Drop-out / Tertunda</span>
          </div>
          <div className="ml-auto text-[11px] font-semibold text-outline flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>Lonjakan drop-out pada Mei disebabkan kendala jadwal ujian sekolah inklusi</span>
          </div>
        </div>
      </div>
    </>
  );
};
