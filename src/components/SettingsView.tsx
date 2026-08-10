import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Bell,
  ShieldCheck,
  Palette,
  Globe,
  CheckCircle2,
  RefreshCw,
  Lock,
  Moon,
  Sun,
  Volume2,
  Smartphone,
  EyeOff,
  Clock,
  Zap,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  Key
} from 'lucide-react';
import { UserSettings } from '../types/Settings';
import { FirestoreService } from '../services/firestore';
import { useIdentity } from '../engine/identityEngine';
import { SecurityConsole } from './SecurityConsole';

const DEFAULT_SETTINGS: UserSettings = {
  userId: 'usr-default',
  // 1. Preferências
  syncIntervalMinutes: 5,
  autoSync: true,
  biometricAuth: true,
  deepLinksEnabled: true,
  startupView: 'overview',
  zeroTouchAutoPair: true,

  // 2. Notificações
  notificationsEnabled: true,
  webPushEnabled: true,
  smsAlertsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  silentHoursEnabled: false,
  silentHoursStart: '22:00',
  silentHoursEnd: '07:00',

  // 3. Privacidade
  dataEncryption: 'AES-256',
  antiTrackerCamouflage: true,
  autoClearSessionHours: 24,
  telemetryOptIn: false,
  remoteWipeGuard: true,

  // 4. Aparência
  theme: 'dark',
  accentColor: 'amber',
  density: 'comfortable',
  fontScaling: 'md',

  // 5. Idioma
  language: 'pt-AO',

  // Meta
  autoArchiveRead: false,
  updatedAt: Date.now()
};

export const SettingsView: React.FC = () => {
  const { user } = useIdentity();
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('portal_user_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar definições locais:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [activeSection, setActiveSection] = useState<'preferencias' | 'notificacoes' | 'privacidade' | 'aparencia' | 'idioma'>('preferencias');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estados do Modo Calculadora (Camuflagem de Privacidade)
  const [calcPin, setCalcPin] = useState<string>(() => {
    return localStorage.getItem('portal_camouflage_pin') || '12345';
  });
  const [calcTitle, setCalcTitle] = useState<string>(() => {
    return localStorage.getItem('portal_camouflage_title') || 'Calculadora Padrão';
  });
  const [calcStart, setCalcStart] = useState<boolean>(() => {
    return localStorage.getItem('portal_camouflage_start') === 'true';
  });
  const [calcHideBtn, setCalcHideBtn] = useState<boolean>(() => {
    return localStorage.getItem('portal_camouflage_hide_btn') === 'true';
  });

  const handleCalcPinChange = (pin: string) => {
    const clean = pin.replace(/\D/g, '');
    setCalcPin(clean);
    localStorage.setItem('portal_camouflage_pin', clean);
    window.dispatchEvent(new Event('portal_camouflage_settings_updated'));
  };

  const handleCalcTitleChange = (title: string) => {
    setCalcTitle(title);
    localStorage.setItem('portal_camouflage_title', title);
    window.dispatchEvent(new Event('portal_camouflage_settings_updated'));
  };

  const handleCalcStartChange = (val: boolean) => {
    setCalcStart(val);
    localStorage.setItem('portal_camouflage_start', String(val));
    window.dispatchEvent(new Event('portal_camouflage_settings_updated'));
  };

  const handleCalcHideBtnChange = (val: boolean) => {
    setCalcHideBtn(val);
    localStorage.setItem('portal_camouflage_hide_btn', String(val));
    window.dispatchEvent(new Event('portal_camouflage_settings_updated'));
  };

  const handleLockCamouflageNow = () => {
    window.dispatchEvent(new Event('portal_lock_camouflage'));
  };

  useEffect(() => {
    // Attempt loading settings from Firestore if user logged in
    const loadFirestoreSettings = async () => {
      if (user?.uid) {
        try {
          // If available from Firestore, sync local state
          const remoteSettings = await FirestoreService.getUserSettings(user.uid);
          if (remoteSettings) {
            setSettings((prev) => ({ ...prev, ...remoteSettings }));
          }
        } catch (err) {
          console.warn('Sem definições remotas do Firestore, a utilizar cache local.');
        }
      }
    };
    loadFirestoreSettings();
  }, [user?.uid]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value, updatedAt: Date.now() };
      try {
        localStorage.setItem('portal_user_settings', JSON.stringify(next));
      } catch (e) {
        console.error('Erro ao guardar no localStorage:', e);
      }
      return next;
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('portal_user_settings', JSON.stringify(settings));
      if (user?.uid) {
        await FirestoreService.saveSettings({ ...settings, userId: user.uid });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Erro ao guardar definições:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar as definições originais da aplicação?')) {
      const resetState = { ...DEFAULT_SETTINGS, userId: user?.uid || 'usr-default', updatedAt: Date.now() };
      setSettings(resetState);
      localStorage.setItem('portal_user_settings', JSON.stringify(resetState));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400 animate-spin-slow" />
            <span>Definições do Portal & Sistema</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gira as preferências de operação, notificações push, privacidade reforçada, personalização visual e idioma do PortalTRMobile.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer flex items-center space-x-1.5"
            title="Restaurar Definições Padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center space-x-2 ${
              saveSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>A Guardar...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Definições Guardadas!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Tabs Bar for 9. Definições */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
        <button
          onClick={() => setActiveSection('preferencias')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'preferencias'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>1. Preferências</span>
        </button>

        <button
          onClick={() => setActiveSection('notificacoes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'notificacoes'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>2. Notificações</span>
        </button>

        <button
          onClick={() => setActiveSection('privacidade')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'privacidade'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>3. Privacidade</span>
        </button>

        <button
          onClick={() => setActiveSection('aparencia')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'aparencia'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>4. Aparência</span>
        </button>

        <button
          onClick={() => setActiveSection('idioma')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
            activeSection === 'idioma'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>5. Idioma</span>
        </button>
      </div>

      {/* SECTION CONTENT */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">

        {/* 1. PREFERÊNCIAS */}
        {activeSection === 'preferencias' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Preferências de Operação e Sincronização</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ajuste o comportamento do barramento de eventos, boot inicial e emparelhamento Zero-Touch.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Sincronização Automática */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Sincronização em Tempo Real</span>
                  <span className="text-[11px] text-slate-500 block">Receber eventos do barramento instantaneamente</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={(e) => updateSetting('autoSync', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Intervalo de Sync */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Intervalo de Sincronização em Segundo Plano</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{settings.syncIntervalMinutes} min</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={settings.syncIntervalMinutes}
                  onChange={(e) => updateSetting('syncIntervalMinutes', parseInt(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Autenticação Biométrica */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Exigir Biometria / WebAuthn</span>
                  <span className="text-[11px] text-slate-500 block">Desbloquear acesso rápido no aplicativo mobile</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.biometricAuth}
                  onChange={(e) => updateSetting('biometricAuth', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Auto Pair Zero-Touch */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Auto-Pairing Zero-Touch</span>
                  <span className="text-[11px] text-slate-500 block">Emparelhar novos nós de rede automaticamente via QR/Token</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.zeroTouchAutoPair}
                  onChange={(e) => updateSetting('zeroTouchAutoPair', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Deep Links Native Intent */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Redirecionamento Deep Links / Intents</span>
                  <span className="text-[11px] text-slate-500 block">Abrir diretamente as definições nativas no Android</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.deepLinksEnabled}
                  onChange={(e) => updateSetting('deepLinksEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Vista Inicial (Startup View) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-slate-200 block">Vista Padrão de Inicialização</span>
                <select
                  value={settings.startupView}
                  onChange={(e) => updateSetting('startupView', e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="overview">Visão Geral (Dashboard)</option>
                  <option value="inbox">Caixa de Entrada (Inbox)</option>
                  <option value="devices">Dispositivos & DeviceHealth</option>
                  <option value="analytics">Métricas & Analytics</option>
                </select>
              </div>

            </div>
          </div>
        )}

        {/* 2. NOTIFICAÇÕES */}
        {activeSection === 'notificacoes' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Notificações & Alertas em Tempo Real</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure os canais de push, alertas de chamadas, vibração e regras de silêncio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Notificações do Sistema */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Ativar Notificações Globais</span>
                  <span className="text-[11px] text-slate-500 block">Notificar sobre SMS, chamadas e estado da bateria</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Web Push */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Web Push Browser Notifications</span>
                  <span className="text-[11px] text-slate-500 block">Alertar mesmo com o navegador minimizado</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.webPushEnabled}
                  onChange={(e) => updateSetting('webPushEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* SMS Alerts */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Alertas Instantâneos de SMS</span>
                  <span className="text-[11px] text-slate-500 block">Aviso prioritário ao receber mensagens nos telefones</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smsAlertsEnabled}
                  onChange={(e) => updateSetting('smsAlertsEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Som e Vibração */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Som de Alerta Auditivo</span>
                  <span className="text-[11px] text-slate-500 block">Tocar tom acústico ao receber eventos prioritários</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Feedback Hático / Vibração</span>
                  <span className="text-[11px] text-slate-500 block">Vibrar dispositivo mobile ao chegar notificação</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) => updateSetting('vibrationEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {/* Horário Silencioso */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Modo Não Incomodar / Horário Silencioso</span>
                    <span className="text-[11px] text-slate-500 block">Silenciar notificações durante a noite</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.silentHoursEnabled}
                    onChange={(e) => updateSetting('silentHoursEnabled', e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {settings.silentHoursEnabled && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Início:</span>
                      <input
                        type="time"
                        value={settings.silentHoursStart}
                        onChange={(e) => updateSetting('silentHoursStart', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Fim:</span>
                      <input
                        type="time"
                        value={settings.silentHoursEnd}
                        onChange={(e) => updateSetting('silentHoursEnd', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 3. PRIVACIDADE & SEGURANÇA */}
        {activeSection === 'privacidade' && (
          <div className="animate-fadeIn">
            <SecurityConsole />
          </div>
        )}

        {/* 4. APARÊNCIA */}
        {activeSection === 'aparencia' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Aparência, Tema Visual & Densidade</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalize as cores de acento, tamanho do texto e contraste da interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Modo de Tema */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-slate-200 block">Modo de Cor / Tema</span>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="dark">Escuro de Alto Contraste (Padrão)</option>
                  <option value="light">Claro Minimalista</option>
                  <option value="system">Seguir Definições do Sistema Operativo</option>
                </select>
              </div>

              {/* Cor de Destaque */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">Cor Primária de Destaque (Accent)</span>
                <div className="flex items-center space-x-3">
                  {[
                    { id: 'amber', bg: 'bg-amber-500', label: 'Âmbar' },
                    { id: 'indigo', bg: 'bg-indigo-500', label: 'Índigo' },
                    { id: 'emerald', bg: 'bg-emerald-500', label: 'Esmeralda' },
                    { id: 'cyan', bg: 'bg-cyan-500', label: 'Ciano' },
                    { id: 'purple', bg: 'bg-purple-500', label: 'Roxo' }
                  ].map((color) => (
                    <button
                      key={color.id}
                      onClick={() => updateSetting('accentColor', color.id as any)}
                      className={`w-7 h-7 rounded-full ${color.bg} flex items-center justify-center cursor-pointer transition-transform ${
                        settings.accentColor === color.id ? 'ring-4 ring-white/30 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={color.label}
                    >
                      {settings.accentColor === color.id && <Check className="w-3.5 h-3.5 text-slate-950 font-black" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Densidade de Layout */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-slate-200 block">Densidade da Interface</span>
                <select
                  value={settings.density}
                  onChange={(e) => updateSetting('density', e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="compact">Compacto (Máxima informação na ecrã)</option>
                  <option value="comfortable">Confortável (Equilibrado - Padrão)</option>
                  <option value="spacious">Espaçoso (Elementos maiores)</option>
                </select>
              </div>

              {/* Escala de Fontes */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-slate-200 block">Tamanho do Texto (Fonte)</span>
                <select
                  value={settings.fontScaling}
                  onChange={(e) => updateSetting('fontScaling', e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="sm">Pequeno (11px / 12px)</option>
                  <option value="md">Médio (12px / 14px - Padrão)</option>
                  <option value="lg">Grande (14px / 16px)</option>
                </select>
              </div>

            </div>
          </div>
        )}

        {/* 5. IDIOMA */}
        {activeSection === 'idioma' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Idioma & Regionalização</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Selecione o idioma de exibição do console e dicionário de termos do sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {[
                { id: 'pt-AO', flag: '🇦🇴', name: 'Português (Angola)', desc: 'Idioma oficial do PortalTRMobile' },
                { id: 'pt-BR', flag: '🇧🇷', name: 'Português (Brasil)', desc: 'Português do Brasil' },
                { id: 'pt-PT', flag: '🇵🇹', name: 'Português (Portugal)', desc: 'Português de Portugal' },
                { id: 'en-US', flag: '🇺🇸', name: 'English (United States)', desc: 'International English' },
                { id: 'es-ES', flag: '🇪🇸', name: 'Español', desc: 'Español castellano' },
                { id: 'fr-FR', flag: '🇫🇷', name: 'Français', desc: 'Français' },
                { id: 'auto', flag: '🌐', name: 'Deteção Automática do Navegador', desc: 'Ajustar dinamicamente' }
              ].map((lang) => (
                <div
                  key={lang.id}
                  onClick={() => updateSetting('language', lang.id as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    settings.language === lang.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-slate-100 ring-2 ring-amber-500/20'
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <span className="text-xs font-bold block text-slate-200">{lang.name}</span>
                      <span className="text-[10px] text-slate-500 block">{lang.desc}</span>
                    </div>
                  </div>
                  {settings.language === lang.id && (
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                </div>
              ))}

            </div>
          </div>
        )}

      </div>

    </div>
  );
};
