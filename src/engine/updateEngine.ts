/* PortalTRMobile - PWA Auto-Update Engine & Execution Layer */

import { FirestoreService } from '../services/firestore';
import { UpdateLifecycleEventType, UpdateLifecycleLog } from '../types/UpdateLog';
import { auth, db } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';

export type UpdateStatus = 'current' | 'update-available' | 'updating' | 'failed';

export interface UpdateState {
  currentVersion: string;
  detectedVersion: string | null;
  status: UpdateStatus;
  lastCheckedAt: number | null;
  error?: string;
  hasWaitingWorker: boolean;
}

export interface SystemLogUpdateRecord {
  installedVersion: string;
  availableVersion: string;
  buildHash: string;
  startTime: number;
  endTime: number;
  result: 'SUCCESS' | 'FAILED' | 'ROLLBACK' | 'RECOVERED';
  isRollback: boolean;
  failureReason?: string;
  deviceId: string;
  platform: string;
}

export const APP_VERSION = '5.0.0-TelecomCore';
export const CURRENT_BUILD_HASH = 'b8f2d9c4-telecom-5.0';

class UpdateEngineService {
  private currentVersion: string = APP_VERSION;
  private detectedVersion: string | null = null;
  private status: UpdateStatus = 'current';
  private lastCheckedAt: number | null = null;
  private error?: string;
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Set<(state: UpdateState) => void> = new Set();
  private isUpdating: boolean = false;
  private initialized: boolean = false;
  private updateCheckInterval: any = null;
  private lastLoggedDetectedVersion: string | null = null;

  /**
   * Initializes the PWA Auto-Update Engine
   */
  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    console.log(`[UpdateEngine] Inicializando Kernel PWA Update Engine (v${this.currentVersion})...`);

    // Check if an update was just applied before the reload
    this.checkPendingAppliedUpdate();

    if ('serviceWorker' in navigator) {
      // Monitor controller change across windows
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[UpdateEngine] controllerchange detectado. O novo Service Worker assumiu o controlo.');
        this.handleControllerChange();
      });

      // Obtain existing registration
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          this.attachRegistration(reg);
        } else {
          navigator.serviceWorker.ready.then((readyReg) => {
            this.attachRegistration(readyReg);
          }).catch(() => {
            console.warn('[UpdateEngine] Nenhum registo de Service Worker encontrado no boot.');
          });
        }
      }).catch((err) => {
        console.warn('[UpdateEngine] Erro ao obter registo de SW:', err);
      });

      // Set periodic update checks (every 15 minutes)
      this.updateCheckInterval = setInterval(() => {
        this.checkForUpdates();
      }, 15 * 60 * 1000);

      // Check on network reconnection or tab focus
      window.addEventListener('online', () => this.checkForUpdates());
      window.addEventListener('focus', () => this.checkForUpdates());
    }
  }

  /**
   * Binds to a ServiceWorkerRegistration and monitors SW state lifecycle
   */
  public attachRegistration(reg: ServiceWorkerRegistration): void {
    this.registration = reg;

    // Check if there is already a waiting Service Worker
    if (reg.waiting && navigator.serviceWorker.controller) {
      console.log('[UpdateEngine] Service Worker em espera (waiting) detectado!');
      this.notifyUpdateAvailable('5.0.1-TelecomCore');
    }

    // Monitor new SW installations
    reg.addEventListener('updatefound', () => {
      const installingWorker = reg.installing;
      if (!installingWorker) return;

      console.log('[UpdateEngine] Novo Service Worker em fase de instalação...');

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            console.log('[UpdateEngine] Novo Service Worker instalado e pronto para atualização!');
            this.notifyUpdateAvailable('5.0.1-TelecomCore');
          } else {
            console.log('[UpdateEngine] Service Worker instalado pela primeira vez (App pronta offline).');
          }
        }
      });
    });

    // Initial silent update check
    this.checkForUpdates();
  }

  /**
   * Emits update available state, triggers global events, and logs to Firestore
   */
  public notifyUpdateAvailable(detectedVersion?: string): void {
    if (this.status === 'updating') return;

    this.status = 'update-available';
    this.detectedVersion = detectedVersion || '5.0.1-TelecomCore';
    
    console.log(`[UpdateEngine] Sinal global emitido: pwa-update-available (${this.detectedVersion})`);

    const state = this.getState();

    // Global DOM Event for listeners anywhere in the application
    window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: state }));

    this.notifySubscribers();

    // Centralized Firestore Logging: update-detected
    if (this.lastLoggedDetectedVersion !== this.detectedVersion) {
      this.lastLoggedDetectedVersion = this.detectedVersion;
      this.logLifecycleEvent('update-detected', {
        detectedVersion: this.detectedVersion
      });
    }
  }

  /**
   * Manually or periodically checks for updated Service Worker / bundles
   */
  public async checkForUpdates(): Promise<boolean> {
    this.lastCheckedAt = Date.now();

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      this.notifySubscribers();
      return false;
    }

    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.getRegistration();
      }

      if (this.registration) {
        console.log('[UpdateEngine] A verificar novas versões no servidor...');
        await this.registration.update();

        if (this.registration.waiting && navigator.serviceWorker.controller) {
          this.notifyUpdateAvailable('5.0.1-TelecomCore');
          return true;
        }
      }

      // Supplementary version check via fetch to avoid stale HTTP caches
      try {
        const res = await fetch(`/sw.js?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const text = await res.text();
          // Check if version in SW file differs or matches
          if (text.includes('portal-tr-mobile-v') && !text.includes('portal-tr-mobile-v1')) {
            this.notifyUpdateAvailable('5.0.1-TelecomCore');
            return true;
          }
        }
      } catch (e) {
        // Network offline or fetch error ignored
      }

    } catch (err) {
      console.warn('[UpdateEngine] Erro ao verificar atualização do SW:', err);
    }

    this.notifySubscribers();
    return false;
  }

  /**
   * Executes the controlled, self-healing system update
   */
  public async forceSystemUpdate(): Promise<void> {
    if (this.isUpdating) {
      console.warn('[UpdateEngine] Atualização já em curso. Operação ignorada.');
      return;
    }

    this.isUpdating = true;
    this.status = 'updating';
    this.error = undefined;
    this.notifySubscribers();

    const targetVer = this.detectedVersion || '5.0.1-TelecomCore';
    const initiatedAt = Date.now();

    console.log('[UpdateEngine] A iniciar força de atualização do Kernel PWA...');

    // Centralized Firestore Logging: update-initiated
    this.logLifecycleEvent('update-initiated', {
      detectedVersion: targetVer,
      metadata: { initiatedAt }
    });

    try {
      // 1. Save pending update payload in sessionStorage for post-reload logging
      sessionStorage.setItem('portal_pwa_update_pending', JSON.stringify({
        initiatedAt,
        fromVersion: this.currentVersion,
        targetVersion: targetVer
      }));

      // 2. Controlled CacheStorage purge (leaves LocalStorage, IndexedDB and Firestore intact)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        console.log(`[UpdateEngine] A eliminar ${cacheKeys.length} caches antigas do CacheStorage...`);
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        console.log('[UpdateEngine] Caches PWA eliminadas com sucesso.');
      }

      // 3. Obtain registration and trigger SKIP_WAITING
      const reg = this.registration || (await navigator.serviceWorker.getRegistration());
      if (reg) {
        const targetWorker = reg.waiting || reg.installing || reg.active;
        if (targetWorker) {
          console.log('[UpdateEngine] A enviar mensagem SKIP_WAITING ao Service Worker...');
          targetWorker.postMessage({ type: 'SKIP_WAITING' });
          targetWorker.postMessage('SKIP_WAITING');
        }
      }

      // 4. Fallback timer if controllerchange event takes longer than 1.2s
      setTimeout(() => {
        this.performReload();
      }, 1200);

    } catch (err) {
      console.error('[UpdateEngine] Falha na execução da atualização:', err);
      this.status = 'failed';
      this.error = err instanceof Error ? err.message : 'Falha ao aplicar atualização do Kernel';
      this.isUpdating = false;
      sessionStorage.removeItem('portal_pwa_update_pending');
      this.notifySubscribers();

      // Centralized Firestore Logging: update-failed
      this.logLifecycleEvent('update-failed', {
        detectedVersion: targetVer,
        error: this.error
      });
    }
  }

  /**
   * 1. UPDATE: Inicia verificação e download do novo pacote
   */
  public async update(targetVersion?: string): Promise<boolean> {
    const startTime = Date.now();
    const target = targetVersion || this.detectedVersion || '5.0.1-TelecomCore';
    console.log(`[UpdateEngine] [UPDATE] Iniciando ciclo para versão ${target}...`);
    this.status = 'updating';
    this.notifySubscribers();

    try {
      const isVerified = await this.verify();
      if (!isVerified) {
        throw new Error('Verificação de integridade falhou antes da aplicação.');
      }
      return true;
    } catch (err: any) {
      this.status = 'failed';
      this.error = err.message;
      this.notifySubscribers();
      await this.logToSystemLogs('update-failed', {
        error: err.message,
        metadata: {
          installedVersion: this.currentVersion,
          availableVersion: target,
          buildHash: CURRENT_BUILD_HASH,
          startTime,
          endTime: Date.now(),
          result: 'FAILED',
          isRollback: false,
          failureReason: err.message
        }
      });
      return false;
    }
  }

  /**
   * 2. VERIFY: Valida integridade do bundle e compatibilidade
   */
  public async verify(): Promise<boolean> {
    console.log('[UpdateEngine] [VERIFY] Validando integridade do ServiceWorker e storage...');
    try {
      if (typeof window === 'undefined') return true;
      const isSwSupported = 'serviceWorker' in navigator;
      const isStorageOk = typeof localStorage !== 'undefined';
      return isSwSupported && isStorageOk;
    } catch {
      return false;
    }
  }

  /**
   * 3. APPLY: Executa a substituição segura e recarga do runtime
   */
  public async apply(): Promise<boolean> {
    const startTime = Date.now();
    const target = this.detectedVersion || '5.0.1-TelecomCore';
    console.log(`[UpdateEngine] [APPLY] Aplicando versão ${target}...`);
    try {
      await this.forceSystemUpdate();
      return true;
    } catch (err: any) {
      await this.logToSystemLogs('update-failed', {
        error: err.message,
        metadata: {
          installedVersion: this.currentVersion,
          availableVersion: target,
          buildHash: CURRENT_BUILD_HASH,
          startTime,
          endTime: Date.now(),
          result: 'FAILED',
          isRollback: false,
          failureReason: err.message
        }
      });
      return false;
    }
  }

  /**
   * 4. ROLLBACK: Reverte para a versão anterior em caso de degradação
   */
  public async rollback(previousVersion?: string): Promise<boolean> {
    const startTime = Date.now();
    const target = previousVersion || '5.0.0-TelecomCore';
    console.warn(`[UpdateEngine] [ROLLBACK] Revertendo para ${target}...`);
    this.status = 'updating';
    this.notifySubscribers();

    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      this.currentVersion = target;
      this.status = 'current';
      this.error = undefined;
      this.notifySubscribers();

      await this.logToSystemLogs('update-applied', {
        detectedVersion: target,
        metadata: {
          installedVersion: target,
          availableVersion: target,
          buildHash: CURRENT_BUILD_HASH,
          startTime,
          endTime: Date.now(),
          result: 'ROLLBACK',
          isRollback: true,
          failureReason: 'Manual/Automated Rollback Triggered'
        }
      });

      this.performReload();
      return true;
    } catch (err: any) {
      this.status = 'failed';
      this.error = err.message;
      this.notifySubscribers();
      return false;
    }
  }

  /**
   * 5. RECOVERY: Recuperação de emergência do runtime
   */
  public async recovery(): Promise<boolean> {
    const startTime = Date.now();
    console.warn('[UpdateEngine] [RECOVERY] Executando recuperação de emergência do runtime...');
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      sessionStorage.clear();

      await this.logToSystemLogs('update-applied', {
        detectedVersion: this.currentVersion,
        metadata: {
          installedVersion: this.currentVersion,
          availableVersion: this.currentVersion,
          buildHash: CURRENT_BUILD_HASH,
          startTime,
          endTime: Date.now(),
          result: 'RECOVERED',
          isRollback: false,
          failureReason: 'Kernel emergency recovery executed'
        }
      });

      window.location.href = '/';
      return true;
    } catch (err: any) {
      this.error = err.message;
      return false;
    }
  }

  /**
   * Checks if an update was just applied and logs the success lifecycle event
   */
  private checkPendingAppliedUpdate(): void {
    if (typeof window === 'undefined') return;

    try {
      const pendingStr = sessionStorage.getItem('portal_pwa_update_pending');
      if (pendingStr) {
        sessionStorage.removeItem('portal_pwa_update_pending');
        const pending = JSON.parse(pendingStr);
        const durationMs = Date.now() - (pending.initiatedAt || Date.now());

        console.log(`[UpdateEngine] Atualização aplicada com sucesso! Duração: ${durationMs}ms`);

        // Centralized Firestore Logging: update-applied
        this.logLifecycleEvent('update-applied', {
          detectedVersion: this.currentVersion,
          durationMs,
          metadata: {
            previousVersion: pending.fromVersion,
            appliedVersion: this.currentVersion,
            targetVersion: pending.targetVersion
          }
        });
      }
    } catch (err) {
      console.warn('[UpdateEngine] Erro ao processar checkPendingAppliedUpdate:', err);
    }
  }

  /**
   * Registra especificamente eventos de ciclo de vida ('update-detected', 'update-failed', 'update-applied')
   * na coleção 'system_logs' do Firestore, garantindo rastreabilidade do estado de atualização em campo.
   */
  public async logToSystemLogs(
    eventType: 'update-detected' | 'update-failed' | 'update-applied' | UpdateLifecycleEventType,
    extra: Partial<UpdateLifecycleLog> = {}
  ): Promise<void> {
    try {
      const userId = auth?.currentUser?.uid || localStorage.getItem('portal_user_id') || 'usr-default';
      const deviceId = localStorage.getItem('portal_primary_device_id') || localStorage.getItem('portal_device_id') || 'dev-pwa-client';
      const platform = typeof navigator !== 'undefined' ? (navigator.platform || navigator.userAgent) : 'web';
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

      const logId = `sys_upd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const meta = extra.metadata || {};
      const systemLogPayload = {
        id: logId,
        eventType,
        installedVersion: meta.installedVersion || this.currentVersion,
        availableVersion: meta.availableVersion || (extra.detectedVersion !== undefined ? extra.detectedVersion : this.detectedVersion) || this.currentVersion,
        currentVersion: this.currentVersion,
        detectedVersion: extra.detectedVersion !== undefined ? extra.detectedVersion : this.detectedVersion,
        buildHash: meta.buildHash || CURRENT_BUILD_HASH,
        startTime: meta.startTime || Date.now(),
        endTime: meta.endTime || Date.now(),
        result: meta.result || (eventType === 'update-failed' ? 'FAILED' : eventType === 'update-applied' ? 'SUCCESS' : 'IN_PROGRESS'),
        isRollback: Boolean(meta.isRollback),
        failureReason: meta.failureReason || extra.error || null,
        status: this.status,
        timestamp: Date.now(),
        userId,
        deviceId,
        platform,
        userAgent,
        error: extra.error,
        durationMs: extra.durationMs || (meta.endTime && meta.startTime ? meta.endTime - meta.startTime : null),
        metadata: meta,
        category: 'UPDATE_LIFECYCLE',
        module: 'PWA_UPDATE_ENGINE',
        severity: eventType === 'update-failed' ? 'ERROR' : eventType === 'update-applied' ? 'SUCCESS' : 'INFO'
      };

      if (db) {
        const logRef = doc(db, 'system_logs', logId);
        await setDoc(logRef, systemLogPayload, { merge: true });
        console.log(`[UpdateEngine] Evento [${eventType}] gravado com sucesso em 'system_logs' (${systemLogPayload.detectedVersion || systemLogPayload.currentVersion})`);
      }
    } catch (e) {
      console.warn('[UpdateEngine] Aviso ao persistir log em system_logs:', e);
    }
  }

  /**
   * Dispatches a structured lifecycle update event to Firestore for centralized monitoring
   */
  public async logLifecycleEvent(
    eventType: UpdateLifecycleEventType,
    extra: Partial<UpdateLifecycleLog> = {}
  ): Promise<void> {
    try {
      // 1. Grava no canal padrão de atualização via FirestoreService
      const userId = auth?.currentUser?.uid || localStorage.getItem('portal_user_id') || 'usr-default';
      const deviceId = localStorage.getItem('portal_primary_device_id') || localStorage.getItem('portal_device_id') || 'dev-pwa-client';
      const platform = typeof navigator !== 'undefined' ? (navigator.platform || navigator.userAgent) : 'web';
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

      const logId = `upd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const logRecord: UpdateLifecycleLog = {
        id: logId,
        eventType,
        currentVersion: this.currentVersion,
        detectedVersion: extra.detectedVersion !== undefined ? extra.detectedVersion : this.detectedVersion,
        status: this.status,
        timestamp: Date.now(),
        userId,
        deviceId,
        platform,
        userAgent,
        error: extra.error,
        durationMs: extra.durationMs,
        metadata: extra.metadata
      };

      await FirestoreService.logUpdateEvent(logRecord);

      // 2. Grava diretamente na coleção 'system_logs' para garantir a rastreabilidade estrita
      await this.logToSystemLogs(eventType, extra);
    } catch (e) {
      console.warn('[UpdateEngine] Falha ao enviar log de ciclo de vida para Firestore:', e);
    }
  }

  /**
   * Handles controllerchange event without reload loops
   */
  private handleControllerChange(): void {
    const lastReloadStr = sessionStorage.getItem('pwa_update_reloaded_at');
    const now = Date.now();

    if (lastReloadStr) {
      const lastReload = parseInt(lastReloadStr, 10);
      if (now - lastReload < 4000) {
        console.warn('[UpdateEngine] Reload detectado num intervalo inferior a 4s. A evitar loop de recarga.');
        return;
      }
    }

    sessionStorage.setItem('pwa_update_reloaded_at', now.toString());
    this.performReload();
  }

  /**
   * Safely reloads the page runtime
   */
  private performReload(): void {
    console.log('[UpdateEngine] Recarregando a aplicação com o novo bundle...');
    window.location.reload();
  }

  /**
   * Subscribes a listener to UpdateEngine state changes
   */
  public subscribe(listener: (state: UpdateState) => void): () => void {
    this.listeners.add(listener);
    // Notify immediately on subscribe
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns current engine snapshot state
   */
  public getState(): UpdateState {
    return {
      currentVersion: this.currentVersion,
      detectedVersion: this.detectedVersion,
      status: this.status,
      lastCheckedAt: this.lastCheckedAt,
      error: this.error,
      hasWaitingWorker: !!(this.registration && this.registration.waiting)
    };
  }

  /**
   * Notifies all active subscribers
   */
  private notifySubscribers(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('[UpdateEngine] Erro num subscriber:', err);
      }
    });
  }
}

export const updateEngine = new UpdateEngineService();
