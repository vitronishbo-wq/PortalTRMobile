import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, RefreshCw, CheckCircle2, AlertCircle, Copy, ShieldCheck } from 'lucide-react';
import { generatePairingToken } from '../services/identityService';

interface QRCodePairingProps {
  msisdn?: string;
  workspaceId?: string;
  onPairingComplete?: () => void;
}

export function QRCodePairing({ msisdn = '244923000111', workspaceId = 'ws-vitronis-default', onPairingComplete }: QRCodePairingProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number>(300);

  const generateQR = async () => {
    setLoading(true);
    setCopied(false);
    try {
      const tok = await generatePairingToken(msisdn, workspaceId);
      setToken(tok);
      const url = `${window.location.origin}/pair?token=${tok}`;

      const dataUrl = await QRCode.toDataURL(url, {
        width: 220,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
      setExpiresIn(300);
    } catch (err) {
      console.error('[QRCodePairing] Error generating QR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQR();
  }, [msisdn, workspaceId]);

  useEffect(() => {
    if (expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [token, expiresIn]);

  const copyToClipboard = () => {
    if (!token) return;
    navigator.clipboard.writeText(`${window.location.origin}/pair?token=${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md mx-auto text-slate-100 font-mono text-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <QrCode className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-black text-slate-100 text-sm">Emparelhamento Zero-Touch</h3>
            <p className="text-[10px] text-slate-400">Escaneie para conectar novo dispositivo ao Mesh</p>
          </div>
        </div>

        <button
          onClick={generateQR}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition cursor-pointer"
          title="Regerar QR Code"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {qrDataUrl && expiresIn > 0 ? (
        <div className="flex flex-col items-center space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="p-2 bg-white rounded-xl shadow-lg border border-slate-300">
            <img src={qrDataUrl} alt="Pairing QR Code" className="w-48 h-48 block" />
          </div>

          <div className="w-full text-center space-y-1">
            <p className="text-[11px] font-bold text-emerald-400 flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Validade: {Math.floor(expiresIn / 60)}m {expiresIn % 60}s</span>
            </p>
            <p className="text-[10px] text-slate-400 truncate">MSISDN: {msisdn}</p>
          </div>

          <div className="w-full pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">{token}</span>
            <button
              onClick={copyToClipboard}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] flex items-center space-x-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-xs text-slate-300 font-bold">QR Code Expirado ou não gerado</p>
          <button
            onClick={generateQR}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Gerar Novo QR Code
          </button>
        </div>
      )}
    </div>
  );
}
