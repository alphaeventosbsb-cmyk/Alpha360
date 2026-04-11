'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Calendar, MapPin, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/services/api';
import type { Job, UserData } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

interface InviteGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  guard: UserData | null;
}

export function InviteGuardModal({ isOpen, onClose, guard }: InviteGuardModalProps) {
  const { user, userData, companyId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingJobId, setInvitingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || user === null || companyId === undefined) return;
    const loadJobs = async () => {
      try {
        let data = await api.listJobs(['open']);
        if (userData?.role === 'client') {
          data = data.filter(j => j.contractorId === user.uid);
        }
        setJobs(data);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, [isOpen, companyId, user, userData]);

  if (!isOpen || !guard) return null;

  const handleInvite = async (job: any) => {
    setInvitingJobId(job.id || null);
    try {
      await api.inviteGuard({
        jobId: job.id!,
        guardId: guard.id!,
        guardName: guard.name || 'Guarda',
        guardPhoto: guard.photoUrl,
      });
      alert('Convite enviado com sucesso! O segurança receberá no aplicativo.');
      onClose();
    } catch (error: any) {
      alert(error.message || 'Erro ao convidar o guarda.');
    } finally {
      setInvitingJobId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#192c4d] text-white">
            <div>
              <h3 className="text-lg font-bold">Convidar para Escala</h3>
              <p className="text-sm opacity-80">{guard.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="size-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
            <p className="text-sm text-slate-500 mb-4 font-bold uppercase">Escalas Abertas Disponíveis</p>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="size-8 animate-spin text-[#192c4d]" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
                <Calendar className="size-8 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">Nenhuma escala em aberto no momento.</p>
                <p className="text-sm text-slate-400 mt-1">Crie uma nova escala no menu "Escalas de Serviço".</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800">{job.clientName}</h4>
                        <div className="flex items-center text-xs font-bold text-slate-500 mt-1 gap-1">
                          <Calendar className="size-3" />
                          <span>{job.date} • {job.startTime} às {job.endTime}</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 mt-1 gap-1">
                          <MapPin className="size-3" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                      <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold text-sm">
                        <DollarSign className="size-4" />
                        {job.dailyRate}
                      </div>
                    </div>
                    
                    <button 
                      disabled={invitingJobId === job.id}
                      onClick={() => handleInvite(job)}
                      className="w-full mt-2 bg-[#192c4d] hover:bg-opacity-90 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {invitingJobId === job.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        'Convidar Guarda'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
