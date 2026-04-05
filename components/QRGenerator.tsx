'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, CheckCircle2 } from 'lucide-react';
import type { QRCodeData } from '@/lib/types';

interface QRGeneratorProps {
  data: QRCodeData;
  jobTitle: string;
  jobDate?: string;
  size?: number;
}

export function QRGenerator({ data, jobTitle, jobDate, size = 200 }: QRGeneratorProps) {
  const [copied, setCopied] = React.useState(false);
  const qrValue = JSON.stringify(data);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${data.type}-${data.jobId}`) as unknown as SVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size * 2;
    canvas.height = size * 2;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, size * 2, size * 2);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${data.type}-${jobTitle.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const isCheckin = data.type === 'checkin';
  const expiresAt = new Date(data.expiresAt);
  const isExpired = expiresAt < new Date();

  return (
    <div className={`bg-white rounded-2xl border-2 ${isCheckin ? 'border-green-200' : 'border-blue-200'} overflow-hidden shadow-sm`}>
      <div className={`px-4 py-3 ${isCheckin ? 'bg-green-50' : 'bg-blue-50'} border-b ${isCheckin ? 'border-green-200' : 'border-blue-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`size-8 rounded-lg flex items-center justify-center ${isCheckin ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isCheckin ? '🔐 CHECK-IN' : '🔓 CHECK-OUT'}
              </h3>
              <p className="text-[10px] text-slate-500">{jobTitle}</p>
            </div>
          </div>
          {isExpired && (
            <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full">
              EXPIRADO
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col items-center">
        <div className={`p-3 rounded-xl ${isExpired ? 'opacity-40 grayscale' : ''} ${isCheckin ? 'bg-green-50' : 'bg-blue-50'}`}>
          <QRCodeSVG
            id={`qr-${data.type}-${data.jobId}`}
            value={qrValue}
            size={size}
            level="H"
            includeMargin
            fgColor={isCheckin ? '#166534' : '#1e40af'}
            bgColor="transparent"
          />
        </div>

        {jobDate && (
          <p className="text-xs text-slate-500 mt-3">📅 {jobDate}</p>
        )}

        <p className="text-[10px] text-slate-400 mt-1">
          Expira: {expiresAt.toLocaleString('pt-BR')}
        </p>

        <div className="flex gap-2 mt-4 w-full">
          <button
            onClick={handleDownload}
            disabled={isExpired}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              isExpired
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isCheckin
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-500/20'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20'
            }`}
          >
            <Download className="size-3.5" />
            Baixar
          </button>
          <button
            onClick={handleCopy}
            disabled={isExpired}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-40"
          >
            <Copy className="size-3.5" />
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  );
}
