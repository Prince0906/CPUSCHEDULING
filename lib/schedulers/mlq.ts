import { Process } from '../types';
import { Scheduler } from './index';

// MLQ Queue Configuration:
// Queue 1 (High): Round Robin style (arrival order)
// Queue 2 (Medium): Round Robin style (arrival order)
// Queue 3 (Low): FCFS

// MLQ time quanta per queue level
export const MLQ_QUANTA: Record<number, number> = {
    1: 2,
    2: 4,
    3: Infinity, // Queue 3 is FCFS — no preemption within queue
};

export const mlqScheduler: Scheduler = {
    id: 'mlq',
    name: 'Multi-Level Queue',
    isPreemptive: true,

    // Select the first process from the highest-priority non-empty queue
    selectNextProcess: (readyQueue: string[], processes: Process[]): string | null => {
        if (readyQueue.length === 0) return null;

        // Group ready queue processes by queue level
        let bestId: string | null = null;
        let bestLevel = Infinity;
        let bestArrival = Infinity;

        for (const id of readyQueue) {
            const process = processes.find(p => p.id === id);
            if (!process) continue;

            const level = process.queueLevel ?? 1;

            if (level < bestLevel) {
                bestLevel = level;
                bestId = id;
                bestArrival = process.arrivalTime;
            } else if (level === bestLevel && process.arrivalTime < bestArrival) {
                // Within same queue, use FCFS (arrival time)
                bestId = id;
                bestArrival = process.arrivalTime;
            }
        }

        return bestId;
    },

    // Preempt if a higher-priority queue has a ready process,
    // or if the current quantum for the process's queue level is exhausted
    shouldPreempt: (
        currentProcess: Process | null,
        readyQueue: string[],
        processes: Process[],
        currentQuantum: number,
        timeQuantum: number
    ): boolean => {
        if (!currentProcess || readyQueue.length === 0) return false;

        const currentLevel = currentProcess.queueLevel ?? 1;
        const queueQuantum = MLQ_QUANTA[currentLevel] ?? Infinity;

        // Check if quantum for this queue level is exhausted
        if (queueQuantum !== Infinity && currentQuantum >= queueQuantum) {
            return true;
        }

        // Check if any process in a higher-priority queue is ready
        for (const id of readyQueue) {
            const process = processes.find(p => p.id === id);
            if (process && (process.queueLevel ?? 1) < currentLevel) {
                return true;
            }
        }

        return false;
    },
};
