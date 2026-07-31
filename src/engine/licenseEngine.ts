export * from '../services/trialEngine';
import { TrialEngine, LicenseRecord } from '../services/trialEngine';
import { License } from '../types/License';
import { FirestoreService } from '../services/firestore';

export class LicenseEngine {
  static getLicense(userId: string, email?: string): LicenseRecord {
    return TrialEngine.getLicense(userId, email);
  }

  static async fetchLicenseFromFirestore(userId: string): Promise<License | null> {
    return await FirestoreService.getLicense(userId);
  }

  static async saveLicenseToFirestore(license: License): Promise<void> {
    await FirestoreService.saveLicense(license);
  }

  static modifyLicense(
    userId: string,
    action: '+3d' | '+15d' | '+30d' | '+90d' | 'lifetime' | 'reset',
    reasonByFounder?: string,
    activatedByCaller: string = 'ROOT'
  ): LicenseRecord {
    return TrialEngine.modifyLicense(userId, action, reasonByFounder, activatedByCaller);
  }

  static evaluateState(license: LicenseRecord) {
    return TrialEngine.evaluateState(license);
  }
}
