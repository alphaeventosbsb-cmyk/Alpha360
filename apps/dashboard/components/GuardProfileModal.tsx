'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Phone, User, Ruler, FileText, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserData } from '@/lib/types';
import { api } from '@/services/api';

interface GuardProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  guard: UserData | null;
  companyId: string;
}

export function GuardProfileModal({ isOpen, onClose, guard, companyId }: GuardProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'rating'>('info');
  const [note, setNote] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (isOpen && guard && companyId && activeTab === 'notes') {
      const fetchNote = async () => {
        setLoadingNote(true);
        try {
          const res = await api.get<any>(`/api/guards/${guard.id}/notes?companyId=${companyId}`);
          setNote(res?.note || '');
        } catch (error) {
          console.error('Error fetching note:', error);
        } finally {
          setLoadingNote(false);
        }
      };
      fetchNote();
    }
  }, [isOpen, guard, companyId, activeTab]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('info');
      setRating(5);
      setRatingComment('');
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen || !guard) return null;

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await api.post(`/api/guards/${guard.id!}/notes`, { companyId, note });
      alert('Anotação interna salva com sucesso!');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Erro ao salvar anotação.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSubmitRating = async () => {
    setSubmittingRating(true);
    try {
      await api.rateGuard({
        guardId: guard.id!,
        jobId: 'direct',
        assignmentId: 'direct',
        rating,
        comment: ratingComment,
      });
      alert('Avaliação enviada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error rating guard:', error);
      alert('Erro ao enviar avaliação.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const FieldInfo = ({ label, value }: { label: string, value?: string | number | null }) => (
    <div className="mb-2">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value || '-'}</p>
    </div>
  );

  const FileBtn = ({ label, url }: { label: string, url?: string }) => {
    if (!url) return null;
    return (
      <a 
        href={url} 
        onClick={(e) => {
          e.preventDefault();
          window.open(url, '_blank', 'noopener,noreferrer');
        }}
        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group bg-white cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-blue-500 group-hover:text-blue-600" />
          <span className="text-xs font-bold text-slate-700">{label}</span>
        </div>
      </a>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#192c4d] text-white shrink-0">
            <h3 className="text-lg font-bold">Perfil do Segurança</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="size-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 pb-6 custom-scrollbar">
            {/* Profile Overview */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="size-20 rounded-full bg-slate-200 border-4 border-white shadow-sm flex items-center justify-center text-[#192c4d] font-bold text-2xl overflow-hidden">
                  {guard.photoUrl ? (
                    <img src={guard.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (guard.name || 'G').substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-black uppercase text-[#192c4d] shadow-sm whitespace-nowrap">
                  {guard.rank || 'Júnior'}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black text-slate-900 leading-tight">{guard.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-sm font-bold text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                    <Star className="size-3.5 fill-current" />
                    {guard.averageRating?.toFixed(1) || '-'} 
                    <span className="text-xs text-yellow-600 font-medium ml-1">({guard.totalRatings || 0})</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <span className="shrink-0 size-2 rounded-full bg-slate-300" />
                    {guard.status || 'Ativo'}
                  </span>
                  {guard.profileCompleted && (
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200 ml-2">
                       ✅ Ficha Trancada
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-2 shrink-0">
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-3 text-xs font-black uppercase transition-colors border-b-2 ${activeTab === 'info' ? 'border-[#192c4d] text-[#192c4d]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Informações Completas
              </button>
              <button 
                onClick={() => setActiveTab('notes')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase transition-colors border-b-2 ${activeTab === 'notes' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <FileText className="size-3.5" /> Notas Internas
              </button>
              <button 
                onClick={() => setActiveTab('rating')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase transition-colors border-b-2 ${activeTab === 'rating' ? 'border-yellow-400 text-yellow-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <Star className="size-3.5" /> Avaliar
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                
                {/* INFO TAB */}
                {activeTab === 'info' && (
                  <motion.div key="info" initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:10}} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Coluna 1 - Pessoais */}
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Dados Pessoais & Endereço</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FieldInfo label="Celular Principal" value={guard.phone} />
                          <FieldInfo label="Nascimento" value={guard.birthDate && new Date(guard.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} />
                          <FieldInfo label="Naturalidade" value={guard.birthPlace} />
                          <FieldInfo label="Sexo" value={guard.gender} />
                          <FieldInfo label="CEP" value={guard.cep} />
                        </div>
                        <FieldInfo label="Endereço Completo" value={guard.addressComplete || guard.address} />
                        <FieldInfo label="Mãe" value={guard.motherName} />
                        <FieldInfo label="Pai" value={guard.fatherName} />
                        <div className="grid grid-cols-2 gap-4">
                          <FieldInfo label="Peso" value={guard.weight ? `${guard.weight} kg` : '-'} />
                          <FieldInfo label="Altura" value={guard.height ? `${guard.height} cm` : '-'} />
                        </div>
                      </div>

                      {/* Coluna 2 - Documentação */}
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Emissões & Formação</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FieldInfo label="CPF" value={guard.cpf} />
                          <FieldInfo label="RG / Doc" value={guard.rg} />
                          <FieldInfo label="Órgão Emissor" value={guard.rgIssuer} />
                          <FieldInfo label="CTPS" value={guard.ctps} />
                          <FieldInfo label="PIS" value={guard.pis} />
                          <FieldInfo label="Título Eleitoral" value={guard.voterTitle} />
                          <FieldInfo label="Reservista/Sus" value={`${guard.militaryCertificate||'-'} / ${guard.susCard||'-'}`} />
                        </div>
                        
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <FieldInfo label="Registro ATA Vigilante" value={guard.courseRegistry} />
                          <div className="space-y-2 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <FileBtn label="Certificado Curso" url={guard.courseCertificateUrl} />
                            <FileBtn label="Comp. Residência" url={guard.addressProofUrl} />
                            <FileBtn label="Currículo PDF" url={guard.resumeUrl} />
                            <FileBtn label="Atestado Criminal" url={guard.criminalRecordUrl} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                  <motion.div key="notes" initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:10}} className="space-y-4 flex flex-col h-full">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs font-medium">
                      ⚠️ Estas anotações são <strong>confidenciais e exclusivas</strong> da sua empresa. O segurança não tem acesso a este texto.
                    </div>
                    
                    {loadingNote ? (
                      <div className="flex justify-center p-6"><Loader2 className="animate-spin size-6 text-amber-500" /></div>
                    ) : (
                      <>
                        <textarea 
                          className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-amber-500 transition-shadow text-sm"
                          placeholder="Ex: Ótimo desempenho no evento de Dezembro, lembrar de chamar para cobrir finais de semana..."
                          value={note}
                          onChange={e => setNote(e.target.value)}
                        />
                        <button 
                          disabled={savingNote}
                          onClick={handleSaveNote}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                        >
                          {savingNote ? <Loader2 className="animate-spin size-5" /> : <><Save className="size-4" /> Salvar Anotação</>}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {/* RATING TAB */}
                {activeTab === 'rating' && (
                  <motion.div key="rating" initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} exit={{opacity:0, x:10}} className="space-y-5">
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-600 mb-3">Qual a sua avaliação geral para este segurança?</p>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-2 rounded-xl transition-all ${star <= rating ? 'text-yellow-400 bg-yellow-50' : 'text-slate-300 hover:text-yellow-200'}`}
                          >
                            <Star className={`size-8 ${star <= rating ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Comentário Adicional</label>
                      <textarea 
                        className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow text-sm"
                        placeholder="Escreva um elogio ou observação construtiva (visível para o algoritmo da plataforma)..."
                        value={ratingComment}
                        onChange={e => setRatingComment(e.target.value)}
                      />
                    </div>

                    <button 
                      disabled={submittingRating}
                      onClick={handleSubmitRating}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                    >
                      {submittingRating ? <Loader2 className="animate-spin size-5" /> : <><Star className="size-4 fill-current" /> Enviar Avaliação</>}
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
