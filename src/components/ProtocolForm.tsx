/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../dbService';
import { Protocol, User } from '../types';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Plus, 
  Trash2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface ProtocolFormProps {
  user: User;
  protocolId: string | null;
  onBack: () => void;
  onSave: () => void;
}

const SCREENING_QUESTIONS = [
  "Judul penelitian",
  "Ringkasan proposal riset dengan bahasa awam/non-teknis; (max : 250 kata)",
  "Pernyataan yang jelas tentang urgensi dan pentingnya penelitian",
  "Pandangan para peneliti tentang isu-isu etik dan cara mengatasinya",
  "Ringkasan hasil hasil studi sebelumnya sesuai topik penelitian",
  "Pernyataan bahwa prinsip prinsip yang tertuang dalam pedoman ini akan dipatuhi",
  "Penjelasan tentang usulan review protokol etik sebelumnya dan hasilnya",
  "Gambaran singkat tentang lokasi penelitian, fasilitas, dan demografi",
  "Nama dan alamat sponsor",
  "Nama, alamat, afiliasi lembaga, kualifikasi ketua peneliti dan peneliti lainnya",
  "Tujuan penelitian, hipotesa, pertanyaan penelitian, asumsi dan variabel",
  "Deskipsi detail tentang desain ujicoba atau penelitian",
  "Jumlah subyek yang dibutuhkan dan penentuannya secara statistik",
  "Kriteria partisipan atau subyek dan jastifikasi penentuan",
  "Jastifikasi melibatkan anak anak atau kelompok rentan",
  "Proses rekrutmen dan langkah menjaga privasi",
  "Deskripsi dan penjelasan semua intervensi (dosis, interval, dll)",
  "Rencana jastifikasi meneruskan atau menghentikan standar terapi",
  "Treatmen/Pengobatan lain yang mungkin diberikan",
  "Test test klinis atau lab atau test lain yang harus dilakukan",
  "Sampel form laporan kasus, metode pencatatan respon, follow-up",
  "Aturan kriteria kapan subyek bisa diberhentikan",
  "Metode pencatatan dan pelaporan adverse events",
  "Resiko resiko yang diketahui dari adverse events",
  "Potensi keuntungan penelitian secara pribadi bagi subyek",
  "Harapan keuntungan penelitian bagi penduduk/pengetahuan baru",
  "Rencana asuransi/kompensasi jika terjadi disabilitas atau kematian",
  "Kemungkinan memberikan kelanjutan akses manfaat intervensi",
  "Perencanaan monitor kesehatan ibu hamil dan anak (jika relevan)",
  "Cara mendapatkan informed consent dan prosedur komunikasi",
  "Izin dari wali jika subyek tidak bisa memberikan informed consent",
  "Deskripsi insentif pada calon subyek (uang, hadiah, dll)",
  "Rencana menginformasikan hal baru yang muncul dalam studi",
  "Perencanaan menginformasikan hasil penelitian pada subyek",
  "Langkah proteksi kerahasiaan data pribadi",
  "Informasi tentang kode identitas subyek dan keamanannya",
  "Kemungkinan penggunaan lebih jauh dari data personal/material biologis",
  "Deskripsi rencana analisa statistik dan kriteria penghentian prematur",
  "Rencana monitor keamanan obat atau intervensi",
  "Daftar referensi yang dirujuk dalam protokol",
  "Sumber dan jumlah dana riset; lembaga funding",
  "Pengaturan untuk mengatasi konflik finansial (Conflict of Interest)",
  "Kontribusi sponsor untuk capacity building (jika setting sumberdaya lemah)",
  "Rencana pelibatan komunitas",
  "Kontrak pemilik hak publikasi hasil riset",
  "Memastikan hasil negatif tersedia melalui publikasi",
  "Rencana publikasi hasil yang beresiko pada komunitas tertentu",
  "Pernyataan penanganan pemalsuan data"
];

export default function ProtocolForm({ user, protocolId, onBack, onSave }: ProtocolFormProps) {
  const [step, setStep] = useState(1);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSaveDraftConfirm, setShowSaveDraftConfirm] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [memberList, setMemberList] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadKey, setCurrentUploadKey] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Protocol>>({
    id: protocolId || Math.random().toString(36).substr(2, 9),
    researcherId: user.id,
    title: '',
    status: 'DRAFT',
    generalInfo: {
      mainResearcher: user.name,
      phone: user.profile?.phone || '',
      members: '',
      organizingInstitution: user.profile?.institution || '',
      collaborationType: 'Bukan kerjasama',
      collaborationDetails: '',
      researchTeamTasks: [{ 
        name: `${user.name}, ${user.profile?.lastEducation || ''}`, 
        institution: user.profile?.institution || '',
        task: 'Peneliti Utama', 
        contact: `${user.profile?.phone || ''} / ${user.email}` 
      }],
      design: 'Intervensi / eksperimen',
      designDetails: '',
      location: '',
      time: '',
      dataCollectionTime: '',
      previousSubmission: 'Tidak',
      previousSubmissionResult: 'diterima',
    },
    screening: {},
    attachments: {
      proposal: '',
      psp: '',
      ic: '',
      instruments: '',
      supportingDocs: [],
      paymentProof: '',
    }
  });

  useEffect(() => {
    const fetchProtocol = async () => {
      if (protocolId) {
        const existing = await dbService.getProtocolById(protocolId);
        if (existing) {
          setFormData(existing);
          if (existing.generalInfo?.members) {
            setMemberList(existing.generalInfo.members.split('\n').filter(m => m.trim() !== ''));
          }
        }
      }
    };
    fetchProtocol();
  }, [protocolId]);

  // Sync memberList to formData.generalInfo.members whenever it changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      generalInfo: {
        ...prev.generalInfo!,
        members: memberList.join('\n')
      }
    }));
  }, [memberList]);

  const handleAddMember = () => {
    setMemberList([...memberList, '']);
  };

  const handleRemoveMember = (index: number) => {
    const newList = [...memberList];
    newList.splice(index, 1);
    setMemberList(newList);
  };

  const handleMemberChange = (index: number, value: string) => {
    const newList = [...memberList];
    newList[index] = value;
    setMemberList(newList);
  };

  const handleSave = async (isSubmit = false) => {
    setIsSaving(true);
    let newStatus = formData.status || 'DRAFT';
    
    if (isSubmit) {
      newStatus = 'SUBMITTED';
    } else if (!formData.status || formData.status === 'DRAFT') {
      newStatus = 'DRAFT';
    }

    const updated: Protocol = {
      ...formData as Protocol,
      status: newStatus as any,
      submittedAt: isSubmit ? new Date().toLocaleDateString('id-ID') : formData.submittedAt,
      registrationNumber: isSubmit ? (formData.registrationNumber || `REG-${Math.floor(1000 + Math.random() * 9000)}`) : (formData.registrationNumber || ''),
    };
    
    const success = await dbService.saveProtocol(updated);
    setIsSaving(false);
    setShowSaveDraftConfirm(false);
    if (success) {
      alert(isSubmit ? "Protokol berhasil diajukan!" : "Draft berhasil disimpan!");
      onSave();
    } else {
      alert("Gagal menyimpan protokol. Silakan coba lagi.");
    }
  };

  const handleAddTask = () => {
    setFormData({
      ...formData,
      generalInfo: {
        ...formData.generalInfo!,
        researchTeamTasks: [...formData.generalInfo!.researchTeamTasks, { name: '', institution: '', task: '', contact: '' }]
      }
    });
  };

  const handleRemoveTask = (index: number) => {
    const newList = [...formData.generalInfo!.researchTeamTasks];
    newList.splice(index, 1);
    setFormData({
      ...formData,
      generalInfo: {
        ...formData.generalInfo!,
        researchTeamTasks: newList
      }
    });
  };

  const handleTaskChange = (index: number, field: string, value: string) => {
    const newList = [...formData.generalInfo!.researchTeamTasks];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({
      ...formData,
      generalInfo: {
        ...formData.generalInfo!,
        researchTeamTasks: newList
      }
    });
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <h3 className="text-sm font-bold text-unair-blue uppercase tracking-wider border-b border-border-color pb-2 mb-6">A. Informasi Umum</h3>
      
      <div className="space-y-6">
        {/* Title */}
        <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-3 text-text-muted">Judul Penelitian</label>
          <textarea 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white min-h-[100px] text-sm"
            placeholder="Masukkan judul lengkap penelitian..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Researcher */}
          <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-3 text-text-muted">Ketua Pelaksana / Peneliti Utama (Nama dan Gelar)</label>
            <input 
              value={formData.generalInfo?.mainResearcher}
              onChange={(e) => setFormData({...formData, generalInfo: {...formData.generalInfo!, mainResearcher: e.target.value}})}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white text-sm"
              placeholder="Contoh: Dr. Nama Lengkap, M.Kep."
            />
          </div>

          {/* Phone */}
          <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-3 text-text-muted">No. HP</label>
            <input 
              value={formData.generalInfo?.phone}
              onChange={(e) => setFormData({...formData, generalInfo: {...formData.generalInfo!, phone: e.target.value}})}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white text-sm"
              placeholder="0812xxxxxx"
            />
          </div>

          {/* Institution */}
          <div className="md:col-span-2 bg-bg-light/30 p-5 rounded-2xl border border-border-color">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-3 text-text-muted">Anggota Peneliti</label>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {memberList.map((member, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2 items-start"
                  >
                    <input 
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white text-sm"
                      placeholder="Nama, Gelar, Institusi..."
                    />
                    <button 
                      type="button"
                      onClick={() => handleRemoveMember(index)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button 
                type="button"
                onClick={handleAddMember}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-unair-blue bg-white px-3 py-2 rounded-lg border border-border-color hover:bg-blue-50 transition-all font-sans"
              >
                <Plus className="w-3 h-3" />
                Tambah Anggota
              </button>
            </div>
          </div>

          {/* Institution */}
          <div className="md:col-span-2 bg-bg-light/30 p-5 rounded-2xl border border-border-color">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-3 text-text-muted">Institusi Penyelenggara Penelitian</label>
            <input 
              value={formData.generalInfo?.organizingInstitution}
              onChange={(e) => setFormData({...formData, generalInfo: {...formData.generalInfo!, organizingInstitution: e.target.value}})}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white text-sm"
              placeholder="Fakultas Keperawatan Universitas Airlangga"
            />
          </div>
        </div>

        {/* Collaboration Type */}
        <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-4 text-text-muted">Jenis Kerjasama Penelitian</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Bukan kerjasama',
              'Kerjasama nasional',
              'Kerjasama internasional',
              'Melibatkan peneliti asing',
              'Lain-lain'
            ].map(type => (
              <label key={type} className="flex items-center gap-3 p-3 bg-white border border-border-color rounded-xl cursor-pointer hover:border-unair-blue/30 transition-all text-xs">
                <input 
                  type="radio" 
                  name="collaborationType"
                  checked={formData.generalInfo?.collaborationType === type}
                  onChange={() => setFormData({...formData, generalInfo: {...formData.generalInfo!, collaborationType: type}})}
                  className="w-4 h-4 text-unair-blue"
                />
                <span className="font-medium text-text-main">{type}</span>
              </label>
            ))}
          </div>
          {(formData.generalInfo?.collaborationType === 'Kerjasama internasional' || 
            formData.generalInfo?.collaborationType === 'Lain-lain') && (
            <div className="mt-4">
              <label className="block text-[9px] uppercase tracking-widest font-bold mb-2 text-text-muted">
                {formData.generalInfo?.collaborationType === 'Kerjasama internasional' ? 'Jumlah Negara Terlibat' : 'Penjelasan Lainnya'}
              </label>
              <input 
                value={formData.generalInfo?.collaborationDetails || ''}
                onChange={(e) => setFormData({...formData, generalInfo: {...formData.generalInfo!, collaborationDetails: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white text-sm"
                placeholder="..."
              />
            </div>
          )}
        </div>

        {/* Research Team Tasks */}
        <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
          <div className="flex justify-between items-center mb-6">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-text-muted">Tugas Tim Peneliti & Anggota</label>
            <button 
              type="button"
              onClick={handleAddTask}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-unair-blue bg-white px-3 py-2 rounded-lg border border-border-color hover:bg-blue-50 hover:border-unair-blue/30 transition-all shadow-sm"
            >
              <Plus className="w-3 h-3" />
              Tambah Anggota/Tugas
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="p-3 text-[9px] uppercase font-bold text-text-muted border border-border-color">Nama & Gelar</th>
                  <th className="p-3 text-[9px] uppercase font-bold text-text-muted border border-border-color">Institusi</th>
                  <th className="p-3 text-[9px] uppercase font-bold text-text-muted border border-border-color">Tugas dan Fungsi</th>
                  <th className="p-3 text-[9px] uppercase font-bold text-text-muted border border-border-color">Telp / Email</th>
                  <th className="p-3 text-center border border-border-color w-10"></th>
                </tr>
              </thead>
              <tbody>
                {formData.generalInfo?.researchTeamTasks.map((task, idx) => (
                  <tr key={idx} className="bg-white/50">
                    <td className="p-2 border border-border-color">
                      <input 
                        value={task.name}
                        onChange={(e) => handleTaskChange(idx, 'name', e.target.value)}
                        className="w-full p-2 bg-transparent focus:outline-none text-xs"
                        placeholder="Nama Lengkap..."
                      />
                    </td>
                    <td className="p-2 border border-border-color">
                      <input 
                        value={task.institution}
                        onChange={(e) => handleTaskChange(idx, 'institution', e.target.value)}
                        className="w-full p-2 bg-transparent focus:outline-none text-xs"
                        placeholder="Institusi..."
                      />
                    </td>
                    <td className="p-2 border border-border-color">
                      <input 
                        value={task.task}
                        onChange={(e) => handleTaskChange(idx, 'task', e.target.value)}
                        className="w-full p-2 bg-transparent focus:outline-none text-xs"
                        placeholder="Contoh: Analisa Data"
                      />
                    </td>
                    <td className="p-2 border border-border-color">
                      <input 
                        value={task.contact}
                        onChange={(e) => handleTaskChange(idx, 'contact', e.target.value)}
                        className="w-full p-2 bg-transparent focus:outline-none text-xs"
                        placeholder="08xx / email@..."
                      />
                    </td>
                    <td className="p-2 border border-border-color text-center">
                      {idx > 0 && (
                        <button 
                          onClick={() => handleRemoveTask(idx)}
                          className="text-red-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Design Penelitian */}
        <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-4 text-text-muted">Desain Penelitian</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Intervensi / eksperimen',
              'Survey/observasi',
              'Kualitatif (wawancara, FGD,....)',
              'Lain-lain'
            ].map(type => (
              <label key={type} className="flex items-center gap-3 p-3 bg-white border border-border-color rounded-xl cursor-pointer hover:border-unair-blue/30 transition-all text-xs">
                <input 
                  type="radio" 
                  name="designType"
                  checked={formData.generalInfo?.design === type}
                  onChange={() => setFormData({...formData, generalInfo: {...formData.generalInfo!, design: type}})}
                  className="w-4 h-4 text-unair-blue"
                />
                <span className="font-medium text-text-main">{type}</span>
              </label>
            ))}
          </div>
          {(formData.generalInfo?.design === 'Kualitatif (wawancara, FGD,....)' || 
            formData.generalInfo?.design === 'Lain-lain') && (
            <div className="mt-4">
              <label className="block text-[9px] uppercase tracking-widest font-bold mb-2 text-text-muted">
                {formData.generalInfo?.design === 'Lain-lain' ? 'Sebutkan Desain Lainnya' : 'Detail (Wawancara, FGD, dll)'}
              </label>
              <input 
                value={formData.generalInfo?.designDetails || ''}
                onChange={(e) => setFormData({...formData, generalInfo: {...formData.generalInfo!, designDetails: e.target.value}})}
                className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white text-sm"
                placeholder="..."
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Location */}
          <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-3 text-text-muted">Tempat Penelitian</label>
            <input 
              value={formData.generalInfo?.location}
              onChange={(e) => setFormData({...formData, generalInfo: {...formData.generalInfo!, location: e.target.value}})}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white text-sm"
            />
          </div>

          {/* Time */}
          <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-3 text-text-muted">Waktu Penelitian</label>
            <input 
              value={formData.generalInfo?.time}
              onChange={(e) => setFormData({...formData, generalInfo: {...formData.generalInfo!, time: e.target.value}})}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white text-sm"
              placeholder="Contoh: Jan - Des 2024"
            />
          </div>

          {/* Collection Time */}
          <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-3 text-text-muted">Waktu Pengumpulan Data</label>
            <input 
              value={formData.generalInfo?.dataCollectionTime}
              onChange={(e) => setFormData({...formData, generalInfo: {...formData.generalInfo!, dataCollectionTime: e.target.value}})}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white text-sm"
            />
          </div>
        </div>

        {/* Previous Submission */}
        <div className="bg-bg-light/30 p-5 rounded-2xl border border-border-color">
          <label className="block text-[10px] uppercase tracking-widest font-bold mb-4 text-text-muted">Pernah Diajukan ke Komisi Etik Lain?</label>
          <div className="flex gap-6 mb-4">
            {['Ya', 'Tidak'].map(val => (
              <label key={val} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="radio" 
                    name="prevSubmission"
                    checked={formData.generalInfo?.previousSubmission === val}
                    onChange={() => setFormData({...formData, generalInfo: {...formData.generalInfo!, previousSubmission: val}})}
                    className="w-5 h-5 text-unair-blue border-border-color focus:ring-unair-blue"
                  />
                </div>
                <span className="text-xs font-bold text-text-main group-hover:text-unair-blue transition-all">{val}</span>
              </label>
            ))}
          </div>
          {formData.generalInfo?.previousSubmission === 'Ya' && (
            <div className="flex gap-4 p-4 bg-white rounded-xl border border-border-color animate-in fade-in slide-in-from-top-1">
              {['diterima', 'ditolak'].map(res => (
                <label key={res} className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="prevRes"
                    checked={formData.generalInfo?.previousSubmissionResult === res}
                    onChange={() => setFormData({...formData, generalInfo: {...formData.generalInfo!, previousSubmissionResult: res}})}
                    className="w-4 h-4 text-unair-blue"
                  />
                  <span className="text-xs font-bold text-text-muted capitalize">{res}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <h3 className="text-sm font-bold text-unair-blue uppercase tracking-wider border-b border-border-color pb-2 mb-6">B. Skrening Protokol Penelitian</h3>
      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest italic">Wajib diisi secara lengkap sesuai dengan protokol penelitian Anda.</p>
      
      <div className="space-y-10">
        {SCREENING_QUESTIONS.map((q, i) => (
          <div key={i} className="space-y-3 bg-bg-light/30 p-5 rounded-2xl border border-border-color">
            <label className="block text-xs font-bold text-text-main">
              {i + 1}. {q}
            </label>
            <textarea 
              value={formData.screening?.[i] || ''}
              onChange={(e) => setFormData({
                ...formData, 
                screening: { ...formData.screening, [i]: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-xl border border-border-color focus:outline-none focus:ring-2 focus:ring-unair-blue/5 bg-white min-h-[80px] text-sm"
              placeholder="Ketik jawaban Anda di sini..."
            />
          </div>
        ))}
      </div>
    </div>
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadKey) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setFileUploadError("Format file tidak didukung. Harap unggah file PDF atau Gambar (.jpg, .jpeg, .png).");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(currentUploadKey);
    const result = await dbService.uploadFile(file);
    setUploading(null);

    if (result.success && result.url) {
      setFormData({
        ...formData,
        attachments: { ...formData.attachments!, [currentUploadKey]: result.url }
      });
    } else {
      setFileUploadError("Gagal mengunggah file: " + (result.error || "Terjadi kesalahan pada server."));
    }
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (key: string) => {
    setCurrentUploadKey(key);
    fileInputRef.current?.click();
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-unair-blue uppercase tracking-wider border-b border-border-color pb-2 mb-6">C. Lampiran Dokumen</h3>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
        accept=".pdf,image/jpeg,image/png,image/jpg"
      />
      <div className="grid grid-cols-1 gap-4">
        {[
          { key: 'proposal', label: 'Pengesahan Proposal', required: true },
          { key: 'psp', label: 'Penjelasan Sebelum Persetujuan (PSP)', required: true },
          { key: 'ic', label: 'Informed Consent (IC)', required: true },
          { key: 'instruments', label: 'Instrumen Penelitian', required: true },
          { key: 'paymentProof', label: 'Bukti Pembayaran', required: true },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-5 bg-bg-light/30 border border-border-color rounded-2xl">
            <div>
              <p className="font-bold text-xs text-text-main">{item.label}</p>
              <p className="text-[9px] uppercase tracking-widest font-bold text-text-muted">{item.required ? 'Wajib' : 'Opsional'}</p>
            </div>
            <div className="flex items-center gap-3">
              {formData.attachments?.[item.key as keyof typeof formData.attachments] ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-accent-green flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" /> Terunggah
                  </span>
                  <a 
                    href={formData.attachments[item.key as keyof typeof formData.attachments] as string} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] text-unair-blue underline font-bold"
                  >
                    Lihat File
                  </a>
                </div>
              ) : null}
              <button 
                disabled={uploading === item.key}
                onClick={() => triggerUpload(item.key)}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-border-color hover:border-unair-blue hover:text-unair-blue rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${
                  uploading === item.key ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading === item.key ? (
                  <div className="w-3 h-3 border-2 border-unair-blue border-t-transparent rounded-full animate-spin"></div>
                ) : formData.attachments?.[item.key as keyof typeof formData.attachments] ? (
                  <RefreshCw className="w-3 h-3" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                {uploading === item.key 
                  ? 'Mengunggah...' 
                  : formData.attachments?.[item.key as keyof typeof formData.attachments] 
                    ? 'Ganti File' 
                    : 'Unggah File'
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 text-center py-10">
      <div className="bg-accent-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-accent-green/20">
        <CheckCircle2 className="w-10 h-10 text-accent-green" />
      </div>
      <h3 className="text-2xl font-bold text-unair-blue">Konfirmasi Pengajuan</h3>
      <p className="text-xs text-text-muted max-w-md mx-auto font-medium">
        Saya menyatakan bahwa isian protokol penelitian sudah benar dan lampiran dokumen sudah lengkap.
      </p>

      {showSubmitConfirm && (
        <div className="mt-8 p-8 bg-accent-green/5 border border-accent-green/20 rounded-3xl max-w-lg mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-accent-green shrink-0" />
            <div className="text-left">
              <p className="text-sm font-bold text-accent-green mb-1">Konfirmasi Final</p>
              <p className="text-xs text-text-muted leading-relaxed font-medium">Apakah Anda sudah yakin? Data yang sudah diajukan akan segera diproses oleh Komite Etik dan tidak dapat diubah sementara waktu.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              disabled={isSaving}
              onClick={() => setShowSubmitConfirm(false)}
              className="flex-1 py-4 bg-white border border-border-color text-text-muted rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-bg-light transition-all active:scale-95 disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="flex-1 py-4 bg-accent-green text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-accent-green/90 transition-all shadow-lg active:scale-95 shadow-accent-green/20 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : 'Ya, Kirim Sekarang'}
            </button>
          </div>
        </div>
      )}
      {!showSubmitConfirm && (
        <div className="mt-8 p-8 bg-bg-light/30 border border-border-color rounded-3xl text-left max-w-lg mx-auto shadow-sm">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-unair-blue mb-4 border-b border-border-color pb-2">Ringkasan Dokumen</h4>
          <ul className="space-y-3 text-xs font-bold text-text-main">
            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-accent-green" /> Protokol Terisi Lengkap</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-accent-green" /> Proposal Riset Terunggah</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-accent-green" /> PSP & Informed Consent Terunggah</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-accent-green" /> Bukti Pembayaran Terunggah</li>
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-unair-blue transition-all font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Batal & Kembali
        </button>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSaveDraftConfirm(true)}
            className="flex items-center gap-2 px-6 py-2 bg-white border border-unair-blue text-unair-blue hover:bg-bg-light rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            Simpan Draft
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex justify-between mb-12 relative px-10">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-border-color -z-10 -translate-y-1/2"></div>
        {[
          { step: 1, label: 'Umum' },
          { step: 2, label: 'Skrening' },
          { step: 3, label: 'Lampiran' },
          { step: 4, label: 'Konfirmasi' }
        ].map((s) => (
          <div key={s.step} className="flex flex-col items-center gap-2">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all relative z-10 ${
                step === s.step 
                  ? 'bg-unair-blue text-white border-unair-blue shadow-lg scale-110' 
                  : step > s.step 
                    ? 'bg-accent-green text-white border-accent-green'
                    : 'bg-white text-text-muted border-border-color'
              }`}
            >
              {step > s.step ? <CheckCircle2 className="w-5 h-5" /> : s.step}
            </div>
            <span className={`text-[9px] uppercase tracking-widest font-bold ${step === s.step ? 'text-unair-blue' : 'text-text-muted'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl border border-border-color shadow-sm min-h-[500px]">
        <div className="mb-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="mt-12 pt-8 border-t border-border-color flex justify-between">
          <button 
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'text-text-muted hover:bg-bg-light'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </button>
          
          {step < 4 ? (
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setStep(step + 1);
              }}
              className="flex items-center gap-2 px-8 py-3 bg-unair-blue text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-unair-blue/90 transition-all shadow-md"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : !showSubmitConfirm ? (
            <button 
              onClick={() => setShowSubmitConfirm(true)}
              className="flex items-center gap-2 px-8 py-3 bg-accent-green text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-accent-green/90 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
              Submit Protokol
            </button>
          ) : null}
        </div>
      </div>

      {/* Save Draft Confirmation Modal */}
      {showSaveDraftConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border-t-8 border-unair-blue animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Save className="w-10 h-10 text-unair-blue" />
            </div>
            <h3 className="text-xl font-bold text-unair-blue mb-2">Simpan Draft</h3>
            <p className="text-sm text-text-muted mb-8 leading-relaxed font-medium">Apakah Anda yakin ingin menyimpan perubahan protokol ini sebagai draft?</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                disabled={isSaving}
                onClick={() => setShowSaveDraftConfirm(false)}
                className="py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-text-muted border border-border-color hover:bg-bg-light transition-all active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                disabled={isSaving}
                onClick={() => handleSave(false)}
                className="py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest bg-unair-blue text-white hover:bg-unair-blue/90 transition-all shadow-lg active:scale-95 shadow-unair-blue/20 flex items-center justify-center gap-2 disabled:bg-unair-blue/70"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : 'Ya, Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* File Upload Error Modal */}
      <AnimatePresence>
        {fileUploadError && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center border-t-8 border-red-500"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">Unggah Dibatalkan</h3>
              <p className="text-sm text-text-muted mb-8 leading-relaxed font-medium">
                {fileUploadError}
              </p>
              <button
                onClick={() => setFileUploadError(null)}
                className="w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all shadow-md active:scale-95"
              >
                Tutup Peringatan
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
