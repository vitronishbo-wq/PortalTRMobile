import { auth } from '../firebase/firebase';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';

export class AuthService {
  /**
   * Realiza login anónimo no Firebase Authentication
   */
  static async loginAnonymously(): Promise<User | null> {
    try {
      if (!auth) {
        console.warn('[AuthService] Instância do Auth não está disponível.');
        return null;
      }
      const userCredential = await signInAnonymously(auth);
      console.log('[AuthService] Autenticado anonimamente:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('[AuthService] Erro na autenticação anónima:', error);
      return null;
    }
  }

  /**
   * Monitoriza o estado da autenticação em tempo real
   */
  static observeAuthState(callback: (user: User | null) => void): () => void {
    if (!auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  }

  /**
   * Obtém o utilizador atual
   */
  static getCurrentUser(): User | null {
    return auth ? auth.currentUser : null;
  }

  /**
   * Encerra a sessão do utilizador
   */
  static async logout(): Promise<void> {
    if (!auth) return;
    try {
      await signOut(auth);
      console.log('[AuthService] Sessão encerrada.');
    } catch (error) {
      console.error('[AuthService] Erro ao terminar sessão:', error);
    }
  }
}
