import { Process } from '../types';
import { Scheduler } from './index';

export const fcfsScheduler: Scheduler = {
  id: 'fcfs',
  name: 'First Come First Serve',
  isPreemptive: false,

  // FCFS: Select first process in queue (by arrival order)
  selectNextProcess: (readyQueue: string[], processes: Process[]): string | null => {
    if (readyQueue.length === 0) return null;
    
    // Return the first process in the queue (already ordered by arrival)
    return readyQueue[0];
  },

  // FCFS is non-preemptive - never preempt
  shouldPreempt: (): boolean => {
    return false;
  },
};
