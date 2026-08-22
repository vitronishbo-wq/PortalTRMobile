import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Apple, QrCode, Sparkles, CheckCircle2, ArrowDown, ExternalLink, ShieldCheck, Share, PlusSquare, Copy, Check } from 'lucide-react';
import { InstallEngine, InstallState } from '../engine/installEngine';

interface SmartInstallerProps {
  onContinueToApp?: () => void;
  appName?: string;
}

export const SmartInstaller: React.FC<SmartInstallerProps> = ({
  onContinueToApp,
  appName = 'Calculadora Padrão'
}) => {
  const [installState, setInstallState] = useState<InstallState>(InstallEngine.getState());
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [installed, setInstalled] = useState<boolean>(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showAndroidManual, setShowAndroidManual] = useState<boolean>(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://portaltrmobile.web.app';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unsubscribe = InstallEngine.subscribe((state) => {
      setInstallState(state);
      if (state.isInstalled) {
        setInstalled(true);
      }
      if (state.platform === 'MOBILE_IOS') {
        setDeviceType('ios');
      } else if (state.platform === 'MOBILE_ANDROID') {
        setDeviceType('android');
      } else {
        setDeviceType('desktop');
      }
    });

    // Generate QR code for desktop view
    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'H'
    }).then((url) => {
      setQrCodeData(url);
    }).catch(err => {
      console.error('[SmartInstaller] Erro ao gerar QR Code:', err);
    });

    return () => unsubscribe();
  }, [currentUrl]);

  const handleInstallClick = async () => {
    const res = await InstallEngine.install();
    if (res.success) {
      setInstalled(true);
    } else if (res.reason === 'prompt_not_ready') {
      setShowAndroidManual(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 p-4 text-center text-white relative">
          <div className="inline-flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Portal Mobile Direct</span>
          </div>
          <h1 className="text-xl font-black mt-2 tracking-tight">
            {appName}
          </h1>
          <p className="text-xs text-indigo-100 mt-0.5">
            Instalação direta e disfarçada no ecrã principal
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge if already installed */}
          {installed && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Aplicação instalada com sucesso no dispositivo!</span>
            </div>
          )}

          {/* IN-APP BROWSER DETECTED VIEW */}
          {installState.isInAppBrowser && (
            <div className="space-y-4 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl animate-in fade-in duration-300">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <ExternalLink className="w-5 h-5" />
                <span>Navegador Interno Detetado</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                As aplicações como Instagram, WhatsApp e Facebook bloqueiam a instalação de PWAs. Abra no navegador predefinido do seu smartphone (<strong>Safari</strong> no iOS ou <strong>Chrome</strong> no Android).
              </p>
              <button
                onClick={handleCopy}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 border border-slate-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Ligação Copiada!' : 'Copiar Ligação para Navegador'}</span>
              </button>
            </div>
          )}

          {/* ANDROID DEVICE VIEW */}
          {!installState.isInAppBrowser && deviceType === 'android' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Instalação em 1 Clique (Android)
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Adicione o ícone da Calculadora ao ecrã principal para acesso direto e sem barra do navegador.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleInstallClick}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center space-x-3 cursor-pointer transform active:scale-95"
                >
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>Instalar no Telemóvel Agora</span>
                </button>

                {onContinueToApp && (
                  <button
                    onClick={onContinueToApp}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Abrir Portal no Navegador</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Sem aviso do Chrome?</p>
                <p>Toque no menu <strong>(⋮)</strong> do navegador e escolha <strong>"Adicionar ao ecrã principal"</strong>.</p>
              </div>
            </div>
          )}

          {/* IOS (IPHONE / IPAD) DEVICE VIEW */}
          {deviceType === 'ios' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Apple className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Instalar no iPhone (Safari)
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Siga estes 2 passos simples no Safari para adicionar o ícone no seu ecrã:
                </p>
              </div>

              {/* iOS Step-by-step visual instruction */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5 text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-slate-200 leading-relaxed">
                    Toque no botão <strong>Partilhar</strong> na barra inferior do Safari (ícone do quadrado com seta para cima <Share className="w-3.5 h-3.5 inline text-indigo-400" />).
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-slate-200 leading-relaxed">
                    Role a lista de opções e selecione <strong className="text-indigo-300">"Adicionar ao Ecrã Principal"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-indigo-400" />).
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-indigo-400 animate-bounce">
                <ArrowDown className="w-5 h-5" />
              </div>

              {onContinueToApp && (
                <button
                  onClick={onContinueToApp}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Aceder ao Portal sem Instalar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* DESKTOP DEVICE VIEW */}
          {deviceType === 'desktop' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Deteção Desktop Ativa</span>
                </div>
                <h2 className="text-base font-bold text-white">
                  Digitalize para Instalar no Smartphone
                </h2>
                <p className="text-xs text-slate-400">
                  Aponte a câmara do telemóvel (Android ou iPhone) para este QR Code:
                </p>
              </div>

              {/* QR Code Frame */}
              <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center max-w-[220px] mx-auto border-4 border-indigo-500/30">
                {qrCodeData ? (
                  <img
                    src={qrCodeData}
                    alt="QR Code de Instalação PWA"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-xs">
                    Gerando QR Code...
                  </div>
                )}
              </div>

              {/* URL bar + copy */}
              <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 bg-transparent px-2 text-xs text-slate-400 font-mono truncate focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              {onContinueToApp && (
                <button
                  onClick={onContinueToApp}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Entrar no Portal Web (Desktop)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Portal TR Mobile • Disfarce de Calculadora com Sincronização Firestore
          </p>
        </div>
      </div>
    </div>
  );
};
