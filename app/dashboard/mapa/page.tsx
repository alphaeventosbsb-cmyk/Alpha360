'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Users, MapPin, AlertTriangle, Filter, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';

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

  useEffect(() => {
    if (!user) return;

    // Guards with location
    const guardsQuery = query(
      collection(db, 'users'),
      where('companyId', '==', userData?.companyId || ''),
      where('role', '==', 'guard')
    );
    const unsubGuards = onSnapshot(guardsQuery, (snapshot) => {
      const data = snapshot.docs
        .filter(d => d.data().lat && d.data().lng)
        .map(d => ({ id: d.id, ...d.data() }));
      setGuards(data);
    });

    // Active jobs with location
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('companyId', '==', userData?.companyId || ''),
      where('status', 'in', ['open', 'filled', 'in_progress'])
    );
    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(data);
    });

    // Recent alerts
    const alertsQuery = query(
      collection(db, 'alerts'),
      where('companyId', '==', userData?.companyId || ''),
      where('status', 'in', ['active', 'dispatching']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const data = snapshot.docs
        .filter(d => d.data().lat && d.data().lng)
        .map(d => ({ id: d.id, ...d.data() }));
      setAlerts(data);
    });

    // Sites (postos) with location for geofence
    const sitesQuery = query(
      collection(db, 'sites'),
      where('companyId', '==', userData?.companyId || '')
    );
    const unsubSites = onSnapshot(sitesQuery, (snapshot) => {
      const data = snapshot.docs
        .filter(d => d.data().lat && d.data().lng)
        .map(d => ({ id: d.id, ...d.data() }));
      setSites(data);
    });

    return () => {
      unsubGuards();
      unsubJobs();
      unsubAlerts();
      unsubSites();
    };
  }, [user]);

  const filteredGuards = filter === 'events' || filter === 'alerts' || filter === 'sites' ? [] : guards;
  const filteredEvents = filter === 'guards' || filter === 'alerts' || filter === 'sites' ? [] : events;
  const filteredAlerts = filter === 'guards' || filter === 'events' || filter === 'sites' ? [] : alerts;
  const filteredSites = filter === 'guards' || filter === 'events' || filter === 'alerts' ? [] : sites;

  const activeGuards = guards.filter(g => g.status === 'Ativo' || g.status === 'On Duty');
  const sosActive = alerts.some(a => a.type === 'sos' && a.status === 'active');

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
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Users className="size-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{activeGuards.length}</p>
            <p className="text-xs text-slate-500">Guardas Ativos</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MapPin className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{events.length}</p>
            <p className="text-xs text-slate-500">Escalas Ativas</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Building2 className="size-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{sites.length}</p>
            <p className="text-xs text-slate-500">Postos</p>
          </div>
        </div>
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          sosActive ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-slate-200'
        }`}>
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

      {/* Map */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-[550px] relative">
          <LiveMap
            events={filteredEvents}
            guards={filteredGuards}
            alerts={filteredAlerts}
            sites={filteredSites}
            sosActive={sosActive}
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
      </div>
    </div>
  );
}
