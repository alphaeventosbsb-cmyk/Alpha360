'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  title: string;
}

export function SiteModal({ isOpen, onClose, onSave, initialData, title }: SiteModalProps) {
  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    client: '',
    guardsAssigned: 0,
    status: 'Ativo',
    lastAudit: new Date().toLocaleDateString('pt-BR'),
    geofenceRadius: 200,
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        client: initialData.client || '',
        guardsAssigned: initialData.guardsAssigned || 0,
        status: initialData.status || 'Ativo',
        lastAudit: initialData.lastAudit || new Date().toLocaleDateString('pt-BR'),
        geofenceRadius: initialData.geofenceRadius || 200,
      });
    } else {
      setFormData({
        name: '',
        address: '',
        client: '',
        guardsAssigned: 0,
        status: 'Ativo',
        lastAudit: new Date().toLocaleDateString('pt-BR'),
        geofenceRadius: 200,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving site:', error);
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome do Posto</label>
              <input 
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                placeholder="Ex: Shopping Central"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
              <input 
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                placeholder="Endereço completo"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Cliente</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="Nome do contratante"
                  value={formData.client}
                  onChange={e => setFormData({...formData, client: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nº de Guardas</label>
                <input 
                  type="number"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  value={formData.guardsAssigned || ''}
                  onChange={e => setFormData({...formData, guardsAssigned: e.target.value ? parseInt(e.target.value) : 0})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option>Ativo</option>
                  <option>Manutenção</option>
                  <option>Inativo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Raio Geofence (m)</label>
                <input 
                  type="number"
                  min="50"
                  max="5000"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  value={formData.geofenceRadius}
                  onChange={e => setFormData({...formData, geofenceRadius: parseInt(e.target.value) || 200})}
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#192c4d] text-white rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-[#192c4d]/20 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
