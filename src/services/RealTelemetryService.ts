// RealTelemetryService.ts — Leitura Estrita de Sensores e APIs W3C
// SEM MÉTRICAS FICTÍCIAS: Se uma API não estiver presente ou não for suportada, retorna NOT_AVAILABLE / NOT_TESTED

export interface RealTelemetryData {
  cpu: {
    cores: number | 'NOT_AVAILABLE';
    architecture: string;
    model: string;
  };
  ram: {
    deviceMemoryGb?: number;
    jsHeapUsedMb?: number;
    jsHeapTotalMb?: number;
    summary: string;
  };
  storage: {
    quotaMb?: number;
    usageMb?: number;
    freeMb?: number;
    summary: string;
  };
  battery: {
    level?: number;
    charging?: boolean;
    supported: boolean;
    summary: string;
  };
  network: {
    type: string;
    effectiveType?: string;
    downlinkMbps?: number;
    rttMs?: number;
    online: boolean;
    summary: string;
  };
  notificationListener: {
    status: 'NOT_CONFIGURED' | 'AWAITING_ANDROID_AGENT' | 'PERMISSION_REQUIRED' | 'ACTIVE';
    serviceName: string;
    granted: boolean;
  };
  timestamp: number;
}

export class RealTelemetryService {
  /**
   * Aquisição real de bateria via W3C BatteryManager API sem simulação
   */
  public static async getRealBattery(): Promise<RealTelemetryData['battery']> {
    try {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        const batteryManager = await (navigator as any).getBattery();
        const level = Math.round(batteryManager.level * 100);
        const charging = batteryManager.charging;
        return {
          level,
          charging,
          supported: true,
          summary: `${level}% (${charging ? 'A Carregar' : 'Em Bateria'})`
        };
      }
    } catch (e) {
      // Ignorar e retornar NOT_AVAILABLE
    }

    return {
      supported: false,
      summary: 'NOT_AVAILABLE'
    };
  }

  /**
   * Aquisição de rede via NetworkInformation API sem suposições de 100Mbps ou 5ms
   */
  public static getRealNetwork(): RealTelemetryData['network'] {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
    const connection = typeof navigator !== 'undefined' ? ((navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection) : null;

    if (connection) {
      const effectiveType = connection.effectiveType ? connection.effectiveType.toUpperCase() : undefined;
      const type = connection.type || (isOnline ? 'Online' : 'Offline');
      const downlink = connection.downlink;
      const rtt = connection.rtt;

      let summary = isOnline ? 'Online' : 'Offline';
      if (effectiveType) summary += ` (${effectiveType})`;
      if (downlink !== undefined && rtt !== undefined) {
        summary += ` - ${downlink} Mbps / RTT ${rtt}ms`;
      }

      return {
        type,
        effectiveType,
        downlinkMbps: downlink,
        rttMs: rtt,
        online: isOnline,
        summary
      };
    }

    return {
      type: isOnline ? 'Online' : 'Offline',
      online: isOnline,
      summary: isOnline ? 'Online (Sem dados de telemetria de link)' : 'Offline'
    };
  }

  /**
   * Aquisição de RAM real via deviceMemory e performance.memory
   */
  public static getRealRAM(): RealTelemetryData['ram'] {
    const deviceMemory = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined;
    const perfMemory = typeof performance !== 'undefined' ? (performance as any).memory : undefined;

    let jsHeapUsedMb: number | undefined;
    let jsHeapTotalMb: number | undefined;

    if (perfMemory) {
      jsHeapUsedMb = Math.round(perfMemory.usedJSHeapSize / (1024 * 1024));
      jsHeapTotalMb = Math.round(perfMemory.totalJSHeapSize / (1024 * 1024));
    }

    let summary = 'NOT_AVAILABLE';
    if (deviceMemory) {
      summary = `${deviceMemory} GB Hardware RAM`;
      if (jsHeapUsedMb) {
        summary += ` (Heap JS: ${jsHeapUsedMb} MB)`;
      }
    } else if (jsHeapUsedMb && jsHeapTotalMb) {
      summary = `Heap JS: ${jsHeapUsedMb} / ${jsHeapTotalMb} MB`;
    }

    return {
      deviceMemoryGb: deviceMemory,
      jsHeapUsedMb,
      jsHeapTotalMb,
      summary
    };
  }

  /**
   * Cores de CPU via navigator.hardwareConcurrency
   */
  public static getRealCPU(): RealTelemetryData['cpu'] {
    const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 'NOT_AVAILABLE';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let arch = 'NOT_AVAILABLE';
    if (userAgent.includes('x86_64') || userAgent.includes('Win64') || userAgent.includes('x64')) {
      arch = 'x86_64';
    } else if (userAgent.includes('Android') || userAgent.includes('ARM') || userAgent.includes('iPhone')) {
      arch = 'ARM';
    }

    return {
      cores,
      architecture: arch,
      model: typeof cores === 'number' ? `${cores} Cores lógicos detectados (${arch})` : 'NOT_AVAILABLE'
    };
  }

  /**
   * Armazenamento real via navigator.storage.estimate()
   */
  public static async getRealStorage(): Promise<RealTelemetryData['storage']> {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const quotaMb = estimate.quota ? Math.round(estimate.quota / (1024 * 1024)) : undefined;
        const usageMb = estimate.usage ? Math.round(estimate.usage / (1024 * 1024)) : undefined;
        const freeMb = quotaMb && usageMb ? quotaMb - usageMb : undefined;

        const quotaGb = quotaMb ? (quotaMb / 1024).toFixed(1) : undefined;
        const usageFormatted = usageMb ? `${usageMb} MB` : '0 MB';

        return {
          quotaMb,
          usageMb,
          freeMb,
          summary: quotaGb ? `${usageFormatted} em uso de ${quotaGb} GB quota` : `${usageFormatted} em uso`
        };
      }
    } catch (e) {
      // Ignorar e retornar NOT_AVAILABLE
    }

    return {
      summary: 'NOT_AVAILABLE'
    };
  }

  /**
   * Status do listener de notificações
   */
  public static async getNotificationListenerStatus(): Promise<RealTelemetryData['notificationListener']> {
    return {
      status: 'AWAITING_ANDROID_AGENT',
      serviceName: 'ao.portal.daemon.NotificationListenerService',
      granted: false
    };
  }

  /**
   * Agregação estrita sem dados fictícios
   */
  public static async getCompleteTelemetry(): Promise<RealTelemetryData> {
    const [battery, storage, notificationListener] = await Promise.all([
      this.getRealBattery(),
      this.getRealStorage(),
      this.getNotificationListenerStatus()
    ]);

    const cpu = this.getRealCPU();
    const ram = this.getRealRAM();
    const network = this.getRealNetwork();

    return {
      cpu,
      ram,
      storage,
      battery,
      network,
      notificationListener,
      timestamp: Date.now()
    };
  }
}
