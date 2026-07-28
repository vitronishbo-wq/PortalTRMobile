export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt: number | string;
  lastLogin: number | string;
}
