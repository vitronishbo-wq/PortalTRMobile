// src/engine/installEngine.ts — Motor Universal de Instalação PWA (Fase 3 & 4)
// Suporte a 1-Clique em Desktop (Windows/Mac/Linux), Android, iOS, Firebase Hosting, Render e Fallback de Iframe

export type InstallEnvironment = 
  | 'STANDALONE_PWA'     // Já instalado e a rodar como PWA
  | 'DESKTOP_CHROME_EDGE'// Laptop / PC com suporte a beforeinstallprompt
  | 'MOBILE_ANDROID'     // Smartphone Android
  | 'MOBILE_IOS'         // iPhone / iPad (Safari WebClip)
  | 'IFRAME_PREVIEW'     // Dentro do iframe do AI Studio / Sandbox
  | 'WEB_BROWSER';       // Navegador comum

export interface InstallState {
  isInstalled: boolean;
  canInstall: boolean;
  environment: InstallEnvironment;
  hasNativePrompt: boolean;
}

export class InstallEngine {
  private static deferredPrompt: any = null;
  private static listeners: Set<(state: InstallState) => void> = new Set();
  private static publicUrl = 'https://portaltrmobile.web.app/';

  /**
   * Inicializa a escuta global do evento beforeinstallprompt imediatamente no arranque
   */
  public static init(): void {
    if (typeof window === 'undefined') return;

    // Escuta evento nativo do Chrome / Edge / Android
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyListeners();
    });

    // Escuta confirmação de app instalada com sucesso
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.notifyListeners();
    });

    // Se a página foi aberta com query param ?auto_install=true vindo do fallback
    if (window.location.search.includes('auto_install=true')) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        if (this.deferredPrompt) {
          this.install();
        }
      }, 500);
    }
  }

  /**
   * Registra manualmente o evento caso capturado em outro ponto
   */
  public static registerInstallPrompt(e: any): void {
    if (e) {
      this.deferredPrompt = e;
      this.notifyListeners();
    }
  }

  /**
   * Verifica se o aplicativo já está instalado e rodando em modo standalone
   */
  public static isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  /**
   * Identifica o ambiente atual de execução
   */
  public static getInstallEnvironment(): InstallEnvironment {
    if (typeof window === 'undefined') return 'WEB_BROWSER';

    if (this.isInstalled()) {
      return 'STANDALONE_PWA';
    }

    const inIframe = window.self !== window.top;
    if (inIframe) {
      return 'IFRAME_PREVIEW';
    }

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      return 'MOBILE_IOS';
    }
    if (/android/.test(ua)) {
      return 'MOBILE_ANDROID';
    }
    if (/chrome|edg|chromium/.test(ua)) {
      return 'DESKTOP_CHROME_EDGE';
    }

    return 'WEB_BROWSER';
  }

  /**
   * Verifica se é possível disparar instalação nativa ou guiada
   */
  public static canInstall(): boolean {
    if (this.isInstalled()) return false;
    return true;
  }

  /**
   * Retorna o estado completo da engine
   */
  public static getState(): InstallState {
    return {
      isInstalled: this.isInstalled(),
      canInstall: this.canInstall(),
      environment: this.getInstallEnvironment(),
      hasNativePrompt: Boolean(this.deferredPrompt)
    };
  }

  /**
   * Inscreve componente React para reações de estado
   */
  public static subscribe(callback: (state: InstallState) => void): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((cb) => cb(state));
  }

  /**
   * Abre o domínio público oficial com auto-instalação
   */
  public static openExternalInstall(): void {
    if (typeof window === 'undefined') return;
    const target = `${this.publicUrl}?auto_install=true`;
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  /**
   * DISPARA A INSTALAÇÃO EM 1 CLIQUE
   * - Laptop/Android com beforeinstallprompt -> Exibe diálogo nativo do SO.
   * - Iframe / AI Studio -> Abre diretamente https://portaltrmobile.web.app/ para disparar no browser nativo.
   * - iOS Safari -> Orienta "Partilhar -> Adicionar ao ecrã principal".
   */
  public static async install(): Promise<{ success: boolean; outcome?: string; reason?: string }> {
    if (this.isInstalled()) {
      return { success: true, outcome: 'ALREADY_INSTALLED', reason: 'A aplicação já está instalada neste dispositivo.' };
    }

    // 1. Caso tenha o evento nativo em cache (Laptop Chrome/Edge ou Android)
    if (this.deferredPrompt) {
      try {
        const promptEvent = this.deferredPrompt;
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        this.deferredPrompt = null;
        this.notifyListeners();
        return {
          success: choice.outcome === 'accepted',
          outcome: choice.outcome
        };
      } catch (err: any) {
        console.warn('[InstallEngine] Erro ao invocar prompt nativo:', err);
      }
    }

    // 2. Se estiver dentro de iframe (AI Studio preview) ou sem evento nativo disponível no ambiente local
    const env = this.getInstallEnvironment();
    if (env === 'IFRAME_PREVIEW' || !this.deferredPrompt) {
      // Abre a URL oficial pública numa nova aba onde o beforeinstallprompt nativo é garantido
      this.openExternalInstall();
      return {
        success: true,
        outcome: 'REDIRECTED_EXTERNAL',
        reason: 'A abrir o domínio oficial https://portaltrmobile.web.app/ para instalação nativa direta.'
      };
    }

    return { success: false, reason: 'Ambiente não suporta instalação automática.' };
  }
}

// Inicia escuta imediatamente na importação
InstallEngine.init();
