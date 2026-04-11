'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Loader2, X, Mic, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
import type { Message } from '@/lib/types';

interface ChatProps {
  jobId: string;
  jobTitle: string;
}

export function Chat({ jobId, jobTitle }: ChatProps) {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (!jobId) return;
    const loadMessages = async () => {
      try {
        const msgs = await api.get<Message[]>(`/api/messages?jobId=${jobId}`);
        setMessages(msgs || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!text.trim() && !previewImage) || !user) return;
    setSending(true);

    try {
      await api.post('/api/messages', {
        jobId,
        senderId: user.uid,
        senderName: userData?.name || user.displayName || 'Usuário',
        senderRole: userData?.role || 'user',
        senderPhoto: userData?.photoUrl || user.photoURL || '',
        text: text.trim(),
        imageUrl: previewImage || '',
      });
      setText('');
      setPreviewImage(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Convert to base64 for API upload
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
        setUploading(false);
      };
      reader.onerror = () => setUploading(false);
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        try {
          // Convert audio to base64
          const reader = new FileReader();
          reader.onload = async () => {
            const audioData = reader.result as string;
            await api.post('/api/messages', {
              jobId,
              senderId: user!.uid,
              senderName: userData?.name || user!.displayName || 'Usuário',
              senderRole: userData?.role || 'user',
              senderPhoto: userData?.photoUrl || user!.photoURL || '',
              text: '',
              audioUrl: audioData,
            });
            setUploading(false);
          };
          reader.onerror = () => setUploading(false);
          reader.readAsDataURL(new File([audioBlob], 'audio.webm', { type: 'audio/webm' }));
        } catch (error) {
          console.error('Error uploading audio:', error);
          setUploading(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Permissão de microfone negada. Verifique as configurações do navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'client': return 'bg-blue-100 text-blue-700';
      case 'guard': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'client': return 'Contratante';
      case 'guard': return 'Vigilante';
      default: return 'Usuário';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{jobTitle}</h3>
          <p className="text-[10px] text-slate-500">{messages.length} mensagens • Canal da escala</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-slate-500 font-medium">Ao vivo</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Send className="size-10 mb-3 opacity-30" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs">Seja o primeiro a enviar!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderId === user?.uid;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {msg.senderName?.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{msg.senderName}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${getRoleColor(msg.senderRole)}`}>
                      {getRoleLabel(msg.senderRole)}
                    </span>
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl ${
                  isOwn
                    ? 'bg-[#192c4d] text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-900 rounded-bl-md'
                }`}>
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Imagem"
                      className="rounded-lg max-w-full mb-2 max-h-48 object-cover"
                    />
                  )}
                  {msg.audioUrl && (
                    <audio
                      src={msg.audioUrl}
                      controls
                      className="max-w-full h-10 mt-1 mb-1"
                    />
                  )}
                  {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                </div>
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-right' : ''} text-slate-400`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {previewImage && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
          <div className="relative inline-block">
            <img src={previewImage} alt="Preview" className="h-16 rounded-lg object-cover" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-2 -right-2 size-5 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-200 flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2.5 text-slate-400 hover:text-[#192c4d] hover:bg-slate-100 rounded-lg transition-colors"
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImageIcon className="size-5" />}
        </button>
        {recording ? (
          <button
            onClick={stopRecording}
            className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 animate-pulse"
          >
            <Square className="size-5 fill-current" />
            <span className="text-xs font-bold">Gravando...</span>
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={uploading}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Mic className="size-5" />
          </button>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={recording}
          placeholder={recording ? "Gravando áudio..." : "Digite sua mensagem..."}
          rows={1}
          className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl border-0 resize-none outline-none focus:ring-2 focus:ring-[#192c4d] text-sm placeholder:text-slate-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && !previewImage)}
          className="p-2.5 bg-[#192c4d] text-white rounded-xl hover:bg-[#192c4d]/90 transition-all disabled:opacity-40 shadow-lg shadow-[#192c4d]/20"
        >
          {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </div>
    </div>
  );
}
