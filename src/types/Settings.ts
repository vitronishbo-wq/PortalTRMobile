export interface UserSettings {
  userId: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  syncIntervalMinutes: number;
  autoArchiveRead: boolean;
  updatedAt: number | string;
}
