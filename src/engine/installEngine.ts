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
  platform: InstallEnvironment;
  isInAppBrowser: boolean;
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
   * Deteta se o utilizador está dentro de WebViews / In-App Browsers (Instagram, WhatsApp, TikTok, etc.)
   */
  public static isInAppBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    return /FBAN|FBAV|Instagram|WhatsApp|TikTok|Snapchat|Line|MicroMessenger|Twitter|FB_IAB/i.test(ua);
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
    const env = this.getInstallEnvironment();
    return {
      isInstalled: this.isInstalled(),
      canInstall: this.canInstall(),
      environment: env,
      platform: env,
      isInAppBrowser: this.isInAppBrowser(),
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
   * DISPARA A INSTALAÇÃO DETERMINÍSTICA
   * - Android / Desktop com beforeinstallprompt -> Exibe diálogo nativo.
   * - iOS Safari -> Fornece instrução determinística de 2 passos.
   * - In-App Browser -> Avisa para abrir no Safari ou Chrome.
   * - Iframe -> Oferece abertura no navegador nativo.
   */
  public static async install(): Promise<{ success: boolean; outcome?: string; reason?: string; message?: string }> {
    if (this.isInstalled()) {
      return { success: true, outcome: 'ALREADY_INSTALLED', reason: 'A aplicação já está instalada neste dispositivo.' };
    }

    if (this.isInAppBrowser()) {
      return {
        success: false,
        reason: 'in_app_browser',
        message: 'Navegador interno detetado. Abra no Safari (iOS) ou Chrome (Android) para instalar.'
      };
    }

    const env = this.getInstallEnvironment();

    if (env === 'MOBILE_IOS') {
      return {
        success: false,
        reason: 'ios_manual_instruction',
        message: 'No iOS Safari: Toque em Partilhar (ícone do quadrado com seta) e selecione "Adicionar ao Ecrã Principal".'
      };
    }

    // 1. Caso tenha o evento nativo em cache (Desktop Chrome/Edge ou Android)
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

    // 2. Se estiver em Iframe Preview
    if (env === 'IFRAME_PREVIEW') {
      this.openExternalInstall();
      return {
        success: true,
        outcome: 'REDIRECTED_EXTERNAL',
        reason: 'A abrir o domínio oficial para instalação nativa direta.'
      };
    }

    return {
      success: false,
      reason: 'prompt_not_ready',
      message: 'Toque no menu (⋮) do navegador e selecione "Adicionar ao ecrã principal" ou "Instalar aplicação".'
    };
  }
}

// Inicia escuta imediatamente na importação
InstallEngine.init();
