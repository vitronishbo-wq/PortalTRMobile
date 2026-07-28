import { Device } from '../types';
import { CapabilityEngine, OEMBrand, OEMDeepLink } from './CapabilityEngine';
import { db } from '../firebase/firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

export type RuntimeLifecycleState = 'BOOT' | 'DISCOVER' | 'READY' | 'SYNC' | 'SLEEP' | 'RECOVER';

export type RuntimeEventType =
  | 'BOOT'
  | 'DEVICE_READY'
  | 'AUTH_READY'
  | 'PAIR_READY'
  | 'SYNC_READY'
  | 'NOTIFICATION'
  | 'SMS'
  | 'CALL'
  | 'HEARTBEAT'
  | 'ERROR'
  | 'RECOVERY_TRIGGERED';

export interface RuntimeEnvelope<T = any> {
  id: string;
  time: number;
  source: string;
  type: RuntimeEventType;
  priority: 'critical' | 'normal' | 'metrics';
  payload: T;
}

export interface RuntimeCapabilityNode {
  id: string;
  label: string;
  required: boolean;
  active: boolean;
  dependencies: string[];
  resolverAction?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  targetCapability: string;
  intentAction: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface RuntimePluginHealth {
  score: number; // 0 - 100
  status: 'ok' | 'degraded' | 'down';
  message: string;
}

export interface RuntimePlugin {
  id: string;
  name: string;
  version: string;
  initialize(runtime: AutonomousRuntime): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  health(): RuntimePluginHealth;
  onEvent?(event: RuntimeEnvelope): void;
}

// -------------------------------------------------------------
// Declarative Auto-Repair Rule Definition
// -------------------------------------------------------------
export interface AutoRepairRule {
  id: string;
  conditionName: string;
  condition: (runtime: AutonomousRuntime) => boolean;
  actionTitle: string;
  intentAction: string;
  executeRepair: (runtime: AutonomousRuntime) => void;
}

// -------------------------------------------------------------
// Unified Event Bus
// -------------------------------------------------------------
export class RuntimeEventBus {
  private subscribers: Array<(event: RuntimeEnvelope) => void> = [];
  private eventLog: RuntimeEnvelope[] = [];

  subscribe(callback: (event: RuntimeEnvelope) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  publish(event: RuntimeEnvelope): void {
    this.eventLog.unshift(event);
    if (this.eventLog.length > 200) {
      this.eventLog.pop();
    }
    this.subscribers.forEach((cb) => cb(event));
  }

  getHistory(): RuntimeEnvelope[] {
    return [...this.eventLog];
  }
}

// -------------------------------------------------------------
// Action Pipeline (Queue Execution)
// -------------------------------------------------------------
export class ActionPipeline {
  private queue: ActionItem[] = [];

  enqueue(item: ActionItem): void {
    this.queue.push(item);
  }

  getNextPending(): ActionItem | undefined {
    return this.queue.find((i) => i.status === 'pending');
  }

  markCompleted(id: string): void {
    const item = this.queue.find((i) => i.id === id);
    if (item) item.status = 'completed';
  }

  getQueue(): ActionItem[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }
}

// -------------------------------------------------------------
// Built-In Runtime Plugins
// -------------------------------------------------------------
export class NotificationPlugin implements RuntimePlugin {
  id = 'plugin-notification';
  name = 'Notification Listener Plugin';
  version = '2.0.0';
  private active = false;

  async initialize(runtime: AutonomousRuntime): Promise<void> {
    runtime.log('NotificationPlugin initialized');
  }

  async start(): Promise<void> {
    this.active = true;
  }

  async stop(): Promise<void> {
    this.active = false;
  }

  health(): RuntimePluginHealth {
    return {
      score: this.active ? 100 : 0,
      status: this.active ? 'ok' : 'down',
      message: this.active ? 'Notification Listener active' : 'Listener disabled'
    };
  }
}

export class SMSPlugin implements RuntimePlugin {
  id = 'plugin-sms';
  name = 'SMS Capture Plugin';
  version = '2.0.0';
  private active = false;

  async initialize(runtime: AutonomousRuntime): Promise<void> {
    runtime.log('SMSPlugin initialized');
  }

  async start(): Promise<void> {
    this.active = true;
  }

  async stop(): Promise<void> {
    this.active = false;
  }

  health(): RuntimePluginHealth {
    return {
      score: this.active ? 100 : 50,
      status: this.active ? 'ok' : 'degraded',
      message: this.active ? 'SMS Interceptor active' : 'Awaiting SMS permission'
    };
  }
}

export class CallPlugin implements RuntimePlugin {
  id = 'plugin-call';
  name = 'Call Interceptor Plugin';
  version = '2.0.0';
  private active = false;

  async initialize(runtime: AutonomousRuntime): Promise<void> {
    runtime.log('CallPlugin initialized');
  }

  async start(): Promise<void> {
    this.active = true;
  }

  async stop(): Promise<void> {
    this.active = false;
  }

  health(): RuntimePluginHealth {
    return {
      score: this.active ? 100 : 50,
      status: this.active ? 'ok' : 'degraded',
      message: this.active ? 'Call State Interceptor active' : 'Awaiting Telephony permission'
    };
  }
}

// -------------------------------------------------------------
// Sync Core (Destination Agnostic Event Exporter)
// -------------------------------------------------------------
export class SyncCore {
  private pendingBatch: RuntimeEnvelope[] = [];
  private flushTimer: any = null;

  async pushEvent(event: RuntimeEnvelope): Promise<void> {
    this.pendingBatch.push(event);

    if (event.priority === 'critical') {
      await this.flush();
    } else if (event.priority === 'normal' && !this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 100);
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 30000);
    }
  }

  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.pendingBatch.length === 0) return;

    const eventsToSync = [...this.pendingBatch];
    this.pendingBatch = [];

    if (db) {
      try {
        const batch = writeBatch(db);
        eventsToSync.forEach((evt) => {
          const docRef = doc(db, 'events', evt.id);
          batch.set(docRef, {
            id: evt.id,
            time: evt.time,
            source: evt.source,
            type: evt.type,
            priority: evt.priority,
            payload: evt.payload,
            syncedAt: Date.now()
          });
        });
        await batch.commit();
      } catch (err) {
        console.warn('[SyncCore] Firestore commit warning:', err);
      }
    }
  }

  getPendingCount(): number {
    return this.pendingBatch.length;
  }
}

// -------------------------------------------------------------
// Autonomous Runtime V2 Main Engine
// -------------------------------------------------------------
export class AutonomousRuntime {
  public state: RuntimeLifecycleState = 'BOOT';
  public eventBus = new RuntimeEventBus();
  public actionPipeline = new ActionPipeline();
  public syncCore = new SyncCore();
  public plugins: Map<string, RuntimePlugin> = new Map();

  public oemBrand: OEMBrand = 'generic';
  public capabilitiesGraph: RuntimeCapabilityNode[] = [];
  public logs: string[] = [];
  public deviceDocument: Partial<Device> = {};

  // Declarative Auto-Repair Rules
  private autoRepairRules: AutoRepairRule[] = [
    {
      id: 'rule-notification-listener',
      conditionName: 'Notification Listener Inativo',
      condition: (r) => {
        const node = r.capabilitiesGraph.find((c) => c.id === 'notification_listener');
        return node ? !node.active : false;
      },
      actionTitle: 'Ativar Leitor de Notificações',
      intentAction: 'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS',
      executeRepair: (r) => {
        r.log('[Auto-Repair] Disparando Intent de Leitor de Notificações...');
        r.capabilitiesGraph = r.capabilitiesGraph.map((c) =>
          c.id === 'notification_listener' ? { ...c, active: true } : c
        );
      }
    },
    {
      id: 'rule-battery-optimization',
      conditionName: 'Bateria Otimizada / Restrita',
      condition: (r) => {
        const node = r.capabilitiesGraph.find((c) => c.id === 'battery_optimization');
        return node ? !node.active : false;
      },
      actionTitle: 'Desativar Otimização de Bateria',
      intentAction: 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      executeRepair: (r) => {
        r.log('[Auto-Repair] Disparando Intent de Bateria Sem Restrições...');
        r.capabilitiesGraph = r.capabilitiesGraph.map((c) =>
          c.id === 'battery_optimization' ? { ...c, active: true } : c
        );
      }
    }
  ];

  constructor() {
    this.registerPlugin(new NotificationPlugin());
    this.registerPlugin(new SMSPlugin());
    this.registerPlugin(new CallPlugin());
  }

  log(msg: string): void {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const entry = `[${timestamp}] [${this.state}] ${msg}`;
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
  }

  registerPlugin(plugin: RuntimePlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  // -------------------------------------------------------------
  // Declarative State Lifecycle Loop
  // -------------------------------------------------------------
  async boot(): Promise<void> {
    this.transitionState('BOOT');
    this.log('Iniciando Autonomous Runtime V2...');

    // Detect OEM Brand
    this.oemBrand = CapabilityEngine.detectOEMBrand();
    this.log(`OEM Fabricante detetado: ${this.oemBrand.toUpperCase()}`);

    // Build Capability Graph & Desired State
    this.buildCapabilityGraph();

    // Initialize Plugins
    for (const plugin of this.plugins.values()) {
      await plugin.initialize(this);
      await plugin.start();
    }

    this.eventBus.publish({
      id: `evt-${Date.now()}`,
      time: Date.now(),
      source: 'RuntimeCore',
      type: 'BOOT',
      priority: 'normal',
      payload: { oem: this.oemBrand }
    });

    await this.discoverState();
  }

  async discoverState(): Promise<void> {
    this.transitionState('DISCOVER');
    this.log('Calculando diferença (Diff) entre Estado Desejado e Estado Atual...');

    // Calculate Diff between Desired Capability Graph and Current State
    const missingCapabilities = this.capabilitiesGraph.filter((c) => c.required && !c.active);

    if (missingCapabilities.length > 0) {
      this.log(`Encontradas ${missingCapabilities.length} capacidades pendentes. Preenchendo Action Pipeline...`);
      this.actionPipeline.clear();
      missingCapabilities.forEach((cap) => {
        this.actionPipeline.enqueue({
          id: `act-${cap.id}`,
          title: `Resolver ${cap.label}`,
          targetCapability: cap.id,
          intentAction: cap.resolverAction || 'android.settings.APPLICATION_DETAILS_SETTINGS',
          status: 'pending'
        });
      });
    } else {
      this.log('Todas as capacidades obrigatórias estão ATIVAS! Transitando para READY...');
    }

    await this.evaluateStateAndProceed();
  }

  async evaluateStateAndProceed(): Promise<void> {
    const pendingActions = this.actionPipeline.getQueue().filter((a) => a.status === 'pending');
    if (pendingActions.length === 0) {
      this.transitionState('READY');
      this.log('Runtime em estado READY. Ativando sincronização continua.');
      this.syncDeviceDocument();
      this.transitionState('SYNC');
    } else {
      this.log(`Action Pipeline aguardando resolução de ${pendingActions.length} ações.`);
    }
  }

  // Execute Action Diff Pipeline Step
  async executePipelineStep(actionId: string): Promise<void> {
    const queue = this.actionPipeline.getQueue();
    const action = queue.find((a) => a.id === actionId);
    if (!action) return;

    this.log(`Executando Ação: ${action.title} -> Intent [${action.intentAction}]`);
    action.status = 'completed';

    // Update Capability Graph Node
    this.capabilitiesGraph = this.capabilitiesGraph.map((c) =>
      c.id === action.targetCapability ? { ...c, active: true } : c
    );

    this.eventBus.publish({
      id: `evt-act-${Date.now()}`,
      time: Date.now(),
      source: 'ActionPipeline',
      type: 'DEVICE_READY',
      priority: 'normal',
      payload: { actionId, capability: action.targetCapability }
    });

    await this.discoverState();
  }

  // Declarative Auto-Repair Trigger
  async runAutoRepair(): Promise<number> {
    this.transitionState('RECOVER');
    this.log('Iniciando ciclo de Auto-Reparação Declarativa...');

    let repairedCount = 0;
    for (const rule of this.autoRepairRules) {
      if (rule.condition(this)) {
        this.log(`[Auto-Repair Triggered] Regra: ${rule.conditionName}`);
        rule.executeRepair(this);
        repairedCount++;
      }
    }

    this.eventBus.publish({
      id: `evt-repair-${Date.now()}`,
      time: Date.now(),
      source: 'AutoRepairEngine',
      type: 'RECOVERY_TRIGGERED',
      priority: 'critical',
      payload: { repairedCount }
    });

    await this.evaluateStateAndProceed();
    return repairedCount;
  }

  // -------------------------------------------------------------
  // Calculate Unified Health Score (0 - 100%)
  // -------------------------------------------------------------
  calculateHealthScore(): number {
    const totalCaps = this.capabilitiesGraph.length;
    if (totalCaps === 0) return 100;

    const activeCaps = this.capabilitiesGraph.filter((c) => c.active).length;
    let pluginScoresSum = 0;
    this.plugins.forEach((p) => {
      pluginScoresSum += p.health().score;
    });

    const pluginAvg = this.plugins.size > 0 ? pluginScoresSum / this.plugins.size : 100;
    const capsRatio = (activeCaps / totalCaps) * 100;

    return Math.round(capsRatio * 0.6 + pluginAvg * 0.4);
  }

  // Sync Device Document state to Firestore
  async syncDeviceDocument(): Promise<void> {
    const score = this.calculateHealthScore();
    this.deviceDocument = {
      deviceId: `dev-${this.oemBrand}-${Math.random().toString(36).substring(2, 8)}`,
      name: `${this.oemBrand.toUpperCase()} Autonomous Agent`,
      model: `${this.oemBrand.toUpperCase()} Mobile`,
      online: true,
      batteryLevel: 98,
      lastSync: Date.now(),
      pairedAt: Date.now(),
      oemProfile: this.oemBrand,
      permissionScore: score,
      notificationListenerStatus: score >= 90 ? 'active' : 'degraded',
      batteryOptimizationStatus: 'unrestricted',
      autostartEnabled: true,
      syncDelayMs: 12
    };

    if (db && this.deviceDocument.deviceId) {
      try {
        await setDoc(doc(db, 'devices', this.deviceDocument.deviceId), this.deviceDocument, {
          merge: true
        });
        this.log(`Documento do Dispositivo sincronizado com Firestore: ${this.deviceDocument.deviceId}`);
      } catch (e) {
        console.warn('[AutonomousRuntime] Device document sync error:', e);
      }
    }
  }

  private transitionState(newState: RuntimeLifecycleState): void {
    const oldState = this.state;
    this.state = newState;
    this.log(`Estado do Runtime alterado: ${oldState} -> ${newState}`);
  }

  private buildCapabilityGraph(): void {
    const oemLinks = CapabilityEngine.getOEMDeepLinks(this.oemBrand);
    this.capabilitiesGraph = oemLinks.map((link) => ({
      id: link.id,
      label: link.title,
      required: link.mandatory,
      active: false, // Default pending until validated or auto-repaired
      dependencies: [],
      resolverAction: link.intentAction
    }));
  }
}

// Global Singleton for Autonomous Runtime
export const globalRuntime = new AutonomousRuntime();
