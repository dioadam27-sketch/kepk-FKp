/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  User as UserIcon
} from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { dbService } from './dbService';
import { User } from './types';

// Components
import Login from './components/Login';
import Register from './components/Register';
import ResearcherDashboard from './components/ResearcherDashboard';
import ReviewerDashboard from './components/ReviewerDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtocolForm from './components/ProtocolForm';
import LoadingOverlay from './components/LoadingOverlay';

// Seeding function
const seedDummyAccounts = async () => {
  const seededFlag = localStorage.getItem('sim_kepk_seeded_v1');
  if (seededFlag) return;

  const dummyUsers = [
    { id: 'adm_unair_01', email: 'admin@kepk.unair.ac.id', password: 'Admin123!', role: 'ADMIN', name: 'Administrator KEPK' },
    { id: 'res_unair_01', email: 'peneliti@kepk.unair.ac.id', password: 'Peneliti123!', role: 'RESEARCHER', name: 'Dr. Peneliti Utama, M.Kep' },
    { id: 'rev_unair_01', email: 'reviewer@kepk.unair.ac.id', password: 'Reviewer123!', role: 'REVIEWER', name: 'Prof. Dr. Reviewer Etik' }
  ];

  for (const u of dummyUsers) {
    try {
      await dbService.register(u as any, true);
    } catch (e) {
      console.warn('Seeding user already exists or failed:', u.email);
    }
  }
  localStorage.setItem('sim_kepk_seeded_v1', 'true');
};

// Protected Route Component
function ProtectedRoute({ user, children, allowedRoles }: { user: User | null, children: ReactNode, allowedRoles?: string[] }) {
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ProtocolFormWrapper({ user }: { user: User }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <ProtocolForm user={user} protocolId={id || null} onBack={() => navigate('/')} onSave={() => navigate('/')} />;
}

function NavigationWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Auto-seed dummy accounts on first run (run in background to speed up initial load)
        seedDummyAccounts();
        
        const currentUser = await dbService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogin = useCallback((u: User) => {
    setUser(u);
    const origin = (location.state as any)?.from?.pathname || "/";
    navigate(origin, { replace: true });
  }, [navigate, location.state]);

  const handleLogout = useCallback(() => {
    dbService.logout();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const goToRegister = useCallback(() => navigate('/register'), [navigate]);
  const goToLogin = useCallback(() => navigate('/login'), [navigate]);
  const goHome = useCallback(() => navigate('/'), [navigate]);

  if (isInitialLoading) {
    return <LoadingOverlay message="Menyinkronkan Sesi..." />;
  }

  return (
    <div className="min-h-screen bg-bg-light text-text-main font-sans relative overflow-x-hidden">
      {/* Background Accent Logo for Login/Register */}
      {!user && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.04]">
          <img 
            src="https://i.imgur.com/sbVYY1A.png" 
            alt="" 
            className="w-[600px] h-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Header */}
      <header className="bg-unair-blue border-b-4 border-unair-gold px-6 py-4 flex items-center justify-between sticky top-0 z-50 text-white shadow-md">
        <div className="flex items-center gap-3">
          <img 
            src="https://i.imgur.com/sbVYY1A.png" 
            alt="Logo UNAIR" 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">SIM-KEPK <span className="font-light">FKp UNAIR</span></h1>
            <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium text-white">Ethical Clearance Management</p>
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

      <main className="max-w-7xl mx-auto p-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} onRegister={goToRegister} />} />
              <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register onBack={goToLogin} onRegister={handleLogin} />} />
              
              <Route path="/" element={
                <ProtectedRoute user={user}>
                  {user?.role === 'RESEARCHER' ? <ResearcherDashboard user={user} onUpdateUser={setUser} /> :
                   user?.role === 'REVIEWER' ? <ReviewerDashboard user={user} /> :
                   <AdminDashboard user={user!} />}
                </ProtectedRoute>
              } />

              <Route path="/protocol/new" element={
                <ProtectedRoute user={user} allowedRoles={['RESEARCHER']}>
                  <ProtocolForm user={user!} protocolId={null} onBack={goHome} onSave={goHome} />
                </ProtectedRoute>
              } />

              <Route path="/protocol/edit/:id" element={
                <ProtectedRoute user={user} allowedRoles={['RESEARCHER']}>
                  <ProtocolFormWrapper user={user!} />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
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

export default function App() {
  return (
    <Router>
      <NavigationWrapper />
    </Router>
  );
}
