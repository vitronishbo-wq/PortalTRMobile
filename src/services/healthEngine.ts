export interface DeviceHealthMetric {
  deviceId: string;
  deviceName: string;
  healthScore: number; // 0 - 100%
  permissionScore: number; // 0 - 100%
  realtimeStatus: 'OK' | 'DEGRADED' | 'DISCONNECTED';
  heartbeatIntervalSec: number;
  batteryLevel: number; // %
  notificationListenerActive: boolean;
  smsInterceptorActive: boolean;
  callsInterceptorActive: boolean;
  lastSyncTimestamp: number;
}

export interface OperationalDiagnostic {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  suggestedAction: string;
  actionCommand: string;
}

export interface DeviceTimelineEvent {
  id: string;
  deviceId: string;
  timestamp: number;
  type: 'INSTALLED' | 'PROVISIONED' | 'PAIRED' | 'PERMISSION_GRANTED' | 'SYNC_OK' | 'OFFLINE' | 'RECOVERED';
  detail: string;
}

export class HealthEngine {
  private static metrics: DeviceHealthMetric[] = [
    {
      deviceId: 'dev-android-s23-01',
      deviceName: 'Samsung Galaxy S23 (Fleet Master)',
      healthScore: 98,
      permissionScore: 100,
      realtimeStatus: 'OK',
      heartbeatIntervalSec: 4,
      batteryLevel: 84,
      notificationListenerActive: true,
      smsInterceptorActive: true,
      callsInterceptorActive: true,
      lastSyncTimestamp: Date.now() - 3000
    },
    {
      deviceId: 'dev-xiaomi-12t-02',
      deviceName: 'Xiaomi 12T (Operator Hub)',
      healthScore: 72,
      permissionScore: 66,
      realtimeStatus: 'DEGRADED',
      heartbeatIntervalSec: 18,
      batteryLevel: 32,
      notificationListenerActive: false,
      smsInterceptorActive: true,
      callsInterceptorActive: true,
      lastSyncTimestamp: Date.now() - 120000
    }
  ];

  private static diagnostics: OperationalDiagnostic[] = [
    {
      id: 'diag-01',
      severity: 'WARNING',
      title: 'Dispositivo Xiaomi 12T perdeu Listener de Notificação',
      description: 'O serviço BIND_NOTIFICATION_LISTENER foi suspenso pela otimização de bateria da MIUI.',
      suggestedAction: 'Executar Workflow de Auto-Healing Repair no Agente Android.',
      actionCommand: 'Repair Device: Xiaomi 12T'
    },
    {
      id: 'diag-02',
      severity: 'INFO',
      title: 'Webhook AppyPay em alta latência (420ms)',
      description: 'Tempo de resposta da API de gateway excedeu o padrão recomendado de 200ms.',
      suggestedAction: 'Aumentar tempo de retry ou alternar gateway reserva ProxyPay.',
      actionCommand: 'Run Diagnostics: Payment Engine'
    }
  ];

  private static timelineEvents: DeviceTimelineEvent[] = [
    {
      id: 'evt-01',
      deviceId: 'dev-android-s23-01',
      timestamp: Date.now() - 3600000 * 24,
      type: 'PROVISIONED',
      detail: 'Agente Zero-Touch registrado via QR Code de Inicialização'
    },
    {
      id: 'evt-02',
      deviceId: 'dev-android-s23-01',
      timestamp: Date.now() - 3600000 * 20,
      type: 'PERMISSION_GRANTED',
      detail: 'Todas as permissões do Kernel (SMS, CallLog, Notification) concedidas'
    },
    {
      id: 'evt-03',
      deviceId: 'dev-android-s23-01',
      timestamp: Date.now() - 3600000 * 2,
      type: 'SYNC_OK',
      detail: 'Canal WebSocket de Baixa Latência estabilizado com Portal (4s heartbeat)'
    }
  ];

  static getHealthMetrics(): DeviceHealthMetric[] {
    return [...HealthEngine.metrics];
  }

  static getDiagnostics(): OperationalDiagnostic[] {
    return [...HealthEngine.diagnostics];
  }

  static getTimelineEvents(): DeviceTimelineEvent[] {
    return [...HealthEngine.timelineEvents];
  }

  static runAutoRepair(deviceId: string): { success: boolean; message: string } {
    const dev = HealthEngine.metrics.find((m) => m.deviceId === deviceId);
    if (dev) {
      dev.notificationListenerActive = true;
      dev.permissionScore = 100;
      dev.healthScore = 96;
      dev.realtimeStatus = 'OK';
    }
    return {
      success: true,
      message: `Comando de auto-healing executado com sucesso no dispositivo '${dev?.deviceName || deviceId}'. Permissões restauradas.`
    };
  }
}
