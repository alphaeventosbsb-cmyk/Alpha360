'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Briefcase, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  ShieldAlert, 
  Droplets,
  Trash2,
  CheckCircle2,
  Loader2,
  MapPin,
  UserCheck,
  X
} from 'lucide-react';
import { JobModal } from '@/components/JobModal';
import { motion } from 'motion/react';
import { useLanguage } from '@/components/language-provider';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';

export default function ClientesPage() {
  const { t } = useLanguage();
  const { user, userData } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedGuard, setSelectedGuard] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch jobs posted by this contractor
    const q = query(
      collection(db, 'jobs'), 
      where('companyId', '==', userData?.companyId || ''),
      where('contractorId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobs(jobsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      }));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async (formData: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'jobs'), {
        ...formData,
        companyId: userData?.companyId || '',
        contractorId: user.uid,
        status: 'open',
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding job:", error);
    }
  };

  const handleToggleStatus = async (job: any) => {
    try {
      await updateDoc(doc(db, 'jobs', job.id), {
        status: job.status === 'open' ? 'closed' : 'open'
      });
    } catch (error) {
      console.error("Error updating job:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('clients.deleteConfirm') || 'Excluir esta vaga permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', id));
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const viewGuardProfile = async (guardId: string) => {
    try {
      const guardDoc = await getDoc(doc(db, 'guards', guardId));
      if (guardDoc.exists()) {
        setSelectedGuard({ id: guardDoc.id, ...guardDoc.data() });
      } else {
        alert("Perfil do vigilante não encontrado.");
      }
    } catch (error) {
      console.error("Error fetching guard profile:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-[#192c4d]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('sidebar.clients') || 'Minhas Vagas'}</h2>
          <p className="text-slate-500 text-sm">{t('clients.subtitle') || 'Publique vagas e gerencie demandas de segurança.'}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#192c4d] text-white rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-[#192c4d]/20"
        >
          <Plus className="size-4" />
          {t('clients.newJob') || 'Nova Requisição de Vaga'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length === 0 ? (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Briefcase className="size-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">{t('clients.noJobs') || 'Nenhuma vaga postada'}</h3>
            <p className="text-slate-500 text-sm">{t('clients.noJobsDesc') || 'Comece publicando uma nova vaga para seus postos.'}</p>
          </div>
        ) : (
          jobs.map((job) => (
            <motion.div 
              layout
              key={job.id}
              className={`bg-white rounded-2xl border ${job.status === 'open' ? 'border-slate-200' : 'border-slate-100 opacity-75'} shadow-sm overflow-hidden flex flex-col`}
            >
              <div className={`p-4 ${job.status === 'open' ? 'bg-slate-50' : 'bg-slate-100'} border-b border-slate-100 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${job.status === 'open' ? 'bg-[#192c4d] text-white' : 'bg-slate-400 text-white'}`}>
                    <Briefcase className="size-4" />
                  </div>
                  <span className="font-bold text-sm truncate max-w-[150px]">{job.clientName}</span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${job.status === 'open' ? 'bg-green-100 text-green-700' : job.status === 'filled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                  {job.status === 'open' ? (t('clients.statusOpen') || 'Aberta') : job.status === 'filled' ? 'Preenchida' : (t('clients.statusClosed') || 'Fechada')}
                </span>
              </div>

              <div className="p-5 space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="size-4" />
                    <span className="text-sm font-medium">{job.date ? new Date(job.date).toLocaleDateString(t('locale') || 'pt-BR') : 'Sem data'}</span>
                  </div>
                  <div className="text-green-600 font-black text-lg">
                    {t('currency') || 'R$'} {Number(job.dailyRate || 0).toLocaleString(t('locale') || 'pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <MapPin className="size-4 shrink-0" />
                    <span className="truncate">{job.location || (t('clients.noLocation') || 'Local não informado')}</span>
                  </div>
                  {job.mapLink && (
                    <a 
                      href={job.mapLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline ml-6"
                    >
                      Ver no Mapa
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Clock className="size-3" />
                    {job.startTime || '00:00'} - {job.endTime || '00:00'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Users className="size-3" />
                    {job.guardsCount || 1} {t('clients.guards') || 'Vigilante(s)'}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {job.hasQRF && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded-lg border border-orange-100">
                      <ShieldAlert className="size-3" /> QRF
                    </span>
                  )}
                  {job.hasHydration && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">
                      <Droplets className="size-3" /> {t('clients.hydration') || 'Hidratação'}
                    </span>
                  )}
                </div>

                {job.status === 'filled' && job.guardId && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="size-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-900">Vaga Preenchida!</span>
                      </div>
                      <button 
                        onClick={() => viewGuardProfile(job.guardId)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Ver Perfil
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={() => handleToggleStatus(job)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    job.status === 'open' 
                      ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <CheckCircle2 className="size-4" />
                  {job.status === 'open' ? (t('clients.closeJob') || 'Fechar Vaga') : (t('clients.reopenJob') || 'Reabrir Vaga')}
                </button>
                <button 
                  onClick={() => handleDelete(job.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <JobModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={t('clients.modalTitle') || "Publicar Nova Vaga de Segurança"}
      />

      {/* Guard Profile Modal */}
      {selectedGuard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#192c4d] text-white">
              <h3 className="text-lg font-bold">Perfil do Vigilante</h3>
              <button onClick={() => setSelectedGuard(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-full bg-slate-200 overflow-hidden">
                  {selectedGuard.photoUrl ? (
                    <img src={selectedGuard.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="size-10 m-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{selectedGuard.name || 'Nome não informado'}</h4>
                  <p className="text-slate-500">CPF: {selectedGuard.cpf || 'Não informado'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 uppercase font-bold">RG</span>
                  <p className="font-medium text-slate-900">{selectedGuard.rg || 'Não informado'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 uppercase font-bold">Idade</span>
                  <p className="font-medium text-slate-900">{selectedGuard.age ? `${selectedGuard.age} anos` : 'Não informada'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 uppercase font-bold">Altura</span>
                  <p className="font-medium text-slate-900">{selectedGuard.height ? `${selectedGuard.height} cm` : 'Não informada'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 uppercase font-bold">Peso</span>
                  <p className="font-medium text-slate-900">{selectedGuard.weight ? `${selectedGuard.weight} kg` : 'Não informado'}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 uppercase font-bold">Endereço Completo</span>
                <p className="font-medium text-slate-900">{selectedGuard.address || 'Não informado'} - CEP: {selectedGuard.cep || 'Não informado'}</p>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-3">Documentos Anexados</h5>
                <div className="grid grid-cols-2 gap-3">
                  {selectedGuard.rgFrontUrl && <a href={selectedGuard.rgFrontUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">RG Frente</a>}
                  {selectedGuard.rgBackUrl && <a href={selectedGuard.rgBackUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">RG Verso</a>}
                  {selectedGuard.cpfUrl && <a href={selectedGuard.cpfUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">CPF</a>}
                  {selectedGuard.residenceProofUrl && <a href={selectedGuard.residenceProofUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Comprovante de Residência</a>}
                  {selectedGuard.courseUrl && <a href={selectedGuard.courseUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Certificado do Curso</a>}
                  {selectedGuard.recyclingUrl && <a href={selectedGuard.recyclingUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Certificado de Reciclagem</a>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
