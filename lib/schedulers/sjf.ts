import { Process } from '../types';
import { Scheduler } from './index';

export const sjfScheduler: Scheduler = {
  id: 'sjf',
  name: 'Shortest Job First',
  isPreemptive: false,

  // SJF: Select process with shortest burst time
  selectNextProcess: (readyQueue: string[], processes: Process[]): string | null => {
    if (readyQueue.length === 0) return null;
    
    // Find process with shortest CPU burst time
    let shortestId: string | null = null;
    let shortestBurst = Infinity;
    
    for (const id of readyQueue) {
      const process = processes.find(p => p.id === id);
      if (process && process.cpuBurstTime < shortestBurst) {
        shortestBurst = process.cpuBurstTime;
        shortestId = id;
      } else if (process && process.cpuBurstTime === shortestBurst) {
        // Tie-breaker: use arrival time (FCFS)
        const currentShortest = processes.find(p => p.id === shortestId);
        if (currentShortest && process.arrivalTime < currentShortest.arrivalTime) {
          shortestId = id;
        }
      }
    }
    
    return shortestId;
  },

  // SJF is non-preemptive - never preempt
  shouldPreempt: (): boolean => {
    return false;
  },
};
