import { useEffect, useState, useCallback } from 'react';
import { SessionState } from '../types/SessionState';
import { updateSessionState, getSessionState, performHandover } from '../services/sessionSyncService';
import { useIdentity } from '../engine/identityEngine';

export function useSessionSync(deviceId: string) {
  const { user, profile } = useIdentity();
  const msisdn = profile?.email || user?.email || 'silajaneiro9@gmail.com';
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isHandoverReady, setIsHandoverReady] = useState(false);

  // Atualiza o estado local e envia para o servidor
  const updateState = useCallback(async (partialState: Partial<SessionState>) => {
    if (!msisdn || !deviceId) return;
    const newState = await updateSessionState(msisdn, deviceId, partialState);
    setSessionState(prev => ({ ...(prev || {}), ...newState } as SessionState));
  }, [msisdn, deviceId]);

  // Handover: puxa estado do dispositivo mais recente
  const triggerHandover = useCallback(async () => {
    if (!msisdn || !deviceId) return;
    const result = await performHandover(msisdn, deviceId);
    if (result) {
      setSessionState(result);
      setIsHandoverReady(true);
    }
  }, [msisdn, deviceId]);

  // Carrega estado inicial ao montar
  useEffect(() => {
    if (!msisdn || !deviceId) return;
    let isMounted = true;

    const loadState = async () => {
      const state = await getSessionState(msisdn, deviceId);
      if (!isMounted) return;

      if (state) {
        setSessionState(state);
      } else {
        // Primeira vez: criar estado padrão
        await updateSessionState(msisdn, deviceId, {
          activeTab: 'inbox',
          draftMessage: '',
          context: {},
        });
        await triggerHandover();
      }
    };

    loadState();
    return () => {
      isMounted = false;
    };
  }, [msisdn, deviceId, triggerHandover]);

  // Listener SSE para mudanças remotas
  useEffect(() => {
    if (!msisdn) return;
    const eventSource = new EventSource(`/api/v1/sessions/events?msisdn=${encodeURIComponent(msisdn)}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.deviceId !== deviceId && data.state) {
          // Outro dispositivo mudou o estado, atualizar localmente
          setSessionState(data.state);
        }
      } catch (err) {
        console.error('[useSessionSync] Erro no listener SSE:', err);
      }
    };

    const handleClipboardUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.msisdn === msisdn && data.text) {
          navigator.clipboard?.writeText(data.text).catch(() => {});
        }
      } catch (err) {
        console.error('[useSessionSync] Erro ao sincronizar área de transferência:', err);
      }
    };

    eventSource.addEventListener('clipboard:updated', handleClipboardUpdate as EventListener);

    return () => {
      eventSource.removeEventListener('clipboard:updated', handleClipboardUpdate as EventListener);
      eventSource.close();
    };
  }, [msisdn, deviceId]);

  return { sessionState, updateState, triggerHandover, isHandoverReady };
}
