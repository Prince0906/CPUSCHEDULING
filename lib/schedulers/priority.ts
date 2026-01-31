import { Process } from '../types';
import { Scheduler } from './index';

// Non-preemptive Priority Scheduling
export const priorityScheduler: Scheduler = {
  id: 'priority',
  name: 'Priority Scheduling',
  isPreemptive: false,

  // Priority: Select process with highest priority (lowest number)
  selectNextProcess: (readyQueue: string[], processes: Process[]): string | null => {
    if (readyQueue.length === 0) return null;
    
    let highestPriorityId: string | null = null;
    let highestPriority = Infinity;
    
    for (const id of readyQueue) {
      const process = processes.find(p => p.id === id);
      if (process && process.priority < highestPriority) {
        highestPriority = process.priority;
        highestPriorityId = id;
      } else if (process && process.priority === highestPriority) {
        // Tie-breaker: use arrival time (FCFS)
        const currentHighest = processes.find(p => p.id === highestPriorityId);
        if (currentHighest && process.arrivalTime < currentHighest.arrivalTime) {
          highestPriorityId = id;
        }
      }
    }
    
    return highestPriorityId;
  },

  // Non-preemptive - never preempt
  shouldPreempt: (): boolean => {
    return false;
  },
};

// Preemptive Priority Scheduling
export const priorityPreemptiveScheduler: Scheduler = {
  id: 'priority-preemptive',
  name: 'Priority Scheduling (Preemptive)',
  isPreemptive: true,

  // Same selection logic as non-preemptive
  selectNextProcess: (readyQueue: string[], processes: Process[]): string | null => {
    if (readyQueue.length === 0) return null;
    
    let highestPriorityId: string | null = null;
    let highestPriority = Infinity;
    
    for (const id of readyQueue) {
      const process = processes.find(p => p.id === id);
      if (process && process.priority < highestPriority) {
        highestPriority = process.priority;
        highestPriorityId = id;
      } else if (process && process.priority === highestPriority) {
        const currentHighest = processes.find(p => p.id === highestPriorityId);
        if (currentHighest && process.arrivalTime < currentHighest.arrivalTime) {
          highestPriorityId = id;
        }
      }
    }
    
    return highestPriorityId;
  },

  // Preempt if a higher priority process is in ready queue
  shouldPreempt: (
    currentProcess: Process | null,
    readyQueue: string[],
    processes: Process[]
  ): boolean => {
    if (!currentProcess || readyQueue.length === 0) return false;
    
    // Check if any process in ready queue has higher priority (lower number)
    for (const id of readyQueue) {
      const process = processes.find(p => p.id === id);
      if (process && process.priority < currentProcess.priority) {
        return true;
      }
    }
    
    return false;
  },
};
