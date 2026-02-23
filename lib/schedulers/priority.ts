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

// ─── Helper: compute effective priority after aging ───────────────────────
// Lower number = higher priority.  Aging reduces the number (raises priority).
export function getEffectivePriority(process: Process, agingTime: number): number {
  if (agingTime <= 0) return process.priority;
  return Math.max(1, process.priority - Math.floor(process.waitingTime / agingTime));
}

// Factory: creates a Scheduler that uses the given agingTime.
// Called from executeTick so the latest agingTime is always used.
export function createPriorityAgingScheduler(agingTime: number): Scheduler {
  return {
    id: 'priority-aging',
    name: 'Priority (Preemptive + Aging)',
    isPreemptive: true,

    selectNextProcess: (readyQueue: string[], processes: Process[]): string | null => {
      if (readyQueue.length === 0) return null;

      let bestId: string | null = null;
      let bestEffective = Infinity;

      for (const id of readyQueue) {
        const p = processes.find(proc => proc.id === id);
        if (!p) continue;
        const eff = getEffectivePriority(p, agingTime);
        if (eff < bestEffective) {
          bestEffective = eff;
          bestId = id;
        } else if (eff === bestEffective) {
          const current = processes.find(proc => proc.id === bestId);
          if (current && p.arrivalTime < current.arrivalTime) {
            bestId = id;
          }
        }
      }
      return bestId;
    },

    shouldPreempt: (
      currentProcess: Process | null,
      readyQueue: string[],
      processes: Process[]
    ): boolean => {
      if (!currentProcess || readyQueue.length === 0) return false;

      const runningEffective = getEffectivePriority(currentProcess, agingTime);

      for (const id of readyQueue) {
        const p = processes.find(proc => proc.id === id);
        if (p && getEffectivePriority(p, agingTime) < runningEffective) {
          return true;
        }
      }
      return false;
    },
  };
}

// Default instance (agingTime = 5) used in the scheduler registry.
// executeTick will create a fresh instance with the real agingTime each call.
export const priorityAgingScheduler: Scheduler = createPriorityAgingScheduler(5);
