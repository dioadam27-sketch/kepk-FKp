/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../types';
import { dbService } from '../dbService';
import { LogIn, UserPlus, Shield, User as UserIcon, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-border-color">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-unair-blue">Selamat Datang</h2>
          <p className="text-sm text-text-muted">Masuk ke Sistem Informasi Manajemen KEPK</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Email / Username</label>
            <input 
              type="text" 
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 transition-all disabled:bg-bg-light disabled:opacity-50"
              placeholder="nama@email.com atau admin"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest font-bold mb-2 text-text-muted">Password</label>
            <input 
              type="password" 
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 transition-all disabled:bg-bg-light disabled:opacity-50"
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
                <button
                  key={r.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setRole(r.id as UserRole)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    role === r.id 
                      ? 'border-unair-blue bg-unair-blue text-white' 
                      : 'border-border-color hover:border-unair-blue/30'
                  }`}
                >
                  <r.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-blue-50 border border-blue-100 text-unair-blue p-3 rounded-xl flex items-center justify-center gap-3"
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-unair-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-unair-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-unair-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Mencocokkan Kredensial...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full bg-unair-blue text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-unair-blue/90'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Masuk...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Masuk
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-color text-center space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-4">Belum memiliki akun?</p>
            <button 
              onClick={onRegister}
              className="text-sm font-bold uppercase tracking-widest text-unair-blue hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <UserPlus className="w-4 h-4" />
              Registrasi Pendaftar Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
