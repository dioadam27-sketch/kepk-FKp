/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../types';
import { dbService } from '../dbService';
import { LogIn, UserPlus, Shield, User as UserIcon, Settings, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoadingOverlay from './LoadingOverlay';
import { signInWithGoogle } from '../lib/firebase';

interface LoginProps {
  onLogin: (user: any) => void;
  onRegister: () => void;
}

export default function Login({ onLogin, onRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('RESEARCHER');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const user = await dbService.login(email, password, role);
      if (user) {
        onLogin(user);
      } else {
        setError('Email, Password, atau Role tidak sesuai.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const googleUser = await signInWithGoogle();
      if (googleUser && googleUser.email) {
        const user = await dbService.loginWithGoogle(
          googleUser.email, 
          googleUser.displayName || 'Google User', 
          role
        );
        
        if (user) {
          onLogin(user);
        } else {
          setError('Gagal sinkronisasi data Google ke server.');
        }
      }
    } catch (err: any) {
      if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
        setError('Gagal login via Google. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto mt-20 relative"
    >
      <AnimatePresence>
        {isLoading && <LoadingOverlay message="Memvalidasi Kredensial..." />}
      </AnimatePresence>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-border-color overflow-hidden relative">
        {/* Subtle background decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-unair-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-unair-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <motion.img 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            src="https://i.imgur.com/sbVYY1A.png" 
            alt="Logo UNAIR" 
            className="h-16 w-auto mx-auto mb-4 object-contain"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl font-bold tracking-tight text-unair-blue">Selamat Datang</h2>
          <p className="text-sm text-text-muted">Masuk ke Sistem Informasi Manajemen KEPK</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Email / Username</label>
            <motion.input 
              whileFocus={{ scale: 1.01 }}
              type="text" 
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/20 transition-all disabled:bg-bg-light disabled:opacity-50"
              placeholder="nama@email.com atau admin"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Password</label>
            <motion.input 
              whileFocus={{ scale: 1.01 }}
              type="password" 
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/20 transition-all disabled:bg-bg-light disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'RESEARCHER', label: 'Peneliti', icon: UserIcon },
                { id: 'REVIEWER', label: 'Reviewer', icon: Shield },
                { id: 'ADMIN', label: 'Admin', icon: Settings },
              ].map((r) => (
                <motion.button
                  key={r.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                  onClick={() => setRole(r.id as UserRole)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    role === r.id 
                      ? 'border-unair-blue bg-unair-blue text-white shadow-lg' 
                      : 'border-border-color hover:border-unair-blue/30 bg-white'
                  }`}
                >
                  <r.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{r.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-xs text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100 overflow-hidden"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button 
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className={`w-full bg-unair-blue text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-unair-blue/90'
            }`}
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Memproses...' : 'Masuk'}
          </motion.button>

          {role === 'RESEARCHER' && (
            <>
              <div className="relative flex items-center justify-center py-2">
                <div className="border-t border-border-color w-full"></div>
                <span className="bg-white px-4 text-[10px] uppercase tracking-widest font-bold text-text-muted absolute">Atau</span>
              </div>

              <motion.button 
                type="button"
                onClick={handleGoogleLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className={`w-full bg-white text-text-main py-3.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 border border-border-color shadow-sm ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-bg-light hover:shadow-md'
                }`}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Masuk dengan Google (Peneliti)
              </motion.button>
            </>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-border-color text-center space-y-4 relative">
          <AnimatePresence mode="wait">
            {role === 'RESEARCHER' ? (
              <motion.div
                key="register-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-text-muted mb-4">Belum memiliki akun?</p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={onRegister}
                  className="text-sm font-bold uppercase tracking-widest text-unair-blue hover:text-unair-gold flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrasi Pendaftar Baru
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="admin-contact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="py-2"
              >
                <p className="text-xs text-text-muted font-medium italic">
                  Akun {role === 'ADMIN' ? 'Admin' : 'Reviewer'} dikelola oleh sistem.<br/>Silakan hubungi Administrator untuk akses.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
