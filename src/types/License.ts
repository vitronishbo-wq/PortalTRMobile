export type LicensePlan = 'free' | 'pro' | 'enterprise' | 'founder' | 'trial';

export interface License {
  id?: string;
  user: string;          // User ID or user email
  userEmail?: string;    // Associated email
  plan: LicensePlan;     // Plan type: 'free', 'pro', 'enterprise', 'founder', 'trial'
  expires: number;       // Expiration timestamp in ms
  trial: boolean;        // Is trial mode currently active
  daysLeft: number;      // Calculated days remaining
  activatedBy: string;   // Who activated the license ('ROOT', 'system_onboarding', 'founder_console', etc.)
  createdAt?: number;
  updatedAt?: number;
}
