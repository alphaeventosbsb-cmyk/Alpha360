import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  Briefcase, MapPin, Clock, DollarSign, Users, Loader2,
  CheckCircle2, Send, ChevronDown, ChevronRight, FileText, Share
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type TabType = 'available' | 'pending' | 'confirmed';

export default function VagasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [jobsData, assignmentsData] = await Promise.all([
          api.listJobs(['open']),
          api.getGuardAssignments(user.uid),
        ]);
        setJobs(jobsData);
        setAssignments(assignmentsData);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const myJobIds = new Set(assignments.map((a: any) => a.jobId));

  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'invited');
  const confirmedAssignments = assignments.filter(a => ['approved', 'checked_in', 'checked_out'].includes(a.status));

  // The Available Jobs should exclude the ones we already applied/assigned to, or just show them as "Already Applied"
  // User requested "Vagas Globais não aplicadas", let's filter out ones we requested, OR just flag them.
  // The UI flagged them before, let's keep the flag so they know they applied.
  
  const handleRequest = async (jobId: string) => {
    setRequesting(jobId);
    try {
      await api.requestJob(jobId);
      alert('Solicitação enviada! Acompanhe na aba Em Análise.');
      const newAssignments = await api.getGuardAssignments(user!.uid);
      setAssignments(newAssignments);
      setActiveTab('pending'); // Auto-switch tab showing progress
    } catch (err: any) {
      alert(err.message || 'Erro ao solicitar vaga.');
    } finally {
      setRequesting(null);
    }
  };

  const TabButton = ({ label, id, badge }: { label: string, id: TabType, badge?: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1, padding: '12px 4px', fontSize: 13, fontWeight: 800,
        background: 'transparent', border: 'none',
        borderBottom: activeTab === id ? '3px solid #3b82f6' : '3px solid transparent',
        color: activeTab === id ? '#3b82f6' : '#64748b',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'all 0.2s'
      }}
    >
      {label}
      {badge ? (
        <span style={{ 
          background: activeTab === id ? '#3b82f6' : '#64748b',
          color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 10 
        }}>{badge}</span>
      ) : null}
    </button>
  );

  return (
    <div style={{ padding: '0 0 100px', maxWidth: 480, margin: '0 auto' }}>
      {/* Sticky Header with Tabs */}
      <div className="safe-top" style={{ 
        position: 'sticky', top: 0, zIndex: 10, 
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)', padding: '20px 16px 0'
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>Portal de Vagas</h1>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <TabButton label="Disponíveis" id="available" badge={jobs.length} />
          <TabButton label="Em Análise" id="pending" badge={pendingAssignments.length} />
          <TabButton label="Confirmadas" id="confirmed" badge={confirmedAssignments.length} />
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        ) : (
          <>
            {/* TABS CONTENT */}

            {/* TAB: AVAILABLE */}
            {activeTab === 'available' && (
              jobs.length === 0 ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
                  <Briefcase size={36} style={{ margin: '0 auto 12px', color: '#475569' }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>Nenhuma vaga aberta</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {jobs.map((job) => {
                    const alreadyApplied = myJobIds.has(job.id);
                    return (
                      <div key={job.id} style={{
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        borderRadius: 16, padding: 16
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <h3 style={{ fontSize: 15, fontWeight: 800 }}>{job.clientName}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <MapPin size={12} color="#64748b" />
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>{job.location || 'Local não informado'}</span>
                            </div>
                          </div>
                          <div style={{
                            background: 'rgba(34,197,94,0.12)', color: '#22c55e', padding: '6px 12px', borderRadius: 10,
                            fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <DollarSign size={14} />{job.dailyRate?.toFixed(0) || '0'}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                            <Clock size={14} style={{ margin: '0 auto 4px', color: '#64748b' }} />
                            <p style={{ fontSize: 11, fontWeight: 700 }}>{job.startTime} - {job.endTime}</p>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                            <Briefcase size={14} style={{ margin: '0 auto 4px', color: '#64748b' }} />
                            <p style={{ fontSize: 11, fontWeight: 700 }}>{job.date || '-'}</p>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                            <Users size={14} style={{ margin: '0 auto 4px', color: '#64748b' }} />
                            <p style={{ fontSize: 11, fontWeight: 700 }}>{job.guardsNeeded || 1} vaga{(job.guardsNeeded || 1) > 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        {alreadyApplied ? (
                          <div style={{
                            width: '100%', padding: '12px', borderRadius: 12, textAlign: 'center',
                            background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                            fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}>
                            <CheckCircle2 size={16} /> Já Solicitado
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRequest(job.id)}
                            disabled={requesting === job.id}
                            style={{
                              width: '100%', padding: '13px', borderRadius: 12,
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              color: 'white', fontSize: 14, fontWeight: 800,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
                              opacity: requesting === job.id ? 0.6 : 1,
                            }}
                          >
                            {requesting === job.id ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Candidatar-se</>}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* TAB: PENDING */}
            {activeTab === 'pending' && (
              pendingAssignments.length === 0 ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
                  <Share size={36} style={{ margin: '0 auto 12px', color: '#475569' }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>Nenhuma solicitação em análise</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {pendingAssignments.map((a: any, i) => (
                    <div key={i} style={{
                      background: 'var(--color-surface)', border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 16, padding: 16
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                            {a.status === 'invited' ? 'Novo Convite' : 'Em Análise pelo Contratante'}
                          </span>
                          <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 10 }}>{a.jobName || a.clientName || 'Escala'}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <MapPin size={12} color="#64748b" />
                            <span style={{ fontSize: 13, color: '#94a3b8' }}>{a.location || 'Local não informado'}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>R$ {a.dailyRate?.toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* TAB: CONFIRMED */}
            {activeTab === 'confirmed' && (
              confirmedAssignments.length === 0 ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 12px', color: '#475569' }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>Nenhuma escala confirmada</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {confirmedAssignments.map((a: any, i) => (
                    <div key={i} style={{
                      background: 'var(--color-surface)', border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 16, padding: 16, position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: '#22c55e' }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                            {a.status === 'checked_in' ? 'Em Andamento' : a.status === 'checked_out' ? 'Concluída' : 'Aprovada'}
                          </span>
                          <h3 style={{ fontSize: 16, fontWeight: 800, marginTop: 10 }}>{a.jobName || a.clientName || 'Escala'}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <MapPin size={12} color="#64748b" />
                            <span style={{ fontSize: 13, color: '#94a3b8' }}>{a.location || 'Local não informado'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {a.status === 'approved' && (
                        <button onClick={() => navigate('/checkin')} style={{
                          width: '100%', marginTop: 16, padding: 12, borderRadius: 10,
                          background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)',
                          fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'center', gap: 6
                        }}>
                          Ir para Check-in <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

          </>
        )}
      </div>
    </div>
  );
}
