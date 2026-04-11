import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, User as UserIcon, FileText, CheckCircle2, AlertTriangle, Download, Link as LinkIcon, Camera } from 'lucide-react';
import { api } from '@/services/api';
import type { UserData } from '@/lib/types';

interface GuardAuditModalProps {
  guardId: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  processing?: boolean;
}

export function GuardAuditModal({ 
  guardId, 
  isOpen, 
  onClose,
  onApprove,
  onReject,
  processing 
}: GuardAuditModalProps) {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && guardId) {
      setLoading(true);
      api.getUser(guardId)
        .then(data => setProfile(data))
        .catch(err => console.error('Erro ao carregar perfil:', err))
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
    }
  }, [isOpen, guardId]);

  if (!isOpen) return null;

  const FieldInfo = ({ label, value }: { label: string, value?: string | number | null }) => (
    <div className="mb-3">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value || '-'}</p>
    </div>
  );

  const FileBtn = ({ label, url }: { label: string, url?: string }) => {
    if (!url) return null;
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noreferrer"
        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <FileText className="size-4" />
          </div>
          <span className="text-sm font-bold text-slate-700">{label}</span>
        </div>
        <Download className="size-4 text-slate-400 group-hover:text-blue-600" />
      </a>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Auditoria de Ficha</h2>
                <p className="text-xs text-slate-500 font-medium">Análise cadastral e documental</p>
              </div>
            </div>
            <button onClick={onClose} className="size-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
              <X className="size-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="size-8 animate-spin text-blue-600" />
                <p className="text-sm font-bold text-slate-500">Buscando dados na base...</p>
              </div>
            ) : !profile ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertTriangle className="size-10 text-amber-500 mb-4" />
                <p className="text-sm font-bold text-slate-900">Usuário não encontrado</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="size-32 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {profile.photoUrl ? (
                      <img src={profile.photoUrl} alt="Foto 3x4" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="size-10 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-black text-slate-900">{profile.name}</h3>
                      {profile.profileCompleted && (
                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="size-3" /> Ficha Trancada
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 font-medium mb-4">{profile.email} • {profile.phone || 'Sem telefone'}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                       <FieldInfo label="CPF" value={profile.cpf} />
                       <FieldInfo label="RG" value={profile.rg} />
                       <FieldInfo label="Expedidor" value={profile.rgIssuer} />
                    </div>
                  </div>
                </div>

                {/* Info Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Pessoais */}
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Dados Pessoais & Endereço</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldInfo label="Nascimento" value={profile.birthDate && new Date(profile.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} />
                      <FieldInfo label="Naturalidade" value={profile.birthPlace} />
                      <FieldInfo label="Sexo" value={profile.gender} />
                      <FieldInfo label="CEP" value={profile.cep} />
                    </div>
                    <FieldInfo label="Endereço Completo" value={profile.addressComplete} />
                    <FieldInfo label="Nome da Mãe" value={profile.motherName} />
                    <FieldInfo label="Nome do Pai" value={profile.fatherName} />
                    <div className="grid grid-cols-2 gap-4">
                      <FieldInfo label="Peso" value={profile.weight ? `${profile.weight} kg` : '-'} />
                      <FieldInfo label="Altura" value={profile.height ? `${profile.height} cm` : '-'} />
                    </div>
                  </div>

                  {/* Profissionais & Anexos */}
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Emissões & Formação</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldInfo label="CTPS" value={profile.ctps} />
                      <FieldInfo label="Série/UF" value={profile.ctpsSeries} />
                      <FieldInfo label="PIS" value={profile.pis} />
                      <FieldInfo label="Título Eleitoral" value={profile.voterTitle} />
                      <FieldInfo label="Reservista" value={profile.militaryCertificate} />
                      <FieldInfo label="Cartão SUS" value={profile.susCard} />
                    </div>
                    
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <FieldInfo label="Registro ATA Vigilante" value={profile.courseRegistry} />
                      <div className="space-y-3 mt-4">
                        <FileBtn label="Certificado do Curso" url={profile.courseCertificateUrl} />
                        <FileBtn label="Comprovante de Residência" url={profile.addressProofUrl} />
                        <FileBtn label="Currículo Profissional" url={profile.resumeUrl} />
                        <FileBtn label="Nada Consta Criminal" url={profile.criminalRecordUrl} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefícios */}
                {(profile.inssBenefits || profile.govBenefits) && (
                  <div>
                     <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Benefícios Sociais</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FieldInfo label="Benefício INSS" value={profile.inssBenefits} />
                       <FieldInfo label="Apoio Governamental" value={profile.govBenefits} />
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {(onApprove || onReject) && profile && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              {onReject && (
                <button
                  onClick={onReject}
                  disabled={processing}
                  className="flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-bold bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {processing ? <Loader2 className="size-5 animate-spin" /> : <X className="size-5" />}
                  Rejeitar
                </button>
              )}
              {onApprove && (
                <button
                  onClick={onApprove}
                  disabled={processing}
                  className="flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                >
                  {processing ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
                  Aprovar Para Escala
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
