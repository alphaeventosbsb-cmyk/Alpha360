'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, Users, ShieldAlert, Droplets, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any;
  title: string;
}

export function JobModal({ isOpen, onClose, onSave, initialData, title }: JobModalProps) {
  const { user, userData, companyId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    date: '',
    startTime: '',
    endTime: '',
    dailyRate: 0,
    guardsNeeded: 1,
    hasQRF: false,
    hasHydration: false,
    isPatrimonial: false,
    location: '',
    mapLink: '',
    description: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          clientName: initialData.clientName || '',
          date: initialData.date || '',
          startTime: initialData.startTime || '',
          endTime: initialData.endTime || '',
          dailyRate: initialData.dailyRate || 0,
          guardsNeeded: initialData.guardsNeeded || 1,
          hasQRF: initialData.hasQRF || false,
          hasHydration: initialData.hasHydration || false,
          isPatrimonial: initialData.isPatrimonial || false,
          location: initialData.location || '',
          mapLink: initialData.mapLink || '',
          description: initialData.description || '',
        });
      } else {
        setFormData({
          clientName: '',
          date: '',
          startTime: '',
          endTime: '',
          dailyRate: 0,
          guardsNeeded: 1,
          hasQRF: false,
          hasHydration: false,
          isPatrimonial: false,
          location: '',
          mapLink: '',
          description: '',
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const expiresAt = new Date(formData.date);
      expiresAt.setDate(expiresAt.getDate() + 1);

      if (initialData?.id) {
        await api.updateJob(initialData.id, {
          ...formData,
          guardsNeeded: formData.guardsNeeded || 1,
          dailyRate: formData.dailyRate || 0,
          qrExpiresAt: expiresAt.toISOString(),
        } as any);
      } else {
        await api.createJob({
          ...formData,
          companyId: companyId || '',
          contractorId: user.uid,
          status: 'open',
          guardsNeeded: formData.guardsNeeded || 1,
          dailyRate: formData.dailyRate || 0,
          hasQRF: formData.hasQRF,
          hasHydration: formData.hasHydration,
          isPatrimonial: formData.isPatrimonial,
          qrExpiresAt: expiresAt.toISOString(),
        } as any);
      }

      if (onSave) onSave(formData);

      // Reset form
      setFormData({
        clientName: '',
        date: '',
        startTime: '',
        endTime: '',
        dailyRate: 0,
        guardsNeeded: 1,
        hasQRF: false,
        hasHydration: false,
        isPatrimonial: false,
        location: '',
        mapLink: '',
        description: '',
      });
      onClose();
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Erro ao criar escala. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#192c4d] text-white">
            <h3 className="text-lg font-bold">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome do Cliente / Evento</label>
              <input 
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                placeholder="Ex: Shopping Central - Evento VIP"
                value={formData.clientName}
                onChange={e => setFormData({...formData, clientName: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Localização</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="Endereço completo"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <MapPin className="size-3" /> Link do Mapa (GPS)
                </label>
                <input 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="Link do Google Maps"
                  value={formData.mapLink}
                  onChange={e => setFormData({...formData, mapLink: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Calendar className="size-3" /> Dia
                </label>
                <input 
                  required
                  type="date"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <DollarSign className="size-3" /> Valor da Diária (R$)
                </label>
                <input 
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg border border-green-200 bg-green-50 text-green-700 font-bold focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0,00"
                  value={formData.dailyRate || ''}
                  onChange={e => setFormData({...formData, dailyRate: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Clock className="size-3" /> Hora Início
                </label>
                <input 
                  required type="time"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  value={formData.startTime}
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Clock className="size-3" /> Hora Término
                </label>
                <input 
                  required type="time"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  value={formData.endTime}
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Users className="size-3" /> Quantidade de Vigilantes
              </label>
              <input 
                required type="number" min="1"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                value={formData.guardsNeeded || ''}
                onChange={e => setFormData({...formData, guardsNeeded: parseInt(e.target.value) || 1})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Descrição (opcional)</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none resize-none"
                placeholder="Detalhes adicionais da escala..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox"
                  className="size-4 rounded text-[#192c4d] focus:ring-[#192c4d]"
                  checked={formData.hasQRF}
                  onChange={e => setFormData({...formData, hasQRF: e.target.checked})}
                />
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-orange-500" />
                  <span className="text-[11px] font-bold text-slate-700">Com QRF</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox"
                  className="size-4 rounded text-[#192c4d] focus:ring-[#192c4d]"
                  checked={formData.hasHydration}
                  onChange={e => setFormData({...formData, hasHydration: e.target.checked})}
                />
                <div className="flex items-center gap-2">
                  <Droplets className="size-4 text-blue-500" />
                  <span className="text-[11px] font-bold text-slate-700">Hidratação</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 border-dashed bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors">
                <input 
                  type="checkbox"
                  className="size-4 rounded text-amber-600 focus:ring-amber-600"
                  checked={formData.isPatrimonial}
                  onChange={e => setFormData({...formData, isPatrimonial: e.target.checked})}
                />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-amber-700">Escala Patrimonial (Ponto Celular)</span>
                </div>
              </label>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#192c4d] text-white rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-[#192c4d]/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : 'Criar Escala'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
