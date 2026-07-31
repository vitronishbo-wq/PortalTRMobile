import { Device } from '../types/Device';

export class DeviceEngine {
  private static devices: Map<string, Device> = new Map();

  static registerDevice(device: Device): void {
    DeviceEngine.devices.set(device.deviceId, device);
  }

  static getDevice(deviceId: string): Device | undefined {
    return DeviceEngine.devices.get(deviceId);
  }

  static getAllDevices(): Device[] {
    return Array.from(DeviceEngine.devices.values());
  }

  static updateStatus(deviceId: string, online: boolean): Device | null {
    const device = DeviceEngine.devices.get(deviceId);
    if (!device) return null;
    device.online = online;
    device.lastSync = Date.now();
    DeviceEngine.devices.set(deviceId, device);
    return device;
  }
}
