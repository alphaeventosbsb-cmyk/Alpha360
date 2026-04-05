'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const blueIcon = createIcon('blue');   // Eventos / Vagas
const greenIcon = createIcon('green'); // Seguranças
const redIcon = createIcon('red');     // SOS / Alarmes
const orangeIcon = createIcon('orange'); // Postos/Sites
const violetIcon = createIcon('violet'); // Guardas em alerta

// Component to handle map centering
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

interface LiveMapProps {
  events: any[];
  guards: any[];
  alerts: any[];
  sites?: any[];
  sosActive?: boolean;
  selectedLocation?: [number, number] | null;
}

export default function LiveMap({ events, guards, alerts, sites = [], sosActive = false, selectedLocation = null }: LiveMapProps) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  
  // Default center: Brasília
  const defaultCenter: [number, number] = [-15.7975, -47.8919];
  const defaultZoom = 11;

  // Auto-center when an item is selected from the list
  useEffect(() => {
    if (selectedLocation) {
      setCenter(selectedLocation);
    }
  }, [selectedLocation]);

  // Auto-center on SOS when it arrives
  useEffect(() => {
    if (sosActive && alerts.length > 0) {
      const sosAlert = alerts.find(a => a.type === 'sos' && a.status === 'active');
      if (sosAlert?.lat && sosAlert?.lng) {
        setCenter([sosAlert.lat, sosAlert.lng]);
      }
    }
  }, [sosActive, alerts]);

  // Check which sites have active SOS alerts near them
  const sitesWithSOS = new Set<string>();
  alerts.forEach(alert => {
    if (alert.type === 'sos' && alert.status !== 'resolved' && alert.jobId) {
      // Find the event/job for this alert
      const event = events.find(e => e.id === alert.jobId);
      if (event?.siteId) {
        sitesWithSOS.add(event.siteId);
      }
    }
  });

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={center} />

        {/* Render Geofence Circles for Sites */}
        {sites.map((site, idx) => {
          if (!site.lat || !site.lng) return null;
          const radius = site.geofenceRadius || 200;
          const hasSOS = sitesWithSOS.has(site.id);

          return (
            <React.Fragment key={`site-fence-${site.id || idx}`}>
              <Circle
                center={[site.lat, site.lng]}
                radius={radius}
                pathOptions={{
                  color: hasSOS ? '#ef4444' : '#22c55e',
                  fillColor: hasSOS ? '#ef4444' : '#22c55e',
                  fillOpacity: hasSOS ? 0.15 : 0.08,
                  weight: 2,
                  dashArray: hasSOS ? undefined : '8 4',
                }}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-bold text-sm">{site.name || 'Posto'}</div>
                    <div className="text-xs text-slate-500">{site.address || ''}</div>
                    <div className="text-xs text-slate-400 mt-1">Raio: {radius}m</div>
                    {hasSOS && (
                      <div className="text-xs text-red-600 font-bold mt-1">⚠️ SOS ATIVO</div>
                    )}
                  </div>
                </Popup>
              </Circle>
              <Marker
                position={[site.lat, site.lng]}
                icon={hasSOS ? redIcon : orangeIcon}
                eventHandlers={{
                  click: () => setCenter([site.lat, site.lng])
                }}
              >
                <Popup>
                  <div>
                    <div className="font-bold text-sm">📍 {site.name || 'Posto'}</div>
                    <div className="text-xs text-slate-500">{site.address || ''}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Guardas: {site.guardsAssigned || 0} • Raio: {radius}m
                    </div>
                    <div className="text-xs mt-1">
                      <span className={`font-bold ${site.status === 'Ativo' ? 'text-green-600' : 'text-slate-400'}`}>
                        {site.status || 'Ativo'}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Render Events (Blue) */}
        {events.map((event, idx) => {
          if (!event.lat || !event.lng) return null;
          return (
            <Marker 
              key={`event-${event.id || idx}`} 
              position={[event.lat, event.lng]} 
              icon={blueIcon}
              eventHandlers={{
                click: () => setCenter([event.lat, event.lng])
              }}
            >
              <Popup>
                <div>
                  <div className="font-bold text-sm">📋 {event.clientName || event.title || 'Escala'}</div>
                  <div className="text-xs text-slate-500">{event.location}</div>
                  {event.date && (
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(event.date).toLocaleDateString('pt-BR')} • {event.startTime || ''} - {event.endTime || ''}
                    </div>
                  )}
                  <div className="text-xs mt-1">
                    <span className={`font-bold ${
                      event.status === 'in_progress' ? 'text-green-600' :
                      event.status === 'filled' ? 'text-blue-600' :
                      'text-amber-600'
                    }`}>
                      {event.status === 'in_progress' ? 'Em Andamento' :
                       event.status === 'filled' ? 'Confirmada' :
                       event.status === 'open' ? 'Aberta' : event.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Guards (Green) */}
        {guards.map((guard, idx) => {
          if (!guard.lat || !guard.lng) return null;
          const isAlert = guard.alertStatus === 'sos' || guard.status === 'SOS';
          return (
            <Marker 
              key={`guard-${guard.id || idx}`} 
              position={[guard.lat, guard.lng]} 
              icon={isAlert ? violetIcon : greenIcon}
              eventHandlers={{
                click: () => setCenter([guard.lat, guard.lng])
              }}
            >
              <Popup>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {guard.photoUrl && (
                      <img src={guard.photoUrl} alt="" className="size-8 rounded-full object-cover" />
                    )}
                    <div>
                      <div className="font-bold text-sm">🛡️ {guard.name}</div>
                      {guard.rank && (
                        <div className="text-[10px] text-amber-600 font-bold">{guard.rank}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Status: <span className={`font-bold ${
                      guard.status === 'Ativo' || guard.status === 'On Duty' ? 'text-green-600' : 'text-slate-400'
                    }`}>{guard.status || 'Em patrulha'}</span>
                  </div>
                  {guard.lastLocationUpdate && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Atualizado: {new Date(guard.lastLocationUpdate).toLocaleTimeString('pt-BR')}
                    </div>
                  )}
                  {guard.phone && (
                    <a href={`tel:${guard.phone}`} className="text-[10px] text-blue-600 font-bold mt-1 block">
                      📞 {guard.phone}
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Alerts/SOS (Red) */}
        {alerts.map((alert, idx) => {
          if (!alert.lat || !alert.lng) return null;
          const isSOS = alert.type === 'sos' && alert.status !== 'resolved';
          return (
            <React.Fragment key={`alert-${alert.id || idx}`}>
              {/* Pulsing circle for SOS */}
              {isSOS && (
                <Circle
                  center={[alert.lat, alert.lng]}
                  radius={50}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.3,
                    weight: 3,
                  }}
                />
              )}
              <Marker 
                position={[alert.lat, alert.lng]} 
                icon={redIcon}
                eventHandlers={{
                  click: () => setCenter([alert.lat, alert.lng])
                }}
              >
                <Popup>
                  <div>
                    <div className="font-bold text-sm text-red-600">
                      {alert.type === 'sos' ? '🆘 SOS EMERGÊNCIA' :
                       alert.type === 'relief' ? '🚻 Rendição' :
                       alert.type === 'hydration' ? '💧 Hidratação' :
                       `⚠️ ${alert.type}`}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{alert.message}</div>
                    {alert.guardName && (
                      <div className="text-xs text-slate-500 mt-1">Guarda: {alert.guardName}</div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1">
                      {alert.createdAt?.toDate ? 
                        alert.createdAt.toDate().toLocaleString('pt-BR') : 
                        new Date(alert.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
