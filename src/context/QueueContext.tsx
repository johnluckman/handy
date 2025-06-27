import React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processQueue as processQueueService, getQueue } from '../services/queueService';

interface QueueContextType {
  queue: object[];
  processQueue: (processor: (queue: object[]) => Promise<{ success: boolean; message?: string }>) => Promise<{ success: boolean; message: string; batchSize: number }>;
  refreshQueue: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType>({
  queue: [],
  processQueue: () => Promise.resolve({ success: false, message: 'Not initialized', batchSize: 0 }),
  refreshQueue: () => Promise.resolve(),
});

export const useQueue = () => useContext(QueueContext);

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<object[]>([]);
  const isProcessing = useRef(false);

  const refreshQueue = useCallback(async () => {
    const items = await getQueue();
    setQueue(items);
  }, []);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  const processQueue = useCallback(async (processor: (queue: object[]) => Promise<{ success: boolean; message?: string }>) => {
    if (isProcessing.current) {
      return { success: false, message: 'Queue processing already in progress.', batchSize: 0 };
    }

    const currentQueue = await getQueue();
    if (currentQueue.length === 0) {
      return { success: true, message: 'Queue is empty.', batchSize: 0 };
    }

    isProcessing.current = true;
    const result = await processQueueService(processor);
    if (result.success) {
      await refreshQueue();
    }
    isProcessing.current = false;
    return result;
  }, [refreshQueue]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        processQueue(() => Promise.resolve({ success: true }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [processQueue]);

  return (
    <QueueContext.Provider value={{ queue, processQueue, refreshQueue }}>
      {children}
    </QueueContext.Provider>
  );
};
