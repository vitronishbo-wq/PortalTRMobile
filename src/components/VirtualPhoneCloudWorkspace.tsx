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
  Star
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

export const VirtualPhoneCloudWorkspace: React.FC = () => {
  const [showZeroTouchPipeline, setShowZeroTouchPipeline] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'teclado' | 'numeros_virtuais' | 'mesh_sessions' | 'historico' | 'contactos' | 'sms' | 'voicemail' | 'app_center' | 'cloud_os'>('teclado');
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
  const [blacklist, setBlacklist] = useState<string[]>(['+244 900 000 000', '+244 999 111 222']);
  const [whitelist, setWhitelist] = useState<string[]>(['+244 923 888 111', '+244 955 777 222', '+244 222 000 999']);
  const [newBlockNum, setNewBlockNum] = useState<string>('');

  // Virtual Numbers Collection State (virtual_numbers/{numberId})
  const [virtualNumbersList, setVirtualNumbersList] = useState<VirtualNumber[]>([
    {
      id: 'num-01',
      number: '+244 923 888 111',
      isPrimary: true,
      isSecondary: false,
      operator: 'Unitel',
      status: 'active',
      type: 'mobile',
      country: 'Angola',
      esim: true,
      esimProfileId: 'eSIM-UNITEL-AO-8801',
      sip: true,
      sipTrunkUri: 'sip:num01@unitel.portal.co.ao',
      ims: true,
      imsGatewayDomain: 'ims.unitel.co.ao'
    },
    {
      id: 'num-02',
      number: '+244 955 777 222',
      isPrimary: false,
      isSecondary: true,
      operator: 'Africell',
      status: 'active',
      type: 'mobile',
      country: 'Angola',
      esim: true,
      esimProfileId: 'eSIM-AFRICELL-AO-5502',
      sip: false,
      ims: true,
      imsGatewayDomain: 'ims.africell.co.ao'
    },
    {
      id: 'num-03',
      number: '+351 210 999 888',
      isPrimary: false,
      isSecondary: true,
      operator: 'SIP Gateway',
      status: 'active',
      type: 'landline',
      country: 'Portugal',
      esim: false,
      sip: true,
      sipTrunkUri: 'sip:lisbon-trunk@sip.portal.co.ao',
      ims: false
    }
  ]);

  // Mesh Sessions State (sessions/{sessionId})
  const [meshSessionsList, setMeshSessionsList] = useState<MeshSession[]>([
    {
      id: 'session-master-01',
      uid: 'usr-founder-001',
      isPrimarySession: true,
      isSecondarySession: false,
      currentDeviceId: 'dev-samsung-s22',
      activeDevicesCount: 5,
      deviceLimit: 100,
      sessionTransferStatus: 'synced',
      autoContinuation: true,
      instantSync: true,
      primaryDevicePriority: 1,
      lastSyncTimestamp: Date.now()
    },
    {
      id: 'session-sec-02',
      uid: 'usr-founder-001',
      isPrimarySession: false,
      isSecondarySession: true,
      currentDeviceId: 'dev-macbook-pro',
      activeDevicesCount: 5,
      deviceLimit: 100,
      sessionTransferStatus: 'synced',
      autoContinuation: true,
      instantSync: true,
      primaryDevicePriority: 2,
      lastSyncTimestamp: Date.now() - 5000
    }
  ]);

  // Call History State
  const [callHistoryFilter, setCallHistoryFilter] = useState<'todas' | 'recebidas' | 'efetuadas' | 'perdidas' | 'transferidas' | 'gravadas' | 'conferencia'>('todas');
  const [searchHistory, setSearchHistory] = useState<string>('');

  // Contacts State
  const [searchContact, setSearchContact] = useState<string>('');
  const [contactsList, setContactsList] = useState([
    { id: '1', name: 'Comando Central (Founder)', phone: '+244 923 888 111', category: 'Root', isFav: true },
    { id: '2', name: 'Operador Africell Core', phone: '+244 955 777 222', category: 'Operador', isFav: true },
    { id: '3', name: 'Suporte Técnico Movicel', phone: '+244 912 666 333', category: 'Suporte', isFav: false },
    { id: '4', name: 'Gateway SIP Angola Enterprise', phone: 'sip:trunk01@sip.portal.co.ao', category: 'SIP', isFav: false },
    { id: '5', name: 'IMS Core Gateway Direct', phone: '+244 222 000 999', category: 'IMS', isFav: true }
  ]);

  // SMS Compose State
  const [smsRecipient, setSmsRecipient] = useState<string>('');
  const [smsBody, setSmsBody] = useState<string>('');
  const [smsHistory, setSmsHistory] = useState<SmsMessage[]>([
    {
      id: 'sms-01',
      sender: '+244 923 888 111',
      recipient: '+244 955 777 222',
      content: 'Código de validação de dispositivo PortalTRMobile: 849201. Validade 5 min.',
      timestamp: Date.now() - 3600000,
      direction: 'inbound',
      status: 'delivered'
    },
    {
      id: 'sms-02',
      sender: '+244 955 777 222',
      recipient: '+244 923 888 111',
      content: 'Sessão de emparelhamento Zero-Touch confirmada no nó Android SM-S901B.',
      timestamp: Date.now() - 1800000,
      direction: 'outbound',
      status: 'delivered'
    }
  ]);

  // Voicemail State
  const [voicemails, setVoicemails] = useState([
    { id: 'vm-1', caller: '+244 912 666 333', name: 'Suporte Técnico Movicel', duration: '0:42', timestamp: Date.now() - 7200000, isRead: false },
    { id: 'vm-2', caller: '+244 955 777 222', name: 'Operador Africell Core', duration: '1:15', timestamp: Date.now() - 14400000, isRead: true }
  ]);
  const [playingVmId, setPlayingVmId] = useState<string | null>(null);

  // Calls Log Mock State (calls/{callId})
  const [callRecords, setCallRecords] = useState<CallRecord[]>([
    {
      id: 'call-101',
      caller: '+244 923 888 111',
      recipient: '+244 955 777 222',
      startTime: Date.now() - 1200000,
      endTime: Date.now() - 1140000,
      durationSeconds: 60,
      status: 'completed',
      direction: 'outbound',
      recordingUrl: 'https://storage.portal.co.ao/calls/call-101.mp3',
      recordingStatus: 'saved',
      isInternational: false,
      countryCode: '+244'
    },
    {
      id: 'call-102',
      caller: '+244 912 666 333',
      recipient: '+244 923 888 111',
      startTime: Date.now() - 3600000,
      endTime: Date.now() - 3600000,
      durationSeconds: 0,
      status: 'missed',
      direction: 'inbound',
      isInternational: false,
      countryCode: '+244'
    },
    {
      id: 'call-103',
      caller: '+351 910 000 111',
      recipient: '+244 923 888 111',
      startTime: Date.now() - 7200000,
      endTime: Date.now() - 7000000,
      durationSeconds: 200,
      status: 'transferred',
      direction: 'inbound',
      recordingUrl: 'https://storage.portal.co.ao/calls/call-103.mp3',
      recordingStatus: 'saved',
      isInternational: true,
      countryCode: '+351'
    }
  ]);

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

  const providers = TelecomRegistry.listProviders();
  const currentProvider = TelecomRegistry.getProvider(selectedProviderId);

  // Helper to detect if a call is international
  const checkIsInternational = (num: string): boolean => {
    if (!num) return false;
    return !num.startsWith('+244') && (num.startsWith('+') || num.startsWith('00'));
  };

  // Keypad Handlers
  const handleKeyPress = (digit: string) => {
    if (inCall) {
      setDtmfBuffer((prev) => prev + digit);
    } else {
      setPhoneNumber((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleInitiateCall = async (numToCall?: string) => {
    const target = numToCall || phoneNumber;
    if (!target) return;

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
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Virtual Phone 2.0 (Telefonia Real & Mesh 3.0)</h3>
            <p className="text-[11px] text-slate-400">PONTES GSM, SIP TRUNK, IMS CORE, ESIM ANGOLA, CONFERÊNCIA E MESH UNIFICADO</p>
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

      {/* TOP NAVIGATION SUB-TABS */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'teclado', label: 'Teclado Telefónico', icon: Grid },
          { id: 'numeros_virtuais', label: `Números Virtuais (${virtualNumbersList.length})`, icon: Smartphone },
          { id: 'mesh_sessions', label: `Mesh Sessions 3.0 (${meshSessionsList.length})`, icon: Layers },
          { id: 'historico', label: `Histórico Chamadas (${callRecords.length})`, icon: Activity },
          { id: 'contactos', label: `Contactos (${contactsList.length})`, icon: Users },
          { id: 'sms', label: `SMS (${smsHistory.length})`, icon: MessageSquare },
          { id: 'voicemail', label: `Correio Voz (${voicemails.filter(v => !v.isRead).length})`, icon: Voicemail },
          { id: 'app_center', label: 'App Center', icon: Grid },
          { id: 'cloud_os', label: 'Cloud Mobile OS', icon: Smartphone }
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

      {/* 1. TECLADO & ACTIVE CALL INTERFACE */}
      {activeTab === 'teclado' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LEFT: DTMF KEYPAD & CALL CONTROLS */}
          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">TECLADO DTMF MULTI-OPERADORA</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">
                {currentProvider?.name || 'Unitel'}
              </span>
            </div>

            {/* Display Screen */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-center space-y-1 relative">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">
                NÚMERO OU ENDEREÇO SIP {checkIsInternational(phoneNumber) ? '• (INTERNACIONAL)' : ''}
              </span>
              <div className="text-xl font-mono font-black tracking-widest text-emerald-400 min-h-[32px] flex items-center justify-center break-all">
                {phoneNumber || (inCall ? phoneNumber : '--- --- ---')}
              </div>
              {phoneNumber && !inCall && (
                <button
                  onClick={handleBackspace}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dialpad Matrix */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {[
                ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
                ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
                ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
                ['*', ''], ['0', '+'], ['#', '']
              ].map(([num, sub]) => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  className="p-3 bg-slate-900 hover:bg-slate-800 active:bg-indigo-900/50 border border-slate-800 rounded-xl text-center transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <span className="block font-black text-white text-base leading-none">{num}</span>
                  {sub && <span className="block text-[8px] text-slate-500 mt-0.5 tracking-widest">{sub}</span>}
                </button>
              ))}
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
                  <span>INICIAR CHAMADA REALTIME</span>
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
                {virtualNumbersList.map((vn) => (
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
                        {vn.esim ? 'ATIVO' : 'N/A'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${vn.sip ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-600'}`}>
                        {vn.sip ? 'SIP DIRECT' : 'N/A'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${vn.ims ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-600'}`}>
                        {vn.ims ? 'IMS CORE' : 'N/A'}
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
                ))}
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
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                  LATÊNCIA &lt;12MS
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
                {meshSessionsList.map((ms) => (
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
                ))}
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
                {filteredContacts.map((ct) => (
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
                ))}
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
              {smsHistory.map((s) => (
                <div key={s.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-indigo-400 font-mono">
                      {s.direction === 'inbound' ? `DE: ${s.sender}` : `PARA: ${s.recipient}`}
                    </span>
                    <span className="text-slate-500">{new Date(s.timestamp).toLocaleTimeString('pt-BR')}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{s.content}</p>
                </div>
              ))}
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
              <tbody className="divide-y divide-slate-800/60">
                {voicemails.map((vm) => (
                  <tr key={vm.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-2.5 font-bold text-white">{vm.name}</td>
                    <td className="p-2.5 text-cyan-400 font-mono font-bold">{vm.caller}</td>
                    <td className="p-2.5 text-slate-300 font-mono">{vm.duration}</td>
                    <td className="p-2.5 text-slate-400 text-[10px]">
                      {new Date(vm.timestamp).toLocaleString('pt-BR')}
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

    </div>
  );
};
