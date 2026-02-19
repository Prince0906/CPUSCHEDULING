import { AlgorithmType, Process, MLQSimulationState, MLQGanttEntry, QueueConfig } from '../types';
import { getScheduler } from './index';

// Starvation threshold: ticks without CPU before a process is flagged
export const STARVATION_THRESHOLD = 10;

/**
 * Run one tick of the Multi-Level Queue scheduler.
 * Strategy:
 *   1. Arrive new processes → push to their queue[process.queueLevel]
 *   2. Tick I/O → completed I/O returns to process's ORIGINAL queue
 *   3. Find activeQueueId = first index where queues[i].length > 0 OR a process is already running in it
 *   4. If activeQueueId changed → preempt current running process back to its queue, increment contextSwitchCount
 *   5. Run sub-scheduler for activeQueue to select next if CPU is idle
 *   6. Execute 1 CPU tick
 *   7. On burst complete: go to I/O or completed
 *   8. Update starvationMap for all non-running processes
 *   9. Append MLQGanttEntry
 *  10. Check isComplete
 */
export function mlqTick(
    state: MLQSimulationState,
    configs: QueueConfig[]
): MLQSimulationState {
    const currentTime = state.currentTime;

    let processes = [...state.processes];
    // Deep-copy the 4 queue arrays
    let queues: [string[], string[], string[], string[]] = [
        [...state.queues[0]],
        [...state.queues[1]],
        [...state.queues[2]],
        [...state.queues[3]],
    ];
    let ioQueue = [...state.ioQueue];
    let runningProcess = state.runningProcess;
    let activeQueueId = state.activeQueueId;
    let completedProcesses = [...state.completedProcesses];
    let ganttChart = [...state.ganttChart] as MLQGanttEntry[];
    let currentQuantum = state.currentQuantum;
    let contextSwitchCount = state.contextSwitchCount;
    const starvationMap = { ...state.starvationMap };

    let executedProcessId: string | null = null;
    let executedProcessName = '';
    let executedProcessColor = '';

    // ─── Step 1: Arrive new processes ───────────────────────────────────────────
    processes = processes.map((p) => {
        if (p.state === 'new' && p.arrivalTime <= currentTime) {
            const ql = p.queueLevel;
            queues[ql] = [...queues[ql], p.id];
            return { ...p, state: 'ready' as const };
        }
        return p;
    });

    // ─── Step 2: Tick I/O queue ─────────────────────────────────────────────────
    const completedIo: string[] = [];
    processes = processes.map((p) => {
        if (p.state === 'waiting' && ioQueue.includes(p.id)) {
            const newIo = p.remainingIoTime - 1;
            if (newIo <= 0) {
                completedIo.push(p.id);
                if (p.remainingCpuTime > 0) {
                    return { ...p, remainingIoTime: 0, state: 'ready' as const };
                } else {
                    return {
                        ...p,
                        remainingIoTime: 0,
                        state: 'terminated' as const,
                        completionTime: currentTime + 1,
                    };
                }
            }
            return { ...p, remainingIoTime: newIo };
        }
        return p;
    });

    // Move completed-I/O processes back to their ORIGINAL queue
    completedIo.forEach((id) => {
        ioQueue = ioQueue.filter((qId) => qId !== id);
        const p = processes.find((p) => p.id === id);
        if (!p) return;
        if (p.state === 'ready') {
            queues[p.queueLevel] = [...queues[p.queueLevel], id];
        } else if (p.state === 'terminated') {
            completedProcesses = [...completedProcesses, id];
        }
    });

    // ─── Step 3: Determine which queue should have the CPU ──────────────────────
    // Active queue = highest priority (lowest index) queue with any ready processes
    // OR the queue of the currently running process (if still highest priority)
    let newActiveQueueId: 0 | 1 | 2 | 3 | null = null;
    for (let i = 0; i < 4; i++) {
        if (queues[i as 0 | 1 | 2 | 3].length > 0) {
            newActiveQueueId = i as 0 | 1 | 2 | 3;
            break;
        }
    }
    // Running process still holds CPU for its queue if no higher queue is ready
    if (runningProcess && newActiveQueueId !== null) {
        const rp = processes.find((p) => p.id === runningProcess);
        if (rp && (rp.queueLevel < newActiveQueueId)) {
            newActiveQueueId = rp.queueLevel as 0 | 1 | 2 | 3;
        }
    } else if (runningProcess && newActiveQueueId === null) {
        const rp = processes.find((p) => p.id === runningProcess);
        if (rp) newActiveQueueId = rp.queueLevel as 0 | 1 | 2 | 3;
    }

    // ─── Step 4: Preempt if a higher-priority queue became active ───────────────
    if (
        runningProcess &&
        newActiveQueueId !== null &&
        activeQueueId !== null &&
        newActiveQueueId < activeQueueId
    ) {
        // Preempt running process → push back to its queue
        const rpIdx = processes.findIndex((p) => p.id === runningProcess);
        if (rpIdx !== -1) {
            const rp = processes[rpIdx];
            processes[rpIdx] = { ...rp, state: 'ready' as const };
            queues[rp.queueLevel] = [runningProcess, ...queues[rp.queueLevel]];

            if (ganttChart.length > 0) {
                ganttChart[ganttChart.length - 1] = {
                    ...ganttChart[ganttChart.length - 1],
                    isPreempted: true,
                };
            }
        }
        runningProcess = null;
        currentQuantum = 0;
        contextSwitchCount++;
    } else if (activeQueueId !== newActiveQueueId && runningProcess === null) {
        // CPU was idle and queue changed (no preemption, just tracking)
        if (activeQueueId !== null && newActiveQueueId !== null) {
            contextSwitchCount++;
        }
    }

    activeQueueId = newActiveQueueId;

    // ─── Step 5: Select next process if CPU idle ─────────────────────────────────
    if (!runningProcess && activeQueueId !== null && queues[activeQueueId].length > 0) {
        const config = configs[activeQueueId];
        const subAlgo = config.algorithm as Exclude<typeof config.algorithm, 'mlq'>;
        const scheduler = getScheduler(subAlgo);
        const nextPid = scheduler.selectNextProcess(queues[activeQueueId], processes);

        if (nextPid) {
            queues[activeQueueId] = queues[activeQueueId].filter((id) => id !== nextPid);
            const idx = processes.findIndex((p) => p.id === nextPid);
            if (idx !== -1) {
                const np = processes[idx];
                processes[idx] = {
                    ...np,
                    state: 'running' as const,
                    startTime: np.startTime ?? currentTime,
                    responseTime: np.responseTime ?? currentTime - np.arrivalTime,
                };
                runningProcess = nextPid;
                currentQuantum = 0;
            }
        }
    }

    // ─── Step 6: Execute running process ─────────────────────────────────────────
    if (runningProcess) {
        const idx = processes.findIndex((p) => p.id === runningProcess);
        if (idx !== -1) {
            const p = processes[idx];
            executedProcessId = p.id;
            executedProcessName = p.name;
            executedProcessColor = p.color;

            const newCpu = p.remainingCpuTime - 1;
            currentQuantum++;

            // ─── Step 6a: RR quantum check (within-queue preemption) ───────────────
            if (activeQueueId !== null) {
                const config = configs[activeQueueId];
                if (
                    config.algorithm === 'rr' &&
                    currentQuantum >= config.timeQuantum &&
                    newCpu > 0
                ) {
                    // RR quantum expired — put back at end of same queue
                    processes[idx] = { ...p, remainingCpuTime: newCpu, state: 'ready' as const };
                    queues[activeQueueId] = [...queues[activeQueueId], runningProcess];
                    runningProcess = null;
                    currentQuantum = 0;

                    if (ganttChart.length > 0) {
                        ganttChart[ganttChart.length - 1] = {
                            ...ganttChart[ganttChart.length - 1],
                            isPreempted: true,
                        };
                    }

                    // Update starvation BEFORE returning early
                    processes.forEach((pr) => {
                        if (pr.state === 'ready' || pr.state === 'waiting') {
                            starvationMap[pr.id] = (starvationMap[pr.id] ?? 0) + 1;
                        } else {
                            starvationMap[pr.id] = 0;
                        }
                    });

                    ganttChart = recordGanttEntry(ganttChart, executedProcessId, executedProcessName, executedProcessColor, currentTime, activeQueueId);

                    return {
                        ...state,
                        processes,
                        queues,
                        ioQueue,
                        runningProcess,
                        activeQueueId,
                        completedProcesses,
                        currentTime: currentTime + 1,
                        ganttChart,
                        isComplete: false,
                        currentQuantum,
                        contextSwitchCount,
                        starvationMap,
                    };
                }
            }

            // ─── Step 6b: Burst complete ────────────────────────────────────────────
            if (newCpu <= 0) {
                if (p.ioBurstTime > 0 && p.remainingIoTime > 0) {
                    processes[idx] = { ...p, remainingCpuTime: 0, state: 'waiting' as const };
                    ioQueue = [...ioQueue, p.id];
                } else {
                    processes[idx] = {
                        ...p,
                        remainingCpuTime: 0,
                        state: 'terminated' as const,
                        completionTime: currentTime + 1,
                    };
                    completedProcesses = [...completedProcesses, p.id];
                }
                runningProcess = null;
                currentQuantum = 0;
            } else {
                processes[idx] = { ...p, remainingCpuTime: newCpu };
            }
        }
    }

    // ─── Step 7: Increment waiting time for ready processes ──────────────────────
    processes = processes.map((p) => {
        const isInReadyQueue = queues.some((q) => q.includes(p.id));
        if (p.state === 'ready' && isInReadyQueue) {
            return { ...p, waitingTime: p.waitingTime + 1 };
        }
        return p;
    });

    // ─── Step 8: Update starvation map ───────────────────────────────────────────
    processes.forEach((p) => {
        if (p.state === 'terminated') {
            starvationMap[p.id] = 0;
        } else if (p.id === runningProcess) {
            starvationMap[p.id] = 0;
        } else if (p.state === 'ready' || p.state === 'waiting') {
            starvationMap[p.id] = (starvationMap[p.id] ?? 0) + 1;
        }
    });

    // ─── Step 9: Record Gantt chart entry ────────────────────────────────────────
    ganttChart = recordGanttEntry(ganttChart, executedProcessId, executedProcessName, executedProcessColor, currentTime, activeQueueId);

    // ─── Step 10: Check completion ───────────────────────────────────────────────
    const allTerminated = processes.every((p) => p.state === 'terminated');
    const allArrived = processes.every((p) => p.arrivalTime <= currentTime);
    const isComplete = allTerminated && allArrived && processes.length > 0;

    return {
        processes,
        queues,
        ioQueue,
        runningProcess,
        activeQueueId,
        completedProcesses,
        currentTime: currentTime + 1,
        ganttChart,
        isComplete,
        currentQuantum,
        contextSwitchCount,
        starvationMap,
    };
}

/** Append or extend the last Gantt entry (avoids redundant one-tick entries). */
function recordGanttEntry(
    ganttChart: MLQGanttEntry[],
    processId: string | null,
    processName: string,
    color: string,
    currentTime: number,
    queueId: 0 | 1 | 2 | 3 | null
): MLQGanttEntry[] {
    const chart = [...ganttChart];
    const last = chart[chart.length - 1];

    if (processId) {
        if (last && last.processId === processId && !last.isPreempted && last.queueId === queueId) {
            chart[chart.length - 1] = { ...last, endTime: currentTime + 1 };
        } else {
            chart.push({
                processId,
                processName,
                startTime: currentTime,
                endTime: currentTime + 1,
                color,
                queueId,
            });
        }
    } else {
        if (last && last.processId === null) {
            chart[chart.length - 1] = { ...last, endTime: currentTime + 1 };
        } else {
            chart.push({
                processId: null,
                processName: 'Idle',
                startTime: currentTime,
                endTime: currentTime + 1,
                color: '#94A3B8',
                queueId: null,
            });
        }
    }

    return chart;
}

/** Build initial MLQ simulation state from a list of processes. */
export function createInitialMlqState(processes: Process[]): MLQSimulationState {
    return {
        processes: processes.map((p) => ({
            ...p,
            remainingCpuTime: p.cpuBurstTime,
            remainingIoTime: p.ioBurstTime,
            state: 'new' as const,
            startTime: null,
            completionTime: null,
            waitingTime: 0,
            responseTime: null,
        })),
        queues: [[], [], [], []],
        ioQueue: [],
        runningProcess: null,
        activeQueueId: null,
        completedProcesses: [],
        currentTime: 0,
        ganttChart: [],
        isComplete: false,
        currentQuantum: 0,
        contextSwitchCount: 0,
        starvationMap: {},
    };
}
