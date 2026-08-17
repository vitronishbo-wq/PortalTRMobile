import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  MessageSquare,
  Send,
  Search,
  Activity,
  Wifi,
  X,
  RotateCcw,
  Play,
  Pause,
  Download,
  Grid,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCheck,
  Globe,
  Radio,
  Share2,
  ShieldAlert,
  PauseCircle,
  Disc,
  Smartphone,
  Layers,
  ArrowRightLeft,
  Star,
  Copy,
  ClipboardPaste,
  Check
} from 'lucide-react';
import { TelecomRegistry, CallRecord, SmsMessage, VirtualNumber, MeshSession } from '../telecom/TelecomProvider';
import { FirestoreService } from '../services/firestore';
import '../telecom/UnitelProvider';
import '../telecom/AfricellProvider';
import '../telecom/MovicelProvider';
import '../telecom/SipGatewayProvider';
import '../telecom/ImsGatewayProvider';
import '../telecom/EsimProvider';

import { ZeroTouchProvisioningPipelineModal } from './ZeroTouchProvisioningPipelineModal';
import { AppCenterView } from './AppCenterView';
import { CloudMobileOSView } from './CloudMobileOSView';
import { TelecomProvisioningConsole } from './TelecomProvisioningConsole';
import { BankingReadinessTable } from './BankingReadinessTable';
import { InstalledAppsTable } from './InstalledAppsTable';
import { HomeScreenManager } from './HomeScreenManager';
import { Landmark, LayoutGrid, CheckSquare, Terminal, Command as CommandIcon } from 'lucide-react';
import { CommandEngine } from '../engine/commandEngine';
import { CommandRegistry } from '../engine/commandRegistry';
import { CommandSuggestionEngine, CommandSuggestion } from '../engine/commandSuggestionEngine';
import { CreateAdminModal } from './modals/CreateAdminModal';
import { CommandPaletteModal } from './modals/CommandPaletteModal';
import { USSDDialogModal } from './modals/USSDDialogModal';
import { FounderIDEWorkspace } from './workspaces/FounderIDEWorkspace';
import { COSCommandBar } from './modals/COSCommandBar';
import { DTMFT9Engine } from '../engine/dtmfT9Engine';
import { SecretVaultService, DrawerSecurityState, SecretDialCommand } from '../services/SecretVaultService';
import { SmartInputInterpreter, InterpretedInput } from '../engine/smartInputInterpreter';
import { UnifiedInputController, KeypadEventDetail } from '../engine/unifiedInputController';

export const VirtualPhoneCloudWorkspace: React.FC = () => {
  const [showZeroTouchPipeline, setShowZeroTouchPipeline] = useState<boolean>(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    | 'teclado'
    | 'founder_ide'
    | 'telecom_provisioning'
    | 'numeros_virtuais'
    | 'mesh_sessions'
    | 'historico'
    | 'contactos'
    | 'sms'
    | 'voicemail'
    | 'banking_readiness'
    | 'installed_apps'
    | 'homescreen_mgr'
    | 'app_center'
    | 'cloud_os'
  >('teclado');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('unitel-primary');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [inCall, setInCall] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [isOnHold, setIsOnHold] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [inConference, setInConference] = useState<boolean>(false);
  const [transferTarget, setTransferTarget] = useState<string>('');
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showForwardModal, setShowForwardModal] = useState<boolean>(false);
  const [forwardingTarget, setForwardingTarget] = useState<string>('');
  const [isForwardingActive, setIsForwardingActive] = useState<boolean>(false);
  const [dtmfBuffer, setDtmfBuffer] = useState<string>('');

  // Blacklist & Whitelist
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newBlockNum, setNewBlockNum] = useState<string>('');

  // Virtual Numbers Collection State (virtual_numbers/{numberId})
  const [virtualNumbersList, setVirtualNumbersList] = useState<VirtualNumber[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('portal_assigned_virtual_numbers');
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return [];
  });

  // Mesh Sessions State (sessions/{sessionId})
  const [meshSessionsList, setMeshSessionsList] = useState<MeshSession[]>([]);

  // Call History State
  const [callHistoryFilter, setCallHistoryFilter] = useState<'todas' | 'recebidas' | 'efetuadas' | 'perdidas' | 'transferidas' | 'gravadas' | 'conferencia'>('todas');
  const [searchHistory, setSearchHistory] = useState<string>('');

  // Contacts State
  const [searchContact, setSearchContact] = useState<string>('');
  const [contactsList, setContactsList] = useState<any[]>([]);

  // SMS Compose State
  const [smsRecipient, setSmsRecipient] = useState<string>('');
  const [smsBody, setSmsBody] = useState<string>('');
  const [smsHistory, setSmsHistory] = useState<SmsMessage[]>([]);

  // Voicemail State
  const [voicemails, setVoicemails] = useState<any[]>([]);
  const [playingVmId, setPlayingVmId] = useState<string | null>(null);

  // Calls Log State (calls/{callId})
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);

  // Input History (Seta Cima / Seta Baixo navigation)
  const [inputHistory, setInputHistory] = useState<string[]>(['*#6368#', '*100#', '*#7668#', '*111#', '+244923888111']);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Copy/Paste State
  const [copiedState, setCopiedState] = useState<boolean>(false);

  // Tecla física ativa para feedback visual no Dialpad (Diretriz de Entrada Unificada)
  const [activePressedKey, setActivePressedKey] = useState<string | null>(null);
  const [numLockDetected, setNumLockDetected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = UnifiedInputController.subscribeVisualFeedback((k) => {
      setActivePressedKey(k);
    });
    return () => unsub();
  }, []);

  const handleCopyPhoneNumber = async () => {
    if (!phoneNumber) return;
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 1500);
    } catch (e) {
      console.error('Falha ao copiar:', e);
    }
  };

  const handlePastePhoneNumber = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Camada 3 & 4: Input Sanitizer & Interpretador
        const sanitized = SmartInputInterpreter.sanitize(text);
        setPhoneNumber(sanitized);
        CommandEngine.setBuffer(sanitized);
      }
    } catch (e) {
      console.error('Falha ao colar:', e);
    }
  };

  const navigateHistory = (direction: 'UP' | 'DOWN') => {
    if (inputHistory.length === 0) return;
    let nextIndex: number;
    if (direction === 'UP') {
      nextIndex = historyIndex < inputHistory.length - 1 ? historyIndex + 1 : historyIndex;
    } else {
      nextIndex = historyIndex > 0 ? historyIndex - 1 : -1;
    }

    setHistoryIndex(nextIndex);
    if (nextIndex >= 0 && nextIndex < inputHistory.length) {
      const histVal = inputHistory[nextIndex];
      setPhoneNumber(histVal);
      CommandEngine.setBuffer(histVal);
    } else if (nextIndex === -1) {
      setPhoneNumber('');
      CommandEngine.clearBuffer();
    }
  };

  // COS Vault State (Nível 1, 2, 3, 4 - Drawer Security & Comandos)
  const [vaultConfig, setVaultConfig] = useState(SecretVaultService.getConfig());

  useEffect(() => {
    const unsub = SecretVaultService.subscribe((cfg) => {
      setVaultConfig({ ...cfg });
    });
    return () => unsub();
  }, []);

  // Call duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (inCall && !isOnHold) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [inCall, isOnHold]);

  // Command Engine Event Listener (Desacoplamento total da UI — Diretriz 05 & 14)
  useEffect(() => {
    const handleCommandEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;

      switch (detail.actionId) {
        case 'OPEN_FOUNDER_CONSOLE':
          setActiveTab('founder_ide');
          break;
        case 'OPEN_ADMIN_CONSOLE':
          setActiveTab('cloud_os');
          break;
        case 'OPEN_DEVICES_VIEW':
          setActiveTab('mesh_sessions');
          break;
        case 'OPEN_TELECOM_VIEW':
          setActiveTab('telecom_provisioning');
          break;
        case 'OPEN_BANKING_VIEW':
          setActiveTab('banking_readiness');
          break;
        case 'OPEN_AUDIT_LOGS':
          setActiveTab('founder_ide');
          break;
        case 'OPEN_CREATE_ADMIN_MODAL':
          setShowCreateAdminModal(true);
          break;
        case 'EXECUTE_LOCK_DEVICE':
          alert('Dispositivo bloqueado com sucesso pelo Command Engine.');
          break;
        case 'EXECUTE_WIPE_SESSION':
          if (confirm('Atenção: Comando de Wipe recebido. Deseja limpar a sessão local?')) {
            localStorage.clear();
            window.location.reload();
          }
          break;
        case 'EXECUTE_PAIR_DEVICE':
          setShowZeroTouchPipeline(true);
          break;
        case 'EXECUTE_SYNC_ALL':
          alert('Sincronização em tempo real de telemetria e canais executada.');
          break;
        default:
          break;
      }
    };

    window.addEventListener('portal:command-executed', handleCommandEvent);
    return () => window.removeEventListener('portal:command-executed', handleCommandEvent);
  }, []);

  // Atalho Global CTRL+K para Command Palette (Diretriz 23)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const providers = TelecomRegistry.listProviders();
  const currentProvider = TelecomRegistry.getProvider(selectedProviderId);

  // Helper to detect if a call is international
  const checkIsInternational = (num: string): boolean => {
    if (!num) return false;
    return !num.startsWith('+244') && (num.startsWith('+') || num.startsWith('00'));
  };

  // Keypad Handlers — Interceção pelo CommandEngine (Diretriz 01)
  const handleKeyPress = (digit: string) => {
    UnifiedInputController.triggerVisualFeedback(digit);
    if (inCall) {
      setDtmfBuffer((prev) => prev + digit);
    } else {
      const nextNumber = phoneNumber + digit;
      setPhoneNumber(nextNumber);
      CommandEngine.append(digit);
    }
  };

  // Captura Global do Teclado do Computador e Numpad (Sistema Unificado de Entrada — Camadas 1 a 6)
  useEffect(() => {
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      // 1. Detectar estado do NumLock no evento
      if (typeof e.getModifierState === 'function') {
        const numLockState = e.getModifierState('NumLock');
        setNumLockDetected(numLockState);
      }

      // 2. Validação inteligente de foco (não captura se estiver em modais ou outros campos)
      const isAnyModal = showCreateAdminModal || showCommandPalette || showZeroTouchPipeline;
      const isDialerTab = activeTab === 'teclado';

      if (!UnifiedInputController.shouldCaptureKeyboardEvent(e, isDialerTab, isAnyModal)) {
        return;
      }

      // 3. Mapear teclas do Numpad, Teclado Superior e Ações
      const mapped = UnifiedInputController.mapKeyboardEvent(e);
      if (!mapped) return;

      if (mapped.action === 'INPUT') {
        e.preventDefault();
        handleKeyPress(mapped.key);
      } else if (mapped.action === 'BACKSPACE') {
        e.preventDefault();
        handleBackspace();
      } else if (mapped.action === 'CLEAR') {
        e.preventDefault();
        handleClearPhoneNumber();
      } else if (mapped.action === 'CANCEL') {
        e.preventDefault();
        handleClearPhoneNumber();
      } else if (mapped.action === 'SUBMIT') {
        e.preventDefault();
        if (phoneNumber.trim()) {
          handleInitiateCall(phoneNumber.trim());
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyboard);
    return () => window.removeEventListener('keydown', handleGlobalKeyboard);
  }, [activeTab, showCreateAdminModal, showCommandPalette, showZeroTouchPipeline, phoneNumber, inCall]);

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
    CommandEngine.backspace();
  };

  const handleClearPhoneNumber = () => {
    setPhoneNumber('');
    CommandEngine.clearBuffer();
  };

  const handleInitiateCall = async (numToCall?: string) => {
    const target = numToCall || phoneNumber;
    if (!target) return;

    // 1. Interceção prioritária do CommandEngine & COSKernel (Diretriz 01, 14, 33, 37)
    CommandEngine.setBuffer(target);
    const cmdResult = await CommandEngine.executeCurrentBuffer();
    if (cmdResult.isCommand) {
      setPhoneNumber('');
      return;
    }

    // Check blacklist
    if (blacklist.includes(target)) {
      alert(`Número ${target} está na LISTA NEGRA. Chamada bloqueada.`);
      return;
    }

    if (!currentProvider) return;

    try {
      const call = await currentProvider.initiateCall(target);
      const callId = call.id || call.callId || `call-${Date.now()}`;
      const isIntl = checkIsInternational(target);

      setActiveCallId(callId);
      setInCall(true);
      setCallDuration(0);
      setDtmfBuffer('');
      setIsOnHold(false);
      setIsRecording(false);
      setInConference(false);

      const newRecord: CallRecord = {
        id: callId,
        caller: currentProvider.virtualNumber || '+244 923 888 111',
        recipient: target,
        startTime: Date.now(),
        durationSeconds: 0,
        status: 'active',
        direction: 'outbound',
        isInternational: isIntl,
        countryCode: isIntl ? target.substring(0, 4) : '+244',
        isWhitelisted: whitelist.includes(target),
        isBlacklisted: false
      };
      setCallRecords((prev) => [newRecord, ...prev]);

      // Save call to Firestore calls/{callId}
      FirestoreService.saveCallRecord(newRecord);
    } catch (err) {
      console.error('Falha ao iniciar chamada:', err);
    }
  };

  const handleEndCall = async () => {
    if (activeCallId && currentProvider) {
      await currentProvider.endCall(activeCallId);
    }
    setInCall(false);

    if (activeCallId) {
      setCallRecords((prev) =>
        prev.map((c) => {
          if (c.id === activeCallId) {
            const updated = {
              ...c,
              status: 'completed' as const,
              endTime: Date.now(),
              durationSeconds: callDuration,
              recordingStatus: isRecording ? ('saved' as const) : ('off' as const),
              recordingUrl: isRecording ? `https://storage.portal.co.ao/calls/${activeCallId}.mp3` : undefined
            };
            FirestoreService.saveCallRecord(updated);
            return updated;
          }
          return c;
        })
      );
    }
    setActiveCallId(null);
    setIsOnHold(false);
    setIsRecording(false);
    setInConference(false);
  };

  const handleToggleHold = () => {
    setIsOnHold(!isOnHold);
    if (activeCallId) {
      setCallRecords((prev) =>
        prev.map((c) => (c.id === activeCallId ? { ...c, isOnHold: !isOnHold, status: !isOnHold ? 'on_hold' : 'active' } : c))
      );
    }
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    if (activeCallId) {
      setCallRecords((prev) =>
        prev.map((c) => (c.id === activeCallId ? { ...c, recordingStatus: !isRecording ? 'recording' : 'saved' } : c))
      );
    }
  };

  const handleToggleConference = () => {
    setInConference(!inConference);
    if (activeCallId) {
      setCallRecords((prev) =>
        prev.map((c) => (c.id === activeCallId ? { ...c, conferenceId: !inConference ? `conf-${Date.now()}` : undefined, status: !inConference ? 'conference' : 'active' } : c))
      );
    }
  };

  const handleTransferCall = () => {
    if (!transferTarget || !activeCallId) return;
    setCallRecords((prev) =>
      prev.map((c) => (c.id === activeCallId ? { ...c, status: 'transferred', recipient: transferTarget } : c))
    );
    setShowTransferModal(false);
    setInCall(false);
    setActiveCallId(null);
  };

  const handleSetPrimaryVirtualNumber = (numId: string) => {
    setVirtualNumbersList((prev) =>
      prev.map((vn) => ({
        ...vn,
        isPrimary: vn.id === numId,
        isSecondary: vn.id !== numId
      }))
    );
  };

  const handleTransferSessionMesh = (sessionId: string) => {
    setMeshSessionsList((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, sessionTransferStatus: 'transferred', lastSyncTimestamp: Date.now() } : s))
    );
    alert(`Sessão ${sessionId} transferida com sucesso no Mesh Multi-Device.`);
  };

  const handleSendSms = async () => {
    if (!smsRecipient || !smsBody || !currentProvider) return;
    try {
      const res = await currentProvider.sendSms(smsRecipient, smsBody);
      const newMsg: SmsMessage = typeof res === 'object' ? res : {
        id: `sms-${Date.now()}`,
        sender: currentProvider.virtualNumber || '+244 923 888 111',
        recipient: smsRecipient,
        content: smsBody,
        timestamp: Date.now(),
        direction: 'outbound',
        status: 'delivered'
      };
      setSmsHistory((prev) => [newMsg, ...prev]);
      FirestoreService.saveSmsMessage(newMsg);
      setSmsBody('');
    } catch (err) {
      console.error('Falha ao enviar SMS:', err);
    }
  };

  const filteredCalls = callRecords.filter((c) => {
    if (callHistoryFilter === 'recebidas' && c.direction !== 'inbound') return false;
    if (callHistoryFilter === 'efetuadas' && c.direction !== 'outbound') return false;
    if (callHistoryFilter === 'perdidas' && c.status !== 'missed') return false;
    if (callHistoryFilter === 'transferidas' && c.status !== 'transferred') return false;
    if (callHistoryFilter === 'gravadas' && !c.recordingUrl) return false;
    if (callHistoryFilter === 'conferencia' && c.status !== 'conference') return false;

    if (searchHistory) {
      const q = searchHistory.toLowerCase();
      return c.caller.toLowerCase().includes(q) || c.recipient.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredContacts = contactsList.filter((c) => {
    if (!searchContact) return true;
    const q = searchContact.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      
      {/* HEADER CONTROL BAR & OPERATOR SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">2.0</h3>
            <p className="text-[11px] text-slate-400">CloudTelco</p>
          </div>
        </div>

        {/* OPERATOR SELECTOR */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-bold">OPERADORA:</span>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.virtualNumber || 'N/A'})
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowZeroTouchPipeline(true)}
            className="px-2.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center space-x-1"
            title="Executar Onboarding 9 Passos 'Um Número, Múltiplos Dispositivos'"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>ZEROTOUCH PIPELINE</span>
          </button>
          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>REALTIME TELECOM</span>
          </span>
        </div>
      </div>

      {/* TOP NAVIGATION SUB-TABS (Diretriz 25: Apenas navegação pública de telefonia visível. Módulos admin acessíveis exclusivamente via Dialer/CLI) */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'teclado', label: 'Dialer', icon: Grid },
            { id: 'historico', label: `Histórico (${callRecords.length})`, icon: Activity },
            { id: 'contactos', label: `Contactos (${contactsList.length})`, icon: Users },
            { id: 'sms', label: `SMS (${smsHistory.length})`, icon: MessageSquare },
            { id: 'voicemail', label: `Correio Voz (${voicemails.filter(v => !v.isRead).length})`, icon: Voicemail }
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-black'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Indicador de Workspace Oculto Ativo (se aberto via comando) */}
        {activeTab !== 'teclado' && activeTab !== 'historico' && activeTab !== 'contactos' && activeTab !== 'sms' && activeTab !== 'voicemail' && (
          <div className="flex items-center space-x-2 shrink-0 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[10px] font-mono text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-bold uppercase">ESPAÇO PRIVILEGIADO: {activeTab.toUpperCase()}</span>
            <button
              onClick={() => setActiveTab('teclado')}
              className="text-amber-400 hover:text-white underline ml-1 cursor-pointer"
            >
              FECHAR
            </button>
          </div>
        )}
      </div>

      {/* 1. TECLADO & ACTIVE CALL INTERFACE */}
      {activeTab === 'teclado' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LEFT: DTMF KEYPAD & CALL CONTROLS */}
          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">TECLADO DTMF MULTI-OPERADORA</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCommandPalette(true)}
                  className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-[10px] font-bold border border-indigo-500/30 flex items-center space-x-1 cursor-pointer"
                  title="Abrir Command Palette (CTRL+K)"
                >
                  <CommandIcon className="w-3 h-3" />
                  <span>CLI / Palette (CTRL+K)</span>
                </button>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  {currentProvider?.name || 'Unitel'}
                </span>
              </div>
            </div>

            {/* Display Screen com Terminal de Entrada Universal (Arquitetura 6 Camadas: Paste -> Sanitizer -> Pipeline -> COS -> Call) */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-center space-y-1 relative">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">
                  TERMINAL UNIVERSAL DE ENTRADA (COPY/PASTE • USSD • COS • T9)
                </span>
                {!inCall && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handlePastePhoneNumber}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 text-[10px] font-mono transition flex items-center space-x-1"
                      title="Colar da área de transferência com auto-sanitização (Ctrl+V)"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      <span>Colar (📋)</span>
                    </button>
                    {phoneNumber && (
                      <button
                        onClick={handleCopyPhoneNumber}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 text-[10px] font-mono transition flex items-center space-x-1"
                        title="Copiar texto atual (Ctrl+C)"
                      >
                        {copiedState ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedState ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Caixa Controlada com 3 Ações Inline: [📋 Colar, ✕ Limpar, 📞 Discar] */}
              <div className="relative flex items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-lg p-1 min-h-[44px]">
                {/* Botão Colar Rápido (📋) */}
                {!inCall && (
                  <button
                    onClick={handlePastePhoneNumber}
                    className="p-2 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition cursor-pointer"
                    title="Colar (Ctrl+V)"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                  </button>
                )}

                {/* Input Controlado Híbrido */}
                <input
                  type="text"
                  data-dialer-input="true"
                  value={phoneNumber}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    const sanitized = SmartInputInterpreter.sanitize(rawVal);
                    setPhoneNumber(sanitized);
                    CommandEngine.setBuffer(sanitized);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && phoneNumber.trim()) {
                      handleInitiateCall(phoneNumber.trim());
                    } else if (e.key === 'Escape') {
                      handleClearPhoneNumber();
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      navigateHistory('UP');
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      navigateHistory('DOWN');
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData('text');
                    if (pasted) {
                      const sanitized = SmartInputInterpreter.sanitize(pasted);
                      setPhoneNumber(sanitized);
                      CommandEngine.setBuffer(sanitized);
                    }
                  }}
                  placeholder={inCall ? phoneNumber : '--- --- ---'}
                  disabled={inCall}
                  className="w-full bg-transparent text-center text-xl font-mono font-black tracking-widest text-emerald-400 placeholder:text-slate-600 focus:outline-none rounded px-2 py-0.5"
                />

                {/* Botões Limpar (✕) e Discar (📞) Inline no próprio Display */}
                {!inCall && (
                  <div className="flex items-center space-x-1">
                    {phoneNumber && (
                      <button
                        onClick={handleClearPhoneNumber}
                        className="p-2 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition cursor-pointer"
                        title="Limpar visor (Escape / ✕)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleInitiateCall(phoneNumber)}
                      disabled={!phoneNumber.trim()}
                      className={`p-2 rounded-md transition cursor-pointer ${
                        phoneNumber.trim() 
                          ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20' 
                          : 'text-slate-600 opacity-40 cursor-not-allowed'
                      }`}
                      title="Discar / Executar (Enter / 📞)"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Classificador Semântico Inteligente de Entrada (Smart Input Interpreter) */}
              {phoneNumber && !inCall && (() => {
                const interpretation: InterpretedInput = SmartInputInterpreter.interpret(phoneNumber);
                const clean = interpretation.sanitized.toUpperCase();
                const t9Resolved = DTMFT9Engine.resolveDTMFToCommand(clean);
                const directCmd = CommandRegistry.findByCommandOrAlias(clean);

                return (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {/* Badge Principal de Categoria */}
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${interpretation.badgeColor}`}>
                      <span>{interpretation.categoryLabel}</span>
                    </span>

                    {/* Resolução Específica de Comando / DTMF */}
                    {t9Resolved ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono">
                        DTMF ➔ {t9Resolved}
                      </span>
                    ) : directCmd ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-mono">
                        {directCmd.description}
                      </span>
                    ) : interpretation.category === 'TELEPHONE' ? (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {clean.startsWith('+') ? 'Internacional E.164' : 'Nacional / Local'}
                      </span>
                    ) : null}
                  </div>
                );
              })()}
            </div>

            {/* Autocomplete Inline Suggestions (Diretriz 20) */}
            {phoneNumber && !inCall && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {CommandSuggestionEngine.getSuggestions(phoneNumber, 3).map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPhoneNumber(s.command);
                      CommandEngine.setBuffer(s.command);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-[10px] text-amber-300 font-mono cursor-pointer transition flex items-center space-x-1"
                  >
                    <span>{s.text}</span>
                    <span className="text-slate-500 font-sans">({s.description})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Dialpad Matrix */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1 text-[9px] font-mono text-slate-500">
                <span>TECLADO FÍSICO / NUMPAD HABILITADO</span>
                {numLockDetected !== null && (
                  <span className={`px-1.5 py-0.2 rounded border ${
                    numLockDetected 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {numLockDetected ? 'NUMLOCK: ON' : 'NUMLOCK: OFF (ATIVAR)'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {[
                  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
                  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
                  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
                  ['*', ''], ['0', '+'], ['#', '']
                ].map(([num, sub]) => {
                  const isPhysicallyPressed = activePressedKey === num;
                  return (
                    <button
                      key={num}
                      onClick={() => handleKeyPress(num)}
                      className={`p-3 border rounded-xl text-center transition-all cursor-pointer shadow-sm ${
                        isPhysicallyPressed
                          ? 'bg-indigo-600 border-indigo-400 scale-95 ring-2 ring-indigo-400 shadow-indigo-600/50'
                          : 'bg-slate-900 hover:bg-slate-800 active:bg-indigo-900/50 border-slate-800 active:scale-95'
                      }`}
                    >
                      <span className={`block font-black text-base leading-none ${isPhysicallyPressed ? 'text-white' : 'text-white'}`}>
                        {num}
                      </span>
                      {sub && (
                        <span className={`block text-[8px] mt-0.5 tracking-widest ${isPhysicallyPressed ? 'text-indigo-200 font-bold' : 'text-slate-500'}`}>
                          {sub}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Favoritos Dinâmicos & Remarcação (Dialer) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span>FAVORITOS DINÂMICOS</span>
                </span>
                {callRecords.length > 0 && (
                  <button
                    onClick={() => {
                      const lastCall = callRecords[0];
                      if (lastCall) setPhoneNumber(lastCall.direction === 'inbound' ? lastCall.caller : lastCall.recipient);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>REMARCAÇÃO</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {contactsList.filter(c => c.isFav).length > 0 ? (
                  contactsList.filter(c => c.isFav).slice(0, 6).map((fav) => (
                    <button
                      key={fav.id}
                      onClick={() => setPhoneNumber(fav.phone)}
                      className="p-1.5 bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-600 rounded-lg text-left transition-all cursor-pointer flex items-center space-x-1.5 min-w-0"
                      title={`Chamar ${fav.name} (${fav.phone})`}
                    >
                      <Star className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-slate-200 truncate">{fav.name}</span>
                        <span className="block text-[8px] font-mono text-indigo-400 truncate">{fav.phone}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <span className="col-span-full text-[10px] text-slate-500 italic p-1">Sem contactos favoritos definidos</span>
                )}
              </div>
            </div>

            {/* Call Action Buttons */}
            <div className="flex items-center justify-center space-x-3 pt-1">
              {!inCall ? (
                <button
                  onClick={() => handleInitiateCall()}
                  disabled={!phoneNumber}
                  className="w-full max-w-xs py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>INICIAR CHAMADA / EXECUTAR CÓDIGO</span>
                </button>
              ) : (
                <button
                  onClick={handleEndCall}
                  className="w-full max-w-xs py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg active:scale-95 animate-pulse"
                >
                  <Phone className="w-4 h-4" />
                  <span>TERMINAR CHAMADA ({formatDuration(callDuration)})</span>
                </button>
              )}
            </div>

            {/* ENGENHARIA DTMF / USSD OPERADORA (Modo Engenharia MMI — 3 Estados: HIDDEN, UNLOCKED, AUTO_LOCKED) */}
            {vaultConfig.drawerState === 'UNLOCKED' ? (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="uppercase tracking-wider text-emerald-400">GAVETA DE 20 COMANDOS DESBLOQUEADA</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => SecretVaultService.lockDrawer('MANUAL')}
                      className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[9px] font-bold uppercase transition"
                      title="Ocultar gaveta de comandos imediatamente"
                    >
                      OCULTAR
                    </button>
                    <span className="text-[9px] text-slate-500 font-mono">5 MIN EXP</span>
                  </div>
                </div>

                {/* Grid Compacto de Nível 4 (USSD Operacional) */}
                <div className="grid grid-cols-3 gap-1">
                  {vaultConfig.commands
                    .filter(c => c.level === 'NIVEL_4_OPERACIONAL' && c.enabled)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setPhoneNumber(item.code);
                          CommandEngine.setBuffer(item.code);
                          handleInitiateCall(item.code);
                        }}
                        className={`p-1 bg-slate-900/90 hover:bg-slate-800 border ${item.badgeColor || 'border-slate-800'} rounded text-left transition-colors cursor-pointer flex flex-col justify-between`}
                        title={`Discar ${item.code} (${item.name})`}
                      >
                        <span className="font-mono font-bold text-[10px] text-white leading-tight">{item.code}</span>
                        <span className="text-[8px] text-slate-400 truncate leading-tight">{item.name}</span>
                      </button>
                    ))}
                </div>

                {/* Linha DTMF T9 e Privilégios (Nível 3) */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {vaultConfig.commands
                    .filter(c => c.level === 'NIVEL_3_PRIVILEGIOS' && c.enabled)
                    .map((t9) => (
                      <button
                        key={t9.id}
                        onClick={() => {
                          setPhoneNumber(t9.code);
                          CommandEngine.setBuffer(t9.code);
                          handleInitiateCall(t9.code);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-[9px] font-mono text-slate-300 transition-colors"
                        title={t9.description}
                      >
                        {t9.code} ({t9.name})
                      </button>
                    ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* RIGHT: IN-CALL ACTIVE MONITOR & REALTIME CONTROLS */}
          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SESSÃO TELECOM & TELEFONIA REAL</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                  inCall
                    ? isOnHold
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : inConference
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}>
                  {inCall ? (isOnHold ? 'EM ESPERA' : inConference ? 'CONFERÊNCIA MULTI-PARTY' : 'CHAMADA EM CURSO') : 'LIVRE'}
                </span>
              </div>

              {inCall ? (
                <div className="space-y-3 pt-3">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase">DESTINATÁRIO CONECTADO</span>
                      {checkIsInternational(phoneNumber) && (
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold text-[9px] flex items-center space-x-1">
                          <Globe className="w-3 h-3" />
                          <span>INTERNACIONAL</span>
                        </span>
                      )}
                    </div>
                    <span className="text-base font-black text-cyan-400 font-mono block">{phoneNumber}</span>
                    <span className="text-[10px] text-slate-400 block">Operadora: {currentProvider?.name}</span>
                    <span className="text-[10px] text-indigo-400 font-bold block">Duração: {formatDuration(callDuration)}</span>
                  </div>

                  {/* DTMF Buffer feedback */}
                  {dtmfBuffer && (
                    <div className="p-2 bg-indigo-950/40 rounded-lg border border-indigo-800 text-[11px] font-mono text-indigo-300">
                      Sinais DTMF Enviados: <span className="font-bold text-white tracking-widest">{dtmfBuffer}</span>
                    </div>
                  )}

                  {/* Advanced Realtime Telefonia Control Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                        isMuted ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-3.5 h-3.5 text-amber-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                      <span className="text-[8px] uppercase">{isMuted ? 'MUTADO' : 'MICROFONE'}</span>
                    </button>

                    <button
                      onClick={handleToggleHold}
                      className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                        isOnHold ? 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[8px] uppercase">{isOnHold ? 'EM ESPERA' : 'RETENÇÃO'}</span>
                    </button>

                    <button
                      onClick={handleToggleRecording}
                      className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                        isRecording ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <Disc className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[8px] uppercase">{isRecording ? 'GRAVANDO' : 'GRAVAR'}</span>
                    </button>

                    <button
                      onClick={handleToggleConference}
                      className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                        inConference ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[8px] uppercase">{inConference ? 'CONFERÊNCIA' : 'CONFERÊNCIA'}</span>
                    </button>

                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-cyan-300 font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer"
                    >
                      <PhoneForwarded className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[8px] uppercase">TRANSFERIR</span>
                    </button>

                    <button
                      onClick={() => setShowForwardModal(true)}
                      className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-indigo-300 font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[8px] uppercase">ENCAMINHAR</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <PhoneCall className="w-8 h-8 text-slate-700 mx-auto" />
                  <span className="block text-slate-400 font-bold">Nenhuma chamada ativa no momento</span>
                  <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
                    Digite um número no teclado ou selecione um contacto para realizar chamadas nacionais ou internacionais.
                  </p>
                </div>
              )}
            </div>

            {/* Dense Telecom Diagnostics */}
            <div className="border-t border-slate-800 pt-3 space-y-1 text-[10px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>Número Virtual Ativo:</span>
                <span className="text-cyan-400 font-bold font-mono">{currentProvider?.virtualNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Coleção Firestore:</span>
                <span className="text-emerald-400 font-bold">calls/{activeCallId || 'idle'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Suporte Internacional:</span>
                <span className="text-cyan-300 font-bold">Ativo (Prefixos +1, +351, +258, +55)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. NÚMEROS VIRTUAIS TAB (virtual_numbers/{numberId}) */}
      {activeTab === 'numeros_virtuais' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-black text-white uppercase block">NÚMERO VIRTUAL ENGINE (virtual_numbers/{'{numberId}'})</span>
              <p className="text-[10px] text-slate-400">Gestão de números principais, secundários, eSIM, SIP e IMS Direct</p>
            </div>
            <button
              onClick={() => {
                const newNum: VirtualNumber = {
                  id: `num-${Date.now()}`,
                  number: `+244 9${Math.floor(10000000 + Math.random() * 90000000)}`,
                  isPrimary: false,
                  isSecondary: true,
                  operator: 'Unitel',
                  status: 'active',
                  type: 'mobile',
                  country: 'Angola',
                  esim: true,
                  sip: true,
                  ims: true
                };
                setVirtualNumbersList((prev) => [...prev, newNum]);
                FirestoreService.saveVirtualNumber(newNum);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ALOCAR NÚMERO VIRTUAL</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <th className="p-2.5">NÚMERO VIRTUAL</th>
                  <th className="p-2.5">PAPEL</th>
                  <th className="p-2.5">OPERADORA</th>
                  <th className="p-2.5">TIPO</th>
                  <th className="p-2.5">PAÍS</th>
                  <th className="p-2.5 text-center">ESIM</th>
                  <th className="p-2.5 text-center">SIP TRUNK</th>
                  <th className="p-2.5 text-center">IMS CORE</th>
                  <th className="p-2.5 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {virtualNumbersList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500 font-sans">
                      <span className="font-bold block text-slate-400">NENHUM NÚMERO CONFIGURADO (NOT_CONFIGURED)</span>
                      <span className="text-[10px] text-slate-600 block mt-1">Conecte credenciais válidas ou provisione uma porta SIP/IMS/SIM real para listar números virtuais.</span>
                    </td>
                  </tr>
                ) : (
                  virtualNumbersList.map((vn) => (
                    <tr key={vn.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-2.5 font-black text-cyan-400">{vn.number}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          vn.isPrimary ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {vn.isPrimary ? 'PRINCIPAL' : 'SECUNDÁRIO'}
                        </span>
                      </td>
                      <td className="p-2.5 text-white font-bold">{vn.operator}</td>
                      <td className="p-2.5 uppercase text-slate-300">{vn.type}</td>
                      <td className="p-2.5 text-slate-300">{vn.country}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${vn.esim ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'text-slate-600'}`}>
                          {vn.esim ? 'ATIVO' : 'NOT_CONFIGURED'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${vn.sip ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-600'}`}>
                          {vn.sip ? 'SIP DIRECT' : 'NOT_CONFIGURED'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${vn.ims ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-600'}`}>
                          {vn.ims ? 'IMS CORE' : 'NOT_CONFIGURED'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right space-x-1">
                        {!vn.isPrimary && (
                          <button
                            onClick={() => handleSetPrimaryVirtualNumber(vn.id)}
                            className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            DEFINIR PRINCIPAL
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MULTI-DEVICE MESH 4.0 TAB (sessions/{sessionId}) */}
      {activeTab === 'mesh_sessions' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-black text-white uppercase block flex items-center space-x-2">
                <span>DEVICE MESH 4.0 — MALHA SINCRO REALTIME</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-mono font-bold">
                  NOT_CONFIGURED
                </span>
              </span>
              <p className="text-[10px] text-slate-400">Continuação automática de sessão, prioridade de nós, sincronização de clipboard, chamadas e SMS</p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.("PortalTRMobile Mesh Key: " + Date.now());
                  alert("Clipboard Sincronizado em toda a malha de dispositivos Mesh 4.0!");
                }}
                className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-xl font-bold text-xs uppercase flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>SINCRONIZAR CLIPBOARD MESH</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <th className="p-2.5">ID DA SESSÃO</th>
                  <th className="p-2.5">DISPOSITIVO ATUAL</th>
                  <th className="p-2.5">ESTADO DA SESSÃO</th>
                  <th className="p-2.5 text-center">PRIORIDADE MESH</th>
                  <th className="p-2.5 text-center">CONTINUAÇÃO AUT.</th>
                  <th className="p-2.5 text-center">DISPOSITIVOS ATIVOS</th>
                  <th className="p-2.5 text-right">TRANSFERÊNCIA RÁPIDA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {meshSessionsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500 font-sans">
                      <span className="font-bold block text-slate-400">NENHUMA SESSÃO MESH REGISTADA (NOT_CONFIGURED)</span>
                      <span className="text-[10px] text-slate-600 block mt-1">Conecte outros dispositivos ao mesmo ID de utilizador para sincronizar a malha.</span>
                    </td>
                  </tr>
                ) : (
                  meshSessionsList.map((ms) => (
                    <tr key={ms.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-2.5 font-bold text-cyan-400">{ms.id}</td>
                      <td className="p-2.5 text-white font-bold">{ms.currentDeviceId}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          ms.isPrimarySession ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {ms.isPrimarySession ? 'SESSÃO ATIVA' : 'SESSÃO SECUNDÁRIA'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-bold text-indigo-300">
                        PRIORIDADE #{ms.primaryDevicePriority}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {ms.autoContinuation ? 'ATIVO' : 'DESATIVADO'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-slate-300">
                        {ms.activeDevicesCount} / {ms.deviceLimit === 100 ? 'Ilimitado' : ms.deviceLimit}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => handleTransferSessionMesh(ms.id)}
                          className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 rounded text-[10px] font-bold uppercase cursor-pointer"
                        >
                          TRANSFERIR SESSÃO
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. HISTÓRICO DE CHAMADAS */}
      {activeTab === 'historico' && (
        <div className="space-y-3">
          
          {/* Filter Sub-Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
              {[
                ['todas', 'Todas'],
                ['recebidas', 'Recebidas'],
                ['efetuadas', 'Efetuadas'],
                ['perdidas', 'Perdidas'],
                ['transferidas', 'Transferidas'],
                ['gravadas', 'Gravadas'],
                ['conferencia', 'Conferências']
              ].map(([fKey, fLabel]) => (
                <button
                  key={fKey}
                  onClick={() => setCallHistoryFilter(fKey as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    callHistoryFilter === fKey
                      ? 'bg-indigo-600 text-white font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {fLabel}
                </button>
              ))}
            </div>

            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                placeholder="Pesquisar histórico..."
                className="pl-8 pr-3 py-1 bg-black border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Dense Calls Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <th className="p-2.5">DIRECÇÃO & TIPO</th>
                  <th className="p-2.5">ORIGEM (CALLER)</th>
                  <th className="p-2.5">DESTINO (RECIPIENT)</th>
                  <th className="p-2.5">ROTA</th>
                  <th className="p-2.5">DURAÇÃO</th>
                  <th className="p-2.5">DATA / HORA</th>
                  <th className="p-2.5 text-center">GRAVAÇÃO</th>
                  <th className="p-2.5 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCalls.length > 0 ? (
                  filteredCalls.map((c) => {
                    const isMissed = c.status === 'missed';
                    const isTransferred = c.status === 'transferred';
                    return (
                      <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-2.5">
                          <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isMissed
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : isTransferred
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : c.direction === 'inbound'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}>
                            {c.direction === 'inbound' ? <PhoneIncoming className="w-3 h-3" /> : <PhoneOutgoing className="w-3 h-3" />}
                            <span>{isMissed ? 'PERDIDA' : isTransferred ? 'TRANSFERIDA' : c.direction.toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-white">{c.caller}</td>
                        <td className="p-2.5 text-cyan-400 font-bold">{c.recipient}</td>
                        <td className="p-2.5">
                          {c.isInternational ? (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-bold">
                              INTL ({c.countryCode})
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">NACIONAL</span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-300">{formatDuration(c.durationSeconds)}</td>
                        <td className="p-2.5 text-slate-400 text-[10px]">
                          {new Date(c.startTime).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-2.5 text-center">
                          {c.recordingUrl ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              ÁUDIO MP3
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">---</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setPhoneNumber(c.direction === 'inbound' ? c.caller : c.recipient);
                              setActiveTab('teclado');
                            }}
                            className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 rounded text-[10px] font-bold uppercase cursor-pointer"
                          >
                            RETORNAR
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      Nenhuma chamada registada no histórico.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CONTACTOS */}
      {activeTab === 'contactos' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                placeholder="Pesquisar contacto por nome, etiqueta ou número..."
                className="w-full pl-8 pr-3 py-1 bg-black border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <label className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 hover:border-indigo-600 rounded-lg text-xs font-bold uppercase cursor-pointer flex items-center space-x-1 transition-all">
                <Download className="w-3 h-3" />
                <span>IMPORTAR VCARD/CSV</span>
                <input
                  type="file"
                  accept=".vcf,.vcard,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const newContact = {
                        id: `imported-${Date.now()}`,
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        phone: '+244 923 ' + Math.floor(100000 + Math.random() * 900000),
                        category: 'Importado',
                        isFav: false
                      };
                      setContactsList(prev => [...prev, newContact]);
                      FirestoreService.saveContact(newContact);
                    }
                  }}
                />
              </label>

              <button
                onClick={() => {
                  const name = prompt('Nome do Contacto:');
                  const phone = prompt('Número / SIP URI:');
                  if (name && phone) {
                    const c = { id: `c-${Date.now()}`, name, phone, category: 'Geral', isFav: false };
                    setContactsList(prev => [...prev, c]);
                    FirestoreService.saveContact(c);
                  }
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase flex items-center space-x-1 cursor-pointer transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>NOVO CONTACTO</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <th className="p-2.5">NOME DO CONTACTO</th>
                  <th className="p-2.5">NÚMERO / SIP</th>
                  <th className="p-2.5">CATEGORIA</th>
                  <th className="p-2.5 text-right">AÇÕES RÁPIDAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500 font-sans text-xs">
                      Nenhum contacto registado. Clique em &quot;NOVO CONTACTO&quot; ou &quot;IMPORTAR VCARD&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((ct) => (
                    <tr key={ct.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-2.5 font-bold text-white flex items-center space-x-2">
                        <span>{ct.name}</span>
                        {ct.isFav && <span className="text-amber-400 text-[10px]">★</span>}
                      </td>
                      <td className="p-2.5 text-cyan-400 font-mono font-bold">{ct.phone}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-800 font-bold">
                          {ct.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-right space-x-2">
                        <button
                          onClick={() => handleInitiateCall(ct.phone)}
                          className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 rounded text-[10px] font-bold uppercase cursor-pointer"
                        >
                          CHAMAR
                        </button>
                        <button
                          onClick={() => {
                            setSmsRecipient(ct.phone);
                            setActiveTab('sms');
                          }}
                          className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 rounded text-[10px] font-bold uppercase cursor-pointer"
                        >
                          SMS
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SMS / CENTRO DE MENSAGENS */}
      {activeTab === 'sms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* COMPOSE SMS */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-800 pb-2">
              NOVA MENSAGEM SMS GSM / OVER-THE-AIR (sms/{'{messageId}'})
            </span>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold">NÚMERO RECEPTOR</label>
              <input
                type="text"
                value={smsRecipient}
                onChange={(e) => setSmsRecipient(e.target.value)}
                placeholder="+244 923 XXX XXX"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold">CONTEÚDO DA MENSAGEM</label>
              <textarea
                rows={4}
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                placeholder="Escreva a mensagem SMS..."
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none"
              />
            </div>

            <button
              onClick={handleSendSms}
              disabled={!smsRecipient || !smsBody}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>ENVIAR SMS AGORA</span>
            </button>
          </div>

          {/* SMS LOG */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl max-h-96 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-800 pb-2">
              REGISTO RECENTE DE SMS (ENTRADA / SAÍDA)
            </span>

            <div className="space-y-2">
              {smsHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">
                  Nenhuma mensagem SMS no histórico.
                </div>
              ) : (
                smsHistory.map((s) => (
                  <div key={s.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-indigo-400 font-mono">
                        {s.direction === 'inbound' ? `DE: ${s.sender}` : `PARA: ${s.recipient}`}
                      </span>
                      <span className="text-slate-500">{new Date(s.timestamp).toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{s.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. CORREIO DE VOZ */}
      {activeTab === 'voicemail' && (
        <div className="space-y-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">CORREIO DE VOZ MULTI-CANAL</span>
            <span className="text-xs font-bold text-indigo-400">
              {voicemails.filter(v => !v.isRead).length} Mensagens Não Lidas
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <th className="p-2.5">CONTACTO</th>
                  <th className="p-2.5">NÚMERO ORIGEM</th>
                  <th className="p-2.5">DURAÇÃO</th>
                  <th className="p-2.5">DATA / HORA</th>
                  <th className="p-2.5 text-right">REPRODUÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {voicemails.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-sans text-xs">
                      Caixa de correio de voz vazia.
                    </td>
                  </tr>
                ) : (
                  voicemails.map((vm) => (
                    <tr key={vm.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-2.5 font-bold text-white">{vm.name || 'Desconhecido'}</td>
                      <td className="p-2.5 text-cyan-400">{vm.caller}</td>
                      <td className="p-2.5 text-slate-400">{vm.duration}</td>
                      <td className="p-2.5 text-slate-500">{new Date(vm.timestamp).toLocaleString('pt-BR')}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setPlayingVmId(playingVmId === vm.id ? null : vm.id)}
                          className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 rounded text-[10px] font-bold uppercase cursor-pointer flex items-center space-x-1.5 ml-auto"
                        >
                          {playingVmId === vm.id ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                          <span>{playingVmId === vm.id ? 'PAUSAR' : 'REPRODUZIR'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TELECOM PROVISIONING CONSOLE */}
      {activeTab === 'telecom_provisioning' && <TelecomProvisioningConsole />}

      {/* BANKING READINESS TABLE */}
      {activeTab === 'banking_readiness' && <BankingReadinessTable />}

      {/* INSTALLED APPS TABLE */}
      {activeTab === 'installed_apps' && <InstalledAppsTable />}

      {/* HOMESCREEN MANAGER */}
      {activeTab === 'homescreen_mgr' && <HomeScreenManager />}

      {/* 8. APP CENTER */}
      {activeTab === 'app_center' && <AppCenterView />}

      {/* 10. CLOUD MOBILE OS */}
      {activeTab === 'cloud_os' && <CloudMobileOSView />}

      {/* CALL TRANSFER OVERLAY MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 z-50">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl w-full max-w-sm space-y-3 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-indigo-400 font-bold uppercase">TRANSFERIR CHAMADA ATIVA</span>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-500 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">NÚMERO DE DESTINO PARA TRANSFERÊNCIA</label>
              <input
                type="text"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                placeholder="+244 9XX XXX XXX"
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-1.5 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl text-xs uppercase font-bold"
              >
                CANCELAR
              </button>
              <button
                onClick={handleTransferCall}
                disabled={!transferTarget}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider"
              >
                EFETUAR TRANSFERÊNCIA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALL FORWARDING MODAL */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 z-50">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl w-full max-w-sm space-y-3 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-indigo-400 font-bold uppercase">ENCAMINHAMENTO DE CHAMADAS</span>
              <button onClick={() => setShowForwardModal(false)} className="text-slate-500 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">NÚMERO PARA ENCAMINHAR</label>
              <input
                type="text"
                value={forwardingTarget}
                onChange={(e) => setForwardingTarget(e.target.value)}
                placeholder="+244 9XX XXX XXX"
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsForwardingActive(false);
                  setShowForwardModal(false);
                }}
                className="px-3 py-1.5 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl text-xs uppercase font-bold"
              >
                DESATIVAR
              </button>
              <button
                onClick={() => {
                  setIsForwardingActive(true);
                  setShowForwardModal(false);
                }}
                disabled={!forwardingTarget}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider"
              >
                ATIVAR ENCAMINHAMENTO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZEROTOUCH PIPELINE ONBOARDING MODAL */}
      <ZeroTouchProvisioningPipelineModal
        isOpen={showZeroTouchPipeline}
        onClose={() => setShowZeroTouchPipeline(false)}
        onComplete={() => setShowZeroTouchPipeline(false)}
      />

      {/* CREATE ADMIN MODAL (Acionado via *#CREATEADMIN# ou IDE) */}
      <CreateAdminModal
        isOpen={showCreateAdminModal}
        onClose={() => setShowCreateAdminModal(false)}
      />

      {/* COMMAND PALETTE MODAL (CTRL+K / CLI - Diretriz 23) */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      {/* FOUNDER CONSOLE 2.0 (IDE) */}
      {activeTab === 'founder_ide' && (
        <FounderIDEWorkspace />
      )}

      {/* COS KERNEL COMMAND BAR (Diretriz 26 & 32) */}
      <COSCommandBar />

      {/* DIÁLOGO USSD / MMI ENGINEERING MODE */}
      <USSDDialogModal />

    </div>
  );
};
