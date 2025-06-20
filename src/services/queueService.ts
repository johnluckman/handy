import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = 'offline_submission_queue';

export interface QueuedSubmission {
    id: string; // A unique ID for the queued item, e.g., a timestamp
    payload: any[]; // The rowData that was supposed to be sent
}

/**
 * Adds a submission to the offline queue.
 * @param {any[]} rowData The data that needs to be submitted.
 */
export const addToQueue = async (rowData: any[]): Promise<void> => {
    try {
        const existingQueueString = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
        const queue: QueuedSubmission[] = existingQueueString ? JSON.parse(existingQueueString) : [];
        
        const newSubmission: QueuedSubmission = {
            id: new Date().toISOString(), // Simple unique ID
            payload: rowData,
        };

        queue.push(newSubmission);
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
        console.log(`[QueueService] Item added to queue. Queue size is now ${queue.length}.`);

    } catch (error) {
        console.error('[QueueService] Failed to add item to queue:', error);
    }
};

/**
 * Retrieves the entire queue from storage.
 * @returns {Promise<QueuedSubmission[]>} The current queue.
 */
export const getQueue = async (): Promise<QueuedSubmission[]> => {
    try {
        const queueString = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
        return queueString ? JSON.parse(queueString) : [];
    } catch (error) {
        console.error('[QueueService] Failed to get queue:', error);
        return [];
    }
};

/**
 * Overwrites the entire queue with a new one.
 * Useful for removing an item after it has been successfully synced.
 * @param {QueuedSubmission[]} queue The new queue to save.
 */
export const updateQueue = async (queue: QueuedSubmission[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
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
        await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
        console.log('[QueueService] Queue cleared.');
    } catch (error) {
        console.error('[QueueService] Failed to clear queue:', error);
    }
}; 