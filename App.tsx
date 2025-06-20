import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AppNavigator from './src/navigation/AppNavigator';
import { getQueue, updateQueue, QueuedSubmission } from './src/services/queueService';
import { appendToSheet } from './src/services/googleSheets';
import { QueueContext } from './src/context/QueueContext';

/**
 * This component will provide queue state to the app and handle synchronization.
 */
const QueueProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [queue, setQueue] = useState<QueuedSubmission[]>([]);

  const refreshQueue = async () => {
    const currentQueue = await getQueue();
    setQueue(currentQueue);
  };

  const syncQueue = async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('[QueueProvider] Sync deferred: App is offline.');
      return { success: true, owedData: null };
    }
    
    console.log('[QueueProvider] Attempting to sync...');
    
    const queueToProcess = await getQueue();

    if (queueToProcess.length === 0) {
      console.log('[QueueProvider] Queue is empty, nothing to sync.');
      return { success: true, owedData: null };
    }

    let itemsChanged = false;
    let lastOwedData: any | null = null;

    while (queueToProcess.length > 0) {
      const currentItem = queueToProcess[0];
      try {
        const result = await appendToSheet(currentItem.payload);
        if (result.success) {
          console.log(`[QueueProvider] Successfully synced item ${currentItem.id}.`);
          queueToProcess.shift();
          itemsChanged = true;
          if (result.owedData) {
            lastOwedData = result.owedData;
          }
        } else {
          console.error(`[QueueProvider] Server error on item ${currentItem.id}. Halting sync.`, result.message);
          break;
        }
      } catch (error) {
        console.error(`[QueueProvider] Network error on item ${currentItem.id}. Halting sync.`, error);
        break;
      }
    }

    if (itemsChanged) {
      await updateQueue(queueToProcess);
      setQueue(queueToProcess);
    }
    
    return { success: itemsChanged, owedData: lastOwedData };
  };

  useEffect(() => {
    // Initial load
    refreshQueue();

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // We still sync on connection change, e.g., for coming back online
        syncQueue();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // This dependency array should be correct now

  return (
    <QueueContext.Provider value={{ queue, refreshQueue, syncQueue }}>
      {children}
    </QueueContext.Provider>
  );
}

/**
 * @returns {React.ReactElement} The root application component.
 */
export default function App(): React.ReactElement {
  return (
    <QueueProvider>
      <AppNavigator />
    </QueueProvider>
  );
}
