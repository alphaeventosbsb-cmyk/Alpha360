'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Lock,
  Unlock,
  Shield,
  Briefcase
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { JobModal } from '@/components/JobModal';
import type { Job } from '@/lib/types';

export default function MinhasEscalasPage() {
  const { t } = useLanguage();
  const { user, userData, companyId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadJobs = async () => {
    if (!user) return;
    try {
      let data = await api.listJobs();
      if (userData?.role === 'client') {
        data = data.filter(j => j.contractorId === user.uid);
      }
      setJobs(data);
    } catch (error) {
      console.error('Erro ao carregar escalas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 10000);
    return () => clearInterval(interval);
  }, [user, companyId, userData]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta escala? Todos os v\u00ednculos com seguran\u00e7as tamb\u00e9m ser\u00e3o apagados. Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.')) return;
    try {
      await api.deleteJob(id);
      alert('Escala e todos os v\u00ednculos foram exclu\u00eddos com sucesso!');
      loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Erro ao excluir escala.');
    }
  };

  const handleToggleStatus = async (job: Job) => {
    try {
      const newStatus = job.status === 'open' ? 'completed' : 'open';
      setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
      await api.updateJob(job.id!, { status: newStatus });
      loadJobs();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao alterar status.');
    }
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const filteredJobs = jobs.filter(j => 
    !searchTerm || 
    j.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#192c4d]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Configuração de Escalas</h2>
        <div className="flex gap-2">
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#192c4d] text-white rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-[#192c4d]/20"
          >
            <Plus className="size-4" />
            Criar Nova Escala
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#192c4d]"
            placeholder="Pesquisar por cliente ou localização..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente / Evento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data / Horário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Local</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Vagas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="size-8 text-slate-300" />
                      <p className="font-medium">Nenhuma escala encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                const isLocked = job.status === 'filled' || job.status === 'in_progress' || job.status === 'completed';
                return (
                  <tr key={job.id} className={`hover:bg-slate-50 transition-colors ${isLocked ? 'opacity-80' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{job.clientName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {isLocked && (
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Lock className="size-3" /> Travada
                          </span>
                        )}
                        {job.isPatrimonial && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded truncate">Patrimonial</span>
                        )}
                        {job.hasQRF && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded truncate">QRF</span>
                        )}
                        <span className="text-xs font-medium text-green-600">R$ {job.dailyRate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                        <Calendar className="size-3 text-slate-400" />
                        {new Date(job.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="size-3 text-slate-400" />
                        {job.startTime} às {job.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700 max-w-[200px]">
                        <MapPin className="size-3 shrink-0 text-slate-400" />
                        <span className="truncate">{job.location || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {job.guardsConfirmed || 0} / {job.guardsNeeded}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isLocked ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold cursor-not-allowed ${
                          job.status === 'filled' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          <Lock className="size-3" />
                          {job.status === 'filled' ? 'Preenchida' : job.status === 'in_progress' ? 'Em Andamento' : 'Concluída'}
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleToggleStatus(job)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          job.status === 'open' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                          'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}>
                          <Unlock className="size-3" />
                          Aberta
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {!isLocked && (
                          <button 
                            onClick={() => openEditModal(job)}
                            className="p-1.5 text-slate-400 hover:text-[#192c4d] transition-colors" 
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(job.id!)}
                          className="p-1.5 text-red-400 hover:text-red-600 transition-colors" 
                          title="Excluir escala e vínculos"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <JobModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingJob(null); }}
        title={editingJob ? "Editar Escala" : "Criar Nova Escala"}
        initialData={editingJob}
      />
    </div>
  );
}
