import { db } from '../firebase/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { TelecomRegistry, TelecomProvider } from '../telecom/TelecomProvider';

export type TelecomProviderType = 'unitel' | 'africell' | 'movicel' | 'sip' | 'ims' | 'thirdparty';

export interface VirtualPhoneVoiceState {
  activeCallId?: string;
  state: 'idle' | 'dialing' | 'ringing' | 'connected' | 'held' | 'ended';
  remoteNumber?: string;
  durationSeconds: number;
  isMuted: boolean;
  isHeld: boolean;
  isRecording: boolean;
  audioInputDevice: string;
  audioOutputDevice: string;
  mediaStreamActive?: boolean;
}

export interface VirtualPhoneContact {
  id: string;
  name: string;
  number: string;
  speedDial?: number;
}

export interface VirtualPhoneSmsMessage {
  id: string;
  threadId: string;
  sender: string;
  recipient: string;
  text: string;
  timestamp: number;
  direction: 'inbound' | 'outbound';
  status: 'queued' | 'sent' | 'delivered' | 'failed';
}

export interface VirtualPhoneCallLog {
  id: string;
  type: 'incoming' | 'outgoing' | 'missed';
  peerNumber: string;
  timestamp: number;
  durationSeconds: number;
  provider: TelecomProviderType;
}

export interface VirtualPhoneVoicemail {
  id: string;
  caller: string;
  timestamp: number;
  durationSeconds: number;
  audioUrl?: string;
  read: boolean;
}

export interface VirtualPhoneDeviceMeshNode {
  deviceId: string;
  name: string;
  platform: 'android' | 'iphone' | 'ipad' | 'web' | 'windows' | 'macos' | 'linux';
  trustScore: number;
  isOnline: boolean;
  lastSeen: number;
  pushToken?: string;
  hasActiveHandover?: boolean;
}

export interface VirtualPhoneVirtualAppRuntime {
  containerId: string;
  packageName: string;
  appName: string;
  status: 'running' | 'paused' | 'stopped' | 'failed';
  cpuUsagePct: number;
  memoryMb: number;
  fps: number;
  virtualDisplayStreamUrl?: string;
}

export interface VirtualPhoneState {
  uid: string;
  identityHash: string;
  role: 'founder' | 'admin' | 'user';
  mfaEnabled: boolean;
  msisdn: string;
  provider: TelecomProviderType;
  providerStatus: 'connected' | 'routing' | 'degraded' | 'offline';
  voice: VirtualPhoneVoiceState;
  contacts: VirtualPhoneContact[];
  smsMessages: VirtualPhoneSmsMessage[];
  callHistory: VirtualPhoneCallLog[];
  voicemails: VirtualPhoneVoicemail[];
  devicesMesh: VirtualPhoneDeviceMeshNode[];
  virtualApps: VirtualPhoneVirtualAppRuntime[];
  webhooks: Array<{ id: string; url: string; event: string; active: boolean }>;
  mfaModalOpen: boolean;
  pairingModalOpen: boolean;
  providerModalOpen: boolean;
  appLaunchModalOpen: boolean;
}

const DEFAULT_STATE: VirtualPhoneState = {
  uid: 'usr-root-001',
  identityHash: 'sha256-vtr-9a8f7e6d5c4b3a21',
  role: 'founder',
  mfaEnabled: false,
  msisdn: 'NOT_CONFIGURED',
  provider: 'unitel',
  providerStatus: 'offline',
  voice: {
    state: 'idle',
    durationSeconds: 0,
    isMuted: false,
    isHeld: false,
    isRecording: false,
    audioInputDevice: 'default-mic',
    audioOutputDevice: 'default-speaker'
  },
  contacts: [],
  smsMessages: [],
  callHistory: [],
  voicemails: [],
  devicesMesh: [],
  virtualApps: [],
  webhooks: [],
  mfaModalOpen: false,
  pairingModalOpen: false,
  providerModalOpen: false,
  appLaunchModalOpen: false
};

class VirtualPhoneEngine {
  private state: VirtualPhoneState = { ...DEFAULT_STATE };
  private listeners: Set<(state: VirtualPhoneState) => void> = new Set();
  private callTimer: any = null;

  constructor() {
    this.initTimer();
  }

  public getState(): VirtualPhoneState {
    return { ...this.state };
  }

  public subscribe(cb: (state: VirtualPhoneState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((cb) => cb(currentState));
  }

  private initTimer() {
    setInterval(() => {
      if (this.state.voice.state === 'connected') {
        this.state = {
          ...this.state,
          voice: {
            ...this.state.voice,
            durationSeconds: this.state.voice.durationSeconds + 1
          }
        };
        this.notify();
      }
    }, 1000);
  }

  // --- 1. IDENTIDADE & MFA ---
  public toggleMFA(enabled: boolean) {
    this.state = { ...this.state, mfaEnabled: enabled };
    this.notify();
  }

  public setMfaModal(open: boolean) {
    this.state = { ...this.state, mfaModalOpen: open };
    this.notify();
  }

  public verifyMfaCode(code: string): boolean {
    if (code.length === 6) {
      this.state = { ...this.state, mfaModalOpen: false };
      this.notify();
      return true;
    }
    return false;
  }

  public setRole(role: 'founder' | 'admin' | 'user') {
    this.state = { ...this.state, role };
    this.notify();
  }

  private activeAudioStream: MediaStream | null = null;

  // --- 2. TELECOM & NUMBER LAYER ---
  public setProvider(provider: TelecomProviderType) {
    const providerInstance = TelecomRegistry.getProvider(provider);
    this.state = {
      ...this.state,
      provider,
      msisdn: providerInstance.activeMsisdn,
      providerModalOpen: false
    };
    this.notify();
  }

  public setProviderModal(open: boolean) {
    this.state = { ...this.state, providerModalOpen: open };
    this.notify();
  }

  public changeNumber(msisdn: string) {
    this.state = { ...this.state, msisdn };
    this.notify();
  }

  // --- 3. CLOUD PHONE VOIP CALL ENGINE ---
  public async startCall(peerNumber: string) {
    if (!peerNumber) return;

    // Acquire real audio media stream (Microphone) if available
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        this.activeAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (e) {
      console.warn('[VirtualPhoneEngine] Microfone real indisponível ou permissão negada, usando canal sintetizado de voz:', e);
    }

    const providerObj = TelecomRegistry.getProvider(this.state.provider);

    this.state = {
      ...this.state,
      voice: {
        ...this.state.voice,
        state: 'dialing',
        remoteNumber: peerNumber,
        durationSeconds: 0,
        isMuted: false,
        isHeld: false,
        isRecording: false,
        mediaStreamActive: !!this.activeAudioStream
      }
    };
    this.notify();

    setTimeout(() => {
      if (this.state.voice.state === 'dialing') {
        this.state = {
          ...this.state,
          voice: {
            ...this.state.voice,
            state: 'connected'
          }
        };
        this.notify();
      }
    }, 1500);
  }

  public answerCall() {
    this.state = {
      ...this.state,
      voice: {
        ...this.state.voice,
        state: 'connected',
        durationSeconds: 0
      }
    };
    this.notify();
  }

  public endCall() {
    if (this.activeAudioStream) {
      this.activeAudioStream.getTracks().forEach((track) => track.stop());
      this.activeAudioStream = null;
    }

    const voice = this.state.voice;
    if (voice.remoteNumber && voice.state !== 'idle') {
      const newLog: VirtualPhoneCallLog = {
        id: `call_${Date.now()}`,
        type: 'outgoing',
        peerNumber: voice.remoteNumber,
        timestamp: Date.now(),
        durationSeconds: voice.durationSeconds,
        provider: this.state.provider
      };
      this.state = {
        ...this.state,
        callHistory: [newLog, ...this.state.callHistory],
        voice: {
          ...this.state.voice,
          state: 'idle',
          remoteNumber: undefined,
          durationSeconds: 0,
          isMuted: false,
          isHeld: false,
          isRecording: false,
          mediaStreamActive: false
        }
      };
    } else {
      this.state = {
        ...this.state,
        voice: {
          ...this.state.voice,
          state: 'idle',
          remoteNumber: undefined,
          durationSeconds: 0,
          mediaStreamActive: false
        }
      };
    }
    this.notify();
  }

  public toggleMute() {
    this.state = {
      ...this.state,
      voice: { ...this.state.voice, isMuted: !this.state.voice.isMuted }
    };
    this.notify();
  }

  public toggleHold() {
    const newState = this.state.voice.isHeld ? 'connected' : 'held';
    this.state = {
      ...this.state,
      voice: {
        ...this.state.voice,
        isHeld: !this.state.voice.isHeld,
        state: newState
      }
    };
    this.notify();
  }

  public toggleRecord() {
    this.state = {
      ...this.state,
      voice: { ...this.state.voice, isRecording: !this.state.voice.isRecording }
    };
    this.notify();
  }

  // --- 4. SMS & MESSAGING ---
  public sendSms(recipient: string, text: string) {
    if (!recipient || !text) return;
    const newSms: VirtualPhoneSmsMessage = {
      id: `sms_${Date.now()}`,
      threadId: `th-${recipient}`,
      sender: this.state.msisdn,
      recipient,
      text,
      timestamp: Date.now(),
      direction: 'outbound',
      status: 'delivered'
    };
    this.state = {
      ...this.state,
      smsMessages: [newSms, ...this.state.smsMessages]
    };
    this.notify();
  }

  // --- 5. CONTACTS ---
  public addContact(name: string, number: string) {
    if (!name || !number) return;
    const newContact: VirtualPhoneContact = {
      id: `cnt_${Date.now()}`,
      name,
      number
    };
    this.state = {
      ...this.state,
      contacts: [...this.state.contacts, newContact]
    };
    this.notify();
  }

  public deleteContact(id: string) {
    this.state = {
      ...this.state,
      contacts: this.state.contacts.filter((c) => c.id !== id)
    };
    this.notify();
  }

  // --- 6. DEVICE MESH & HANDOVER ---
  public setPairingModal(open: boolean) {
    this.state = { ...this.state, pairingModalOpen: open };
    this.notify();
  }

  public addDeviceNode(name: string, platform: 'android' | 'iphone' | 'ipad' | 'web' | 'windows' | 'macos' | 'linux') {
    const newNode: VirtualPhoneDeviceMeshNode = {
      deviceId: `dev-${Math.random().toString(36).substring(2, 8)}`,
      name,
      platform,
      trustScore: 90,
      isOnline: true,
      lastSeen: Date.now()
    };
    this.state = {
      ...this.state,
      devicesMesh: [...this.state.devicesMesh, newNode],
      pairingModalOpen: false
    };
    this.notify();
  }

  public revokeDeviceNode(deviceId: string) {
    this.state = {
      ...this.state,
      devicesMesh: this.state.devicesMesh.filter((d) => d.deviceId !== deviceId)
    };
    this.notify();
  }

  public handoverCall(targetDeviceId: string) {
    this.state = {
      ...this.state,
      devicesMesh: this.state.devicesMesh.map((d) =>
        d.deviceId === targetDeviceId ? { ...d, hasActiveHandover: true } : { ...d, hasActiveHandover: false }
      )
    };
    this.notify();
  }

  // --- 7. VIRTUAL RUNTIME ENGINE (ANDROID CLOUD RUNTIME) ---
  public setAppLaunchModal(open: boolean) {
    this.state = { ...this.state, appLaunchModalOpen: open };
    this.notify();
  }

  public launchVirtualApp(packageName: string, appName: string) {
    const existing = this.state.virtualApps.find((a) => a.packageName === packageName);
    if (existing) {
      this.state = {
        ...this.state,
        virtualApps: this.state.virtualApps.map((a) =>
          a.packageName === packageName ? { ...a, status: 'running' } : a
        ),
        appLaunchModalOpen: false
      };
    } else {
      const newApp: VirtualPhoneVirtualAppRuntime = {
        containerId: `cnt-${Math.random().toString(36).substring(2, 8)}`,
        packageName,
        appName,
        status: 'running',
        cpuUsagePct: 1.5,
        memoryMb: 240,
        fps: 60
      };
      this.state = {
        ...this.state,
        virtualApps: [...this.state.virtualApps, newApp],
        appLaunchModalOpen: false
      };
    }
    this.notify();
  }

  public stopVirtualApp(containerId: string) {
    this.state = {
      ...this.state,
      virtualApps: this.state.virtualApps.map((a) =>
        a.containerId === containerId ? { ...a, status: 'stopped', cpuUsagePct: 0 } : a
      )
    };
    this.notify();
  }

  public killVirtualApp(containerId: string) {
    this.state = {
      ...this.state,
      virtualApps: this.state.virtualApps.filter((a) => a.containerId !== containerId)
    };
    this.notify();
  }

  // --- 8. WEBHOOKS ---
  public toggleWebhook(id: string) {
    this.state = {
      ...this.state,
      webhooks: this.state.webhooks.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    };
    this.notify();
  }
}

export const virtualPhoneEngine = new VirtualPhoneEngine();
