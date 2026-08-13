import { db } from '../firebase/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { AppEvent, Device, UserSettings, UserProfile, AppSession, License, resolveRootLevel, getDefaultPermissionsForRole } from '../types/index';

export class FirestoreService {
  /**
   * Listener em tempo real (onSnapshot) para a coleção de eventos/notificações
   */
  static listenToEvents(
    onData: (events: AppEvent[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!db) {
      onData([]);
      return () => {};
    }

    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(150));

      return onSnapshot(
        q,
        (snapshot) => {
          const events: AppEvent[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              userId: data.userId || data.uid || 'usr-default',
              deviceId: data.deviceId || 'dev-pixel-8',
              type: data.type || 'notification',
              source: data.source || data.app || 'system',
              title: data.title || 'Sem título',
              body: data.body || data.text || data.content || '',
              priority: data.priority || 'normal',
              timestamp: data.timestamp || Date.now(),
              read: data.read ?? false,
              archived: data.archived ?? false,
              favorite: data.favorite ?? false,
              packageName: data.packageName || '',
              sender: data.sender || ''
            };
          });
          onData(events);
        },
        (error) => {
          console.warn('[FirestoreService] Erro no listener de eventos:', error.message);
          if (onError) onError(error);
        }
      );
    } catch (e) {
      console.error('[FirestoreService] Erro ao subscrever eventos:', e);
      return () => {};
    }
  }

  /**
   * Listener em tempo real (onSnapshot) para a coleção de dispositivos pareados
   */
  static listenToDevices(
    onData: (devices: Device[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!db) {
      onData([]);
      return () => {};
    }

    try {
      const devicesRef = collection(db, 'devices');

      return onSnapshot(
        devicesRef,
        (snapshot) => {
          const devices: Device[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              deviceId: docSnap.id,
              nodeId: data.nodeId || `node-${docSnap.id.substring(0, 8)}`,
              userId: data.userId || data.uid || 'usr-default',
              workspaceId: data.workspaceId || 'ws-vitronis-default',
              name: data.name || 'Dispositivo Android',
              model: data.model || 'Android',
              osVersion: data.osVersion || 'Android 14',
              lastSync: data.lastSync || Date.now(),
              online: data.online ?? true,
              batteryLevel: data.health?.battery ?? data.batteryLevel ?? 100,
              pairedAt: data.pairedAt || Date.now(),
              capabilities: data.capabilities || {
                sms: true,
                calls: true,
                accessibility: false,
                biometrics: true,
                whatsapp: true
              },
              health: data.health || {
                battery: data.batteryLevel ?? 88,
                network: 'AFRICELL_4G'
              },
              oemProfile: data.oemProfile || 'generic',
              permissionScore: data.permissionScore ?? 98,
              notificationListenerStatus: data.notificationListenerStatus || 'active',
              syncDelayMs: data.syncDelayMs ?? 12,
              isPrimaryDevice: data.isPrimaryDevice ?? false,
              ipAddress: data.ipAddress || '192.168.1.100',
              networkType: data.networkType || 'Wi-Fi / 5G',
              carrier: data.carrier || 'Unitel Angola',
              virtualNumber: data.virtualNumber || '+244 923 000 000',
              platform: data.platform || 'android'
            };
          });
          onData(devices);
        },
        (error) => {
          console.warn('[FirestoreService] Erro no listener de dispositivos:', error.message);
          if (onError) onError(error);
        }
      );
    } catch (e) {
      console.error('[FirestoreService] Erro ao subscrever dispositivos:', e);
      return () => {};
    }
  }

  /**
   * Salva ou atualiza um evento/notificação no Firestore
   */
  static async saveEvent(event: AppEvent): Promise<void> {
    if (!db) return;
    try {
      const eventRef = doc(db, 'events', event.id);
      await setDoc(eventRef, {
        ...event,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar evento:', error);
    }
  }

  /**
   * Atualiza campos específicos de um evento
   */
  static async updateEvent(eventId: string, updates: Partial<AppEvent>): Promise<void> {
    if (!db) return;
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('[FirestoreService] Erro ao atualizar evento:', error);
    }
  }

  /**
   * Elimina um evento do Firestore
   */
  static async deleteEvent(eventId: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error('[FirestoreService] Erro ao eliminar evento:', error);
    }
  }

  /**
   * Salva ou atualiza um dispositivo no Firestore
   */
  static async saveDevice(device: Device): Promise<void> {
    if (!db) return;
    try {
      const deviceRef = doc(db, 'devices', device.deviceId);
      await setDoc(deviceRef, {
        ...device,
        lastSync: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar dispositivo:', error);
    }
  }

  /**
   * Elimina um dispositivo do Firestore
   */
  static async deleteDevice(deviceId: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'devices', deviceId));
    } catch (error) {
      console.error('[FirestoreService] Erro ao eliminar dispositivo:', error);
    }
  }

  /**
   * Obtém as configurações do utilizador no Firestore
   */
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    if (!db) return null;
    try {
      const settingsRef = doc(db, 'settings', userId);
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        return snap.data() as UserSettings;
      }
    } catch (error) {
      console.error('[FirestoreService] Erro ao obter configurações:', error);
    }
    return null;
  }

  /**
   * Salva ou atualiza as configurações do utilizador no Firestore
   */
  static async saveSettings(settings: UserSettings): Promise<void> {
    if (!db) return;
    try {
      const settingsRef = doc(db, 'settings', settings.userId);
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar configurações:', error);
    }
  }

  /**
   * Salva perfil do utilizador
   */
  static async saveUserProfile(user: UserProfile): Promise<void> {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', user.userId);
      const rootLevel = user.rootLevel || resolveRootLevel(user.role, user.authority);
      await setDoc(
        userRef,
        {
          ...user,
          rootLevel,
          lastLogin: Date.now()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar perfil do utilizador:', error);
    }
  }

  /**
   * Salva licença na coleção 'licenses'
   */
  static async saveLicense(license: License): Promise<void> {
    if (!db) return;
    try {
      const docId = license.id || license.user;
      const licenseRef = doc(db, 'licenses', docId);
      const now = Date.now();
      const expires = license.expires || now + 7 * 86400000;
      const daysLeft = Math.max(0, Math.ceil((expires - now) / 86400000));
      await setDoc(
        licenseRef,
        {
          user: license.user,
          userEmail: license.userEmail || '',
          plan: license.plan || 'trial',
          expires: expires,
          trial: license.trial ?? (expires > now),
          daysLeft: license.daysLeft ?? daysLeft,
          activatedBy: license.activatedBy || 'system_onboarding',
          updatedAt: now
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar licença:', error);
    }
  }

  /**
   * Obtém licença pelo ID do utilizador na coleção 'licenses'
   */
  static async getLicense(userId: string): Promise<License | null> {
    if (!db || !userId) return null;
    try {
      const { getDoc } = await import('firebase/firestore');
      const licenseRef = doc(db, 'licenses', userId);
      const snap = await getDoc(licenseRef);
      if (snap.exists()) {
        const data = snap.data() as License;
        const now = Date.now();
        const daysLeft = Math.max(0, Math.ceil((data.expires - now) / 86400000));
        return {
          ...data,
          daysLeft: data.plan === 'founder' || data.expires > now + 30000 * 86400000 ? 9999 : daysLeft
        };
      }
      return null;
    } catch (error) {
      console.error('[FirestoreService] Erro ao obter licença:', error);
      return null;
    }
  }

  /**
   * Obtém o perfil do utilizador pelo UID no Firestore
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db || !uid) return null;
    try {
      const { getDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('[FirestoreService] Erro ao carregar perfil do utilizador:', error);
      return null;
    }
  }

  /**
   * Escuta em tempo real as alterações do perfil de um utilizador específico
   */
  static listenToUserProfile(
    uid: string,
    onData: (profile: UserProfile | null) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!db || !uid) {
      onData(null);
      return () => {};
    }
    try {
      const userRef = doc(db, 'users', uid);
      return onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            onData(snap.data() as UserProfile);
          } else {
            onData(null);
          }
        },
        (error) => {
          console.warn('[FirestoreService] Erro ao escutar perfil:', error.message);
          if (onError) onError(error);
        }
      );
    } catch (e) {
      console.error('[FirestoreService] Erro na subscrição do perfil:', e);
      return () => {};
    }
  }

  /**
   * Escuta em tempo real a lista completa de utilizadores da coleção 'users'
   */
  static listenToAllUsers(
    onData: (users: UserProfile[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!db) {
      onData([]);
      return () => {};
    }
    try {
      const usersRef = collection(db, 'users');
      return onSnapshot(
        usersRef,
        (snapshot) => {
          const usersList: UserProfile[] = snapshot.docs.map((d) => d.data() as UserProfile);
          onData(usersList);
        },
        (error) => {
          console.warn('[FirestoreService] Erro ao escutar lista de utilizadores:', error.message);
          if (onError) onError(error);
        }
      );
    } catch (e) {
      console.error('[FirestoreService] Erro na subscrição de utilizadores:', e);
      return () => {};
    }
  }

  /**
   * Promove de forma atómica um utilizador autenticado a Founder persistindo no documento users/{uid} no Firestore
   */
  static async promoteUserToFounder(
    uid: string,
    email: string,
    displayName?: string,
    identityHash?: string
  ): Promise<UserProfile> {
    const founderProfile: UserProfile = {
      userId: uid,
      email: email || 'founder@portal.internal',
      displayName: displayName || 'Founder Master (System)',
      role: 'founder',
      system: true,
      immutable: true,
      authority: 'ROOT',
      rootLevel: 'ROOT',
      permissions: ['*'],
      ...(identityHash ? { identityHash } : {}),
      ...getDefaultPermissionsForRole('founder', 'ROOT'),
      createdAt: Date.now(),
      lastLogin: Date.now()
    };

    if (db) {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, founderProfile, { merge: true });
      // Registar na coleção de sistema com hash SHA-256 (zero-knowledge, sem dados pessoais em texto limpo)
      const systemFounderRef = doc(db, 'system', 'founder');
      await setDoc(
        systemFounderRef,
        {
          activeFounderUid: uid,
          promotedAt: Date.now(),
          immutable: true,
          ...(identityHash ? { identityHash } : {})
        },
        { merge: true }
      );
    }

    return founderProfile;
  }

  /**
   * Salva um convite de administrador na coleção 'invitations' do Firestore
   */
  static async saveInvitation(invitation: any): Promise<void> {
    if (!db) return;
    try {
      const invRef = doc(db, 'invitations', invitation.token);
      await setDoc(invRef, invitation, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar convite no Firestore:', error);
    }
  }

  /**
   * Obtém um convite pelo token no Firestore
   */
  static async getInvitation(token: string): Promise<any | null> {
    if (!db || !token) return null;
    try {
      const { getDoc } = await import('firebase/firestore');
      const invRef = doc(db, 'invitations', token);
      const snap = await getDoc(invRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      console.error('[FirestoreService] Erro ao obter convite do Firestore:', error);
      return null;
    }
  }

  /**
   * Promove ou cria um utilizador como Admin no Firestore
   */
  static async createOrUpdateAdminUser(
    uid: string,
    email: string,
    displayName: string,
    adminRole: string,
    permissions: string[]
  ): Promise<UserProfile> {
    const defaultAdminPerms = getDefaultPermissionsForRole('admin', 'ADMIN');
    const adminProfile: UserProfile = {
      userId: uid,
      email: email,
      displayName: displayName,
      role: 'admin',
      system: false,
      immutable: false,
      authority: 'ADMIN',
      rootLevel: 'LEVEL_1',
      permissions: permissions || ['events.read'],
      ...defaultAdminPerms,
      createdAt: Date.now(),
      lastLogin: Date.now()
    };

    if (db) {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, adminProfile, { merge: true });
    }

    return adminProfile;
  }

  /**
   * Obtém os dados de um dispositivo pelo ID
   */
  static async getDevice(deviceId: string): Promise<(Device & { blocked?: boolean; trusted?: boolean }) | null> {
    if (!db) return null;
    try {
      const devRef = doc(db, 'devices', deviceId);
      const snap = await getDoc(devRef);
      if (snap.exists()) {
        return { deviceId: snap.id, ...snap.data() } as any;
      }
    } catch (e) {
      console.warn('[FirestoreService] Erro ao obter dispositivo:', e);
    }
    return null;
  }

  /**
   * Regista uma nova sessão
   */
  static async saveSession(session: any): Promise<void> {
    if (!db) return;
    try {
      const sessionId = session.sessionId || session.id;
      const sessionRef = doc(db, 'sessions', sessionId);
      await setDoc(sessionRef, {
        ...session,
        lastActive: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error('[FirestoreService] Erro ao salvar sessão:', error);
    }
  }

  /**
   * Chama / Chamadas telefónicas (calls/{callId})
   */
  static async saveCallRecord(call: any): Promise<void> {
    if (!db) return;
    try {
      const callRef = doc(db, 'calls', call.id);
      await setDoc(callRef, {
        ...call,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.error('[FirestoreService] Erro ao salvar registo de chamada:', e);
    }
  }

  /**
   * Números Virtuais (virtual_numbers/{numberId})
   */
  static async saveVirtualNumber(num: any): Promise<void> {
    if (!db) return;
    try {
      const numRef = doc(db, 'virtual_numbers', num.id);
      await setDoc(numRef, {
        ...num,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.error('[FirestoreService] Erro ao salvar número virtual:', e);
    }
  }

  /**
   * Pareamento de Dispositivo (device_pairing/{pairingId})
   */
  static async saveDevicePairing(pairing: any): Promise<void> {
    if (!db) return;
    try {
      const pairRef = doc(db, 'device_pairing', pairing.id || pairing.pairingId);
      await setDoc(pairRef, {
        ...pairing,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.error('[FirestoreService] Erro ao salvar pareamento de dispositivo:', e);
    }
  }

  /**
   * Contactos (contacts/{contactId})
   */
  static async saveContact(contact: any): Promise<void> {
    if (!db) return;
    try {
      const contactRef = doc(db, 'contacts', contact.id);
      await setDoc(contactRef, {
        ...contact,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.error('[FirestoreService] Erro ao salvar contacto:', e);
    }
  }

  /**
   * Mensagens SMS (sms/{messageId})
   */
  static async saveSmsMessage(sms: any): Promise<void> {
    if (!db) return;
    try {
      const smsRef = doc(db, 'sms', sms.id);
      await setDoc(smsRef, {
        ...sms,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.error('[FirestoreService] Erro ao salvar mensagem SMS:', e);
    }
  }

  /**
   * Notificações (notifications/{notificationId})
   */
  static async saveNotification(notification: any): Promise<void> {
    if (!db) return;
    try {
      const notifRef = doc(db, 'notifications', notification.id);
      await setDoc(notifRef, {
        ...notification,
        timestamp: notification.timestamp || Date.now()
      }, { merge: true });
    } catch (e) {
      console.error('[FirestoreService] Erro ao salvar notificação:', e);
    }
  }

  /**
   * Logs de Segurança (security_logs/{logId})
   */
  static async logSecurityEvent(log: any): Promise<void> {
    if (!db) return;
    try {
      const logId = log.id || log.logId || `sec-${Date.now()}`;
      const logRef = doc(db, 'security_logs', logId);
      await setDoc(logRef, {
        ...log,
        timestamp: Date.now()
      }, { merge: true });
    } catch (e) {
      console.error('[FirestoreService] Erro ao gravar log de segurança:', e);
    }
  }

  /**
   * Telecom Providers Config (telecom_providers/{providerId})
   */
  static async saveTelecomProvider(provider: any): Promise<void> {
    if (!db) return;
    try {
      const provRef = doc(db, 'telecom_providers', provider.id || provider.providerId);
      await setDoc(provRef, {
        ...provider,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.error('[FirestoreService] Erro ao salvar provedor de telefonia:', e);
    }
  }
}
