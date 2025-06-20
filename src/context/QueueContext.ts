import { createContext, useContext } from 'react';
import { QueuedSubmission } from '../services/queueService';

export interface QueueContextType {
  queue: QueuedSubmission[];
  refreshQueue: () => Promise<void>;
  syncQueue: () => Promise<{ success: boolean; owedData: any | null }>;
}

export const QueueContext = createContext<QueueContextType | null>(null);

// Custom hook to easily access the context in any component
export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}; 