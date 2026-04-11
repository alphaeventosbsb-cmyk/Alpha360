import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Send, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id?: string;
  jobId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  imageUrl?: string;
  createdAt?: string;
}

export default function ChatPage() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load assignments
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await api.getGuardAssignments(user.uid);
        const active = data.filter((a: any) => {
          const isStatusOk = ['approved', 'checked_in'].includes(a.status);
          const isLeader = a.assignmentRole && a.assignmentRole !== 'Segurança';
          return isStatusOk && isLeader;
        });
        setAssignments(active);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingJobs(false);
      }
    };
    load();
  }, [user]);

  // Load messages for selected job
  useEffect(() => {
    if (!selectedJob) return;
    const load = async () => {
      try {
        const msgs = await api.listMessages(selectedJob);
        setMessages(msgs || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [selectedJob]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !user || !selectedJob) return;
    setSending(true);
    try {
      await api.sendMessage({
        jobId: selectedJob,
        senderId: user.uid,
        senderName: userData?.name || 'Vigilante',
        senderRole: 'guard',
        text: text.trim(),
      });
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Job list view
  if (!selectedJob) {
    return (
      <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
        <div className="safe-top" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={22} color="#3b82f6" /> Chat
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
            Comunicação por escala
          </p>
        </div>

        {loadingJobs ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        ) : assignments.length === 0 ? (
          <div style={{
            padding: '48px 16px', textAlign: 'center', borderRadius: 16,
            border: '1px dashed var(--color-border)',
          }}>
            <MessageSquare size={36} style={{ margin: '0 auto 12px', color: '#475569' }} />
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>Relatórios Fechados</h1>
            <p style={{ fontSize: 13, color: '#64748b', padding: '0 10px', lineHeight: 1.5 }}>O Chat Operacional é restrito aos cargos de Liderança (Supervisores, Inspetores). As contingências normais de Segurança base devem ser reportadas usando a aba <b>Ações de Emergência (SOS)</b>.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assignments.map((a) => (
              <button
                key={a.id || a.jobId}
                onClick={() => setSelectedJob(a.jobId)}
                style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: 14, padding: 16, textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{a.jobName || a.clientName || 'Escala'}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: 99,
                      background: a.status === 'checked_in' ? '#22c55e' : '#3b82f6',
                    }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {a.status === 'checked_in' ? 'Em serviço' : 'Confirmada'}
                    </span>
                  </div>
                </div>
                <MessageSquare size={18} color="#64748b" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Chat view
  const currentAssignment = assignments.find(a => a.jobId === selectedJob);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header */}
      <div className="safe-top" style={{
        padding: '12px 16px', background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => setSelectedJob(null)} style={{ padding: 4 }}>
          <ArrowLeft size={20} color="#94a3b8" />
        </button>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800 }}>
            {currentAssignment?.jobName || currentAssignment?.clientName || 'Chat'}
          </p>
          <p style={{ fontSize: 10, color: '#64748b' }}>Escala ativa</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#475569' }}>Nenhuma mensagem ainda.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.senderId === user?.uid;
          return (
            <div key={i} style={{
              alignSelf: isMine ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}>
              {!isMine && (
                <p style={{
                  fontSize: 10, fontWeight: 700, color: '#64748b',
                  marginBottom: 2, marginLeft: 8,
                }}>
                  {msg.senderName}
                </p>
              )}
              <div style={{
                padding: '10px 14px', borderRadius: 14,
                background: isMine ? '#3b82f6' : 'var(--color-surface)',
                color: isMine ? 'white' : 'var(--color-text)',
                border: isMine ? 'none' : '1px solid var(--color-border)',
                borderBottomRightRadius: isMine ? 4 : 14,
                borderBottomLeftRadius: isMine ? 14 : 4,
              }}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="" style={{
                    width: '100%', borderRadius: 8, marginBottom: 6,
                  }} />
                )}
                <p style={{ fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>{msg.text}</p>
                <p style={{
                  fontSize: 9, color: isMine ? 'rgba(255,255,255,0.6)' : '#475569',
                  textAlign: 'right', marginTop: 4,
                }}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit', minute: '2-digit',
                  }) : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="safe-bottom" style={{
        padding: '8px 12px', background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Mensagem..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 14,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--color-border)',
            color: 'white', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: 14,
            background: text.trim() ? '#3b82f6' : 'var(--color-surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" color="white" />
          ) : (
            <Send size={18} color="white" />
          )}
        </button>
      </div>
    </div>
  );
}
