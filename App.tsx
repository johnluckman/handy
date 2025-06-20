import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AppNavigator from './src/navigation/AppNavigator';
import { getQueue, updateQueue } from './src/services/queueService';
import { appendToSheet } from './src/services/googleSheets';

/**
 * This component will handle the background synchronization of the offline queue.
 */
const SyncProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const syncQueue = async () => {
    console.log('[SyncProvider] Checking for items to sync...');
    let queue = await getQueue();

    if (queue.length === 0) {
      console.log('[SyncProvider] Queue is empty. Nothing to sync.');
      return;
    }

    console.log(`[SyncProvider] Found ${queue.length} items to sync.`);
    
    // Process the queue one by one
    while (queue.length > 0) {
      const currentItem = queue[0];
      try {
        const result = await appendToSheet(currentItem.payload);
        if (result.success) {
          console.log(`[SyncProvider] Successfully synced item ${currentItem.id}.`);
          // Remove the successfully synced item from the front of the queue
          queue.shift();
          await updateQueue(queue);
        } else {
          console.error(`[SyncProvider] Failed to sync item ${currentItem.id}. Server indicated failure. Will retry later.`, result.message);
          // Stop processing this cycle to avoid getting stuck on a failing item
          break;
        }
      } catch (error) {
        console.error(`[SyncProvider] Network error while syncing item ${currentItem.id}. Will retry later.`, error);
        // Stop processing, likely offline
        break;
      }
    }
  };

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('[SyncProvider] Network state changed. Is connected?', state.isConnected);
      if (state.isConnected) {
        syncQueue();
      }
    });

    // Run a sync check when the app starts
    syncQueue();

    // Unsubscribe when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  return <>{children}</>;
}

/**
 * @returns {React.ReactElement} The root application component.
 */
export default function App(): React.ReactElement {
  return (
    <SyncProvider>
      <AppNavigator />
    </SyncProvider>
  );
}
