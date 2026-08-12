export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  DEVICES: 'devices',
  SESSIONS: 'sessions',
  DEVICE_PAIRING: 'device_pairing',
  VIRTUAL_NUMBERS: 'virtual_numbers',
  CALLS: 'calls',
  SMS: 'sms',
  CONTACTS: 'contacts',
  NOTIFICATIONS: 'notifications',
  SECURITY_LOGS: 'security_logs',
  TELECOM_PROVIDERS: 'telecom_providers',
  MASTER_IDENTITY: 'master_identity',
  PRESENCE: 'presence',
  TELEMETRY: 'telemetry',
  FAVORITES: 'favorites',
  CLIPBOARD: 'clipboard',
  WORKSPACES: 'workspaces',
  PERMISSIONS: 'permissions',
  ROLES: 'roles',
  LICENSES: 'licenses',
  SUBSCRIPTIONS: 'subscriptions',
  AUDIT: 'audit',
  BANK_ACCOUNTS: 'bank_accounts',
  TRANSACTIONS: 'transactions',
  WALLETS: 'wallets',
  PAYMENT_METHODS: 'payment_methods',
  APP_CENTER: 'app_center',
  CLOUD_RUNTIMES: 'cloud_runtimes'
} as const;

export type FirestoreCollectionKey = keyof typeof FIRESTORE_COLLECTIONS;

