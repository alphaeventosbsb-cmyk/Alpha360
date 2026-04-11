'use client';

import React, { useState } from 'react';
import { Search, Bell, Settings, Globe, LogOut } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import Link from 'next/link';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [muted, setMuted] = useState(false);

  React.useEffect(() => {
    // Quick polling for topbar unread
    const fetchNotifs = async () => {
      try {
        const { api } = await import('@/services/api');
        const alerts = await api.listAlerts({ limit: 5 });
        setNotifications(alerts.filter(a => a.status === 'active' || a.status === 'dispatching'));
      } catch (e) {}
    };
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 10000);
    return () => clearInterval(iv);
  }, []);

  // Make muted state globally readable via localStorage for the map sirenes
  React.useEffect(() => {
    localStorage.setItem('alpha360_muted', muted ? '1' : '0');
  }, [muted]);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-md">
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#192c4d]/20 outline-none" 
            placeholder={t('header.search')} 
            type="text"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" 
            title="Notificações & Áudio"
          >
            <Bell className="size-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden" style={{ zIndex: 9999 }}>
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 text-[#192c4d]">
                <span className="font-bold text-sm">Notificações Táticas</span>
                <button 
                  onClick={() => setMuted(!muted)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg ${muted ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-[#192c4d]'}`}
                >
                  {muted ? 'ÁUDIO MUTADO' : 'ÁUDIO LIGADO'}
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">Nenhum alerta ativo.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                      <p className="text-[10px] font-bold text-red-600 mb-1">⚠️ {n.type.toUpperCase()}</p>
                      <p className="text-sm font-bold text-slate-800">{n.guardName || n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button 
            onClick={() => setLanguage('pt-BR')}
            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${language === 'pt-BR' ? 'bg-white shadow-sm text-[#192c4d]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            PT-BR
          </button>
          <button 
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${language === 'en' ? 'bg-white shadow-sm text-[#192c4d]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            EN
          </button>
        </div>

        <Link href="/dashboard/perfil" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title={t('header.settings')}>
          <Settings className="size-5" />
        </Link>

        <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center" title="Sair da Conta">
          <LogOut className="size-5" />
        </button>
      </div>
    </header>
  );
}
