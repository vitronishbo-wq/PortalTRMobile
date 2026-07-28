import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Cpu,
  Sparkles,
  Wifi,
  Radio,
  Smartphone,
  Key,
  Copy,
  Check,
  Zap,
  ShieldCheck
} from 'lucide-react';
import {
  registerServiceWorker,
  requestNotificationPermission,
  sendTestNotification,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  getActivePushSubscription,
  getStoredVapidKey,
  saveStoredVapidKey,
  SwRegistrationStatus,
  WebPushSubscriptionStatus
} from '../lib/pushNotifications';

export const ServiceWorkerNotificationCard: React.FC = () => {
  const [swStatus, setSwStatus] = useState<SwRegistrationStatus>({
    supported: false,
    registered: false,
    permission: 'default',
    active: false
  });
  const [vapidKey, setVapidKey] = useState<string>('');
  const [pushStatus, setPushStatus] = useState<WebPushSubscriptionStatus>({ subscribed: false });
  const [loading, setLoading] = useState<boolean>(true);
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [testSent, setTestSent] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedSub, setCopiedSub] = useState<boolean>(false);
  const [autoNotify, setAutoNotify] = useState<boolean>(() => {
    return localStorage.getItem('portal_auto_push_notify') !== 'false';
  });

  const checkStatus = async () => {
    setLoading(true);
    const status = await registerServiceWorker();
    setSwStatus(status);

    const key = getStoredVapidKey();
    setVapidKey(key);

    const activeSub = await getActivePushSubscription();
    if (activeSub) {
      setPushStatus({
        subscribed: true,
        endpoint: activeSub.endpoint,
        vapidKey: key,
        subscription: activeSub
      });
    } else {
      setPushStatus({ subscribed: false, vapidKey: key });
    }

    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleRequestPermission = async () => {
    setLoading(true);
    const perm = await requestNotificationPermission();
    const status = await registerServiceWorker();
    setSwStatus({ ...status, permission: perm });
    setLoading(false);
  };

  const handleSubscribeWebPush = async () => {
    setSubscribing(true);
    saveStoredVapidKey(vapidKey);
    const res = await subscribeToWebPush(vapidKey);
    setPushStatus(res);
    setSubscribing(false);
  };

  const handleUnsubscribeWebPush = async () => {
    setSubscribing(true);
    await unsubscribeFromWebPush();
    setPushStatus({ subscribed: false, vapidKey });
    setSubscribing(false);
  };

  const handleSendTest = async () => {
    setTestSent(true);
    await sendTestNotification();
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleToggleAutoNotify = (val: boolean) => {
    setAutoNotify(val);
    localStorage.setItem('portal_auto_push_notify', String(val));
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl p-6 border border-amber-500/30 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
              <span>Service Worker & VAPID Web Push Nativas</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PWA Cloud Functions
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Permite alertas nativos do sistema em segundo plano acionados pelas capturas do Firestore.
            </p>
          </div>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Verificar SW</span>
        </button>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SW Status Card */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Estado do Service Worker</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center space-x-2">
            {swStatus.active ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ativo (/sw.js)</span>
              </span>
            ) : swStatus.registered ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Registrado (Instalando)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Inativo</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Escopo: {swStatus.scope || '/'}
          </p>
        </div>

        {/* Permission Status Card */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Permissão do Navegador</span>
            {swStatus.permission === 'granted' ? (
              <Bell className="w-4 h-4 text-emerald-400" />
            ) : (
              <BellOff className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            {swStatus.permission === 'granted' ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Permitido</span>
              </span>
            ) : swStatus.permission === 'denied' ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Bloqueado</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Pendente</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Web Push API nativo do SO
          </p>
        </div>

        {/* PushSubscription Status */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Subscrição Web Push VAPID</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center space-x-2">
            {pushStatus.subscribed ? (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Subscrito (Active)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                <span>Não Subscrito</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Salvo em Firestore collection <code className="text-amber-400">push_subscriptions</code>
          </p>
        </div>
      </div>

      {/* VAPID Key & Web Push Controls */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200">Chave Pública VAPID (Web Push Key)</h4>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Usada para assinar notificações das Cloud Functions</span>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={vapidKey}
            onChange={(e) => setVapidKey(e.target.value)}
            onBlur={(e) => saveStoredVapidKey(e.target.value)}
            placeholder="Digite ou cole a VAPID Public Key..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:ring-1 focus:ring-amber-500 outline-none"
          />
          <button
            onClick={() => copyToClipboard(vapidKey, setCopiedKey)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-2">
            {!pushStatus.subscribed ? (
              <button
                onClick={handleSubscribeWebPush}
                disabled={subscribing}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{subscribing ? 'Subscrevendo...' : 'Registar Subscrição Web Push'}</span>
              </button>
            ) : (
              <button
                onClick={handleUnsubscribeWebPush}
                disabled={subscribing}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{subscribing ? 'Cancelando...' : 'Cancelar Subscrição Web Push'}</span>
              </button>
            )}

            {pushStatus.subscription && (
              <button
                onClick={() => copyToClipboard(JSON.stringify(pushStatus.subscription, null, 2), setCopiedSub)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copiedSub ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSub ? 'JSON Copiado!' : 'Copiar JSON para Cloud Functions'}</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-400 italic">
            Subscrições são guardadas automaticamente no Firestore em <code className="text-amber-400">push_subscriptions</code>
          </span>
        </div>
      </div>

      {/* Action Controls & Testing */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Ativar Alertas Nativos no Telemóvel / PC</span>
          </h4>
          <p className="text-xs text-slate-400">
            Subscreva o Service Worker para emitir pop-ups nativos quando o Android enviar capturas para o Firestore.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {swStatus.permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              disabled={loading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>Ativar Notificações Nativas</span>
            </button>
          )}

          <button
            onClick={handleSendTest}
            disabled={swStatus.permission !== 'granted'}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            title={swStatus.permission !== 'granted' ? 'Ative as permissões primeiro' : 'Disparar notificação de teste'}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testSent ? 'Enviado!' : 'Testar Notificação Nativa'}</span>
          </button>

          <label className="flex items-center space-x-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={autoNotify}
              onChange={(e) => handleToggleAutoNotify(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <span>Notificar em Background</span>
          </label>
        </div>
      </div>
    </div>
  );
};

