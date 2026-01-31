import { Process } from '../types';
import { Scheduler } from './index';

export const roundRobinScheduler: Scheduler = {
  id: 'rr',
  name: 'Round Robin',
  isPreemptive: true,

  // RR: Select first process in queue (FCFS order)
  selectNextProcess: (readyQueue: string[], processes: Process[]): string | null => {
    if (readyQueue.length === 0) return null;
    
    // Round Robin uses FCFS for selection
    // The preempted process is added to the END of the queue
    return readyQueue[0];
  },

  // RR: Preempt when time quantum expires
  shouldPreempt: (
    currentProcess: Process | null,
    readyQueue: string[],
    processes: Process[],
    currentQuantum: number,
    timeQuantum: number
  ): boolean => {
    if (!currentProcess) return false;
    
    // Preempt if time quantum has expired AND there are other processes waiting
    // Only preempt if there are processes in ready queue (otherwise let it continue)
    if (currentQuantum >= timeQuantum && readyQueue.length > 0) {
      return true;
    }
    
    return false;
  },
};
