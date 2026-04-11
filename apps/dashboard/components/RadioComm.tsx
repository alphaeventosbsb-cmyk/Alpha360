'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Square, VolumeX, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function RadioComm() {
  const [expanded, setExpanded] = useState(false);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [channels] = useState([
    { id: 'global', name: 'Canal Operacional (Global)' },
    { id: 'lideranca', name: 'Canal Liderança' }
  ]);
  const [activeChannel, setActiveChannel] = useState('global');
  
  const [isPressing, setIsPressing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  
  const [muted, setMuted] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioQueue = useRef<string[]>([]);
  const isPlayingQueue = useRef(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const fxBeep = useRef<HTMLAudioElement | null>(null);
  const fxStatic = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fxBeep.current = new Audio('https://actions.google.com/sounds/v1/communication/beep_short.ogg');
    fxStatic.current = new Audio('https://actions.google.com/sounds/v1/foley/radio_static.ogg');
  }, []);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join-channel', activeChannel);
    });

    s.on('disconnect', () => setIsConnected(false));

    s.on('speaker-started', () => {
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
    if (isReceiving || isPressing) return;
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

        mr.start(250);
      });
      
    } catch (err) {
      setErrorStatus('Sem Microfone');
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

  if (!expanded) {
    return (
      <button 
        onClick={() => setExpanded(true)}
        className="fixed bottom-6 right-6 bg-[#1e293b] p-4 rounded-full shadow-2xl border border-slate-700 hover:scale-105 transition-transform group z-50 flex items-center justify-center gap-3"
      >
        <Radio className={isReceiving ? 'text-blue-500 animate-pulse' : 'text-slate-400'} size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-700 z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#1e293b] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
          <span className="text-white font-bold text-sm tracking-wide">DESPACHADOR HT</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setMuted(!muted)} className={muted ? 'text-red-500' : 'text-slate-400 hover:text-white'}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button onClick={() => setExpanded(false)} className="text-slate-400 hover:text-white">
            <Minimize2 size={18} />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col items-center">
        {/* Channel Selector */}
        <div className="w-full mb-6">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Frequência</label>
          <select 
            value={activeChannel}
            onChange={changeChannel}
            className="w-full bg-[#1e293b] text-white text-sm font-bold p-2.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Status */}
        <div className="h-4 mb-4 flex items-center justify-center w-full">
          {errorStatus && <span className="text-red-500 text-xs font-bold">{errorStatus}</span>}
          {!errorStatus && isReceiving && <span className="text-blue-400 text-xs font-bold animate-pulse">RECEBENDO SINAL...</span>}
          {!errorStatus && isSpeaking && <span className="text-red-500 text-xs font-bold">TRANSMITINDO AO VIVO</span>}
        </div>

        {/* PTT Button */}
        <button
          onPointerDown={startPTT}
          onPointerUp={stopPTT}
          onPointerLeave={stopPTT}
          className="w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all select-none"
          style={{
            background: isReceiving ? '#3b82f6' : isSpeaking ? '#ef4444' : '#f59e0b',
            boxShadow: isReceiving ? '0 0 40px rgba(59,130,246,0.5)' : 
                       isSpeaking ? '0 0 50px rgba(239,68,68,0.7)' : 
                       '0 10px 20px rgba(0,0,0,0.5), inset 0 4px 10px rgba(255,255,255,0.2)',
            transform: isSpeaking ? 'scale(0.95)' : 'scale(1)',
            pointerEvents: isReceiving ? 'none' : 'auto'
          }}
        >
          {isReceiving ? (
            <><Radio size={32} className="text-white animate-pulse" /><span className="text-white mt-1 text-xs font-bold">RECEPÇÃO</span></>
          ) : isSpeaking ? (
            <><Mic size={32} className="text-white" /><span className="text-white mt-1 text-xs font-bold">NO AR</span></>
          ) : (
            <><Mic size={32} className="text-white" /><span className="text-white mt-1 text-xs font-bold w-12 text-center leading-tight">PRESSIONE PARA FALAR</span></>
          )}
        </button>
      </div>
    </div>
  );
}
