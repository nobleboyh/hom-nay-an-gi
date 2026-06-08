import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useUIStore } from '../stores/uiStore';

export type NetworkStatus = 'online' | 'offline' | 'unknown';

export interface NetworkStatusValue {
  isOnline: boolean;
  networkType: string;
}

const NetworkStatusContext = createContext<NetworkStatusValue>({
  isOnline: true,
  networkType: 'unknown',
});

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<NetworkStatusValue>({
    isOnline: true,
    networkType: 'unknown',
  });
  const wasOfflineRef = useRef(false);
  const offlineToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = Boolean(state.isConnected);
      const networkType = state.type || 'unknown';
      const wasOffline = wasOfflineRef.current;
      wasOfflineRef.current = !isConnected;

      setStatus({ isOnline: isConnected, networkType });

      if (!isConnected) {
        if (!offlineToastIdRef.current) {
          const store = useUIStore.getState();
          store.addToast('Mất kết nối', 'info', 0);
          const toast = store.toasts.find((t) => t.message === 'Mất kết nối');
          if (toast) {
            offlineToastIdRef.current = toast.id;
          }
        }
      } else if (wasOffline) {
        if (offlineToastIdRef.current) {
          useUIStore.getState().dismissToast(offlineToastIdRef.current);
          offlineToastIdRef.current = null;
        }
        useUIStore.getState().addToast('Đã kết nối', 'success', 2000);
      }
    });

    return () => {
      unsubscribe();
      const id = offlineToastIdRef.current;
      if (id) {
        useUIStore.getState().dismissToast(id);
        offlineToastIdRef.current = null;
      }
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={status}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus(): NetworkStatusValue {
  return useContext(NetworkStatusContext);
}
