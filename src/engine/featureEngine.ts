export class FeatureEngine {
  private static flags: Map<string, boolean> = new Map([
    ['ENABLE_MFA', true],
    ['ENABLE_PLAYGROUND', true],
    ['ENABLE_ANDROID_INTEGRATION', true],
    ['ENABLE_REALTIME_SYNC', true],
    ['ENABLE_FOUNDER_LOCK', true],
  ]);

  static isEnabled(featureName: string): boolean {
    return FeatureEngine.flags.get(featureName) ?? false;
  }

  static setFlag(featureName: string, enabled: boolean): void {
    FeatureEngine.flags.set(featureName, enabled);
  }

  static getAllFlags(): Record<string, boolean> {
    return Object.fromEntries(FeatureEngine.flags);
  }
}
