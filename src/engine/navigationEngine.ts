import { MultiDeviceMeshEngine } from './multiDeviceMeshEngine';

export type PublicTabDomain =
  | 'inicio'
  | 'chamadas'
  | 'mensagens'
  | 'notificacoes'
  | 'dispositivos'
  | 'favoritos'
  | 'pesquisa'
  | 'definicoes';

export class NavigationEngineService {
  private activeDomain: PublicTabDomain = 'inicio';
  private activeSubTab: string = 'default';
  private historyStack: { domain: PublicTabDomain; subTab?: string; timestamp: number }[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Sync active domain with Mesh session handover
    MultiDeviceMeshEngine.subscribeSession((session) => {
      if (session?.activeTab) {
        const domain = session.activeTab as PublicTabDomain;
        if (domain && domain !== this.activeDomain) {
          this.navigateToDomainInternal(domain, 'mesh-sync', false);
        }
      }
    });
  }

  public navigateTo(domain: PublicTabDomain, subTab?: string) {
    this.navigateToDomainInternal(domain, subTab, true);
  }

  private navigateToDomainInternal(domain: PublicTabDomain, subTab: string = 'default', broadcastToMesh: boolean = true) {
    this.activeDomain = domain;
    this.activeSubTab = subTab;

    this.historyStack.unshift({
      domain,
      subTab,
      timestamp: Date.now()
    });
    this.historyStack = this.historyStack.slice(0, 30);

    if (broadcastToMesh) {
      const activeSession = MultiDeviceMeshEngine.getActiveSession();
      if (activeSession) {
        activeSession.activeTab = domain;
        MultiDeviceMeshEngine.registerNodeInMesh({
          primaryPhoneNumber: activeSession.primaryPhoneNumber
        });
      }
    }

    this.notify();
  }

  public getActiveDomain(): PublicTabDomain {
    return this.activeDomain;
  }

  public getActiveSubTab(): string {
    return this.activeSubTab;
  }

  public getNavigationHistory() {
    return this.historyStack;
  }

  public goBack(): boolean {
    if (this.historyStack.length > 1) {
      this.historyStack.shift(); // remove current
      const previous = this.historyStack[0];
      if (previous) {
        this.activeDomain = previous.domain;
        this.activeSubTab = previous.subTab || 'default';
        this.notify();
        return true;
      }
    }
    return false;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    callback();
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }
}

export const NavigationEngine = new NavigationEngineService();
