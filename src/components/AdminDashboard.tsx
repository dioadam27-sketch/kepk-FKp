/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dbService } from '../dbService';
import { Protocol, User, ReviewClassification } from '../types';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Search, 
  Filter, 
  MoreVertical,
  UserCheck,
  Tag,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ChevronRight,
  ShieldCheck,
  XCircle,
  X,
  User as UserIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'REKAP' | 'LAPORAN' | 'PENGGUNA'>('REKAP');
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAddingReviewer, setIsAddingReviewer] = useState(false);
  const [newReviewer, setNewReviewer] = useState({ name: '', email: '', password: '' });

  // Compute Data Laporan (Memoized to prevent infinite re-renders with Recharts)
  const monthlyData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    protocols.forEach(p => {
       if (!p.submittedAt) return;
       // Handle possible invalid dates or different formats
       try {
         const d = new Date(p.submittedAt.split('-').reverse().join('-') || p.submittedAt);
         const month = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
         if (month !== 'Invalid Date') {
           counts[month] = (counts[month] || 0) + 1;
         }
       } catch (e) {
         console.warn("Invalid date format", p.submittedAt);
       }
    });
    return Object.keys(counts).map(k => ({ name: k, total: counts[k] }));
  }, [protocols]);

  const demographicData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allUsers.filter(u => u.role === 'RESEARCHER').forEach(u => {
       const inst = u.profile?.institution || 'FKp UNAIR';
       counts[inst] = (counts[inst] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [allUsers]);
  
  const COLORS = ['#0056A6', '#FFB703', '#A855F7', '#10B981', '#F97316'];

  const reviewerPerformance = React.useMemo(() => {
    return reviewers.map(r => {
       const assigned = protocols.filter(p => p.assignedReviewers?.includes(r.id));
       const finished = assigned.filter(p => p.status === 'APPROVED' || p.status === 'REJECTED' || p.status === 'REVISION_REQUIRED');
       return { name: r.name, institution: r.profile?.institution || '-', total: assigned.length, finished: finished.length };
    }).sort((a,b) => b.total - a.total);
  }, [reviewers, protocols]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr.split('-').reverse().join('-'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const allProtocols = await dbService.getProtocols();
      setProtocols(allProtocols);
      
      const users = await dbService.getUsers();
      setAllUsers(users);
      setReviewers(users.filter(u => u.role === 'REVIEWER'));
    };
    fetchData();
  }, []);

  const handleAssignReviewer = async (protocolId: string, reviewerId: string) => {
    setIsAssigning(true);
    try {
      const success = await dbService.assignReviewer(protocolId, reviewerId);
      if (success) {
        // Optimistic UI Update untuk mengurangi delay visual jika list sangat banyak
        setProtocols(prev => prev.map(p => 
          p.id === protocolId ? { ...p, status: 'ASSIGNED', assignedReviewers: [...(p.assignedReviewers || []), reviewerId] } : p
        ));
        setSelectedProtocol(null);
      } else {
        alert("Gagal menyimpan penugasan ke database Google Sheets (Koneksi Terputus).");
      }
    } catch(err) {
      alert("Error tak terduga saat menyimpan ke server.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveReviewer = async (protocolId: string, reviewerId: string) => {
    if (!confirm('Lepas penugasan reviewer ini?')) return;
    
    const success = await dbService.unassignReviewer(protocolId, reviewerId);
    if (success) {
      setProtocols(prev => prev.map(p => 
        p.id === protocolId 
          ? { ...p, assignedReviewers: (p.assignedReviewers || []).filter(rid => rid !== reviewerId) } 
          : p
      ));
    } else {
      alert("Gagal melepas penugasan dari server.");
    }
  };

  const handleSetClassification = async (protocolId: string, classification: ReviewClassification) => {
    const p = await dbService.getProtocolById(protocolId);
    if (p) {
      const updated: Protocol = { ...p, classification };
      const success = await dbService.saveProtocol(updated);
      if (success) {
        const allProtocols = await dbService.getProtocols();
        setProtocols(allProtocols);
      }
    }
  };

  const handleAddReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigning(true);
    try {
      const userData: Partial<User> = {
        name: newReviewer.name,
        email: newReviewer.email,
        password: newReviewer.password,
        role: 'REVIEWER',
        profile: {
          institution: 'FKp UNAIR',
          isProfileComplete: false,
          placeOfBirth: '',
          dateOfBirth: '',
          gender: 'Laki-laki',
          lastEducation: '',
          status: 'Reviewer',
          phone: ''
        }
      };
      
      const success = await dbService.register(userData);
      if (success) {
        alert("Reviewer berhasil didaftarkan!");
        const users = await dbService.getUsers();
        setAllUsers(users);
        setReviewers(users.filter(u => u.role === 'REVIEWER'));
        setIsAddingReviewer(false);
        setNewReviewer({ name: '', email: '', password: '' });
      } else {
        alert("Gagal mendaftarkan reviewer.");
      }
    } catch (err) {
      alert("Terjadi kesalahan.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-auto">
      {/* Card 1: Admin Summary */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-border-color p-5 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-unair-blue font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-none pb-0 mb-0">
              <ShieldCheck className="w-4 h-4" />
              Admin SIM-KEPK
            </h2>
            <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-bold">Fakultas Keperawatan UNAIR</p>
          </div>
          <div className="flex bg-bg-light p-1 rounded-xl border border-border-color">
            <button 
              onClick={() => setActiveTab('REKAP')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'REKAP' ? 'bg-unair-blue text-white shadow-sm' : 'text-text-muted hover:bg-white'}`}
            >
              Rekap
            </button>
            <button 
              onClick={() => {
                setActiveTab('LAPORAN');
                setActiveReport(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'LAPORAN' ? 'bg-unair-blue text-white shadow-sm' : 'text-text-muted hover:bg-white'}`}
            >
              Laporan
            </button>
            <button 
              onClick={() => setActiveTab('PENGGUNA')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'PENGGUNA' ? 'bg-unair-blue text-white shadow-sm' : 'text-text-muted hover:bg-white'}`}
            >
              Pengguna
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-auto">
          <div className="bg-bg-light p-3 rounded-xl text-center">
            <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Total</p>
            <p className="text-xl font-bold text-unair-blue">{protocols.length}</p>
          </div>
          <div className="bg-bg-light p-3 rounded-xl text-center">
            <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Pending</p>
            <p className="text-xl font-bold text-accent-orange">{protocols.filter(p => p.status === 'SUBMITTED').length}</p>
          </div>
          <div className="bg-bg-light p-3 rounded-xl text-center">
            <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Selesai</p>
            <p className="text-xl font-bold text-accent-green">{protocols.filter(p => p.status === 'APPROVED').length}</p>
          </div>
        </div>
      </div>

      {/* Card 2: Search & Filter */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-border-color p-5 shadow-sm flex flex-col justify-between">
        <h2 className="text-unair-blue font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-border-color pb-2">
          <Search className="w-4 h-4" />
          Pencarian Cepat
        </h2>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input 
              placeholder="Cari No. Reg atau Judul..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-bg-light/50 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-border-color rounded-xl text-[10px] font-bold uppercase tracking-widest text-text-muted hover:bg-bg-light transition-all">
              <Filter className="w-3.5 h-3.5" />
              Filter Lanjutan
            </button>
            <button className="flex items-center justify-center px-4 py-2.5 bg-unair-blue text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-unair-blue/90 transition-all shadow-sm">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Card 3: Main Content Area */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-border-color shadow-sm overflow-hidden flex flex-col">
        {activeTab === 'REKAP' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-light/50">
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">No. Reg / Tgl</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Peneliti</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Klasifikasi</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Reviewer</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {protocols.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-light/30 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-unair-blue">{p.registrationNumber}</p>
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">{formatDate(p.submittedAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <button 
                        onClick={() => {
                          const protocolResearcher = allUsers.find(u => u.name === p.generalInfo.mainResearcher || u.id === p.researcherId);
                          if (protocolResearcher) setSelectedUser(protocolResearcher);
                        }}
                        className="text-xs font-bold text-unair-blue hover:underline text-left block leading-tight"
                      >
                        {p.generalInfo.mainResearcher}
                      </button>
                      <p className="text-[9px] text-text-muted font-medium truncate max-w-[180px] mt-0.5">{p.title}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select 
                        value={p.classification || ''}
                        onChange={(e) => handleSetClassification(p.id, e.target.value as ReviewClassification)}
                        className="text-[9px] font-bold uppercase tracking-wider bg-white border border-border-color rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-unair-blue/30"
                      >
                        <option value="">Pilih</option>
                        <option value="CONTINUING">Continuing</option>
                        <option value="EXEMPT">Exempt</option>
                        <option value="EXPEDITED">Expedited</option>
                        <option value="FULLBOARD">Fullboard</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap gap-1">
                           {(p.assignedReviewers || []).length > 0 ? (
                            (p.assignedReviewers || []).map((rid) => {
                              const rev = reviewers.find(r => r.id === rid);
                              return (
                                <span key={rid} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-unair-blue/5 text-unair-blue rounded text-[9px] font-bold border border-unair-blue/10">
                                  {rev ? rev.name : 'Unknown'}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveReviewer(p.id, rid);
                                    }}
                                    className="hover:text-red-500 transition-colors ml-0.5"
                                    title="Lepas Reviewer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[9px] text-text-muted italic font-medium">Belum Ditugaskan</span>
                          )}
                        </div>
                        <button 
                          onClick={() => setSelectedProtocol(p)}
                          className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-unair-blue hover:text-unair-gold transition-all w-fit group"
                        >
                          <Plus className="w-2.5 h-2.5 group-hover:scale-125 transition-transform" />
                          <span>{(p.assignedReviewers || []).length > 0 ? 'Tambah' : 'Tugaskan'}</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="p-1.5 hover:bg-unair-blue hover:text-white rounded-lg transition-all text-text-muted">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'LAPORAN' ? (
          activeReport === null ? (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Protokol per Bulan', icon: BarChart3, color: 'text-blue-500' },
                { label: 'Demografi Peneliti', icon: Users, color: 'text-purple-500' },
                { label: 'Jenis Penelitian', icon: Tag, color: 'text-orange-500' },
                { label: 'Dana Pendaftaran', icon: FileText, color: 'text-green-500' },
                { label: 'Kinerja Reviewer', icon: UserCheck, color: 'text-red-500' },
                { label: 'Evaluasi Kepuasan', icon: CheckCircle2, color: 'text-teal-500' },
              ].map((item, i) => (
                <div key={i} onClick={() => setActiveReport(item.label)} className="bg-bg-light/50 p-5 rounded-2xl border border-border-color hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center">
                  <div className={`bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-unair-blue group-hover:text-white transition-all ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-xs text-text-main mb-1 uppercase tracking-tight">{item.label}</h4>
                  <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Lihat Detail</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setActiveReport(null)} className="p-2 bg-bg-light hover:bg-unair-blue hover:text-white rounded-full transition-all text-text-muted">
                   <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h3 className="text-lg font-bold text-unair-blue uppercase tracking-tight">{activeReport}</h3>
              </div>

              {activeReport === 'Protokol per Bulan' && (
                 <div className="h-80 w-full bg-bg-light/30 border border-border-color rounded-2xl p-6">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={monthlyData}>
                         <XAxis dataKey="name" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                         <YAxis fontSize={10} axisLine={false} tickLine={false}/>
                         <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                         <Bar dataKey="total" fill="#0056A6" radius={[4,4,0,0]} barSize={40} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              )}

              {activeReport === 'Demografi Peneliti' && (
                 <div className="flex flex-col items-center justify-center bg-bg-light/30 border border-border-color rounded-2xl p-6">
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={demographicData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                             {demographicData.map((_entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Pie>
                           <Tooltip contentStyle={{borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                         </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                       {demographicData.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}/>
                             <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{entry.name} ({entry.value})</span>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

               {activeReport === 'Kinerja Reviewer' && (
                 <div className="overflow-x-auto border border-border-color rounded-2xl bg-bg-light/30">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-border-color">
                             <th className="px-5 py-4 text-[10px] uppercase tracking-widest font-bold text-text-muted text-center">Peringkat</th>
                             <th className="px-5 py-4 text-[10px] uppercase tracking-widest font-bold text-text-muted">Nama Reviewer</th>
                             <th className="px-5 py-4 text-[10px] uppercase tracking-widest font-bold text-text-muted text-center">Beban Tugas Aktif</th>
                             <th className="px-5 py-4 text-[10px] uppercase tracking-widest font-bold text-text-muted text-center">Selesai (Approved)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-border-color">
                          {reviewerPerformance.map((rev, i) => (
                             <tr key={i} className="hover:bg-white transition-colors">
                                <td className="px-5 py-4 text-center">
                                   <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${i === 0 ? 'bg-unair-gold text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-200 text-orange-800'}`}>
                                      {i+1}
                                   </span>
                                </td>
                                <td className="px-5 py-4">
                                   <p className="text-xs font-bold text-text-main">{rev.name}</p>
                                   <p className="text-[9px] uppercase tracking-widest text-text-muted">{rev.institution}</p>
                                </td>
                                <td className="px-5 py-4 text-center">
                                   <span className="text-xs font-bold text-unair-blue">{rev.total}</span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                   <span className="text-xs font-bold text-accent-green">{rev.finished}</span>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}

              {!['Protokol per Bulan', 'Demografi Peneliti', 'Kinerja Reviewer'].includes(activeReport) && (
                 <div className="text-center py-12 border border-border-color rounded-2xl bg-bg-light/30">
                    <BarChart3 className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
                    <p className="text-sm font-bold text-text-muted">Data Laporan "{activeReport}" Belum Terkumpul</p>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mt-2">Masih membutuhkan input sampel data yang homogen dari sistem.</p>
                 </div>
              )}
            </div>
          )
        ) : activeTab === 'PENGGUNA' ? (
          <div>
            <div className="p-5 border-b border-border-color flex justify-between items-center bg-bg-light/30">
              <h3 className="text-sm font-bold text-unair-blue uppercase tracking-tight">Manajemen Akun Pengguna</h3>
              <button 
                onClick={() => setIsAddingReviewer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-unair-blue text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-unair-blue/90 transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Reviewer
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-light/50">
                    <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Role</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Nama</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Email</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted">Institusi</th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-text-muted text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-bg-light/30 transition-colors group">
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'REVIEWER' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-text-main">{u.name}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-text-muted">{u.email}</td>
                      <td className="px-5 py-4 text-xs text-text-muted">{u.profile?.institution || '-'}</td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1.5 bg-bg-light text-unair-blue rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-unair-blue hover:text-white transition-all shadow-sm"
                        >
                          Lihat CV
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal Tambah Reviewer */}
      {isAddingReviewer && (
        <div className="fixed inset-0 bg-unair-blue/20 backdrop-blur-sm flex items-center justify-center p-6 z-[110]">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-border-color">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-unair-blue">Tambah Reviewer Baru</h3>
              <button onClick={() => setIsAddingReviewer(false)} className="text-text-muted hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddReviewer} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-text-muted">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={newReviewer.name}
                  onChange={e => setNewReviewer({...newReviewer, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/10 outline-none text-sm"
                  placeholder="Nama Lengkap dengan Gelar"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-text-muted">Email</label>
                <input 
                  type="email" 
                  required
                  value={newReviewer.email}
                  onChange={e => setNewReviewer({...newReviewer, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/10 outline-none text-sm"
                  placeholder="Email aktif reviewer"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-text-muted">Password Sementara</label>
                <input 
                  type="text" 
                  required
                  value={newReviewer.password}
                  onChange={e => setNewReviewer({...newReviewer, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-border-color focus:ring-2 focus:ring-unair-blue/10 outline-none text-sm"
                  placeholder="Min 6 Karakter"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingReviewer(false)}
                  className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] text-text-muted bg-bg-light hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isAssigning}
                  className="flex-1 py-3 bg-unair-blue text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-unair-blue/90 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isAssigning ? 'Memproses...' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProtocol && (
        <div className="fixed inset-0 bg-unair-blue/20 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-border-color">
            <h3 className="text-xl font-bold text-unair-blue mb-2">Pilih Reviewer</h3>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-6">Tugaskan reviewer untuk: {selectedProtocol.registrationNumber}</p>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
              {reviewers.map((r) => {
                const isAlreadyAssigned = selectedProtocol?.assignedReviewers?.includes(r.id);
                return (
                  <button
                    key={r.id}
                    disabled={isAssigning || isAlreadyAssigned}
                    onClick={() => handleAssignReviewer(selectedProtocol!.id, r.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group disabled:opacity-60 ${
                      isAlreadyAssigned 
                        ? 'bg-bg-light border-border-color cursor-not-allowed' 
                        : 'border-border-color hover:border-unair-blue hover:bg-unair-blue/5 cursor-pointer'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${isAlreadyAssigned ? 'text-text-muted' : 'text-text-main group-hover:text-unair-blue'}`}>
                          {r.name}
                        </p>
                        {isAlreadyAssigned && (
                          <span className="text-[8px] bg-accent-green/10 text-accent-green px-1.5 py-0.5 rounded uppercase font-bold">Terpilih</span>
                        )}
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">{r.profile?.institution || 'FKp UNAIR'}</p>
                    </div>
                    {!isAlreadyAssigned && (
                      isAssigning ? (
                        <div className="w-4 h-4 border-2 border-unair-blue/30 border-t-unair-blue rounded-full animate-spin"></div>
                      ) : (
                        <Plus className="w-4 h-4 text-unair-blue group-hover:scale-125 transition-transform" />
                      )
                    )}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setSelectedProtocol(null)}
              className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] text-text-muted hover:text-red-500 transition-all"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* User / Biodata Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-unair-blue/20 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-border-color">
            <div className="flex justify-between items-start mb-6 border-b border-border-color pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-unair-blue rounded-full flex items-center justify-center border border-blue-100">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-unair-blue">{selectedUser.name}</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">CV & Biodata • {selectedUser.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-bg-light rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-text-muted" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-light/50 p-4 rounded-2xl border border-border-color">
                  <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Email / Kontak</p>
                  <p className="text-xs font-semibold text-text-main">{selectedUser.email}</p>
                  <p className="text-xs font-semibold text-text-main mt-1">{selectedUser.profile?.phone || '-'}</p>
                </div>
                <div className="bg-bg-light/50 p-4 rounded-2xl border border-border-color">
                  <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Status Kepegawaian</p>
                  <p className="text-xs font-semibold text-text-main">{selectedUser.profile?.status || '-'}</p>
                </div>
              </div>
              
              <div className="bg-bg-light/50 p-4 rounded-2xl border border-border-color">
                <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Institusi Asal</p>
                <p className="text-sm font-semibold text-text-main">{selectedUser.profile?.institution || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-light/50 p-4 rounded-2xl border border-border-color">
                  <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Pendidikan Terakhir</p>
                  <p className="text-sm font-semibold text-text-main">{selectedUser.profile?.lastEducation || '-'}</p>
                </div>
                <div className="bg-bg-light/50 p-4 rounded-2xl border border-border-color">
                  <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Jenis Kelamin</p>
                  <p className="text-sm font-semibold text-text-main">{selectedUser.profile?.gender || '-'}</p>
                </div>
              </div>
              
              <div className="bg-bg-light/50 p-4 rounded-2xl border border-border-color">
                <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-1">Tempat, Tanggal Lahir</p>
                <p className="text-sm font-semibold text-text-main">
                  {selectedUser.profile?.placeOfBirth || '-'}, {' '}
                  {selectedUser.profile?.dateOfBirth 
                    ? new Date(selectedUser.profile.dateOfBirth).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : '-'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setSelectedUser(null)}
              className="mt-8 w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs bg-bg-light text-text-main hover:bg-gray-100 transition-all border border-border-color"
            >
              Tutup Biodata
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
