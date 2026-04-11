'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, Loader2, Briefcase, Calendar } from 'lucide-react';
import { Chat } from '@/components/Chat';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import type { Job } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { user, userData } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const loadChatJobs = async () => {
    if (!user) return;
    try {
      if (userData?.role === 'guard') {
        const myAssignments = await api.getGuardAssignments(user.uid);
        const activeAssignments = myAssignments.filter((a: any) => 
          a.status === 'approved' || a.status === 'checked_in'
        );
        const allJobs = await api.listJobs();
        const jobIds = new Set(activeAssignments.map((a: any) => a.jobId));
        const jobsData = allJobs.filter(j => j.id && jobIds.has(j.id));
        setJobs(jobsData);
        if (jobsData.length > 0 && !selectedJob) {
          setSelectedJob(jobsData[0]);
        }
      } else {
        const allJobs = await api.listJobs();
        const jobsData = allJobs.filter(j => j.status === 'filled' || j.status === 'in_progress');
        setJobs(jobsData);
        if (jobsData.length > 0 && !selectedJob) {
          setSelectedJob(jobsData[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar jobs do chat:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatJobs();
    const interval = setInterval(loadChatJobs, 15000);
    return () => clearInterval(interval);
  }, [user, userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#192c4d]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Chat Operacional</h2>
        <p className="text-slate-500 text-sm">Comunicação em tempo real por escala.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <MessageSquare className="size-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Nenhuma escala ativa</h3>
          <p className="text-slate-500 text-sm">O chat estará disponível quando houver escalas em andamento.</p>
        </div>
      ) : (
        <div className="flex gap-6 h-[600px]">
          {/* Job List */}
          <div className="w-72 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Escalas ({jobs.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all",
                    selectedJob?.id === job.id
                      ? "bg-[#192c4d] text-white shadow-lg shadow-[#192c4d]/20"
                      : "bg-transparent hover:bg-slate-100 text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className={cn("size-4", selectedJob?.id === job.id ? "text-white/70" : "text-slate-400")} />
                    <span className="text-sm font-bold truncate">{job.clientName}</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 text-[10px]",
                    selectedJob?.id === job.id ? "text-white/60" : "text-slate-400"
                  )}>
                    <Calendar className="size-3" />
                    {job.date ? new Date(job.date).toLocaleDateString('pt-BR') : '-'}
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block",
                    job.status === 'in_progress'
                      ? selectedJob?.id === job.id ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                      : selectedJob?.id === job.id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                  )}>
                    {job.status === 'in_progress' ? 'EM ANDAMENTO' : 'CONFIRMADA'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1">
            {selectedJob ? (
              <Chat jobId={selectedJob.id!} jobTitle={selectedJob.clientName} />
            ) : (
              <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-400">Selecione uma escala para iniciar o chat.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
