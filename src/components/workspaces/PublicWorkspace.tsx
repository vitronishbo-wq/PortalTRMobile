import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Smartphone,
  MessageSquare,
  PhoneCall,
  Bell,
  Users,
  Grid,
  Activity,
  User,
  CreditCard,
  ShieldCheck,
  Settings,
  Lock,
  Plus,
  KeyRound,
  LogOut,
  CheckCircle2,
  QrCode,
  Zap,
  ChevronRight,
  Search,
  Filter,
  Download,
  X,
  Sparkles,
  Wifi,
  Battery,
  Send,
  RefreshCw,
  Archive,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Contact,
  CheckCheck,
  BellOff,
  Layers,
  Star,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useIdentity } from '../../engine/identityEngine';
import { useOnlineStatus } from '../../lib/offlineCache';
import { TrialEngine } from '../../services/trialEngine';
import { exportEventsToCsv } from '../../lib/csvExporter';
import { SwipeableEventCard, DeviceEvent } from '../SwipeableEventCard';
import { DevicesView } from '../DevicesView';
import { SettingsView } from '../SettingsView';
import { SystemArchitectureDiagram } from '../SystemArchitectureDiagram';
import { MobileHomeView } from '../MobileHomeView';
import { QRCodePairing } from '../QRCodePairing';
import { InputEngine } from '../../engine/inputEngine';
import { InteractionEngine, NavigationEngine, MultiDeviceMeshEngine } from '../../engine';
import { Device } from '../../types';

interface PublicWorkspaceProps {
  onOpenFounderWorkspace?: () => void;
  onOpenAuthModal?: () => void;
  devices?: Device[];
  onAddDevice?: (device: Partial<Device>) => void;
  onRemoveDevice?: (id: string) => void;
  onSimulateEvent?: () => void;
}

const defaultDevicesList: Device[] = [
  {
    deviceId: 'dev-pixel-8',
    userId: 'usr-default',
    uid: 'usr-default',
    name: 'Google Pixel 8 Pro',
    model: 'Pixel 8 Pro (Android 14)',
    osVersion: 'Android 14 (API 34)',
    platform: 'android',
    lastSync: Date.now() - 2 * 60 * 1000,
    online: true,
    batteryLevel: 88,
    pairedAt: Date.now() - 7 * 24 * 3600 * 1000,
    oemProfile: 'pixel'
  },
  {
    deviceId: 'dev-iphone-15',
    userId: 'usr-default',
    uid: 'usr-default',
    name: 'iPhone 15 Pro Max',
    model: 'iPhone 15 Pro (iOS 17)',
    osVersion: 'iOS 17.5.1',
    platform: 'iphone',
    lastSync: Date.now() - 15 * 60 * 1000,
    online: true,
    batteryLevel: 92,
    pairedAt: Date.now() - 12 * 24 * 3600 * 1000,
    oemProfile: 'apple'
  },
  {
    deviceId: 'dev-ipad-m2',
    userId: 'usr-default',
    uid: 'usr-default',
    name: 'iPad Air M2',
    model: 'iPad Air 11" (iPadOS 17)',
    osVersion: 'iPadOS 17.5',
    platform: 'tablet',
    lastSync: Date.now() - 45 * 60 * 1000,
    online: false,
    batteryLevel: 74,
    pairedAt: Date.now() - 30 * 24 * 3600 * 1000,
    oemProfile: 'apple'
  },
  {
    deviceId: 'dev-win-dell',
    userId: 'usr-default',
    uid: 'usr-default',
    name: 'Dell XPS Workstation',
    model: 'Dell XPS 15 (Windows 11)',
    osVersion: 'Windows 11 Pro 23H2',
    platform: 'windows',
    lastSync: Date.now() - 5 * 60 * 1000,
    online: true,
    batteryLevel: 100,
    pairedAt: Date.now() - 60 * 24 * 3600 * 1000,
    oemProfile: 'generic'
  },
  {
    deviceId: 'dev-macbook-m3',
    userId: 'usr-default',
    uid: 'usr-default',
    name: 'MacBook Pro M3 Max',
    model: 'MacBook Pro 16" (macOS Sonoma)',
    osVersion: 'macOS Sonoma 14.5',
    platform: 'macos',
    lastSync: Date.now() - 1 * 60 * 1000,
    online: true,
    batteryLevel: 95,
    pairedAt: Date.now() - 90 * 24 * 3600 * 1000,
    oemProfile: 'apple'
  },
  {
    deviceId: 'dev-linux-thinkpad',
    userId: 'usr-default',
    uid: 'usr-default',
    name: 'ThinkPad X1 Carbon',
    model: 'ThinkPad X1 (Ubuntu 24.04)',
    osVersion: 'Ubuntu 24.04 LTS (Kernel 6.8)',
    platform: 'linux',
    lastSync: Date.now() - 3 * 3600 * 1000,
    online: false,
    batteryLevel: 65,
    pairedAt: Date.now() - 45 * 24 * 3600 * 1000,
    oemProfile: 'generic'
  },
  {
    deviceId: 'dev-web-chrome',
    userId: 'usr-default',
    uid: 'usr-default',
    name: 'Portal Web Console',
    model: 'Google Chrome 125 (Web Session)',
    osVersion: 'Web / PWA Environment',
    platform: 'web',
    lastSync: Date.now(),
    online: true,
    batteryLevel: 100,
    pairedAt: Date.now() - 1 * 24 * 3600 * 1000,
    oemProfile: 'generic'
  }
];

export type PublicTabType =
  | 'inicio'
  | 'meu_dispositivo'
  | 'mensagens'
  | 'chamadas'
  | 'notificacoes'
  | 'contactos'
  | 'dispositivos'
  | 'atividade'
  | 'favoritos'
  | 'pesquisa'
  | 'arquitetura'
  | 'conta'
  | 'subscricao'
  | 'seguranca'
  | 'privacidade'
  | 'sessoes'
  | 'aparencia'
  | 'definicoes';

export const PublicWorkspace: React.FC<PublicWorkspaceProps> = ({
  onOpenAuthModal,
  devices,
  onAddDevice,
  onRemoveDevice,
  onSimulateEvent
}) => {
  const { user: authUser, profile: userProfile, loginWithGoogle, logout } = useIdentity();
  const { isOnline } = useOnlineStatus();
  
  const isAuthenticated = Boolean(authUser || userProfile);
  const activeDevices = devices && devices.length > 0 ? devices : defaultDevicesList;
  const hasDevice = isAuthenticated ? activeDevices.length > 0 : false;

  const [activeTab, setActiveTab] = useState<PublicTabType>('inicio');

  const normalizeTab = (tab: string): PublicTabType => {
    if (!tab) return 'inicio';
    const t = tab.toLowerCase();
    if (t === 'timeline' || t === 'activity' || t === 'atividade') return 'atividade';
    if (t === 'devices' || t === 'dispositivos') return 'dispositivos';
    if (t === 'favorites' || t === 'favoritos') return 'favoritos';
    if (t === 'search' || t === 'pesquisa') return 'pesquisa';
    if (t === 'home' || t === 'inicio') return 'inicio';
    if (t === 'chamadas' || t === 'phone' || t === 'calls') return 'chamadas';
    if (t === 'mensagens' || t === 'messages') return 'mensagens';
    if (t === 'notificacoes' || t === 'notifications') return 'notificacoes';
    if (t === 'contactos' || t === 'contacts') return 'contactos';
    if (t === 'definicoes' || t === 'settings') return 'definicoes';
    if (t === 'meu_dispositivo') return 'meu_dispositivo';
    if (t === 'conta' || t === 'subscricao') return 'conta';
    if (t === 'seguranca') return 'seguranca';
    if (t === 'privacidade') return 'privacidade';
    if (t === 'sessoes') return 'sessoes';
    if (t === 'aparencia') return 'aparencia';
    if (t === 'arquitetura') return 'arquitetura';
    return 'inicio';
  };

  // Multi-Device Unified Mesh & Interaction Engine Initialization
  useEffect(() => {
    MultiDeviceMeshEngine.registerNodeInMesh({
      primaryPhoneNumber: userProfile?.phoneNumber || '+244923456789',
      deviceName: 'PortalTRMobile Unified Node'
    });

    const unsubscribeNav = NavigationEngine.subscribe(() => {
      const activeDomain = NavigationEngine.getActiveDomain();
      if (activeDomain) {
        setActiveTab(normalizeTab(activeDomain));
      }
    });

    const handleSwitchPublicTab = (e: CustomEvent<string>) => {
      if (e.detail) {
        setActiveTab(normalizeTab(e.detail));
      }
    };

    window.addEventListener('switch-public-tab' as any, handleSwitchPublicTab);

    return () => {
      unsubscribeNav();
      window.removeEventListener('switch-public-tab' as any, handleSwitchPublicTab);
    };
  }, [userProfile]);

  const handleTabChange = (newTab: PublicTabType) => {
    const target = normalizeTab(newTab);
    setActiveTab(target);
    NavigationEngine.navigateTo(target as any);
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [msgSubTab, setMsgSubTab] = useState<'todas' | 'sms' | 'conversas' | 'arquivos'>('todas');
  const [callSubTab, setCallSubTab] = useState<'dialer' | 'historico' | 'recebidas' | 'efetuadas' | 'perdidas' | 'contactos'>('dialer');
  const [notifSubTab, setNotifSubTab] = useState<'todas' | 'nao_lidas' | 'aplicacoes'>('todas');
  const [selectedNotifApp, setSelectedNotifApp] = useState<string>('todos');

  // Sample Messages, Calls, Contacts & Notifications State
  const [messages, setMessages] = useState<DeviceEvent[]>([
    {
      id: 'msg-1',
      type: 'sms',
      title: 'SMS (+244 923 000 111)',
      detail: 'Código de confirmação de transferência recebido: 849204.',
      timestamp: 'Há 5 min',
      isFavorite: false,
    },
    {
      id: 'msg-2',
      type: 'whatsapp',
      title: 'WhatsApp (Maria Silva)',
      detail: 'Olá! Já recebi os documentos do projeto. Obrigado!',
      timestamp: 'Há 18 min',
      isFavorite: true,
    },
    {
      id: 'msg-3',
      type: 'sms',
      title: 'SMS (UNITEL Alerta)',
      detail: 'O seu saldo de dados expira em 3 dias. Recarregue para manter a ligação.',
      timestamp: 'Há 1h',
      isFavorite: false,
    },
    {
      id: 'msg-4',
      type: 'whatsapp',
      title: 'WhatsApp (Grupo Operações)',
      detail: 'Relatório diário de vendas sincronizado com sucesso.',
      timestamp: 'Há 3h',
      isFavorite: true,
    },
    {
      id: 'msg-5',
      type: 'telegram',
      title: 'Telegram (Suporte Técnico)',
      detail: 'A atualização do sistema foi agendada para este fim de semana.',
      timestamp: 'Ontem',
      isFavorite: false,
    }
  ]);

  const [calls, setCalls] = useState([
    { id: 'call-1', name: 'Carlos Eduardo', number: '+244 912 345 678', type: 'Perdida', time: '14:22', duration: '0 min' },
    { id: 'call-2', name: 'Suporte Técnico', number: '+244 923 888 999', type: 'Recebida', time: '11:05', duration: '4 min 12s' },
    { id: 'call-3', name: 'Ana Beatriz', number: '+244 944 111 222', type: 'Efetuada', time: 'Ontem', duration: '1 min 45s' },
    { id: 'call-4', name: 'Maria Silva', number: '+244 923 000 111', type: 'Recebida', time: 'Ontem 18:30', duration: '8 min 02s' },
    { id: 'call-5', name: 'Número Desconhecido', number: '+244 931 555 777', type: 'Perdida', time: 'Há 2 dias', duration: '0 min' },
    { id: 'call-6', name: 'Ana Beatriz', number: '+244 944 111 222', type: 'Efetuada', time: 'Há 3 dias', duration: '12 min 30s' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 'notif-1', app: 'BAI Directo', title: 'Transferência Recebida', body: 'Recebeu Kz 45.000,00 de Carlos Santos.', time: 'Há 10 min', isRead: false, category: 'Finanças' },
    { id: 'notif-2', app: 'Instagram', title: 'Nova Interação', body: 'lucas_dev curtiu e comentou na sua publicação.', time: 'Há 35 min', isRead: false, category: 'Redes Sociais' },
    { id: 'notif-3', app: 'Gmail', title: 'Alerta de Segurança', body: 'Novo início de sessão detetado no seu smartphone.', time: 'Há 2h', isRead: true, category: 'Segurança' },
    { id: 'notif-4', app: 'UNITEL Money', title: 'Saldo de Dados', body: 'A sua recarga de 10GB foi ativada com sucesso.', time: 'Há 5h', isRead: true, category: 'Utilitários' },
    { id: 'notif-5', app: 'WhatsApp', title: 'Mensagem de Voz', body: 'Recebeu 1 nova mensagem de áudio de Maria Silva (0:45).', time: 'Ontem', isRead: true, category: 'Mensagens' }
  ]);

  const [contacts, setContacts] = useState([
    { id: 'c-1', name: 'Ana Beatriz', phone: '+244 944 111 222', category: 'Trabalho' },
    { id: 'c-2', name: 'Carlos Eduardo', phone: '+244 912 345 678', category: 'Pessoal' },
    { id: 'c-3', name: 'Maria Silva', phone: '+244 923 000 111', category: 'Trabalho' },
    { id: 'c-4', name: 'Suporte Técnico', phone: '+244 923 888 999', category: 'Serviço' }
  ]);

  const primaryDevice = activeDevices[0] || defaultDevicesList[0];

  const displayEmail = userProfile?.email || authUser?.email || 'utilizador@portal.co.ao';
  const license = TrialEngine.getLicense(authUser?.uid || 'usr-public-001', displayEmail);
  const evalState = TrialEngine.evaluateState(license);

  const navCategories = [
    {
      group: 'Public Portal (8 Domínios)',
      items: [
        { id: 'inicio', label: 'Home', icon: Home },
        { id: 'chamadas', label: 'Phone', icon: PhoneCall, badge: calls.length },
        { id: 'mensagens', label: 'Messages', icon: MessageSquare, badge: messages.length },
        { id: 'notificacoes', label: 'Notifications', icon: Bell, badge: notifications.length },
        { id: 'dispositivos', label: 'Devices', icon: Grid, badge: activeDevices.length },
        { id: 'favoritos', label: 'Favorites', icon: Star },
        { id: 'pesquisa', label: 'Search', icon: Search },
        { id: 'definicoes', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 font-sans text-slate-100 select-none pb-12">
      
      {/* TAB: INÍCIO — HOME MOBILE CLEAN (DEFAULT) */}
      {(activeTab === 'inicio' || !activeTab) && (
        <div className="flex flex-col items-center justify-center py-2">
          <MobileHomeView
            onNavigateTab={(tabId) => setActiveTab(tabId as any)}
            unreadMessagesCount={messages.filter(m => !m.isFavorite).length}
            unreadNotifsCount={notifications.filter(n => !n.isRead).length}
            activeDevicesCount={activeDevices.length}
            primaryDeviceName={primaryDevice.name}
            batteryLevel={primaryDevice.batteryLevel ?? 98}
            isOnline={isOnline}
            daysRemaining={evalState.daysRemaining}
            onOpenMenu={onSimulateEvent}
          />
        </div>
      )}

      {/* OUTROS MÓDULOS (WRAPPER CARD DEDICADO) */}
      {activeTab !== 'inicio' && activeTab && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          {/* TAB: MEU DISPOSITIVO */}
          {activeTab === 'meu_dispositivo' && (
              <div className="space-y-6">
                
                {/* Header / Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{primaryDevice.name}</h3>
                      <p className="text-xs font-mono text-slate-400">{primaryDevice.model}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        const now = Date.now();
                        primaryDevice.lastSync = now;
                        onSimulateEvent?.();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Forçar Sincronização</span>
                    </button>
                  </div>
                </div>

                {/* Grid 1: Online Status, Bateria e Última Sincronização */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Estado Online / Offline */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Estado de Conexão</span>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm font-black text-emerald-400">ONLINE</span>
                      </div>
                      <Wifi className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">Conectado via Wi-Fi / LTE</p>
                  </div>

                  {/* Bateria */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Nível de Bateria</span>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-black text-amber-400">{primaryDevice.batteryLevel ?? 98}%</span>
                      <Battery className="w-4 h-4 text-amber-400" />
                    </div>
                    {/* Visual Battery Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full" style={{ width: `${primaryDevice.batteryLevel ?? 98}%` }}></div>
                    </div>
                  </div>

                  {/* Última Sincronização */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Última Sincronização</span>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-mono font-black text-indigo-300">
                        {new Date(primaryDevice.lastSync).toLocaleTimeString('pt-BR')}
                      </span>
                      <RefreshCw className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-emerald-400 font-mono font-bold">● Sync em Tempo Real Ativo</p>
                  </div>

                </div>

                {/* Seção 2: Permissões do Agente Android */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Permissões do Agente Móvel</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      4/4 CONCEDIDAS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-slate-300">Leitura de SMS</span>
                      <span className="text-emerald-400 font-mono font-extrabold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ATIVO</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-slate-300">Captura de Notificações</span>
                      <span className="text-emerald-400 font-mono font-extrabold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ATIVO</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-slate-300">Registo de Chamadas</span>
                      <span className="text-emerald-400 font-mono font-extrabold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ATIVO</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <span className="font-bold text-slate-300">Serviço de Acessibilidade</span>
                      <span className="text-emerald-400 font-mono font-extrabold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ATIVO</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seção 3: Diagnóstico do Dispositivo */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Diagnóstico e Saúde do Sistema</h4>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      100% OPERACIONAL
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-slate-400 font-medium">Latência da Rede WebSocket:</span>
                      <span className="font-mono text-emerald-400 font-bold">18 ms</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-slate-400 font-medium">Conexão Firestore Realtime:</span>
                      <span className="font-mono text-emerald-400 font-bold">Estável (Sincronizado)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-slate-400 font-medium">Motor de Camuflagem (Calculadora):</span>
                      <span className="font-mono text-indigo-300 font-bold">Pronto / Ativo</span>
                    </div>
                  </div>
                </div>

                {/* Seção 4: Ação de Sincronização Forçada */}
                <div className="bg-gradient-to-r from-indigo-950/60 to-slate-950 p-5 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Sincronização Manual Forçada</h4>
                    <p className="text-[11px] text-slate-400">Solicita ao agente Android a transmissão imediata de novos logs e estados.</p>
                  </div>

                  <button
                    onClick={() => {
                      const now = Date.now();
                      primaryDevice.lastSync = now;
                      onSimulateEvent?.();
                    }}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Sincronizar Agora</span>
                  </button>
                </div>

              </div>
            )}

            {/* TAB: MENSAGENS */}
            {activeTab === 'mensagens' && (() => {
              const filteredMessages = messages.filter((msg) => {
                // Filter by sub-tab
                if (msgSubTab === 'sms' && msg.type !== 'sms' && !msg.title.toLowerCase().includes('sms')) {
                  return false;
                }
                if (msgSubTab === 'conversas' && msg.type === 'sms' && !msg.title.toLowerCase().includes('whatsapp') && !msg.title.toLowerCase().includes('telegram')) {
                  return false;
                }
                if (msgSubTab === 'arquivos' && !msg.isFavorite) {
                  return false;
                }

                // Filter by Search Query
                if (searchQuery.trim()) {
                  const query = searchQuery.toLowerCase();
                  const matchesTitle = msg.title.toLowerCase().includes(query);
                  const matchesDetail = msg.detail.toLowerCase().includes(query);
                  return matchesTitle || matchesDetail;
                }

                return true;
              });

              return (
                <div className="space-y-5">
                  
                  {/* Header & Control Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Centro de Mensagens & SMS</h3>
                        <p className="text-[11px] text-slate-400">Mensagens capturadas e sincronizadas do dispositivo móvel</p>
                      </div>
                    </div>

                    <button 
                      onClick={onSimulateEvent}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Simular Nova Mensagem</span>
                    </button>
                  </div>

                  {/* Campo de Pesquisa & Sub-abas de Filtro */}
                  <div className="space-y-3">
                    
                    {/* Pesquisa */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar por contacto, número ou conteúdo da mensagem..."
                        className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sub-abas (Todas / SMS / Conversas / Arquivos) */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        onClick={() => setMsgSubTab('todas')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          msgSubTab === 'todas'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Todas ({messages.length})</span>
                      </button>

                      <button
                        onClick={() => setMsgSubTab('sms')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          msgSubTab === 'sms'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                        <span>SMS ({messages.filter(m => m.type === 'sms' || m.title.toLowerCase().includes('sms')).length})</span>
                      </button>

                      <button
                        onClick={() => setMsgSubTab('conversas')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          msgSubTab === 'conversas'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Conversas ({messages.filter(m => m.type !== 'sms' || m.title.toLowerCase().includes('whatsapp') || m.title.toLowerCase().includes('telegram')).length})</span>
                      </button>

                      <button
                        onClick={() => setMsgSubTab('arquivos')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          msgSubTab === 'arquivos'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-400" />
                        <span>Arquivos / Guardadas ({messages.filter(m => m.isFavorite).length})</span>
                      </button>
                    </div>

                  </div>

                  {/* Lista de Mensagens */}
                  <div className="space-y-2.5">
                    {filteredMessages.length > 0 ? (
                      filteredMessages.map((msg) => (
                        <SwipeableEventCard
                          key={msg.id}
                          event={msg}
                          onDelete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
                          onToggleFavorite={(id) => setMessages(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m))}
                        />
                      ))
                    ) : (
                      <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <span className="block text-sm font-bold text-slate-300">Nenhuma mensagem encontrada</span>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Não existem mensagens correspondentes aos filtros selecionados.
                          </p>
                        </div>
                        {(searchQuery || msgSubTab !== 'todas') && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setMsgSubTab('todas');
                            }}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-xl text-xs font-bold border border-slate-800 transition-all cursor-pointer"
                          >
                            Limpar Filtros
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}

            {/* TAB: CHAMADAS */}
            {activeTab === 'chamadas' && (() => {
              // Filter calls or contacts based on subTab & search query
              const query = searchQuery.toLowerCase().trim();

              const filteredCalls = calls.filter((call) => {
                // Filter by subTab
                if (callSubTab === 'recebidas' && call.type !== 'Recebida') return false;
                if (callSubTab === 'efetuadas' && call.type !== 'Efetuada') return false;
                if (callSubTab === 'perdidas' && call.type !== 'Perdida') return false;

                // Search query
                if (query) {
                  const matchName = call.name.toLowerCase().includes(query);
                  const matchNumber = call.number.toLowerCase().includes(query);
                  return matchName || matchNumber;
                }
                return true;
              });

              const filteredContacts = contacts.filter((c) => {
                if (!query) return true;
                return c.name.toLowerCase().includes(query) || c.phone.toLowerCase().includes(query) || c.category.toLowerCase().includes(query);
              });

              return (
                <div className="space-y-5">
                  
                  {/* Header & Control Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Registo de Chamadas & Contactos</h3>
                        <p className="text-[11px] text-slate-400">Histórico de chamadas efetuadas, recebidas, perdidas e agenda de contactos</p>
                      </div>
                    </div>

                    <button 
                      onClick={onSimulateEvent}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Simular Chamada</span>
                    </button>
                  </div>

                  {/* Campo de Pesquisa & Sub-abas (Histórico / Recebidas / Efetuadas / Perdidas / Contactos) */}
                  <div className="space-y-3">
                    
                    {/* Pesquisa */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar por nome ou número de telefone..."
                        className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sub-abas (Phone: Dialer / Calls / Contacts) */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        onClick={() => {
                          setCallSubTab('dialer');
                          InputEngine.openKeyboard('dialer');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          callSubTab === 'dialer'
                            ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-md font-black ring-1 ring-emerald-400/40'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Dialer (Teclado)</span>
                      </button>

                      <button
                        onClick={() => setCallSubTab('historico')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          callSubTab === 'historico' || callSubTab === 'recebidas' || callSubTab === 'efetuadas' || callSubTab === 'perdidas'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Calls / Histórico ({calls.length})</span>
                      </button>

                      <button
                        onClick={() => setCallSubTab('contactos')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          callSubTab === 'contactos'
                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 font-black'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Contact className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Contacts / Contactos ({contacts.length})</span>
                      </button>
                    </div>

                  </div>

                  {/* Conteúdo: Dialer / Lista de Chamadas / Lista de Contactos */}
                  {callSubTab === 'dialer' ? (
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center space-y-4 max-w-sm mx-auto shadow-2xl">
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                        <span className="text-xl font-mono font-black tracking-widest text-emerald-400">
                          {InputEngine.getBuffer() || 'Aguardando número...'}
                        </span>
                        {InputEngine.getBuffer() && (
                          <button
                            onClick={() => InputEngine.backspace()}
                            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                          <button
                            key={digit}
                            onClick={() => InputEngine.typeDigit(digit)}
                            className="py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-600 text-slate-100 font-mono font-black text-lg border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow"
                          >
                            {digit}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-center space-x-3">
                        <button
                          onClick={() => {
                            if (InputEngine.getBuffer()) {
                              onSimulateEvent?.();
                              InputEngine.clearBuffer();
                            }
                          }}
                          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>Efetuar Chamada</span>
                        </button>
                      </div>
                    </div>
                  ) : callSubTab !== 'contactos' ? (
                    <div className="space-y-2">
                      {filteredCalls.length > 0 ? (
                        filteredCalls.map((call) => {
                          const isMissed = call.type === 'Perdida';
                          const isReceived = call.type === 'Recebida';

                          return (
                            <div key={call.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2.5 rounded-xl border ${
                                  isMissed 
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                    : isReceived 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                }`}>
                                  {isMissed && <PhoneMissed className="w-4 h-4" />}
                                  {isReceived && <PhoneIncoming className="w-4 h-4" />}
                                  {!isMissed && !isReceived && <PhoneOutgoing className="w-4 h-4" />}
                                </div>
                                <div>
                                  <span className={`block text-xs font-extrabold ${isMissed ? 'text-rose-400' : 'text-white'}`}>
                                    {call.name}
                                  </span>
                                  <span className="block text-[11px] font-mono text-slate-400">
                                    {call.number} • <strong className={isMissed ? 'text-rose-400' : isReceived ? 'text-emerald-400' : 'text-indigo-400'}>{call.type}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="text-right font-mono text-xs text-slate-400">
                                <div>{call.time}</div>
                                <div className="text-[10px] text-slate-500">{call.duration}</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                            <PhoneCall className="w-6 h-6" />
                          </div>
                          <span className="block text-sm font-bold text-slate-300">Nenhuma chamada encontrada</span>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Não existem registos de chamadas para o filtro selecionado.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Lista de Contactos */
                    <div className="space-y-2">
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                          <div key={contact.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black text-xs">
                                {contact.name.charAt(0)}
                              </div>
                              <div>
                                <span className="block text-xs font-extrabold text-white">{contact.name}</span>
                                <span className="block text-[11px] font-mono text-slate-400">{contact.phone}</span>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800">
                              {contact.category}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                            <Contact className="w-6 h-6" />
                          </div>
                          <span className="block text-sm font-bold text-slate-300">Nenhum contacto encontrado</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })()}

            {/* TAB: NOTIFICAÇÕES */}
            {activeTab === 'notificacoes' && (() => {
              const query = searchQuery.toLowerCase().trim();
              const unreadCount = notifications.filter(n => !n.isRead).length;

              // Extract unique app names for the "Aplicações" filter
              const uniqueApps = Array.from(new Set(notifications.map(n => n.app)));

              // Filter notifications
              const filteredNotifications = notifications.filter((notif) => {
                // Sub-tab filter
                if (notifSubTab === 'nao_lidas' && notif.isRead) return false;
                if (notifSubTab === 'aplicacoes' && selectedNotifApp !== 'todos' && notif.app !== selectedNotifApp) return false;

                // Search query filter
                if (query) {
                  const matchApp = notif.app.toLowerCase().includes(query);
                  const matchTitle = notif.title.toLowerCase().includes(query);
                  const matchBody = notif.body.toLowerCase().includes(query);
                  const matchCat = (notif.category || '').toLowerCase().includes(query);
                  return matchApp || matchTitle || matchBody || matchCat;
                }

                return true;
              });

              const markAllAsRead = () => {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
              };

              const toggleReadStatus = (id: string) => {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
              };

              const deleteNotification = (id: string) => {
                setNotifications(prev => prev.filter(n => n.id !== id));
              };

              return (
                <div className="space-y-5">
                  
                  {/* Header & Control Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Centro de Notificações das Aplicações</h3>
                        <p className="text-[11px] text-slate-400">Notificações push sincronizadas em tempo real com o dispositivo móvel</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Marcar lidas ({unreadCount})</span>
                        </button>
                      )}

                      <button 
                        onClick={onSimulateEvent}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Simular Notificação</span>
                      </button>
                    </div>
                  </div>

                  {/* Campo de Pesquisa & Sub-abas (Todas / Não lidas / Aplicações) */}
                  <div className="space-y-3">
                    
                    {/* Pesquisa */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar por aplicação, título ou conteúdo da notificação..."
                        className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sub-abas */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        onClick={() => {
                          setNotifSubTab('todas');
                          setSelectedNotifApp('todos');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          notifSubTab === 'todas'
                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 font-black'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Todas ({notifications.length})</span>
                      </button>

                      <button
                        onClick={() => setNotifSubTab('nao_lidas')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          notifSubTab === 'nao_lidas'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        <span>Não Lidas ({unreadCount})</span>
                      </button>

                      <button
                        onClick={() => setNotifSubTab('aplicacoes')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          notifSubTab === 'aplicacoes'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Por Aplicação ({uniqueApps.length})</span>
                      </button>
                    </div>

                    {/* Filtro secundário por Aplicação (quando na sub-aba Aplicações) */}
                    {notifSubTab === 'aplicacoes' && (
                      <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
                        <button
                          onClick={() => setSelectedNotifApp('todos')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedNotifApp === 'todos'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          Todas as App
                        </button>
                        {uniqueApps.map((appName) => (
                          <button
                            key={appName}
                            onClick={() => setSelectedNotifApp(appName)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                              selectedNotifApp === appName
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {appName} ({notifications.filter(n => n.app === appName).length})
                          </button>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Lista de Notificações */}
                  <div className="space-y-2.5">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 rounded-2xl border transition-all space-y-1.5 relative group ${
                            !notif.isRead
                              ? 'bg-slate-950 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                              : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                              )}
                              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">{notif.app}</span>
                              {notif.category && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800">
                                  {notif.category}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono text-slate-500">{notif.time}</span>
                              <button
                                onClick={() => toggleReadStatus(notif.id)}
                                title={notif.isRead ? "Marcar como não lida" : "Marcar como lida"}
                                className="text-slate-500 hover:text-cyan-400 p-1 cursor-pointer transition-colors"
                              >
                                <CheckCheck className={`w-3.5 h-3.5 ${notif.isRead ? 'text-slate-600' : 'text-cyan-400'}`} />
                              </button>
                              <button
                                onClick={() => deleteNotification(notif.id)}
                                title="Eliminar notificação"
                                className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <span className="block text-xs font-extrabold text-white">{notif.title}</span>
                          <p className="text-xs text-slate-300 leading-relaxed">{notif.body}</p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                          <BellOff className="w-6 h-6" />
                        </div>
                        <span className="block text-sm font-bold text-slate-300">Nenhuma notificação encontrada</span>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Não existem notificações correspondentes aos filtros selecionados.
                        </p>
                        {(searchQuery || notifSubTab !== 'todas' || selectedNotifApp !== 'todos') && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setNotifSubTab('todas');
                              setSelectedNotifApp('todos');
                            }}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded-xl text-xs font-bold border border-slate-800 transition-all cursor-pointer"
                          >
                            Limpar Filtros
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}

            {/* TAB: CONTACTOS */}
            {activeTab === 'contactos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Lista de Contactos Sincronizados ({contacts.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block text-xs font-extrabold text-white">{contact.name}</span>
                          <span className="block text-[11px] font-mono text-slate-400">{contact.phone}</span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-400">
                        {contact.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: DISPOSITIVOS */}
            {activeTab === 'dispositivos' && (
              <DevicesView
                devices={activeDevices}
                onAddDevice={onAddDevice || (() => {})}
                onRemoveDevice={onRemoveDevice || (() => {})}
                onSimulateEvent={onSimulateEvent || (() => {})}
              />
            )}

            {/* TAB: ATIVIDADE */}
            {activeTab === 'atividade' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Registo Global de Atividade (Timeline & Eventos)</span>
                  </h3>
                  <button
                    onClick={() => exportEventsToCsv(messages)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Exportar CSV</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {messages.map((msg) => (
                    <SwipeableEventCard
                      key={msg.id}
                      event={msg}
                      onDelete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
                      onToggleFavorite={(id) => setMessages(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB: FAVORITOS (★ — Favorites) */}
            {activeTab === 'favoritos' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    <span>★ Favoritos (Contactos, Conversas, Dispositivos & Ações)</span>
                  </h3>
                </div>

                {/* 1. Conversas & Mensagens Favoritas */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">Conversas & Mensagens Favoritas</h4>
                  {messages.filter(m => m.isFavorite).length > 0 ? (
                    messages.filter(m => m.isFavorite).map((msg) => (
                      <SwipeableEventCard
                        key={msg.id}
                        event={msg}
                        onDelete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
                        onToggleFavorite={(id) => setMessages(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m))}
                      />
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
                      Nenhuma mensagem marcada como favorita. Toque na estrela de qualquer mensagem para fixar aqui.
                    </div>
                  )}
                </div>

                {/* 2. Dispositivos Favoritos */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider">Dispositivos Principais Favoritos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeDevices.map((dev) => (
                      <div key={dev.id} className="p-3.5 bg-slate-950 rounded-2xl border border-purple-500/30 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-white">{dev.name}</span>
                            <span className="block text-[10px] font-mono text-slate-400">{dev.model} • {dev.batteryLevel}% Bateria</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                          {dev.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Ações Rápidas Favoritas */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">Ações Favoritas Rápidas</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      onClick={onSimulateEvent}
                      className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left space-y-1.5 transition-all cursor-pointer group"
                    >
                      <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="block text-xs font-bold text-slate-200">Simular Evento</span>
                      <span className="block text-[10px] text-slate-500">Enviar push/sms teste</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('dispositivos')}
                      className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-left space-y-1.5 transition-all cursor-pointer group"
                    >
                      <RefreshCw className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="block text-xs font-bold text-slate-200">Sincronizar Mesh</span>
                      <span className="block text-[10px] text-slate-500">Forçar batimento cardiaco</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('notificacoes')}
                      className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left space-y-1.5 transition-all cursor-pointer group"
                    >
                      <Bell className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="block text-xs font-bold text-slate-200">Notificações</span>
                      <span className="block text-[10px] text-slate-500">Ver todas as não lidas</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('seguranca')}
                      className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-left space-y-1.5 transition-all cursor-pointer group"
                    >
                      <ShieldCheck className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                      <span className="block text-xs font-bold text-slate-200">Segurança</span>
                      <span className="block text-[10px] text-slate-500">Sessões e Chaves</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PESQUISA (⌕ — Search Universal) */}
            {activeTab === 'pesquisa' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>⌕ Pesquisa Universal (Mensagens, Chamadas, Notificações, Contactos & Hardware)</span>
                  </h3>
                </div>

                {/* Input de Pesquisa Universal */}
                <div className="relative">
                  <Search className="w-5 h-5 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar em mensagens, chamadas, contactos, notificações ou dispositivos..."
                    className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner font-sans"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Resultados Filtrados */}
                <div className="space-y-4 pt-2">
                  {/* Result Section 1: Mensagens */}
                  {messages.filter(m => !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.detail.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Mensagens ({messages.filter(m => !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.detail.toLowerCase().includes(searchQuery.toLowerCase())).length})</span>
                      </h4>
                      <div className="space-y-2">
                        {messages
                          .filter(m => !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.detail.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(m => (
                            <SwipeableEventCard
                              key={m.id}
                              event={m}
                              onDelete={(id) => setMessages(prev => prev.filter(item => item.id !== id))}
                              onToggleFavorite={(id) => setMessages(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Result Section 2: Contactos */}
                  {contacts.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Contactos Encontrados</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {contacts
                          .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))
                          .map(c => (
                            <div key={c.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="block text-xs font-bold text-white">{c.name}</span>
                                <span className="block text-[11px] font-mono text-slate-400">{c.phone}</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {c.category}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Result Section 3: Notificações */}
                  {notifications.filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.body.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Bell className="w-3.5 h-3.5" />
                        <span>Notificações</span>
                      </h4>
                      <div className="space-y-2">
                        {notifications
                          .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.body.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(n => (
                            <div key={n.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-mono text-amber-400 font-bold">{n.app} • {n.time}</span>
                                <h5 className="text-xs font-bold text-white">{n.title}</h5>
                                <p className="text-[11px] text-slate-300">{n.body}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* TAB: CONTA & ESTADO GLOBAL DA SUBSCRIÇÃO */}
            {(activeTab === 'conta' || (activeTab as string) === 'subscricao') && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Informações da Conta & Estado Global</span>
                  </h3>
                  <button
                    onClick={() => logout()}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>

                {/* 1. ESTADO GLOBAL DA SUBSCRIÇÃO (NO TOPO DA CONTA) */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  !evalState.active
                    ? 'bg-rose-950/70 border-rose-500/80 text-rose-200 shadow-xl shadow-rose-950/50'
                    : license.lifetime
                      ? 'bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-cyan-500/10 border-amber-500/40 text-slate-100 shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-xl ${
                        !evalState.active
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Estado Global da Subscrição</h4>
                        <p className="text-[10px] text-slate-400">Estado de Licenciamento da Conta</p>
                      </div>
                    </div>

                    {/* Badge de Estado */}
                    {!evalState.active ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] tracking-wider uppercase animate-bounce shadow">
                        Subscrição Expirada
                      </span>
                    ) : license.lifetime ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[10px] tracking-wider uppercase shadow">
                        Licença Vitalícia
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-[10px] tracking-wider uppercase">
                        Ativa ({evalState.daysRemaining}d restantes)
                      </span>
                    )}
                  </div>

                  <div className="pt-3 space-y-3">
                    {!evalState.active ? (
                      <div className="space-y-3">
                        <div className="bg-rose-900/40 border border-rose-500/50 p-3.5 rounded-xl space-y-1">
                          <h5 className="text-xs font-black text-white flex items-center space-x-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Subscrição expirada</span>
                          </h5>
                          <p className="text-[11px] text-rose-200 leading-snug">
                            O seu período de utilização expirou. Renove sua subscrição para manter a sincronização em tempo real e acesso a todas as funcionalidades do sistema.
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            const userId = authUser?.uid || 'usr-public-001';
                            TrialEngine.modifyLicense(userId, '+30d', 'Renovação Manual efetuada na Conta');
                            window.location.reload();
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Renove sua subscrição</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Plano Atual</span>
                            <span className="font-extrabold text-amber-400 uppercase">{license.plan || 'Premium'}</span>
                          </div>
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Validade</span>
                            <span className="font-mono text-slate-200">
                              {license.lifetime ? 'Ilimitada (Vitalício)' : `${evalState.daysRemaining} dias restantes`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => {
                              const userId = authUser?.uid || 'usr-public-001';
                              TrialEngine.modifyLicense(userId, '+30d', 'Renovação estendida pelo utilizador');
                              window.location.reload();
                            }}
                            className="text-[11px] font-mono text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Renove sua subscrição (+30 Dias)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. INFORMAÇÕES DA CONTA DO UTILIZADOR */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Detalhes do Perfil</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Email:</span>
                    <span className="text-xs font-mono text-indigo-300">{displayEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Estado da Conta:</span>
                    <span className={`text-xs font-bold ${evalState.active ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {evalState.active ? 'Ativo' : 'Subscrição Expirada'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SEGURANÇA */}
            {activeTab === 'seguranca' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Segurança & Encriptação</span>
                  </h3>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Camuflagem (Calculadora):</span>
                    <span className="text-xs font-bold text-emerald-400">Ativada</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Encriptação de Dados:</span>
                    <span className="text-xs font-mono text-cyan-300">AES-256 / RSA-4096</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRIVACIDADE */}
            {activeTab === 'privacidade' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Privacidade & Permissões</span>
                  </h3>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold">Acesso a Contactos Locais:</span>
                    <span className="text-emerald-400 font-mono font-bold">Autorizado</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold">Ocultar Número de Telefone:</span>
                    <span className="text-cyan-400 font-mono font-bold">Ativado</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold">Registos de Atividade Anónimos:</span>
                    <span className="text-emerald-400 font-mono font-bold">Sim</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SESSÕES */}
            {activeTab === 'sessoes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>Sessões Ativas</span>
                  </h3>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <span className="block font-bold text-white">Sessão Atual (Navegador Web)</span>
                      <span className="block text-[10px] font-mono text-slate-400">Lisboa, Portugal • Chrome / PWA</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                      Ativa Agora
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: APARÊNCIA */}
            {activeTab === 'aparencia' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Aparência & Temas</span>
                  </h3>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-slate-300 font-bold block">Tema Visual do Sistema</span>
                    <span className="text-slate-400 text-[11px] block">
                      Ajuste temas, wallpapers e visual no ecrã de início através das opções de personalização da Home.
                    </span>
                    <button
                      onClick={() => setActiveTab('inicio')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
                    >
                      Ir para Personalização da Home
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ARQUITETURA */}
            {activeTab === 'arquitetura' && (
              <SystemArchitectureDiagram />
            )}

            {/* TAB: DEFINIÇÕES */}
            {activeTab === 'definicoes' && (
              <SettingsView />
            )}
        </div>
      )}

    </div>
  );
};
