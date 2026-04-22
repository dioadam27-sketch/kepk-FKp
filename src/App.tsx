/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, 
  FileText, 
  Users, 
  LogOut, 
  Bell, 
  User as UserIcon,
  LayoutDashboard,
  FilePlus,
  History,
  Award,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { dbService } from './dbService';
import { User, UserRole, Protocol } from './types';

// Components
import Login from './components/Login';
import Register from './components/Register';
import ResearcherDashboard from './components/ResearcherDashboard';
import ReviewerDashboard from './components/ReviewerDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtocolForm from './components/ProtocolForm';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'PROTOCOL_FORM'>('LOGIN');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await dbService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setView('DASHBOARD');
      }
    };
    checkUser();
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    dbService.logout();
    setUser(null);
    setView('LOGIN');
  };

  const renderView = () => {
    if (!user) {
      if (view === 'REGISTER') return <Register onBack={() => setView('LOGIN')} onRegister={handleLogin} />;
      return <Login onLogin={handleLogin} onRegister={() => setView('REGISTER')} />;
    }

    if (view === 'PROTOCOL_FORM') {
      return (
        <ProtocolForm 
          user={user}
          protocolId={selectedProtocolId} 
          onBack={() => setView('DASHBOARD')} 
          onSave={() => setView('DASHBOARD')}
        />
      );
    }

    switch (user.role) {
      case 'RESEARCHER':
        return (
          <ResearcherDashboard 
            user={user} 
            onNewProtocol={() => {
              setSelectedProtocolId(null);
              setView('PROTOCOL_FORM');
            }}
            onEditProtocol={(id) => {
              setSelectedProtocolId(id);
              setView('PROTOCOL_FORM');
            }}
            onUpdateUser={setUser}
          />
        );
      case 'REVIEWER':
        return <ReviewerDashboard user={user} />;
      case 'ADMIN':
        return <AdminDashboard user={user} />;
      default:
        return <div>Invalid Role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-bg-light text-text-main font-sans">
      {/* Header */}
      <header className="bg-unair-blue border-b-4 border-unair-gold px-6 py-4 flex items-center justify-between sticky top-0 z-50 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">SIM-KEPK <span className="font-light">FKp UNAIR</span></h1>
            <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium">Ethical Clearance Management</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user.name}</p>
                <div className="flex justify-end">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">
                    {user.role === 'RESEARCHER' ? 'Peneliti Pengusul' : user.role}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <UserIcon className="w-5 h-5 opacity-80" />
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + (user?.role || '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-[#EEF2F7] p-6 mt-12 border-t border-border-color flex flex-col sm:flex-row justify-between items-center gap-4 text-text-muted text-[11px] font-medium">
        <p>Komisi Etik Penelitian Kesehatan (KEPK) Fakultas Keperawatan Universitas Airlangga</p>
        <div className="flex gap-6 uppercase tracking-widest">
          <span>v2.1.0-Stable</span>
          <span>© 2026 All Rights Reserved</span>
        </div>
      </footer>
    </div>
  );
}
