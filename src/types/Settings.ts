export interface UserSettings {
  userId: string;

  // 1. Preferências
  syncIntervalMinutes: number;
  autoSync: boolean;
  biometricAuth: boolean;
  deepLinksEnabled: boolean;
  startupView: 'inbox' | 'devices' | 'analytics' | 'overview';
  zeroTouchAutoPair: boolean;

  // 2. Notificações
  notificationsEnabled: boolean;
  webPushEnabled: boolean;
  smsAlertsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  silentHoursEnabled: boolean;
  silentHoursStart: string;
  silentHoursEnd: string;

  // 3. Privacidade
  dataEncryption: 'AES-256' | 'RSA-4096' | 'NONE';
  antiTrackerCamouflage: boolean;
  autoClearSessionHours: number;
  telemetryOptIn: boolean;
  remoteWipeGuard: boolean;

  // 4. Aparência
  theme: 'dark' | 'light' | 'system';
  accentColor: 'indigo' | 'amber' | 'emerald' | 'cyan' | 'purple';
  density: 'compact' | 'comfortable' | 'spacious';
  fontScaling: 'sm' | 'md' | 'lg';

  // 5. Idioma
  language: 'pt-AO' | 'pt-BR' | 'pt-PT' | 'en-US' | 'es-ES' | 'fr-FR' | 'auto';

  // Meta
  autoArchiveRead: boolean;
  updatedAt: number | string;
}
