/* PortalTRMobile Universal App Container Engine — Camada 20 Universal App Container */

export type UniversalAppType = 'native' | 'pwa' | 'web' | 'banking' | 'messaging' | 'social';

export interface UniversalAppDefinition {
  id: string;
  name: string;
  type: UniversalAppType;
  category: 'telecom' | 'finance' | 'social' | 'tools' | 'media' | 'system';
  icon: string;
  url?: string;
  packageId?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isOpen: boolean;
  trustRequiredLevel: 'low' | 'medium' | 'high' | 'founder';
  isolatedStorage: boolean;
  backgroundSync: boolean;
  lastOpenedAt?: number;
}

class UniversalAppContainerEngine {
  private apps: Map<string, UniversalAppDefinition> = new Map();
  private openAppId: string | null = null;
  private listeners: Set<(apps: UniversalAppDefinition[], activeAppId: string | null) => void> = new Set();

  constructor() {
    this.seedDefaultUniversalApps();
  }

  private seedDefaultUniversalApps(): void {
    const defaultApps: UniversalAppDefinition[] = [
      {
        id: 'app_dialer',
        name: 'Telefonia Core',
        type: 'native',
        category: 'telecom',
        icon: '☎️',
        isPinned: true,
        isFavorite: true,
        isOpen: false,
        trustRequiredLevel: 'low',
        isolatedStorage: false,
        backgroundSync: true
      },
      {
        id: 'app_sms',
        name: 'Mensagens SMS & Chat',
        type: 'messaging',
        category: 'telecom',
        icon: '💬',
        isPinned: true,
        isFavorite: true,
        isOpen: false,
        trustRequiredLevel: 'low',
        isolatedStorage: false,
        backgroundSync: true
      },
      {
        id: 'app_banking_multicaixa',
        name: 'Multicaixa Express',
        type: 'banking',
        category: 'finance',
        icon: '🏦',
        isPinned: true,
        isFavorite: true,
        isOpen: false,
        trustRequiredLevel: 'high',
        isolatedStorage: true,
        backgroundSync: false
      },
      {
        id: 'app_whatsapp',
        name: 'WhatsApp Web Cloud',
        type: 'messaging',
        category: 'social',
        icon: '🟢',
        url: 'https://web.whatsapp.com',
        isPinned: true,
        isFavorite: false,
        isOpen: false,
        trustRequiredLevel: 'medium',
        isolatedStorage: true,
        backgroundSync: true
      },
      {
        id: 'app_telegram',
        name: 'Telegram Web',
        type: 'messaging',
        category: 'social',
        icon: '✈️',
        url: 'https://web.telegram.org',
        isPinned: false,
        isFavorite: false,
        isOpen: false,
        trustRequiredLevel: 'medium',
        isolatedStorage: true,
        backgroundSync: true
      },
      {
        id: 'app_bai_directo',
        name: 'BAI Directo Cloud',
        type: 'banking',
        category: 'finance',
        icon: '💳',
        isPinned: false,
        isFavorite: true,
        isOpen: false,
        trustRequiredLevel: 'high',
        isolatedStorage: true,
        backgroundSync: false
      },
      {
        id: 'app_instagram',
        name: 'Instagram Cloud',
        type: 'social',
        category: 'social',
        icon: '📸',
        url: 'https://instagram.com',
        isPinned: false,
        isFavorite: false,
        isOpen: false,
        trustRequiredLevel: 'low',
        isolatedStorage: true,
        backgroundSync: false
      }
    ];

    defaultApps.forEach((a) => this.apps.set(a.id, a));
  }

  // --- Operações: Abrir, Fixar, Favoritar ---
  public openApp(id: string): UniversalAppDefinition | null {
    const app = this.apps.get(id);
    if (!app) return null;

    app.isOpen = true;
    app.lastOpenedAt = Date.now();
    this.openAppId = id;
    this.apps.set(id, app);
    this.notifySubscribers();
    return app;
  }

  public closeApp(id: string): void {
    const app = this.apps.get(id);
    if (app) {
      app.isOpen = false;
      this.apps.set(id, app);
    }
    if (this.openAppId === id) {
      this.openAppId = null;
    }
    this.notifySubscribers();
  }

  public togglePin(id: string): boolean {
    const app = this.apps.get(id);
    if (!app) return false;
    app.isPinned = !app.isPinned;
    this.apps.set(id, app);
    this.notifySubscribers();
    return app.isPinned;
  }

  public toggleFavorite(id: string): boolean {
    const app = this.apps.get(id);
    if (!app) return false;
    app.isFavorite = !app.isFavorite;
    this.apps.set(id, app);
    this.notifySubscribers();
    return app.isFavorite;
  }

  public getActiveApp(): UniversalAppDefinition | null {
    return this.openAppId ? this.apps.get(this.openAppId) || null : null;
  }

  public getAllApps(): UniversalAppDefinition[] {
    return Array.from(this.apps.values());
  }

  public getPinnedApps(): UniversalAppDefinition[] {
    return this.getAllApps().filter((a) => a.isPinned);
  }

  public getFavoriteApps(): UniversalAppDefinition[] {
    return this.getAllApps().filter((a) => a.isFavorite);
  }

  public subscribe(fn: (apps: UniversalAppDefinition[], activeAppId: string | null) => void): () => void {
    this.listeners.add(fn);
    fn(this.getAllApps(), this.openAppId);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notifySubscribers(): void {
    const apps = this.getAllApps();
    this.listeners.forEach((fn) => fn(apps, this.openAppId));
  }
}

export const universalAppContainer = new UniversalAppContainerEngine();
