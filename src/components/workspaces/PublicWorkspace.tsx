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
  FileSpreadsheet,
  X,
  Sparkles,
  Wifi,
  Battery,
  Send,
  RefreshCw
} from 'lucide-react';
import { useIdentity } from '../../engine/identityEngine';
import { TrialEngine } from '../../services/trialEngine';
import { exportEventsToCsv } from '../../lib/csvExporter';
import { SwipeableEventCard, DeviceEvent } from '../SwipeableEventCard';
import { DevicesView } from '../DevicesView';
import { QRCodePairing } from '../QRCodePairing';
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
    lastSync: Date.now() - 2 * 60 * 1000,
    online: true,
    batteryLevel: 88,
    pairedAt: Date.now() - 7 * 24 * 3600 * 1000
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
  | 'conta'
  | 'subscricao'
  | 'seguranca'
  | 'definicoes';

export const PublicWorkspace: React.FC<PublicWorkspaceProps> = ({
  onOpenAuthModal,
  devices,
  onAddDevice,
  onRemoveDevice,
  onSimulateEvent
}) => {
  const { user: authUser, profile: userProfile, loginWithGoogle, logout } = useIdentity();
  
  const isAuthenticated = Boolean(authUser || userProfile);
  const activeDevices = devices && devices.length > 0 ? devices : defaultDevicesList;
  const hasDevice = isAuthenticated ? activeDevices.length > 0 : false;

  const [activeTab, setActiveTab] = useState<PublicTabType>('inicio');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    }
  ]);

  const [calls, setCalls] = useState([
    { id: 'call-1', name: 'Carlos Eduardo', number: '+244 912 345 678', type: 'Perdida', time: '14:22', duration: '0 min' },
    { id: 'call-2', name: 'Suporte Técnico', number: '+244 923 888 999', type: 'Recebida', time: '11:05', duration: '4 min 12s' },
    { id: 'call-3', name: 'Ana Beatriz', number: '+244 944 111 222', type: 'Efetuada', time: 'Ontem', duration: '1 min 45s' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 'notif-1', app: 'Banco do Brasil', title: 'Pix Recebido', body: 'Você recebeu R$ 450,00 de Carlos Santos.', time: 'Há 10 min' },
    { id: 'notif-2', app: 'Instagram', title: 'Novo Curtiu', body: 'lucas_dev curtiu a sua publicação.', time: 'Há 35 min' },
    { id: 'notif-3', app: 'Gmail', title: 'Alerta de Início de Sessão', body: 'Novo acesso detetado no seu smartphone.', time: 'Há 2h' }
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
      group: 'Visão Geral',
      items: [
        { id: 'inicio', label: 'Início', icon: Home },
        { id: 'meu_dispositivo', label: 'Meu Dispositivo', icon: Smartphone }
      ]
    },
    {
      group: 'Comunicação',
      items: [
        { id: 'mensagens', label: 'Mensagens', icon: MessageSquare, badge: messages.length },
        { id: 'chamadas', label: 'Chamadas', icon: PhoneCall, badge: calls.length },
        { id: 'notificacoes', label: 'Notificações', icon: Bell, badge: notifications.length },
        { id: 'contactos', label: 'Contactos', icon: Users, badge: contacts.length }
      ]
    },
    {
      group: 'Gestão',
      items: [
        { id: 'dispositivos', label: 'Dispositivos', icon: Grid, badge: activeDevices.length },
        { id: 'atividade', label: 'Atividade', icon: Activity }
      ]
    },
    {
      group: 'Conta & Definições',
      items: [
        { id: 'conta', label: 'Conta', icon: User },
        { id: 'subscricao', label: 'Subscrição', icon: CreditCard },
        { id: 'seguranca', label: 'Segurança', icon: ShieldCheck },
        { id: 'definicoes', label: 'Definições', icon: Settings }
      ]
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans text-slate-100 select-none pb-12">
      
      {/* ── STATE 1: NÃO AUTENTICADO ── */}
      {!isAuthenticated && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-500/20 ring-1 ring-white/20">
            <Zap className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-white tracking-tight">PORTALTRMOBILE</h2>
            <p className="text-sm text-slate-400">
              Sistema Operacional de Comunicação e Gestão de Dispositivos Móveis.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 max-w-sm mx-auto space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Estado do Utilizador</span>
              <p className="text-sm font-extrabold text-white">NÃO AUTENTICADO</p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                onClick={onOpenAuthModal}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                <span>Entrar / Criar Conta</span>
              </button>

              <button
                onClick={() => loginWithGoogle()}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continuar com Google</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 2: AUTENTICADO SEM DISPOSITIVO ── */}
      {isAuthenticated && !hasDevice && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Configurar Primeiro Dispositivo</h2>
                <p className="text-xs text-slate-400">Emparelhe o seu smartphone Android para ativar o Workspace Móvel</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
              SEM DISPOSITIVO
            </span>
          </div>

          <QRCodePairing
            onPairingComplete={() => {
              if (onAddDevice) {
                onAddDevice({
                  name: 'Smartphone Android Emparelhado',
                  model: 'Android Device',
                  online: true
                });
              }
            }}
          />
        </div>
      )}

      {/* ── STATE 3: AUTENTICADO COM DISPOSITIVO (WORKSPACE MÓVEL COMPLETE PORTAL) ── */}
      {isAuthenticated && hasDevice && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-black text-white tracking-tight">PORTALTRMOBILE</h1>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-slate-400">Workspace Móvel • {primaryDevice.name || 'Dispositivo Ativo'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-between sm:justify-start">
              <span className="flex items-center space-x-1">
                <Battery className="w-3.5 h-3.5 text-amber-400" />
                <span>{primaryDevice.batteryLevel ?? 98}%</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sync OK</span>
              </span>
            </div>
          </div>

          {/* Navigation Bar / Tabs Selection Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {navCategories.flatMap(group => group.items).map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as PublicTabType)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                      <span className="text-xs font-bold truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-300 border border-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            
            {/* TAB: INÍCIO */}
            {activeTab === 'inicio' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 space-y-3">
                  <h3 className="text-sm font-black text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Bem-vindo ao PortalTRMobile</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Acompanhe em tempo real as comunicações, estado da bateria, mensagens e eventos sincronizados com o seu dispositivo móvel.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div 
                    onClick={() => setActiveTab('mensagens')}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5 text-indigo-400 mx-auto" />
                    <span className="block text-lg font-black text-white">{messages.length}</span>
                    <span className="block text-[11px] text-slate-400 font-bold">Mensagens</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('chamadas')}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-5 h-5 text-amber-400 mx-auto" />
                    <span className="block text-lg font-black text-white">{calls.length}</span>
                    <span className="block text-[11px] text-slate-400 font-bold">Chamadas</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('notificacoes')}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <Bell className="w-5 h-5 text-cyan-400 mx-auto" />
                    <span className="block text-lg font-black text-white">{notifications.length}</span>
                    <span className="block text-[11px] text-slate-400 font-bold">Notificações</span>
                  </div>

                  <div 
                    onClick={() => setActiveTab('dispositivos')}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1 hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-5 h-5 text-emerald-400 mx-auto" />
                    <span className="block text-lg font-black text-white">{activeDevices.length}</span>
                    <span className="block text-[11px] text-slate-400 font-bold">Dispositivos</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MEU DISPOSITIVO */}
            {activeTab === 'meu_dispositivo' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <span>Detalhes do Dispositivo Principal</span>
                  </h3>
                  <button 
                    onClick={onSimulateEvent}
                    className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Testar Evento</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Nome:</span>
                    <span className="text-xs font-extrabold text-white">{primaryDevice.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Modelo & OS:</span>
                    <span className="text-xs font-mono text-indigo-300">{primaryDevice.model}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Nível de Bateria:</span>
                    <span className="text-xs font-bold text-amber-400">{primaryDevice.batteryLevel ?? 98}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Sincronização:</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {new Date(primaryDevice.lastSync).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MENSAGENS */}
            {activeTab === 'mensagens' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Mensagens & SMS Capturadas ({messages.length})</span>
                  </h3>
                </div>

                <div className="space-y-2.5">
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

            {/* TAB: CHAMADAS */}
            {activeTab === 'chamadas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <PhoneCall className="w-4 h-4 text-amber-400" />
                    <span>Registo de Chamadas Telefónicas</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {calls.map((call) => (
                    <div key={call.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-extrabold text-white">{call.name}</span>
                          <span className="block text-[11px] font-mono text-slate-400">{call.number} • {call.type}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-slate-400">
                        <div>{call.time}</div>
                        <div className="text-[10px] text-slate-500">{call.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: NOTIFICAÇÕES */}
            {activeTab === 'notificacoes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span>Notificações de Aplicações ({notifications.length})</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">{notif.app}</span>
                        <span className="text-[10px] font-mono text-slate-500">{notif.time}</span>
                      </div>
                      <span className="block text-xs font-extrabold text-white">{notif.title}</span>
                      <p className="text-xs text-slate-400">{notif.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    <span>Registo Global de Atividade</span>
                  </h3>
                  <button
                    onClick={() => exportEventsToCsv(messages)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
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

            {/* TAB: CONTA */}
            {activeTab === 'conta' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Informações da Conta</span>
                  </h3>
                  <button
                    onClick={() => logout()}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Email:</span>
                    <span className="text-xs font-mono text-indigo-300">{displayEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Estado:</span>
                    <span className="text-xs font-bold text-emerald-400">Ativo</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SUBSCRIÇÃO */}
            {activeTab === 'subscricao' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Plano & Subscrição</span>
                  </h3>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Plano Atual:</span>
                    <span className="text-xs font-black text-amber-400 uppercase">{license.plan || 'Plano Padrão'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Validade:</span>
                    <span className="text-xs font-mono text-slate-300">
                      {license.lifetime ? 'Licença Vitalícia' : `${evalState.daysRemaining} dias restantes`}
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

            {/* TAB: DEFINIÇÕES */}
            {activeTab === 'definicoes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-slate-300" />
                    <span>Definições da Aplicação</span>
                  </h3>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Modo de Sincronização:</span>
                    <span className="text-xs font-mono text-indigo-300 font-bold">Tempo Real</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">Notificações Web Push:</span>
                    <span className="text-xs font-bold text-emerald-400">Ativadas</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
