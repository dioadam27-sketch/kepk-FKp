/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { dbService } from '../dbService';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import LoadingOverlay from './LoadingOverlay';
import { AnimatePresence } from 'motion/react';

interface RegisterProps {
  onBack: () => void;
  onRegister: (user: any) => void;
}

export default function Register({ onBack, onRegister }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    placeOfBirth: '',
    dateOfBirth: '',
    gender: 'Laki-laki',
    lastEducation: '',
    status: 'Dosen/Umum',
    institution: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok.');
      return;
    }
    setIsLoading(true);
    const user = await dbService.register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: 'RESEARCHER',
      profile: {
        placeOfBirth: formData.placeOfBirth,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        lastEducation: formData.lastEducation,
        status: formData.status,
        institution: formData.institution,
        phone: formData.phone,
      }
    });
    setIsLoading(false);
    
    if (user) {
      onRegister(user);
    } else {
      setError('Registrasi gagal. Silakan coba lagi.');
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setError('');
    try {
      const googleUser = await signInWithGoogle();
      if (googleUser && googleUser.email) {
        const user = await dbService.loginWithGoogle(
          googleUser.email, 
          googleUser.displayName || 'Google User', 
          'RESEARCHER'
        );
        
        if (user) {
          onRegister(user);
        } else {
          setError('Gagal pendaftaran via Google.');
        }
      }
    } catch (err: any) {
      if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
        setError('Gagal pendaftaran Google. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <AnimatePresence>
        {isLoading && <LoadingOverlay message="Memproses Database..." />}
      </AnimatePresence>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-unair-blue mb-6 transition-all font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Login
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-border-color">
        <div className="mb-8 flex items-center gap-4">
          <img 
            src="https://i.imgur.com/sbVYY1A.png" 
            alt="Logo UNAIR" 
            className="h-12 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-unair-blue">Registrasi Peneliti</h2>
            <p className="text-sm text-text-muted">Lengkapi data diri untuk membuat akun pengusul</p>
          </div>
        </div>

        <div className="mb-8">
          <button 
            type="button"
            onClick={handleGoogleRegister}
            className="w-full bg-white text-text-main py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 border border-border-color shadow-sm hover:bg-bg-light"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Daftar Cepat dengan Google
          </button>

          <div className="relative flex items-center justify-center py-6">
            <div className="border-t border-border-color w-full"></div>
            <span className="bg-white px-4 text-[10px] uppercase tracking-widest font-bold text-text-muted absolute">Atau isi Manual</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Nama Lengkap & Gelar</label>
              <input 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5"
                placeholder="Contoh: Dr. Nama Lengkap, S.Kep., Ns., M.Kep."
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Email</label>
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">No. Kontak (WhatsApp)</label>
              <input 
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5"
                placeholder="08123456789"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Tempat Lahir</label>
              <input 
                required
                value={formData.placeOfBirth}
                onChange={(e) => setFormData({...formData, placeOfBirth: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Tanggal Lahir</label>
              <input 
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Jenis Kelamin</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white"
              >
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Pendidikan Terakhir</label>
              <input 
                required
                value={formData.lastEducation}
                onChange={(e) => setFormData({...formData, lastEducation: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white"
              >
                <option>D3</option>
                <option>D4</option>
                <option>S1</option>
                <option>S2</option>
                <option>S3</option>
                <option>Dosen/Umum</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Institusi</label>
              <input 
                required
                value={formData.institution}
                onChange={(e) => setFormData({...formData, institution: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Password</label>
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Konfirmasi Password</label>
              <input 
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-unair-blue text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-unair-blue/90 transition-all flex items-center justify-center gap-2 mt-4 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Daftar Sekarang
          </button>
        </form>
      </div>
    </div>
  );
}
