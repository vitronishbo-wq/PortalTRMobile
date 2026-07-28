export interface Device {
  deviceId: string;
  userId: string;
  uid?: string;
  name: string;
  model: string;
  osVersion: string;
  lastSync: number | string;
  online: boolean;
  batteryLevel?: number;
  pairedAt: number | string;
}
