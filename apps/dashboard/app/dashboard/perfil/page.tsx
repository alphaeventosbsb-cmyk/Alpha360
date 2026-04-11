'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Star, Save, Loader2, Camera, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';

export default function PerfilPage() {
  const { user, userData, refreshUserData } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const isLocked = userData?.profileCompleted === true;
  const [form, setForm] = useState({
    name: '', phone: '', cpf: '', rg: '', address: '', age: '', height: '',
    pixKey: '', pixKeyType: 'cpf' as 'cpf' | 'email' | 'phone' | 'random',
  });

  useEffect(() => {
    if (userData) {
      setForm({
        name: userData.name || '',
        phone: userData.phone || '',
        cpf: userData.cpf || '',
        rg: userData.rg || '',
        address: userData.address || '',
        age: String(userData.age || ''),
        height: String(userData.height || ''),
        pixKey: userData.pixKey || '',
        pixKeyType: userData.pixKeyType || 'cpf',
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.updateUser(user.uid, {
        name: form.name,
        phone: form.phone,
        cpf: form.cpf,
        rg: form.rg,
        address: form.address,
        age: form.age,
        height: form.height,
        pixKey: form.pixKey,
        pixKeyType: form.pixKeyType,
        profileCompleted: true,
      });
      await refreshUserData();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(`Erro ao salvar perfil: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      // Compress and convert to base64
      const base64Data = await compressImageToBase64(file);
      await api.updateUser(user.uid, { photoUrl: base64Data } as any);
      await refreshUserData();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(`Erro ao fazer upload da foto: ${error.message || error}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Meu Perfil</h2>
        <p className="text-slate-500 text-sm">Gerencie suas informações pessoais e dados de pagamento.</p>
      </div>

      {/* Photo + Basic Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="size-20 rounded-full bg-[#192c4d]/10 flex items-center justify-center text-2xl font-bold text-[#192c4d] overflow-hidden">
              {userData?.photoUrl ? (
                <img src={userData.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                (userData?.name || 'U').substring(0, 2).toUpperCase()
              )}
            </div>
            <label className={`absolute bottom-0 right-0 size-7 ${uploadingPhoto ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#192c4d] cursor-pointer hover:bg-[#192c4d]/80'} text-white rounded-full flex items-center justify-center transition-colors shadow-lg`}>
              {uploadingPhoto ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
              <input type="file" accept="image/*" capture="user" className="hidden" disabled={uploadingPhoto} onChange={handlePhotoUpload} />
            </label>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{userData?.name}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#192c4d]/10 text-[#192c4d] uppercase">
                {userData?.role === 'guard' ? 'Vigilante' : userData?.role}
              </span>
              {userData?.rank && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {userData.rank}
                </span>
              )}
              {userData?.averageRating && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-0.5">
                  <Star className="size-3" /> {userData.averageRating} ({userData.totalRatings})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><User className="size-3" /> Nome Completo</label>
            <input disabled={saving || isLocked} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none disabled:bg-slate-100 disabled:text-slate-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Phone className="size-3" /> Telefone</label>
            <input disabled={saving || isLocked} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none disabled:bg-slate-100 disabled:text-slate-500" placeholder="(11) 99999-0000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">CPF</label>
            <input disabled={saving || isLocked} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none disabled:bg-slate-100 disabled:text-slate-500" placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">RG</label>
            <input disabled={saving || isLocked} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none disabled:bg-slate-100 disabled:text-slate-500" value={form.rg} onChange={e => setForm({...form, rg: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Idade</label>
            <input disabled={saving || isLocked} type="number" min="16" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none disabled:bg-slate-100 disabled:text-slate-500" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Altura (cm)</label>
            <input disabled={saving || isLocked} type="number" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none disabled:bg-slate-100 disabled:text-slate-500" value={form.height} onChange={e => setForm({...form, height: e.target.value})} />
          </div>
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin className="size-3" /> Endereço</label>
            <input disabled={saving || isLocked} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none disabled:bg-slate-100 disabled:text-slate-500" placeholder="Rua, número, bairro, cidade" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          </div>
        </div>
      </div>

      {/* PIX */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <CreditCard className="size-4 text-green-600" /> Dados PIX para Pagamento
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Chave</label>
            <select disabled={saving || isLocked} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" value={form.pixKeyType} onChange={e => setForm({...form, pixKeyType: e.target.value as any})}>
              <option value="cpf">CPF</option>
              <option value="email">Email</option>
              <option value="phone">Telefone</option>
              <option value="random">Aleatória</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Chave PIX</label>
            <input disabled={saving || isLocked} className="w-full px-4 py-2.5 rounded-lg border border-green-200 bg-green-50 text-green-700 font-medium focus:ring-2 focus:ring-green-500 outline-none disabled:bg-slate-100 disabled:text-slate-500" placeholder="Sua chave PIX" value={form.pixKey} onChange={e => setForm({...form, pixKey: e.target.value})} />
          </div>
        </div>
      </div>

      {/* Save */}
      {!isLocked ? (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#192c4d] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#192c4d]/90 transition-all shadow-lg shadow-[#192c4d]/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-5 animate-spin" /> : saved ? <><CheckCircle className="size-5" /> Salvo!</> : <><Save className="size-5" /> Salvar Perfil</>}
        </button>
      ) : (
        <div className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200">
          <Shield className="size-5" /> Perfil Bloqueado para Edição
        </div>
      )}
    </div>
  );
}

function CheckCircle(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}

// Utility to compress image and return Base64 string
async function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      const max_size = 600;
      if (width > height) {
        if (width > max_size) {
          height *= max_size / width;
          width = max_size;
        }
      } else {
        if (height > max_size) {
          width *= max_size / height;
          height = max_size;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas init failed'));
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get base64 string
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = url;
  });
}
