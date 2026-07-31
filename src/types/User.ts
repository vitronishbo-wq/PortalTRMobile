export type UserRole = 'founder' | 'admin' | 'operator' | 'user' | 'android_agent' | 'integration';

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  system?: boolean;
  immutable?: boolean;
  createdAt: number | string;
  lastLogin: number | string;
  permissions?: string[];
  authority?: 'ROOT' | 'ADMIN' | 'OPERATOR' | 'USER';
  claims?: string[];
  identityHash?: string;
}

