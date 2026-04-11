'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Users, MapPin, AlertTriangle, Filter, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';

const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-lg">
      <Loader2 className="size-8 text-[#192c4d] animate-spin" />
    </div>
  ),
});

export default function MapaPage() {
  const { user, userData } = useAuth();
  const [guards, setGuards] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'guards' | 'events' | 'alerts' | 'sites'>('all');

  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  const loadMapData = async () => {
    if (!user) return;
    try {
      const [guardsData, jobsData, alertsData, sitesData] = await Promise.all([
        api.listGuards(),
        api.listJobs(),
        api.listAlerts({ limit: 20 }),
        api.listSites(),
      ]);
      
      // Guards with active status and location
      setGuards(guardsData.filter((g: any) => 
        g.lat !== undefined && g.lng !== undefined && 
        (g.status === 'Ativo' || g.status === 'On Duty' || g.status === 'in_progress')
      ));
      
      // Active jobs
      setEvents(jobsData.filter((j: any) => ['open', 'filled', 'in_progress'].includes(j.status)));
      
      // Active alerts with location
      setAlerts(alertsData.filter((a: any) => 
        (a.status === 'active' || a.status === 'dispatching') && a.lat && a.lng
      ));
      
      // Sites with location
      setSites(sitesData.filter((s: any) => s.lat && s.lng));
    } catch (error) {
      console.error('Erro ao carregar dados do mapa:', error);
    }
  };

  useEffect(() => {
    loadMapData();
    const interval = setInterval(loadMapData, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const filteredGuards = filter === 'events' || filter === 'alerts' || filter === 'sites' ? [] : guards;
  const filteredEvents = filter === 'guards' || filter === 'alerts' || filter === 'sites' ? [] : events;
  const filteredAlerts = filter === 'guards' || filter === 'events' || filter === 'sites' ? [] : alerts;
  const filteredSites = filter === 'guards' || filter === 'events' || filter === 'alerts' ? [] : sites;

  const activeGuards = guards.filter(g => g.status === 'Ativo' || g.status === 'On Duty');
  const sosActive = alerts.some(a => a.type === 'sos' && a.status === 'active');

  useEffect(() => {
    const isMuted = localStorage.getItem('alpha360_muted') === '1';
    if (!isMuted && sosActive) {
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');
      audio.loop = true;
      audio.play().catch(e => console.log('Audio autoplay blocked', e));
      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [sosActive]);

  const handleRespondAlert = async (alertData: any) => {
    if (!user || !alertData) return;
    try {
      await api.updateAlert(alertData.id, { status: 'resolved' });

      if (alertData.jobId && alertData.guardId) {
        let messageText = 'Recebemos o seu chamado e estamos agindo.';
        if (alertData.type === 'sos') messageText = '🆘 EMERGÊNCIA RECEBIDA! Atenção: A base acaba de despachar reforços de Pronta Resposta para sua localização. Mantenha a vigilância e segurança no local.';
        else if (alertData.type === 'hydration') messageText = '💧 Alerta de Hidratação/Água recebido. Estamos enviando suporte hídrico.';
        else if (alertData.type === 'relief') messageText = '🚻 Pedido de Rendição (Pausa) recebido. Seu substituto está a caminho, aguarde no posto.';

        await api.sendMessage({
          jobId: alertData.jobId,
          senderId: user.uid,
          senderName: 'BASE OPERACIONAL',
          text: messageText,
        });
      }

      setAlerts(prev => prev.filter(a => a.id !== alertData.id));
      alert('Alerta respondido e normalizado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao responder alerta.');
    }
  };

  const renderSidebarList = () => {
    if (filter === 'all') return null;

    let items: any[] = [];
    let title = '';
    
    if (filter === 'guards') {
      items = activeGuards;
      title = 'Guardas Ativos';
    } else if (filter === 'events') {
      items = events.filter(e => e.status === 'in_progress' || e.status === 'filled');
      title = 'Escalas Confirmadas/Ativas';
    } else if (filter === 'sites') {
      items = sites;
      title = 'Postos Registrados';
    } else if (filter === 'alerts') {
      items = alerts;
      title = 'Alertas Ativos';
    }

    return (
      <div className="w-full lg:w-80 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[550px] shrink-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{items.length} itens encontrados na varredura.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-center text-slate-400 mt-4">Nenhum registro ativo.</p>
          )}
          {items.map((item, i) => {
            const hasLocation = item.lat !== undefined && item.lng !== undefined;
            return (
              <div 
                role="button"
                key={i} 
                onClick={() => {
                  if (hasLocation) setSelectedLocation([item.lat, item.lng])
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedLocation && hasLocation && selectedLocation[0] === item.lat 
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                    : hasLocation ? 'border-slate-200 bg-white hover:border-[#192c4d] hover:shadow-sm cursor-pointer' : 'border-dashed border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="font-bold text-sm text-slate-900">
                  {item.name || item.clientName || 'Alerta Ocorrido'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  {item.rank || item.location || item.address || item.message || 'Sem Localização Detalhada'}
                </div>
                {filter === 'guards' && (
                  <div className="text-[10px] text-green-600 font-bold mt-1.5">• {item.status}</div>
                )}
                {filter === 'alerts' && (
                  <>
                    <div className="text-[10px] text-red-600 font-bold mt-1.5 mb-2">⚠️ {item.type.toUpperCase()}</div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRespondAlert(item);
                      }}
                      className="w-full bg-[#192c4d] hover:bg-black text-white text-xs font-bold py-2 rounded-lg transition-colors mt-2 flex justify-center items-center gap-2"
                    >
                      Mandar Reforço / Avisar Posto
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mapa em Tempo Real</h2>
          <p className="text-slate-500 text-sm">Monitoramento tático de todas as operações.</p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'guards', 'events', 'sites', 'alerts'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-[#192c4d] text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'guards' ? 'Guardas' : f === 'events' ? 'Escalas' : f === 'sites' ? 'Postos' : 'Alertas'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter(filter === 'guards' ? 'all' : 'guards')}
          className={`bg-white p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${filter === 'guards' ? 'border-[#192c4d] ring-1 ring-[#192c4d]' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="p-2 bg-green-50 rounded-lg">
            <Users className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{activeGuards.length}</p>
            <p className="text-xs text-slate-500">Guardas Ativos</p>
          </div>
        </div>
        <div 
          onClick={() => setFilter(filter === 'events' ? 'all' : 'events')}
          className={`bg-white p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${filter === 'events' ? 'border-[#192c4d] ring-1 ring-[#192c4d]' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="p-2 bg-blue-50 rounded-lg">
            <MapPin className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{events.filter(e => e.status === 'in_progress' || e.status === 'filled').length}</p>
            <p className="text-xs text-slate-500">Escalas Ativas</p>
          </div>
        </div>
        <div 
          onClick={() => setFilter(filter === 'sites' ? 'all' : 'sites')}
          className={`bg-white p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${filter === 'sites' ? 'border-[#192c4d] ring-1 ring-[#192c4d]' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="p-2 bg-orange-50 rounded-lg">
            <Building2 className="size-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{sites.length}</p>
            <p className="text-xs text-slate-500">Postos</p>
          </div>
        </div>
        <div 
          onClick={() => setFilter(filter === 'alerts' ? 'all' : 'alerts')}
          className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
            filter === 'alerts' ? 'border-[#192c4d] ring-1 ring-[#192c4d]' : 
            sosActive ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`p-2 rounded-lg ${sosActive ? 'bg-red-100' : 'bg-red-50'}`}>
            <AlertTriangle className={`size-5 ${sosActive ? 'text-red-600' : 'text-red-600'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{alerts.length}</p>
            <p className={`text-xs ${sosActive ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
              {sosActive ? '🆘 SOS ATIVO' : 'Alertas Ativos'}
            </p>
          </div>
        </div>
      </div>

      {/* Map and Active List Array */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative h-[550px]">
          <LiveMap
            events={filteredEvents}
            guards={filteredGuards}
            alerts={filteredAlerts}
            sites={filteredSites}
            sosActive={sosActive}
            selectedLocation={selectedLocation}
            onRespondAlert={handleRespondAlert}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 p-3 rounded-xl border border-slate-200 backdrop-blur-sm text-[10px] z-[1000] shadow-lg">
            <p className="font-bold text-slate-700 mb-2">Legenda</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2"><span className="size-2.5 bg-green-500 rounded-full" /> Guarda Ativo</div>
              <div className="flex items-center gap-2"><span className="size-2.5 bg-blue-500 rounded-full" /> Escala / Evento</div>
              <div className="flex items-center gap-2"><span className="size-2.5 bg-orange-500 rounded-full" /> Posto</div>
              <div className="flex items-center gap-2"><span className="size-2.5 bg-red-500 rounded-full animate-pulse" /> Alerta / SOS</div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full border-2 border-green-400 border-dashed" /> Geofence
              </div>
            </div>
          </div>
        </div>
        
        {/* Active List Sidebar */}
        {renderSidebarList()}
      </div>
    </div>
  );
}
