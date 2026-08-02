import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Smartphone, Copy, Check, Download, ExternalLink, Sparkles, RefreshCw, Apple } from 'lucide-react';

interface PwaQrCodeCardProps {
  defaultUrl?: string;
}

export const PwaQrCodeCard: React.FC<PwaQrCodeCardProps> = ({ defaultUrl }) => {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://portaltrmobile.web.app';
  const [targetUrl, setTargetUrl] = useState<string>(defaultUrl || currentOrigin);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedOS, setSelectedOS] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    generateQrCode(targetUrl);
  }, [targetUrl]);

  const generateQrCode = async (url: string) => {
    if (!url) return;
    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'qrcode-portal-tr-calculadora.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetToCurrentOrigin = () => {
    setTargetUrl(currentOrigin);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl p-6 border border-indigo-500/30 shadow-xl space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
              <span>QR Code para Instalação (iOS & Android)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Sem Cabos
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Aponte a câmara do iPhone ou Android para instalar a aplicação disfarçada de Calculadora diretamente no ecrã principal.
            </p>
          </div>
        </div>

        <button
          onClick={resetToCurrentOrigin}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          title="Usar URL desta aplicação no navegador"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Usar URL Atual</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* QR Code Display Container */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner space-y-3">
          <div className="relative group p-3 bg-white rounded-xl shadow-2xl transition-transform hover:scale-105">
            {isGenerating ? (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code PWA Portal TR Calculadora"
                className="w-48 h-48 object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                Gerando QR Code...
              </div>
            )}
            
            <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Baixar Imagem QR</span>
            </button>
            <a
              href={targetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <span>Testar Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* URL Input & OS Tabs Instructions */}
        <div className="md:col-span-7 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>URL da Aplicação (APP_URL):</span>
              <span className="text-[10px] text-slate-500 font-mono">Funciona em iOS e Android</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://portaltrmobile.web.app"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              <button
                onClick={handleCopyUrl}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* OS Selector Tabs */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedOS('android')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedOS === 'android'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (Chrome)</span>
            </button>
            <button
              onClick={() => setSelectedOS('ios')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedOS === 'ios'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>iPhone / iOS (Safari)</span>
            </button>
          </div>

          {/* Step by step guide */}
          {selectedOS === 'android' ? (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Instalação no Android (Chrome):</span>
              </div>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  Abra a câmara e <strong>escaneie o QR Code</strong> (ou acesse no Chrome).
                </li>
                <li>
                  Toque no menu de <strong>3 pontos (⋮)</strong> no canto superior do Chrome.
                </li>
                <li>
                  Selecione <strong>"Adicionar ao ecrã principal"</strong> (ou <em>"Instalar aplicação"</em>).
                </li>
                <li>
                  A app surge no telefone com o nome e ícone de <strong>Calculadora</strong>.
                </li>
              </ol>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                <Apple className="w-4 h-4 text-slate-200" />
                <span>Instalação no iPhone (Safari / iOS):</span>
              </div>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  Abra a <strong>Câmara do iPhone</strong> e escaneie o QR Code para abrir o link no <strong>Safari</strong>.
                </li>
                <li>
                  No Safari, toque no botão <strong>Partilhar</strong> (ícone do quadrado com a seta para cima ⎋ na barra inferior).
                </li>
                <li>
                  Role a lista para baixo e toque em <strong>"Adicionar ao Ecrã Principal"</strong> (<em>Add to Home Screen</em>).
                </li>
                <li>
                  Confirme o nome <strong>"Calculadora"</strong> e toque em <strong>Adicionar</strong> no canto superior direito.
                </li>
                <li>
                  Pronto! O ícone da <strong>Calculadora</strong> ficará no ecrã do iPhone e abrirá sem barras do navegador.
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
