import { Process } from '../types';
import { Scheduler } from './index';

export const srtfScheduler: Scheduler = {
  id: 'srtf',
  name: 'Shortest Remaining Time First',
  isPreemptive: true,

  // SRTF: Select process with shortest remaining time
  selectNextProcess: (readyQueue: string[], processes: Process[]): string | null => {
    if (readyQueue.length === 0) return null;
    
    // Find process with shortest remaining CPU time
    let shortestId: string | null = null;
    let shortestRemaining = Infinity;
    
    for (const id of readyQueue) {
      const process = processes.find(p => p.id === id);
      if (process && process.remainingCpuTime < shortestRemaining) {
        shortestRemaining = process.remainingCpuTime;
        shortestId = id;
      } else if (process && process.remainingCpuTime === shortestRemaining) {
        // Tie-breaker: use arrival time (FCFS)
        const currentShortest = processes.find(p => p.id === shortestId);
        if (currentShortest && process.arrivalTime < currentShortest.arrivalTime) {
          shortestId = id;
        }
      }
    }
    
    return shortestId;
  },

  // SRTF: Preempt if a process in ready queue has shorter remaining time
  shouldPreempt: (
    currentProcess: Process | null,
    readyQueue: string[],
    processes: Process[]
  ): boolean => {
    if (!currentProcess || readyQueue.length === 0) return false;
    
    // Check if any process in ready queue has shorter remaining time
    for (const id of readyQueue) {
      const process = processes.find(p => p.id === id);
      if (process && process.remainingCpuTime < currentProcess.remainingCpuTime) {
        return true;
      }
    }
    
    return false;
  },
};
