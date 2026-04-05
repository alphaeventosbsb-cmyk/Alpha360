'use client';

import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  ShieldAlert, 
  Droplets,
  CheckCircle2,
  Loader2,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import { requestJobAssignment } from '@/lib/firestore-service';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Job, JobAssignment } from '@/lib/types';

export default function VagasPage() {
  const { user, userData } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myRequests, setMyRequests] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch open jobs
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('companyId', '==', userData?.companyId || ''),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job));
      setJobs(data);
      setLoading(false);
    });

    // Fetch my pending requests
    const requestsQuery = query(
      collection(db, 'job_assignments'),
      where('companyId', '==', userData?.companyId || ''),
      where('guardId', '==', user.uid)
    );
    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JobAssignment));
      setMyRequests(data);
    });

    return () => {
      unsubJobs();
      unsubRequests();
    };
  }, [user]);

  const getRequestStatus = (jobId: string): JobAssignment | undefined => {
    return myRequests.find(r => r.jobId === jobId);
  };

  const handleRequest = async (job: Job) => {
    if (!user || !job.id) return;
    setRequesting(job.id);

    try {
      await requestJobAssignment(job, {
        uid: user.uid,
        displayName: userData?.name || user.displayName || 'Vigilante',
        photoURL: userData?.photoUrl || user.photoURL || undefined,
      });
      alert('Solicitação enviada! Aguarde a aprovação do contratante.');
    } catch (error: any) {
      alert(error.message || 'Erro ao solicitar vaga.');
    } finally {
      setRequesting(null);
    }
  };

  const getStatusBadge = (request: JobAssignment | undefined) => {
    if (!request) return null;
    switch (request.status) {
      case 'pending':
        return <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-700">⏳ Aguardando Aprovação</span>;
      case 'approved':
        return <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-green-100 text-green-700">✅ Aprovado</span>;
      case 'rejected':
        return <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-red-100 text-red-700">❌ Rejeitado</span>;
      case 'checked_in':
        return <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-blue-100 text-blue-700">🔐 Em Serviço</span>;
      case 'checked_out':
        return <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-700">🔓 Finalizado</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-[#192c4d]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Vagas Disponíveis</h2>
        <p className="text-slate-500 text-sm">Encontre e solicite participação em escalas disponíveis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length === 0 ? (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Briefcase className="size-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Nenhuma vaga disponível</h3>
            <p className="text-slate-500 text-sm">No momento não há vagas abertas. Volte mais tarde.</p>
          </div>
        ) : (
          jobs.map((job) => {
            const request = getRequestStatus(job.id!);
            const hasRequested = !!request;
            const canRequest = !hasRequested || request?.status === 'rejected';
            const spotsLeft = job.guardsNeeded - (job.guardsConfirmed || 0);

            return (
              <motion.div 
                layout
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg flex items-center justify-center bg-[#192c4d] text-white">
                      <Briefcase className="size-4" />
                    </div>
                    <span className="font-bold text-sm truncate max-w-[150px]">{job.clientName}</span>
                  </div>
                  {getStatusBadge(request) || (
                    <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {spotsLeft} vaga(s)
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="size-4" />
                      <span className="text-sm font-medium">{job.date ? new Date(job.date).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                    </div>
                    <div className="text-green-600 font-black text-lg">
                      R$ {Number(job.dailyRate || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <MapPin className="size-4 shrink-0" />
                      <span className="truncate">{job.location || 'Local não informado'}</span>
                    </div>
                    {job.mapLink && (
                      <a 
                        href={job.mapLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline ml-6"
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
                      {job.guardsNeeded || 1} Vigilante(s)
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
                        <Droplets className="size-3" /> Hidratação
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  {canRequest ? (
                    <button 
                      onClick={() => handleRequest(job)}
                      disabled={requesting === job.id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-[#192c4d] text-white hover:bg-opacity-90 transition-all shadow-md shadow-[#192c4d]/20 disabled:opacity-50"
                    >
                      {requesting === job.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" />
                          Solicitar Participação
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <AlertCircle className="size-3" />
                        {request?.status === 'pending' ? 'Aguardando aprovação do contratante' : 
                         request?.status === 'approved' ? 'Você foi aprovado! Aguarde o dia da escala.' :
                         'Solicitação já enviada'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
