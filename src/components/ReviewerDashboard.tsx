/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../dbService';
import { Protocol, User, Review } from '../types';
import ReviewerProfileForm from './ReviewerProfileForm';
import { security } from '../utils/security';
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

interface ReviewerDashboardProps {
  user: User;
}

export default function ReviewerDashboard({ user }: ReviewerDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [confirmDownload, setConfirmDownload] = useState<{protocol: Protocol, fileUrl: string, title: string} | null>(null);
  const [conclusion, setConclusion] = useState<Review['conclusion']>('APPROVED');
  const [notes, setNotes] = useState('');

  const handleDownload = () => {
    if (confirmDownload && confirmDownload.fileUrl) {
       window.open(confirmDownload.fileUrl, '_blank');
    }
    setConfirmDownload(null);
  };

  const userId = currentUser.id;
  const isProfileComplete = !!currentUser.profile?.isProfileComplete;

  useEffect(() => {
    if (isProfileComplete) {
      const fetchProtocols = async () => {
        try {
          const allProtocols = await dbService.getProtocols();
          setProtocols(allProtocols.filter(p => p.status === 'ASSIGNED' || p.status === 'REVIEWING' || p.status === 'APPROVED'));
        } catch (err) {
          console.error("Failed to fetch protocols:", err);
        }
      };
      fetchProtocols();
    }
  }, [userId, isProfileComplete]);

  const handleReviewSubmit = async () => {
    if (!selectedProtocol) return;

    const review: Review = {
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      assignedAt: new Date().toLocaleDateString('id-ID'),
      submittedAt: new Date().toLocaleDateString('id-ID'),
      reviewFile: 'review_result.pdf',
      conclusion,
      notes,
    };

    const updatedProtocol: Protocol = {
      ...selectedProtocol,
      status: conclusion === 'APPROVED' ? 'APPROVED' : 'REVISION_REQUIRED',
      reviews: [...(selectedProtocol.reviews || []), review],
    };

    const success = await dbService.saveProtocol(updatedProtocol);
    if (success) {
      setSelectedProtocol(null);
      const allProtocols = await dbService.getProtocols();
      setProtocols(allProtocols.filter(p => p.status === 'ASSIGNED' || p.status === 'REVIEWING' || p.status === 'APPROVED'));
    }
  };

  // If profile is not complete, show the registration form
  if (!currentUser.profile?.isProfileComplete) {
    return (
      <ReviewerProfileForm 
        user={currentUser} 
        onComplete={(updatedUser) => {
          setCurrentUser(updatedUser);
          // Also update local storage so App keeps the state
          localStorage.setItem('sim_kepk_user', security.encrypt(updatedUser));
        }} 
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-auto">
      {/* Card 1: Reviewer Stats */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-border-color p-5 shadow-sm flex flex-col">
        <h2 className="text-unair-blue font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border-color pb-2">
          <Clock className="w-4 h-4" />
          Statistik Telaah
        </h2>
        <div className="space-y-3">
          <div className="bg-bg-light p-3 rounded-xl flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-text-muted">Total Tugas</span>
            <span className="font-bold text-unair-blue">{protocols.length}</span>
          </div>
          <div className="bg-bg-light p-3 rounded-xl flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-text-muted">Selesai</span>
            <span className="font-bold text-accent-green">{protocols.filter(p => p.status === 'APPROVED').length}</span>
          </div>
        </div>
      </div>

      {/* Card 2: Welcome/Info */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-border-color p-5 shadow-sm flex flex-col justify-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-unair-blue/10 flex items-center justify-center text-unair-blue">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-unair-blue">Halo, {user.name}</h2>
            <p className="text-sm text-text-muted">Anda memiliki {protocols.filter(p => p.status !== 'APPROVED').length} tugas telaah etik yang perlu diselesaikan.</p>
          </div>
        </div>
      </div>

      {/* Card 3: Task List */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-border-color shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-border-color flex justify-between items-center">
          <h2 className="text-unair-blue font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-none pb-0 mb-0">
            <FileText className="w-4 h-4" />
            Daftar Tugas Telaah Etik
          </h2>
        </div>

        <div className="overflow-x-auto">
          {protocols.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-text-muted">Tidak ada protokol yang perlu di-review saat ini.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-light/50">
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Tgl Assign</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">No. Reg</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Peneliti</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Judul Penelitian</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {protocols.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-light/30 transition-colors group">
                    <td className="px-5 py-4 text-[10px] font-mono text-text-muted">{p.submittedAt}</td>
                    <td className="px-5 py-4 text-xs font-bold text-unair-blue">{p.registrationNumber}</td>
                    <td className="px-5 py-4 text-xs font-semibold">{p.generalInfo.mainResearcher}</td>
                    <td className="px-5 py-4 text-xs text-text-main max-w-xs truncate">{p.title}</td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => setSelectedProtocol(p)}
                        className="px-3 py-1.5 bg-unair-blue text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-unair-blue/90 transition-all shadow-sm"
                      >
                        Telaah
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedProtocol && (
        <div className="fixed inset-0 bg-unair-blue/20 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-border-color">
            <div className="flex justify-between items-start mb-6 border-b border-border-color pb-4">
              <div>
                <h3 className="text-xl font-bold text-unair-blue">Form Telaah Etik</h3>
                <p className="text-xs text-text-muted font-bold mt-1">{selectedProtocol.registrationNumber} • {selectedProtocol.title}</p>
              </div>
              <button onClick={() => setSelectedProtocol(null)} className="p-2 hover:bg-bg-light rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-text-muted" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-bold mb-3 text-text-muted">Dokumen Lampiran Peneliti</label>
                <div className="space-y-2 border border-border-color rounded-2xl p-2 bg-bg-light/30">
                  {[
                    { key: 'proposal', label: 'Pengesahan Proposal' },
                    { key: 'psp', label: 'Penjelasan Sebelum Persetujuan (PSP)' },
                    { key: 'ic', label: 'Informed Consent (IC)' },
                    { key: 'instruments', label: 'Instrumen Penelitian' },
                    { key: 'paymentProof', label: 'Bukti Pembayaran' },
                  ].map(doc => {
                    const fileUrl = selectedProtocol.attachments?.[doc.key as keyof typeof selectedProtocol.attachments] as string | undefined;
                    return (
                      <div key={doc.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-border-color/50">
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${fileUrl ? 'text-unair-blue' : 'text-border-color'}`} />
                          <div>
                            <p className={`text-xs font-bold ${fileUrl ? 'text-text-main' : 'text-text-muted'}`}>{doc.label}</p>
                            <p className="text-[9px] uppercase tracking-widest text-text-muted mt-0.5">
                              {fileUrl ? 'Dokumen Tersedia' : 'Tidak Dilampirkan'}
                            </p>
                          </div>
                        </div>
                        {fileUrl ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-blue-50 text-unair-blue hover:bg-unair-blue hover:text-white rounded-lg transition-colors border border-blue-100"
                              title="Lihat Dokumen"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button 
                              onClick={() => setConfirmDownload({ protocol: selectedProtocol, fileUrl: fileUrl, title: doc.label })}
                              className="p-2 bg-white text-text-muted hover:bg-bg-light border border-border-color rounded-lg transition-colors"
                              title="Unduh Dokumen"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Enggah Hasil Review (Form Review)</label>
                <div className="border-2 border-dashed border-border-color rounded-2xl p-8 text-center hover:border-unair-blue/30 transition-all cursor-pointer bg-bg-light/50">
                  <Upload className="w-8 h-8 text-unair-blue/30 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Klik atau seret file ke sini</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Kesimpulan Telaah</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'APPROVED', label: 'Disetujui', color: 'text-accent-green', icon: CheckCircle2 },
                    { id: 'CONDITIONAL', label: 'Disetujui Kondisional', color: 'text-accent-orange', icon: Clock },
                    { id: 'ADDITIONAL_INFO', label: 'Butuh Info Tambahan', color: 'text-unair-blue', icon: AlertCircle },
                    { id: 'REJECTED', label: 'Ditolak', color: 'text-red-500', icon: XCircle },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setConclusion(c.id as any)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        conclusion === c.id 
                          ? 'border-unair-blue bg-unair-blue/5 shadow-inner' 
                          : 'border-border-color hover:border-unair-blue/30 bg-white'
                      }`}
                    >
                      <c.icon className={`w-5 h-5 ${c.color}`} />
                      <span className="text-xs font-bold text-text-main">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Catatan Reviewer</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 min-h-[100px] text-sm"
                  placeholder="Masukkan catatan atau alasan kesimpulan..."
                />
              </div>

              <button 
                onClick={handleReviewSubmit}
                className="w-full bg-unair-blue text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-unair-blue/90 transition-all shadow-lg"
              >
                Kirim Hasil Telaah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Confirmation Modal */}
      <AnimatePresence>
        {confirmDownload && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center border-t-8 border-unair-blue"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-10 h-10 text-unair-blue" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">Unduh Dokumen?</h3>
              <p className="text-sm text-text-muted mb-8 leading-relaxed font-medium">
                Peringatan Kerahasiaan. Apakah Anda akan mengunduh dokumen <strong>{confirmDownload.title}</strong> dari protokol penelitian atas nama <strong>{confirmDownload.protocol.generalInfo.mainResearcher}</strong>?
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setConfirmDownload(null)}
                  className="w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-text-muted border border-border-color hover:bg-bg-light transition-all active:scale-95"
                >
                  Batal
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest bg-unair-blue text-white hover:bg-unair-blue/90 transition-all shadow-md active:scale-95"
                >
                  Ya, Unduh
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
