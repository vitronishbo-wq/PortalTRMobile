/* PortalTRMobile - PWA Auto-Update Engine & Execution Layer */

export type UpdateStatus = 'current' | 'update-available' | 'updating' | 'failed';

export interface UpdateState {
  currentVersion: string;
  detectedVersion: string | null;
  status: UpdateStatus;
  lastCheckedAt: number | null;
  error?: string;
  hasWaitingWorker: boolean;
}

export const APP_VERSION = '5.0.0-TelecomCore';

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

  /**
   * Initializes the PWA Auto-Update Engine
   */
  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    console.log(`[UpdateEngine] Inicializando Kernel PWA Update Engine (v${this.currentVersion})...`);

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
            console.warn('[UpdateEngine] Nenhuma registo de Service Worker encontrado no boot.');
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
   * Emits update available state and triggers global events
   */
  public notifyUpdateAvailable(detectedVersion?: string): void {
    if (this.status === 'updating') return;

    this.status = 'update-available';
    this.detectedVersion = detectedVersion || '5.0.1-TelecomCore';
    
    console.log(`[UpdateEngine] Sinal global emitted: pwa-update-available (${this.detectedVersion})`);

    const state = this.getState();

    // Global DOM Event for listeners anywhere in the application
    window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: state }));

    this.notifySubscribers();
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

    console.log('[UpdateEngine] A iniciar força de atualização do Kernel PWA...');

    try {
      // 1. Controlled CacheStorage purge (leaves LocalStorage, IndexedDB and Firestore intact)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        console.log(`[UpdateEngine] A eliminar ${cacheKeys.length} caches antigas do CacheStorage...`);
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        console.log('[UpdateEngine] Caches PWA eliminadas com sucesso.');
      }

      // 2. Obtain registration and trigger SKIP_WAITING
      const reg = this.registration || (await navigator.serviceWorker.getRegistration());
      if (reg) {
        const targetWorker = reg.waiting || reg.installing || reg.active;
        if (targetWorker) {
          console.log('[UpdateEngine] A enviar mensagem SKIP_WAITING ao Service Worker...');
          targetWorker.postMessage({ type: 'SKIP_WAITING' });
          targetWorker.postMessage('SKIP_WAITING');
        }
      }

      // 3. Fallback timer if controllerchange event takes longer than 1.2s
      setTimeout(() => {
        this.performReload();
      }, 1200);

    } catch (err) {
      console.error('[UpdateEngine] Falha na execução da atualização:', err);
      this.status = 'failed';
      this.error = err instanceof Error ? err.message : 'Falha ao aplicar atualização do Kernel';
      this.isUpdating = false;
      this.notifySubscribers();
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
