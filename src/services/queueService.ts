import AsyncStorage from '@react-native-async-storage/async-storage';
import { appendToSheet } from './googleSheets'; // Assuming this is your GS API

const QUEUE_KEY = 'submissionQueue';

// The queue will now store the whole submission object
export async function addToQueue(data: object): Promise<void> {
  try {
    const queue = await getQueue();
    queue.push(data);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to queue:', error);
  }
}

export async function getQueue(): Promise<object[]> {
  try {
    const storedQueue = await AsyncStorage.getItem(QUEUE_KEY);
    return storedQueue ? JSON.parse(storedQueue) : [];
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
}

export async function processQueue(): Promise<{ success: boolean; message: string; batchSize: number }> {
  const queue = await getQueue();
  if (queue.length === 0) {
    return { success: true, message: 'Queue is empty.', batchSize: 0 };
  }

  try {
    // Pass the entire queue to be processed as a batch
    const result = await appendToSheet(queue);
    
    if (result.success) {
      // Clear the queue only on successful batch submission
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
      return { success: true, message: 'Queue processed successfully.', batchSize: queue.length };
    } else {
      // If the batch fails, the items remain in the queue for the next attempt
      return { success: false, message: result.message || 'Failed to process queue.', batchSize: 0 };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error processing queue:', errorMessage);
    return { success: false, message: `Error processing queue: ${errorMessage}`, batchSize: 0 };
  }
}

/**
 * Updates the entire queue in storage.
 * @param {object[]} queue The new queue to save.
 */
export const updateQueue = async (queue: object[]): Promise<void> => {
    try {
        await AsyncStorage.setItem('submissionQueue', JSON.stringify(queue));
        console.log(`[QueueService] Queue updated. New size is ${queue.length}.`);
    } catch (error) {
        console.error('[QueueService] Failed to update queue:', error);
    }
};

/**
 * Clears the entire queue.
 */
export const clearQueue = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(QUEUE_KEY);
        console.log('[QueueService] Queue cleared.');
    } catch (error) {
        console.error('[QueueService] Failed to clear queue:', error);
    }
}; 