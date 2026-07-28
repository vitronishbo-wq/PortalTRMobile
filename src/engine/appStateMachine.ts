import { useState, useCallback } from 'react';
import { PortalState } from '../types';

export interface AppStateMachineState {
  lifecycle: PortalState;
  activeTab: string;
  isSimulatorOpen: boolean;
  isCamouflageModalOpen: boolean;
}

export function useAppStateMachine(initialStartCamouflaged: boolean) {
  const [state, setState] = useState<AppStateMachineState>(() => ({
    lifecycle: initialStartCamouflaged ? 'LOCKED' : 'READY',
    activeTab: 'public',
    isSimulatorOpen: false,
    isCamouflageModalOpen: false
  }));

  const transitionTo = useCallback((nextLifecycle: PortalState) => {
    setState((prev) => ({ ...prev, lifecycle: nextLifecycle }));
  }, []);

  const lockApp = useCallback(() => {
    setState((prev) => ({ ...prev, lifecycle: 'LOCKED' }));
  }, []);

  const unlockApp = useCallback(() => {
    setState((prev) => ({ ...prev, lifecycle: 'READY', activeTab: prev.activeTab === 'installer' || prev.activeTab === 'onboarding' ? prev.activeTab : 'timeline' }));
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setState((prev) => {
      let nextLifecycle: PortalState = 'READY';
      if (tab === 'installer') nextLifecycle = 'INSTALL_REQUIRED';
      if (tab === 'onboarding') nextLifecycle = 'PAIRING';
      return {
        ...prev,
        activeTab: tab,
        lifecycle: prev.lifecycle === 'LOCKED' ? 'LOCKED' : nextLifecycle
      };
    });
  }, []);

  const setSimulatorOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, isSimulatorOpen: open }));
  }, []);

  const setCamouflageModalOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, isCamouflageModalOpen: open }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      lifecycle: prev.lifecycle === 'LOCKED' ? 'LOCKED' : (loading ? 'LOADING' : 'READY')
    }));
  }, []);

  return {
    state,
    isLocked: state.lifecycle === 'LOCKED',
    isLoading: state.lifecycle === 'LOADING',
    transitionTo,
    setLoading,
    lockApp,
    unlockApp,
    setActiveTab,
    setSimulatorOpen,
    setCamouflageModalOpen
  };
}
