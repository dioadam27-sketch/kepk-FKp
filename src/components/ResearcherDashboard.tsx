/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../dbService';
import { Protocol, User } from '../types';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Download,
  Edit3,
  ExternalLink,
  User as UserIcon,
  Activity,
  Zap,
  Loader2
} from 'lucide-react';

interface ResearcherDashboardProps {
  user: User;
  onUpdateUser?: (user: User) => void;
}

export default function ResearcherDashboard({ user, onUpdateUser }: ResearcherDashboardProps) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleEditProfileClick = React.useCallback(() => {
    if (!user) return;
    setEditFormData({
      id: user.id,
      name: user.name,
      profile: {
        placeOfBirth: user.profile?.placeOfBirth || '',
        dateOfBirth: user.profile?.dateOfBirth || '',
        gender: user.profile?.gender || '',
        lastEducation: user.profile?.lastEducation || '',
        status: user.profile?.status || '',
        institution: user.profile?.institution || '',
        phone: user.profile?.phone || ''
      }
    });
    setIsEditProfileOpen(true);
  }, [user.id, user.name, user.profile?.placeOfBirth, user.profile?.dateOfBirth, user.profile?.gender, user.profile?.lastEducation, user.profile?.status, user.profile?.institution, user.profile?.phone]);

  useEffect(() => {
    let active = true;
    const fetchProtocols = async () => {
      if (!user.id) return;
      setIsLoading(true);
      try {
        const allProtocols = await dbService.getProtocols(user.id);
        if (active) {
          setProtocols(allProtocols);
        }
      } catch (err) {
        console.error("Failed to fetch protocols:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchProtocols();
    return () => { active = false; };
  }, [user.id]);

  const isProfileComplete = !!user.profile?.isProfileComplete;
  const userRole = user.role;

  useEffect(() => {
    // Auto-open edit profile if incomplete - only trigger once when conditions meet
    if (userRole === 'RESEARCHER' && !isProfileComplete && !isEditProfileOpen) {
      handleEditProfileClick();
    }
  }, [userRole, isProfileComplete, isEditProfileOpen, handleEditProfileClick]);

  const handleEditProtocol = (id: string) => {
    navigate(`/protocol/edit/${id}`);
  };

  const handleNewProtocol = () => {
    navigate('/protocol/new');
  };

  const getStatusColor = (status: Protocol['status']) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      case 'REVISION_REQUIRED': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = (status: Protocol['status']) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="w-3 h-3" />;
      case 'REJECTED': return <AlertCircle className="w-3 h-3" />;
      case 'REVISION_REQUIRED': return <Clock className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const placeholder_handleEditProfileClick_moved = () => {
    // This function was moved above useEffect
  };

  const handleSaveProfileClick = () => {
    // Basic validation
    if (!editFormData.name || !editFormData.profile?.phone || !editFormData.profile?.institution) {
      alert('Mohon isi Nama, Nomor Kontak, dan Institusi.');
      return;
    }
    setIsConfirmSaveOpen(true);
  };

  const handleConfirmSaveProfile = async () => {
    if (editFormData && editFormData.id) {
      setIsSavingProfile(true);
      
      // Ensure profile is marked as complete
      const dataToSave = {
        ...editFormData,
        profile: {
          ...editFormData.profile,
          isProfileComplete: true
        }
      };

      const updatedUser = await dbService.updateProfile(dataToSave as User);
      setIsSavingProfile(false);
      if (updatedUser && onUpdateUser) {
        onUpdateUser(updatedUser);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    }
    setIsConfirmSaveOpen(false);
    setIsEditProfileOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-auto lg:grid-rows-[auto_auto]">
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-accent-green text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="text-xs font-bold uppercase tracking-widest">Data diri berhasil diperbarui</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card 1: Informasi Pengusul */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-border-color p-5 shadow-sm flex flex-col">
        <h2 className="text-unair-blue font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border-color pb-2">
          <UserIcon className="w-4 h-4" />
          Informasi Pengusul
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-[#F8FAFC] p-3 rounded-xl">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">Institusi</p>
            <p className="font-semibold text-xs">{user.profile?.institution || 'Universitas Airlangga'}</p>
          </div>
          <div className="bg-[#F8FAFC] p-3 rounded-xl">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">Pendidikan / Status</p>
            <p className="font-semibold text-xs">{user.profile?.lastEducation} - {user.profile?.status}</p>
          </div>
          <div className="bg-[#F8FAFC] p-3 rounded-xl">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">Nomor Kontak</p>
            <p className="font-semibold text-xs">{user.profile?.phone}</p>
          </div>
          <div className="bg-[#F8FAFC] p-3 rounded-xl">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">Email</p>
            <p className="font-semibold text-xs truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Card 2: Status Ethical Clearance */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-border-color p-5 shadow-sm flex flex-col">
        <h2 className="text-unair-blue font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border-color pb-2">
          <Clock className="w-4 h-4" />
          Status Ethical Clearance
        </h2>
        <div className="flex justify-between mt-2 relative">
          <div className="absolute top-[14px] left-0 w-full h-[2px] bg-border-color -z-0"></div>
          {[
            { label: 'Registrasi', status: 'complete' },
            { label: 'Protokol', status: 'active' },
            { label: 'Bayar', status: 'pending' },
            { label: 'Review', status: 'pending' },
            { label: 'Sertifikat', status: 'pending' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative z-10 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                s.status === 'complete' ? 'bg-accent-green text-white' : 
                s.status === 'active' ? 'bg-unair-blue text-white' : 
                'bg-border-color text-text-muted'
              }`}>
                {s.status === 'complete' ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-[9px] uppercase tracking-tighter font-bold text-text-muted text-center leading-tight">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Daftar Protokol (Main Area) */}
      <div className="lg:col-span-3 lg:row-span-2 bg-white rounded-2xl border border-border-color shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-border-color flex justify-between items-center">
          <h2 className="text-unair-blue font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-none pb-0 mb-0">
            <FileText className="w-4 h-4" />
            Daftar Protokol Penelitian
          </h2>
        </div>

        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="p-20 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-unair-blue/40" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-text-muted animate-pulse">Memuat Protokol...</p>
            </div>
          ) : protocols.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-bg-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm opacity-50">Belum ada protokol yang diajukan.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-light/50">
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">No. Reg</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Judul Penelitian</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Status</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {protocols.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-light/30 transition-colors group">
                    <td className="px-5 py-4 text-xs font-bold text-unair-blue">{p.registrationNumber || 'DRAFT'}</td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold line-clamp-1 text-text-main">{p.title}</p>
                      <p className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">{p.submittedAt || 'Belum Submit'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(p.status)}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleEditProtocol(p.id)}
                          className="p-1.5 hover:bg-unair-blue hover:text-white rounded-lg transition-all text-unair-blue border border-unair-blue/20 hover:border-unair-blue"
                          title={p.status === 'DRAFT' || p.status === 'REVISION_REQUIRED' ? 'Edit / Revisi' : 'Lihat Detail'}
                        >
                          {p.status === 'DRAFT' || p.status === 'REVISION_REQUIRED' ? (
                            <Edit3 className="w-4 h-4" />
                          ) : (
                            <ExternalLink className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Card 4: Sidebar Actions */}
      <div className="lg:col-span-1 lg:row-span-2 bg-white rounded-2xl border border-border-color p-5 shadow-sm flex flex-col">
        <h2 className="text-unair-blue font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border-color pb-2">
          <Plus className="w-4 h-4" />
          Aksi Cepat
        </h2>
        
        <div className="bg-[#FFF5F5] border border-[#FEB2B2] text-[#C53030] p-3 rounded-xl text-[11px] mb-6 leading-relaxed">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p><strong>Perhatian:</strong> Pastikan seluruh dokumen instrumen penelitian telah terunggah sebelum melakukan submit protokol.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          <button 
            onClick={handleNewProtocol}
            className="w-full bg-unair-blue text-white py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-unair-blue/90 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajukan Protokol
          </button>
          <button 
            onClick={handleEditProfileClick}
            className="w-full bg-white border border-unair-blue text-unair-blue py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-bg-light transition-all flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit Data Diri
          </button>
          <div className="mt-4 text-[10px] text-text-muted text-center uppercase tracking-widest leading-tight">
            Terakhir diperbarui:<br />
            <span className="font-bold">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
          </div>
        </div>
      </div>
      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border-color flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-unair-blue flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Edit Data Diri
                </h3>
                {!user.profile?.isProfileComplete && (
                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-1">Silakan lengkapi profil Anda untuk melanjutkan</p>
                )}
              </div>
              {user.profile?.isProfileComplete && (
                <button onClick={() => setIsEditProfileOpen(false)} className="text-text-muted hover:text-red-500 font-bold">✕</button>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={editFormData.name || ''} 
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-border-color focus:outline-none focus:border-unair-blue text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Nomor Kontak (WA)</label>
                  <input 
                    type="text" 
                    value={editFormData.profile?.phone || ''} 
                    onChange={(e) => setEditFormData({...editFormData, profile: {...editFormData.profile!, phone: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-border-color focus:outline-none focus:border-unair-blue text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Institusi</label>
                  <input 
                    type="text" 
                    value={editFormData.profile?.institution || ''} 
                    onChange={(e) => setEditFormData({...editFormData, profile: {...editFormData.profile!, institution: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-border-color focus:outline-none focus:border-unair-blue text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Pendidikan Terakhir</label>
                  <select 
                    value={editFormData.profile?.lastEducation || ''} 
                    onChange={(e) => setEditFormData({...editFormData, profile: {...editFormData.profile!, lastEducation: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-border-color focus:outline-none focus:border-unair-blue text-sm"
                  >
                    <option value="">Pilih Pendidikan</option>
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Status</label>
                  <select 
                    value={editFormData.profile?.status || ''} 
                    onChange={(e) => setEditFormData({...editFormData, profile: {...editFormData.profile!, status: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-border-color focus:outline-none focus:border-unair-blue text-sm"
                  >
                    <option value="">Pilih Status</option>
                    <option value="Dosen">Dosen</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Jenis Kelamin</label>
                  <select 
                    value={editFormData.profile?.gender || ''} 
                    onChange={(e) => setEditFormData({...editFormData, profile: {...editFormData.profile!, gender: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-border-color focus:outline-none focus:border-unair-blue text-sm"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Tempat Lahir</label>
                  <input 
                    type="text" 
                    value={editFormData.profile?.placeOfBirth || ''} 
                    onChange={(e) => setEditFormData({...editFormData, profile: {...editFormData.profile!, placeOfBirth: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-border-color focus:outline-none focus:border-unair-blue text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    value={editFormData.profile?.dateOfBirth || ''} 
                    onChange={(e) => setEditFormData({...editFormData, profile: {...editFormData.profile!, dateOfBirth: e.target.value}})}
                    className="w-full px-3 py-2 rounded-lg border border-border-color focus:outline-none focus:border-unair-blue text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border-color flex justify-end gap-3 sticky bottom-0 bg-white">
              {user.profile?.isProfileComplete && (
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-text-muted hover:bg-bg-light transition-all"
                >
                  Batal
                </button>
              )}
              <button 
                onClick={handleSaveProfileClick}
                className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-unair-blue text-white hover:bg-unair-blue/90 transition-all shadow-md"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmSaveOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-unair-blue" />
            </div>
            <h3 className="text-lg font-bold text-unair-blue mb-2">Konfirmasi Simpan</h3>
            <p className="text-sm text-text-muted mb-6">Apakah Anda yakin ingin menyimpan perubahan data diri ini?</p>
            <div className="flex gap-3">
              <button 
                disabled={isSavingProfile}
                onClick={() => setIsConfirmSaveOpen(false)}
                className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-text-muted border border-border-color hover:bg-bg-light transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                disabled={isSavingProfile}
                onClick={handleConfirmSaveProfile}
                className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-unair-blue text-white hover:bg-unair-blue/90 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Menyimpan...
                  </>
                ) : 'Ya, Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
