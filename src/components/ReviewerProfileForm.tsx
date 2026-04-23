/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { dbService } from '../dbService';
import { 
  User as UserIcon, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  FileText, 
  Save, 
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewerProfileFormProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

export default function ReviewerProfileForm({ user, onComplete }: ReviewerProfileFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    placeOfBirth: user.profile?.placeOfBirth || '',
    dateOfBirth: user.profile?.dateOfBirth || '',
    gender: user.profile?.gender || 'Laki-laki',
    lastEducation: user.profile?.lastEducation || '',
    institution: user.profile?.institution || '',
    email: user.email,
    phone: user.profile?.phone || '',
    ethicsTraining: user.profile?.ethicsTraining || '',
    ethicsTrainingFile: user.profile?.ethicsTrainingFile || '',
    confidentialityAgreementFile: user.profile?.confidentialityAgreementFile || '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
    showPassword: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'ethicsTrainingFile' | 'confidentialityAgreementFile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert("Format file tidak didukung. Harap unggah file PDF atau Gambar (.jpg, .jpeg, .png).");
      return;
    }

    setIsUploading(field);
    try {
      const result = await dbService.uploadFile(file);
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, [field]: result.url }));
      } else {
        alert('Gagal mengunggah file: ' + result.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengunggah');
    } finally {
      setIsUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate password if provided
    if (passwordData.newPassword) {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Konfirmasi password tidak cocok');
        setIsSubmitting(false);
        return;
      }
      if (passwordData.newPassword.length < 6) {
        setError('Password minimal 6 karakter');
        setIsSubmitting(false);
        return;
      }
    }

    // Required fields check (Agreement is mandatory)
    if (!formData.confidentialityAgreementFile) {
      setError('Confidentiality Agreement wajib diunggah');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Update Password if requested
      if (passwordData.newPassword) {
        const passwordSuccess = await dbService.changePassword(user.id, passwordData.newPassword);
        if (!passwordSuccess) {
          throw new Error('Gagal merubah password');
        }
      }

      // 2. Update Profile
      const updatedUser: User = {
        ...user,
        name: formData.name,
        profile: {
          ...user.profile,
          placeOfBirth: formData.placeOfBirth,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          lastEducation: formData.lastEducation,
          status: user.profile?.status || 'Reviewer',
          institution: formData.institution,
          phone: formData.phone,
          ethicsTraining: formData.ethicsTraining,
          ethicsTrainingFile: formData.ethicsTrainingFile,
          confidentialityAgreementFile: formData.confidentialityAgreementFile,
          isProfileComplete: true
        }
      };

      const success = await dbService.updateProfile(updatedUser);
      if (success) {
        onComplete(updatedUser);
      } else {
        setError('Gagal menyimpan profil');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-border-color"
      >
        {/* Header */}
        <div className="bg-unair-blue px-8 py-10 text-white relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Profil Reviewer</h2>
              <p className="text-unair-blue-light font-medium tracking-wide flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-unair-gold rounded-full animate-pulse" />
                Lengkapi data Anda untuk mulai menelaah protokol
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          {/* Section 1: Data Pribadi */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-border-color pb-2">
              <UserIcon className="w-5 h-5 text-unair-blue" />
              <h3 className="font-bold text-unair-blue uppercase tracking-widest text-xs">Identitas Pribadi</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Nama Lengkap & Gelar</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/5 outline-none transition-all"
                    placeholder="Contoh: Dr. Namalengkap, M.Kes"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Tempat Lahir</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    required
                    value={formData.placeOfBirth}
                    onChange={e => setFormData({...formData, placeOfBirth: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/5 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Tanggal Lahir</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="date" 
                    required
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/5 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Laki-laki', 'Perempuan'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({...formData, gender: g})}
                      className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                        formData.gender === g 
                          ? 'bg-unair-blue text-white border-unair-blue' 
                          : 'border-border-color hover:border-unair-blue/30 text-text-muted'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Pendidikan Terakhir</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <select 
                    value={formData.lastEducation}
                    onChange={e => setFormData({...formData, lastEducation: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/5 outline-none transition-all appearance-none"
                  >
                    <option value="">Pilih Pendidikan</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                    <option value="Sp1">Sp1</option>
                    <option value="Sp2">Sp2</option>
                    <option value="Dosen/Lainnya">Dosen/Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Institusi</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    required
                    value={formData.institution}
                    onChange={e => setFormData({...formData, institution: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/5 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Kontak */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-border-color pb-2">
              <Mail className="w-5 h-5 text-unair-blue" />
              <h3 className="font-bold text-unair-blue uppercase tracking-widest text-xs">Informasi Kontak</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Email Aktif</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="email" 
                    readOnly
                    value={formData.email}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-color bg-bg-light text-text-muted outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">No. Kontak / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/5 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Kompetensi & Legalitas */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-border-color pb-2">
              <FileText className="w-5 h-5 text-unair-blue" />
              <h3 className="font-bold text-unair-blue uppercase tracking-widest text-xs">Kompetensi & Legalitas</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Pelatihan Etik / Sertifikasi (Opsional)</label>
                <textarea 
                  value={formData.ethicsTraining}
                  onChange={e => setFormData({...formData, ethicsTraining: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/5 outline-none transition-all h-24 resize-none"
                  placeholder="Sebutkan pelatihan etik yang pernah diikuti..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Sertifikat Etik */}
                <div className="p-4 rounded-2xl border border-dashed border-border-color hover:border-unair-blue/50 transition-all bg-bg-light/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Sertifikat Pelatihan (Opsional)</p>
                  <label className="flex flex-col items-center justify-center cursor-pointer group">
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={e => handleFileUpload(e, 'ethicsTrainingFile')}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <div className="flex items-center gap-3">
                      {isUploading === 'ethicsTrainingFile' ? (
                        <Loader2 className="w-6 h-6 text-unair-blue animate-spin" />
                      ) : formData.ethicsTrainingFile ? (
                        <CheckCircle className="w-6 h-6 text-accent-green" />
                      ) : (
                        <Upload className="w-6 h-6 text-unair-blue group-hover:scale-110 transition-transform" />
                      )}
                      <span className="text-xs font-bold text-unair-blue uppercase tracking-wider">
                        {formData.ethicsTrainingFile ? 'Ganti File' : 'Unggah PDF/Gambar'}
                      </span>
                    </div>
                  </label>
                  {formData.ethicsTrainingFile && (
                    <p className="text-[9px] text-accent-green mt-2 font-bold uppercase">Berhasil diunggah</p>
                  )}
                </div>

                {/* Upload Confidentiality Agreement */}
                <div className={`p-4 rounded-2xl border border-dashed transition-all ${
                  !formData.confidentialityAgreementFile ? 'border-orange-300 bg-orange-50/30' : 'border-border-color bg-bg-light/30'
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Confidentiality Agreement (Wajib)</p>
                  <label className="flex flex-col items-center justify-center cursor-pointer group">
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={e => handleFileUpload(e, 'confidentialityAgreementFile')}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <div className="flex items-center gap-3">
                      {isUploading === 'confidentialityAgreementFile' ? (
                        <Loader2 className="w-6 h-6 text-unair-blue animate-spin" />
                      ) : formData.confidentialityAgreementFile ? (
                        <CheckCircle className="w-6 h-6 text-accent-green" />
                      ) : (
                        <Upload className="w-6 h-6 text-unair-blue group-hover:scale-110 transition-transform" />
                      )}
                      <span className="text-xs font-bold text-unair-blue uppercase tracking-wider">
                        {formData.confidentialityAgreementFile ? 'Ganti File' : 'Unggah Dokumen'}
                      </span>
                    </div>
                  </label>
                  {formData.confidentialityAgreementFile ? (
                    <p className="text-[9px] text-accent-green mt-2 font-bold uppercase">Berhasil diunggah</p>
                  ) : (
                    <p className="text-[9px] text-orange-600 mt-2 font-bold uppercase">* Dokumen ini wajib diunggah</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Keamanan (Ganti Password) */}
          <section className="bg-bg-light/50 p-6 rounded-3xl border border-border-color">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-unair-blue" />
              <h3 className="font-bold text-unair-blue uppercase tracking-widest text-xs">Ganti Password (Opsional)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type={passwordData.showPassword ? "text" : "password"} 
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/5 outline-none transition-all"
                    placeholder="Min 6 karakter"
                  />
                  <button 
                    type="button"
                    onClick={() => setPasswordData({...passwordData, showPassword: !passwordData.showPassword})}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-unair-blue transition-colors"
                  >
                    {passwordData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type={passwordData.showPassword ? "text" : "password"} 
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/5 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold uppercase tracking-wide">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isSubmitting || !!isUploading}
            className="w-full bg-unair-blue text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm shadow-xl shadow-unair-blue/20 hover:bg-unair-blue/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menyimpan Profil...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan & Lanjutkan ke Dashboard</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
