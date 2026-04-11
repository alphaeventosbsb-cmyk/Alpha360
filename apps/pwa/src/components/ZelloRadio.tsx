import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Square, Play, Power, VolumeX, Volume2 } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ZelloRadio() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<{ id: string, name: string }[]>([
    { id: 'global', name: 'Canal Operacional (Global)' }
  ]);
  const [activeChannel, setActiveChannel] = useState('global');
  
  const [isPressing, setIsPressing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Am I allowed to speak?
  const [isReceiving, setIsReceiving] = useState(false); // Is someone else speaking?
  
  const [muted, setMuted] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  
  // Audio Queue for playback
  const audioQueue = useRef<string[]>([]);
  const isPlayingQueue = useRef(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // FX Sounds
  const fxBeep = useRef<HTMLAudioElement | null>(null);
  const fxStatic = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fxBeep.current = new Audio('https://actions.google.com/sounds/v1/communication/beep_short.ogg');
    fxStatic.current = new Audio('https://actions.google.com/sounds/v1/foley/radio_static.ogg');
  }, []);

  // Initialize Channels based on jobs
  useEffect(() => {
    if (!user) return;
    const fetchJobs = async () => {
      try {
        const assignments = await api.getGuardAssignments(user.uid, ['approved', 'checked_in']);
        const newChannels = [
          { id: 'global', name: 'Canal Operacional' },
          { id: 'lideranca', name: 'Canal Liderança' }
        ];
        assignments.forEach((a: any) => {
          if (a.jobId) newChannels.push({ id: a.jobId, name: `Escala: ${a.job?.location || a.jobId.slice(0,4)}` });
        });
        setChannels(newChannels);
      } catch (err) {}
    };
    fetchJobs();
  }, [user]);

  // Connect to Socket
  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join-channel', activeChannel);
    });

    s.on('disconnect', () => setIsConnected(false));

    s.on('speaker-started', (socketId) => {
      setIsReceiving(true);
      if (fxStatic.current && !muted) {
        fxStatic.current.volume = 0.2;
        fxStatic.current.play().catch(()=>{});
      }
    });

    s.on('speaker-stopped', () => {
      setIsReceiving(false);
    });

    s.on('audio-chunk', (chunk: ArrayBuffer) => {
      if (muted) return;
      const blob = new Blob([chunk], { type: 'audio/webm;codecs=opus' });
      audioQueue.current.push(URL.createObjectURL(blob));
      if (!isPlayingQueue.current) playNextInQueue();
    });

    return () => {
      s.disconnect();
    };
  }, [activeChannel, muted]);

  const changeChannel = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (socket && isConnected) {
      socket.emit('leave-channel', activeChannel);
      const newChan = e.target.value;
      setActiveChannel(newChan);
      socket.emit('join-channel', newChan);
    }
  };

  const playNextInQueue = () => {
    if (audioQueue.current.length === 0) {
      isPlayingQueue.current = false;
      return;
    }
    isPlayingQueue.current = true;
    const url = audioQueue.current.shift()!;
    const audio = new Audio(url);
    currentAudio.current = audio;
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      playNextInQueue();
    };
    audio.play().catch(e => {
      console.warn("Autoplay falhou", e);
      playNextInQueue();
    });
  };

  const startPTT = async () => {
    if (isReceiving || isPressing) return; // Cant speak while someone else is
    setIsPressing(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      socket?.emit('start-speaking', activeChannel, (allowed: boolean) => {
        if (!allowed) {
          setErrorStatus('Frequência Ocupada!');
          stream.getTracks().forEach(t => t.stop());
          setIsPressing(false);
          setTimeout(() => setErrorStatus(null), 2000);
          return;
        }

        setIsSpeaking(true);
        if (fxBeep.current) {
          fxBeep.current.volume = 0.5;
          fxBeep.current.play().catch(()=>{});
        }

        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        mediaRecorder.current = mr;

        mr.ondataavailable = (e) => {
          if (e.data.size > 0 && socket) {
            e.data.arrayBuffer().then(buffer => {
              socket.emit('audio-chunk', activeChannel, buffer);
            });
          }
        };

        // Envia pedaços a cada 250ms (Tempo Real)
        mr.start(250);
      });
      
    } catch (err) {
      setErrorStatus('Sem Permissão de Microfone');
      setIsPressing(false);
      setTimeout(() => setErrorStatus(null), 2000);
    }
  };

  const stopPTT = () => {
    if (!isPressing) return;
    setIsPressing(false);
    
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    }
    
    socket?.emit('stop-speaking', activeChannel);
    setIsSpeaking(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 70, left: 0, right: 0, padding: 16,
      background: '#0f172a', borderTop: '1px solid #1e293b', zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      {/* HUD Info */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 8, background: isConnected ? '#22c55e' : '#ef4444', boxShadow: `0 0 8px ${isConnected ? '#22c55e' : '#ef4444'}` }} />
          <span style={{ color: '#cbd5e1', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            {isConnected ? 'Sinal Forte' : 'Buscando Antena...'}
          </span>
        </div>
        <button onClick={() => setMuted(!muted)} style={{ background: 'none', border: 'none', color: muted ? '#ef4444' : '#94a3b8' }}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Channel Selector */}
      <select 
        value={activeChannel}
        onChange={changeChannel}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #334155',
          background: '#1e293b', color: '#f8fafc', fontSize: 13, fontWeight: 800,
          marginBottom: 20
        }}
      >
        {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {/* Status Warning */}
      {errorStatus && (
        <div style={{ color: '#ef4444', fontSize: 12, fontWeight: 800, marginBottom: 10 }}>{errorStatus}</div>
      )}
      
      {/* PTT Button */}
      <button
        onPointerDown={startPTT}
        onPointerUp={stopPTT}
        onPointerLeave={stopPTT}
        style={{
          width: 140, height: 140, borderRadius: '50%', border: 'none',
          background: isReceiving ? '#3b82f6' : isSpeaking ? '#ef4444' : '#f59e0b',
          boxShadow: isReceiving ? '0 0 40px rgba(59,130,246,0.5)' : 
                     isSpeaking ? '0 0 50px rgba(239,68,68,0.7)' : 
                     '0 10px 20px rgba(0,0,0,0.5), inset 0 4px 10px rgba(255,255,255,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', transition: 'all 0.1s', transform: isSpeaking ? 'scale(0.95)' : 'scale(1)',
          pointerEvents: isReceiving ? 'none' : 'auto'
        }}
      >
        {isReceiving ? (
          <><Radio size={40} className="animate-pulse" /><span style={{ fontSize: 14, fontWeight: 900, marginTop: 8 }}>RECEPÇÃO</span></>
        ) : isSpeaking ? (
          <><Mic size={40} /><span style={{ fontSize: 14, fontWeight: 900, marginTop: 8 }}>NO AR</span></>
        ) : (
          <><Power size={48} /><span style={{ fontSize: 14, fontWeight: 900, marginTop: 8 }}>APERTE (PTT)</span></>
        )}
      </button>

      <div style={{ marginTop: 16, color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
        Alpha360 HT-Protocol
      </div>
    </div>
  );
}
