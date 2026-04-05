'use client';

import React from 'react';
import { Search, Bell, Settings, Globe } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();

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
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title={t('header.notifications')}>
          <Bell className="size-5" />
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
        
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

        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title={t('header.settings')}>
          <Settings className="size-5" />
        </button>
      </div>
    </header>
  );
}
