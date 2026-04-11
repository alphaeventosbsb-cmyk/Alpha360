'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
};

// Default center: Brasília
const defaultCenter = { lat: -15.7975, lng: -47.8919 };
const defaultZoom = 11;

// Custom marker SVG generators for colored pins
function pinSvg(color: string, glyph: string = ''): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="8" fill="#fff" opacity="0.9"/>
      <text x="16" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">${glyph}</text>
    </svg>
  `)}`;
}

const bluePin = pinSvg('#3B82F6', '📋');
const greenPin = pinSvg('#22C55E', '🛡');
const redPin = pinSvg('#EF4444', '🆘');
const orangePin = pinSvg('#F97316', '📍');
const violetPin = pinSvg('#8B5CF6', '⚠');

// Dark-themed map style for premium look
const mapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

interface LiveMapProps {
  events: any[];
  guards: any[];
  alerts: any[];
  sites?: any[];
  sosActive?: boolean;
  selectedLocation?: [number, number] | null;
  onRespondAlert?: (alert: any) => void;
}

export default function LiveMap({ events, guards, alerts, sites = [], sosActive = false, selectedLocation = null, onRespondAlert }: LiveMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    mapRef.current = null;
  }, []);

  // Pan to selected location
  useEffect(() => {
    if (mapRef.current && selectedLocation) {
      mapRef.current.panTo({ lat: selectedLocation[0], lng: selectedLocation[1] });
      mapRef.current.setZoom(15);
    }
  }, [selectedLocation]);

  // Auto-center on SOS when it arrives
  useEffect(() => {
    if (mapRef.current && sosActive && alerts.length > 0) {
      const sosAlert = alerts.find(a => a.type === 'sos' && a.status === 'active');
      if (sosAlert?.lat && sosAlert?.lng) {
        mapRef.current.panTo({ lat: sosAlert.lat, lng: sosAlert.lng });
        mapRef.current.setZoom(15);
      }
    }
  }, [sosActive, alerts]);

  // Check which sites have active SOS alerts near them
  const sitesWithSOS = new Set<string>();
  alerts.forEach(alert => {
    if (alert.type === 'sos' && alert.status !== 'resolved' && alert.jobId) {
      const event = events.find(e => e.id === alert.jobId);
      if (event?.siteId) {
        sitesWithSOS.add(event.siteId);
      }
    }
  });

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-red-600 font-bold">Erro ao carregar Google Maps</p>
          <p className="text-xs text-slate-500 mt-1">Verifique a API Key</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="w-8 h-8 border-3 border-[#192c4d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative z-0">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
        }}
      >
        {/* Geofence Circles for Sites */}
        {sites.map((site, idx) => {
          if (!site.lat || !site.lng) return null;
          const radius = site.geofenceRadius || 200;
          const hasSOS = sitesWithSOS.has(site.id);

          return (
            <React.Fragment key={`site-fence-${site.id || idx}`}>
              <Circle
                center={{ lat: site.lat, lng: site.lng }}
                radius={radius}
                options={{
                  strokeColor: hasSOS ? '#ef4444' : '#22c55e',
                  strokeWeight: 2,
                  strokeOpacity: 0.8,
                  fillColor: hasSOS ? '#ef4444' : '#22c55e',
                  fillOpacity: hasSOS ? 0.15 : 0.08,
                  ...(hasSOS ? {} : { strokeDashArray: '8 4' }),
                }}
              />
              <Marker
                position={{ lat: site.lat, lng: site.lng }}
                icon={{
                  url: hasSOS ? redPin : orangePin,
                  scaledSize: new google.maps.Size(32, 42),
                }}
                onClick={() => setActiveInfoWindow(`site-${site.id || idx}`)}
              >
                {activeInfoWindow === `site-${site.id || idx}` && (
                  <InfoWindow 
                    position={{ lat: site.lat, lng: site.lng }}
                    onCloseClick={() => setActiveInfoWindow(null)}
                  >
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
                      {hasSOS && (
                        <div className="text-xs text-red-600 font-bold mt-1">⚠️ SOS ATIVO</div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Events / Escalas (Blue) */}
        {events.map((event, idx) => {
          if (!event.lat || !event.lng) return null;
          return (
            <Marker
              key={`event-${event.id || idx}`}
              position={{ lat: event.lat, lng: event.lng }}
              icon={{
                url: bluePin,
                scaledSize: new google.maps.Size(32, 42),
              }}
              onClick={() => setActiveInfoWindow(`event-${event.id || idx}`)}
            >
              {activeInfoWindow === `event-${event.id || idx}` && (
                <InfoWindow 
                  position={{ lat: event.lat, lng: event.lng }}
                  onCloseClick={() => setActiveInfoWindow(null)}
                >
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
                </InfoWindow>
              )}
            </Marker>
          );
        })}

        {/* Guards (Green) */}
        {guards.map((guard, idx) => {
          if (!guard.lat || !guard.lng) return null;
          const isAlert = guard.alertStatus === 'sos' || guard.status === 'SOS';
          return (
            <Marker
              key={`guard-${guard.id || idx}`}
              position={{ lat: guard.lat, lng: guard.lng }}
              icon={{
                url: isAlert ? violetPin : greenPin,
                scaledSize: new google.maps.Size(32, 42),
              }}
              onClick={() => setActiveInfoWindow(`guard-${guard.id || idx}`)}
            >
              {activeInfoWindow === `guard-${guard.id || idx}` && (
                <InfoWindow 
                  position={{ lat: guard.lat, lng: guard.lng }}
                  onCloseClick={() => setActiveInfoWindow(null)}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {guard.photoUrl && (
                        <img src={guard.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
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
                </InfoWindow>
              )}
            </Marker>
          );
        })}

        {/* Alerts / SOS (Red) */}
        {alerts.map((alert, idx) => {
          if (!alert.lat || !alert.lng) return null;
          const isSOS = alert.type === 'sos' && alert.status !== 'resolved';
          return (
            <React.Fragment key={`alert-${alert.id || idx}`}>
              {/* Pulsing circle for SOS */}
              {isSOS && (
                <Circle
                  center={{ lat: alert.lat, lng: alert.lng }}
                  radius={50}
                  options={{
                    strokeColor: '#ef4444',
                    strokeWeight: 3,
                    fillColor: '#ef4444',
                    fillOpacity: 0.3,
                  }}
                />
              )}
              <Marker
                position={{ lat: alert.lat, lng: alert.lng }}
                icon={{
                  url: redPin,
                  scaledSize: new google.maps.Size(32, 42),
                }}
                onClick={() => setActiveInfoWindow(`alert-${alert.id || idx}`)}
              >
                {activeInfoWindow === `alert-${alert.id || idx}` && (
                  <InfoWindow 
                    position={{ lat: alert.lat, lng: alert.lng }}
                    onCloseClick={() => setActiveInfoWindow(null)}
                  >
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
                      {alert.status === 'active' && onRespondAlert && (
                        <button 
                          onClick={() => onRespondAlert(alert)}
                          className="mt-3 w-full bg-[#192c4d] hover:bg-black text-white text-xs font-bold py-1.5 rounded-md transition-colors"
                        >
                          Mandar Reforço / Avisar que viu
                        </button>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            </React.Fragment>
          );
        })}
      </GoogleMap>
    </div>
  );
}
