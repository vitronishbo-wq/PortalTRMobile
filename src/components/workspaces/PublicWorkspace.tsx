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
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useIdentity } from '../../engine/identityEngine';
import { useOnlineStatus } from '../../lib/offlineCache';
import { TrialEngine } from '../../services/trialEngine';
import { exportEventsToCsv } from '../../lib/csvExporter';
import { VirtualPhoneCloudWorkspace } from '../VirtualPhoneCloudWorkspace';
import { SwipeableEventCard, DeviceEvent } from '../SwipeableEventCard';
import { DevicesView } from '../DevicesView';
import { SettingsView } from '../SettingsView';
import { SystemArchitectureDiagram } from '../SystemArchitectureDiagram';
import { MobileHomeView } from '../MobileHomeView';
import { LicenseManagementModal } from '../LicenseManagementModal';
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
  | 'chamadas'
  | 'mensagens'
  | 'contactos'
  | 'dispositivos'
  | 'notificacoes'
  | 'favoritos'
  | 'pesquisa'
  | 'definicoes'
  | 'conta';

export interface UserIdentity {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'founder' | 'admin' | 'supervisor' | 'operator' | 'auditor' | 'user';
  status: 'Active' | 'Suspended';
  lastAuthTimestamp: number;
  primaryDevice?: string;
  linkedDevicesCount?: number;
  virtualNumber?: string;
  carrier?: string;
  licenseType?: string;
}

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
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);
  const [licenseRefreshKey, setLicenseRefreshKey] = useState<number>(0);

  const normalizeTab = (tab: string): PublicTabType => {
    if (!tab) return 'inicio';
    const t = tab.toLowerCase();
    if (t === 'inicio' || t === 'home' || t === 'smartphone') return 'inicio';
    if (t === 'chamadas' || t === 'phone' || t === 'calls') return 'chamadas';
    if (t === 'mensagens' || t === 'messages' || t === 'sms') return 'mensagens';
    if (t === 'contactos' || t === 'contacts') return 'contactos';
    if (t === 'dispositivos' || t === 'devices' || t === 'meu_dispositivo') return 'dispositivos';
    if (t === 'notificacoes' || t === 'notifications') return 'notificacoes';
    if (t === 'favoritos' || t === 'favorites') return 'favoritos';
    if (t === 'pesquisa' || t === 'search') return 'pesquisa';
    if (t === 'definicoes' || t === 'settings') return 'definicoes';
    if (t === 'conta' || t === 'licenca' || t === 'plano' || t === 'billing' || t === 'subscricao') return 'conta';
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
  const [msgSubTab, setMsgSubTab] = useState<'todas' | 'sms' | 'favoritos'>('todas');
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

  // User Identities RBAC State
  const [userIdentities, setUserIdentities] = useState<UserIdentity[]>([
    {
      id: 'usr-root-001',
      name: 'Deus Fundador',
      email: 'silajaneiro9@gmail.com',
      role: 'founder',
      status: 'Active',
      lastAuthTimestamp: Date.now() - 2 * 60 * 1000
    },
    {
      id: 'usr-admin-002',
      name: 'Carlos Santos',
      email: 'carlos.santos@portal.co.ao',
      role: 'admin',
      status: 'Active',
      lastAuthTimestamp: Date.now() - 45 * 60 * 1000
    },
    {
      id: 'usr-client-003',
      name: 'Maria Silva',
      email: 'maria.silva@unitel.co.ao',
      role: 'user',
      status: 'Active',
      lastAuthTimestamp: Date.now() - 3 * 3600 * 1000
    },
    {
      id: 'usr-client-004',
      name: 'Lucas Pereira',
      email: 'lucas.dev@africell.co.ao',
      role: 'user',
      status: 'Suspended',
      lastAuthTimestamp: Date.now() - 24 * 3600 * 1000
    },
    {
      id: 'usr-client-005',
      name: 'Ana Beatriz',
      email: 'ana.beatriz@bai.co.ao',
      role: 'user',
      status: 'Active',
      lastAuthTimestamp: Date.now() - 12 * 60 * 1000
    }
  ]);

  // Fetch real-time user identities from Firestore 'users' collection
  useEffect(() => {
    if (!db) return;
    try {
      const usersRef = collection(db, 'users');
      const unsubscribe = onSnapshot(
        usersRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const fetchedUsers: UserIdentity[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                name: data.displayName || data.name || data.email?.split('@')[0] || docSnap.id,
                email: data.email || `${docSnap.id}@portal.co.ao`,
                role: (data.role as 'founder' | 'admin' | 'user') || 'user',
                status: (data.status as 'Active' | 'Suspended') || 'Active',
                lastAuthTimestamp: data.lastAuthTimestamp || data.lastLogin || data.updatedAt || Date.now()
              };
            });
            setUserIdentities(fetchedUsers);
          } else {
            // Seed initial records to Firestore 'users' collection
            const initialSeeds: UserIdentity[] = [
              { id: 'usr-root-001', name: 'Deus Fundador', email: 'silajaneiro9@gmail.com', role: 'founder', status: 'Active', lastAuthTimestamp: Date.now() - 2 * 60 * 1000 },
              { id: 'usr-admin-002', name: 'Carlos Santos', email: 'carlos.santos@portal.co.ao', role: 'admin', status: 'Active', lastAuthTimestamp: Date.now() - 45 * 60 * 1000 },
              { id: 'usr-client-003', name: 'Maria Silva', email: 'maria.silva@unitel.co.ao', role: 'user', status: 'Active', lastAuthTimestamp: Date.now() - 3 * 3600 * 1000 },
              { id: 'usr-client-004', name: 'Lucas Pereira', email: 'lucas.dev@africell.co.ao', role: 'user', status: 'Suspended', lastAuthTimestamp: Date.now() - 24 * 3600 * 1000 },
              { id: 'usr-client-005', name: 'Ana Beatriz', email: 'ana.beatriz@bai.co.ao', role: 'user', status: 'Active', lastAuthTimestamp: Date.now() - 12 * 60 * 1000 }
            ];
            initialSeeds.forEach((u) => {
              setDoc(doc(db, 'users', u.id), {
                displayName: u.name,
                email: u.email,
                role: u.role,
                status: u.status,
                lastAuthTimestamp: u.lastAuthTimestamp
              }, { merge: true }).catch(() => {});
            });
          }
        },
        (error) => {
          console.warn('[Firestore] Users subscription:', error);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.error('[Firestore] Users collection error:', e);
    }
  }, []);

  const handleToggleStatus = async (usr: UserIdentity) => {
    const newStatus: 'Active' | 'Suspended' = usr.status === 'Active' ? 'Suspended' : 'Active';
    setUserIdentities((prev) => prev.map((u) => (u.id === usr.id ? { ...u, status: newStatus } : u)));
    if (db) {
      try {
        await updateDoc(doc(db, 'users', usr.id), { status: newStatus });
      } catch (err) {
        await setDoc(doc(db, 'users', usr.id), {
          displayName: usr.name,
          email: usr.email,
          role: usr.role,
          status: newStatus,
          lastAuthTimestamp: usr.lastAuthTimestamp
        }, { merge: true }).catch(() => {});
      }
    }
  };

  const primaryDevice = activeDevices[0] || defaultDevicesList[0];

  const displayEmail = userProfile?.email || authUser?.email || 'utilizador@portal.co.ao';
  const license = TrialEngine.getLicense(authUser?.uid || 'usr-public-001', displayEmail);
  const evalState = TrialEngine.evaluateState(license);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 font-sans text-slate-100 select-none pb-12">
      
      {/* TAB: INÍCIO — INTERFACE SMARTPHONE (DEFAULT) */}
      {(activeTab === 'inicio' || !activeTab) && (
        <div className="flex flex-col items-center justify-center py-2">
          <MobileHomeView
            onNavigateTab={(tabId) => handleTabChange(normalizeTab(tabId))}
            unreadMessagesCount={messages.filter(m => !m.isFavorite).length}
            unreadNotifsCount={notifications.filter(n => !n.isRead).length}
            activeDevicesCount={activeDevices.length}
            primaryDeviceName={primaryDevice.name}
            batteryLevel={primaryDevice.batteryLevel ?? 98}
            isOnline={isOnline}
            daysRemaining={evalState.daysRemaining}
            onOpenMenu={onSimulateEvent}
            onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
          />
        </div>
      )}

      {/* COMMERCIAL CONTENT CONTAINER FOR OTHER TABS */}
      {activeTab !== 'inicio' && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          
          {/* Header Bar to return to Smartphone */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <button
              onClick={() => setActiveTab('inicio')}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Voltar ao Smartphone</span>
            </button>
            <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">
              {activeTab}
            </span>
          </div>

          {/* TAB: MENSAGENS */}
            {activeTab === 'mensagens' && (() => {
              const filteredMessages = messages.filter((msg) => {
                // Filter by sub-tab
                if (msgSubTab === 'sms' && msg.type !== 'sms' && !msg.title.toLowerCase().includes('sms')) {
                  return false;
                }
                if (msgSubTab === 'favoritos' && !msg.isFavorite) {
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

                    {/* Sub-abas (Todas / SMS / Favoritos) */}
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
                        onClick={() => setMsgSubTab('favoritos')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          msgSubTab === 'favoritos'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Favoritos ({messages.filter(m => m.isFavorite).length})</span>
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

            {/* TAB: CHAMADAS / CLOUD PHONE */}
            {activeTab === 'chamadas' && (
              <VirtualPhoneCloudWorkspace />
            )}

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
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Lista de Contactos Sincronizados ({contacts.length})</span>
                  </h3>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                        <th className="p-2">CONTACTO</th>
                        <th className="p-2">NÚMERO TELEFÓMICO</th>
                        <th className="p-2">CATEGORIA</th>
                        <th className="p-2 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                          <td className="p-2 font-bold text-slate-200">{contact.name}</td>
                          <td className="p-2 text-cyan-400 font-bold">{contact.phone}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                              {contact.category}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <button
                              onClick={() => {
                                handleTabChange('chamadas');
                              }}
                              className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 rounded text-[10px] font-bold uppercase cursor-pointer transition-all"
                            >
                              CHAMAR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      onClick={() => setActiveTab('definicoes')}
                      className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-left space-y-1.5 transition-all cursor-pointer group"
                    >
                      <Settings className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                      <span className="block text-xs font-bold text-slate-200">Definições</span>
                      <span className="block text-[10px] text-slate-500">Configurações do sistema</span>
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

            {/* TAB: DEFINIÇÕES */}
            {activeTab === 'definicoes' && (
              <SettingsView />
            )}

            {/* TAB: CONTA / LICENÇA / SUBSCRIÇÃO */}
            {activeTab === 'conta' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Gestão e Renovação de Licença</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {evalState.daysRemaining === 9999 ? 'Licença Vitalícia Ativa' : `${evalState.daysRemaining} dias restantes no período experimental / piloto`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsLicenseModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Abrir Painel de Renovação
                  </button>
                </div>
              </div>
            )}
        </div>
      )}

      {/* MODAL DE GESTÃO E RENOVAÇÃO DE LICENÇA */}
      <LicenseManagementModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        onLicenseUpdated={() => setLicenseRefreshKey(prev => prev + 1)}
      />
    </div>
  );
};
