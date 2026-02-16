import { Process } from '../types';
import { Scheduler } from './index';

// MLFQ Queue Configuration:
// Queue 1 (High): quantum = 2
// Queue 2 (Medium): quantum = 4
// Queue 3 (Low): quantum = 8
// All processes start in Queue 1.
// When a process exhausts its quantum, it gets demoted to the next queue.

export const MLFQ_QUANTA: Record<number, number> = {
    1: 2,
    2: 4,
    3: 8,
};

export const MLFQ_MAX_LEVEL = 3;

export const mlfqScheduler: Scheduler = {
    id: 'mlfq',
    name: 'Multi-Level Feedback Queue',
    isPreemptive: true,

    // Select the first process from the highest-priority non-empty queue
    selectNextProcess: (readyQueue: string[], processes: Process[]): string | null => {
        if (readyQueue.length === 0) return null;

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
                bestId = id;
                bestArrival = process.arrivalTime;
            }
        }

        return bestId;
    },

    // Preempt if quantum for current queue level is exhausted,
    // or if a higher-priority queue has a process ready
    shouldPreempt: (
        currentProcess: Process | null,
        readyQueue: string[],
        processes: Process[],
        currentQuantum: number,
        timeQuantum: number
    ): boolean => {
        if (!currentProcess || readyQueue.length === 0) return false;

        const currentLevel = currentProcess.queueLevel ?? 1;
        const queueQuantum = MLFQ_QUANTA[currentLevel] ?? 8;

        // Check if quantum for this queue level is exhausted
        if (currentQuantum >= queueQuantum) {
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
