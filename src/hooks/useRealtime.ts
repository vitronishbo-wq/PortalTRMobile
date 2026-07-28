import { useState, useEffect } from 'react';
import { AppEvent, Device } from '../types/index';
import { FirestoreService } from '../services/firestore';
import { AuthService } from '../services/auth';
import { User } from 'firebase/auth';

export function useRealtime() {
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Iniciar autenticação anónima se nenhum utilizador estiver ativo
    const unsubscribeAuth = AuthService.observeAuthState((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        AuthService.loginAnonymously();
      }
    });

    // 2. Registar listener em tempo real para Eventos/Notificações
    const unsubscribeEvents = FirestoreService.listenToEvents(
      (newEvents) => {
        setEvents(newEvents);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // 3. Registar listener em tempo real para Dispositivos
    const unsubscribeDevices = FirestoreService.listenToDevices(
      (newDevices) => {
        setDevices(newDevices);
      },
      (err) => {
        console.warn('[useRealtime] Erro ao carregar dispositivos:', err.message);
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeEvents();
      unsubscribeDevices();
    };
  }, []);

  return {
    user,
    events,
    devices,
    loading,
    error,
    saveEvent: FirestoreService.saveEvent,
    updateEvent: FirestoreService.updateEvent,
    deleteEvent: FirestoreService.deleteEvent,
    saveDevice: FirestoreService.saveDevice,
    deleteDevice: FirestoreService.deleteDevice
  };
}
