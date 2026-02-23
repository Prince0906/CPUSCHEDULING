import { Process, MLFQSimulationState, MLQGanttEntry, MLFQQueueConfig } from '../types';

/**
 * Run one tick of the Multi-Level Feedback Queue scheduler.
 * Strategy:
 *   1. Priority Boost (Rule 6) - If boost time = 0, move all to Q0, reset cpu time and boost timer.
 *   2. Arrive new processes to Q0 (Rule 1).
 *   3. Tick I/O (Rule 4). Completed I/O returns to the BACK of the SAME queue.
 *   4. Find activeQueueId - Highest priority (lowest index) with ready processes.
 *   5. Preemption (Rule 5) - If activeQueueId < current running queue, preempt running process to FRONT of its queue.
 *   6. Select next process from activeQueueId (front of queue).
 *   7. Execute 1 CPU tick.
 *      - Increment cpuTimeUsedInCurrentQueue (Rule 2 + Accounting Fix).
 *      - If process performs I/O, it yields CPU, and keeps its priority (Rule 4).
 *        We trigger I/O when remainingCpuTime reaches half of cpuBurstTime to simulate mid-burst I/O.
 *      - If cpuTimeUsedInCurrentQueue >= queue quantum, demote to BACK of next lower queue (Rule 3).
 *      - If process burst complete, handle termination.
 *   8. Return updated state.
 */
export function mlfqTick(
    state: MLFQSimulationState,
    configs: MLFQQueueConfig[],
    boostLimit: number
): MLFQSimulationState {
    const currentTime = state.currentTime;

    let processes = [...state.processes];
    let queues: [string[], string[], string[]] = [
        [...state.queues[0]],
        [...state.queues[1]],
        [...state.queues[2]],
    ];
    let ioQueue = [...state.ioQueue];
    let runningProcess = state.runningProcess;
    let activeQueueId = state.activeQueueId;
    let completedProcesses = [...state.completedProcesses];
    let ganttChart = [...state.ganttChart] as MLQGanttEntry[];
    let currentQuantum = state.currentQuantum;
    let boostTimeRemaining = state.boostTimeRemaining - 1;

    let executedProcessId: string | null = null;
    let executedProcessName = '';
    let executedProcessColor = '';

    // ─── Step 1: Rule 6 - Priority Boost ─────────────────────────────────────────
    if (boostTimeRemaining <= 0) {
        // Boost all processes to Q0
        const allBoosted: string[] = [];
        allBoosted.push(...queues[0]); // Keep Q0 order
        allBoosted.push(...queues[1]); // Boost Q1
        allBoosted.push(...queues[2]); // Boost Q2

        queues[0] = allBoosted;
        queues[1] = [];
        queues[2] = [];

        processes = processes.map((p) => {
            if (p.state !== 'terminated' && p.state !== 'new') {
                return {
                    ...p,
                    queueLevel: 0,
                    cpuTimeUsedInCurrentQueue: 0 // completely reset usage
                };
            }
            return p;
        });

        // If a process is running, its queueLevel just updated. Stay in Q0.
        if (runningProcess) {
            const rpIdx = processes.findIndex(p => p.id === runningProcess);
            if (rpIdx !== -1) {
                activeQueueId = 0;
                processes[rpIdx].cpuTimeUsedInCurrentQueue = 0;
                currentQuantum = 0;
            }
        }
        boostTimeRemaining = boostLimit;
    }

    // ─── Step 2: Arrive new processes to Q0 (Rule 1) ────────────────────────────
    processes = processes.map((p) => {
        if (p.state === 'new' && p.arrivalTime <= currentTime) {
            queues[0].push(p.id);
            return {
                ...p,
                state: 'ready' as const,
                queueLevel: 0,
                cpuTimeUsedInCurrentQueue: 0
            };
        }
        return p;
    });

    // ─── Step 3: Tick I/O (Rule 4) ──────────────────────────────────────────────
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

    // Move completed-I/O processes back to their CURRENT queue (Back of queue)
    completedIo.forEach((id) => {
        ioQueue = ioQueue.filter((qId) => qId !== id);
        const p = processes.find((proc) => proc.id === id);
        if (!p) return;
        if (p.state === 'ready') {
            const ql = p.queueLevel as 0 | 1 | 2;
            queues[ql].push(id);
        } else if (p.state === 'terminated') {
            completedProcesses.push(id);
        }
    });

    // ─── Step 4: Determine active queue ─────────────────────────────────────────
    let newActiveQueueId: 0 | 1 | 2 | null = null;
    for (let i = 0; i < 3; i++) {
        if (queues[i as 0 | 1 | 2].length > 0) {
            newActiveQueueId = i as 0 | 1 | 2;
            break;
        }
    }

    // Check if running process maintains CPU
    if (runningProcess) {
        const rp = processes.find((p) => p.id === runningProcess);
        if (rp) {
            // It holds CPU if it's the highest priority OR equals the newly active queue
            // (e.g. if it's in Q1 and newActive is Q1 or Q2)
            if (newActiveQueueId === null || rp.queueLevel <= newActiveQueueId) {
                newActiveQueueId = rp.queueLevel as 0 | 1 | 2;
            }
        }
    }

    // ─── Step 5: Rule 5 - Preemption Selection ──────────────────────────────────
    if (
        runningProcess &&
        newActiveQueueId !== null &&
        activeQueueId !== null &&
        newActiveQueueId < activeQueueId
    ) {
        // Preempt running process → push back to the FRONT of its CURRENT queue
        const rpIdx = processes.findIndex((p) => p.id === runningProcess);
        if (rpIdx !== -1) {
            const rp = processes[rpIdx];
            processes[rpIdx] = { ...rp, state: 'ready' as const };
            const ql = rp.queueLevel as 0 | 1 | 2;
            queues[ql] = [runningProcess, ...queues[ql]];

            if (ganttChart.length > 0) {
                ganttChart[ganttChart.length - 1] = {
                    ...ganttChart[ganttChart.length - 1],
                    isPreempted: true,
                };
            }
        }
        runningProcess = null;
        currentQuantum = 0;
    }

    activeQueueId = newActiveQueueId;

    // ─── Step 6: Select next process if CPU idle ────────────────────────────────
    if (!runningProcess && activeQueueId !== null && queues[activeQueueId].length > 0) {
        // Shift from front of queue
        const nextPid = queues[activeQueueId].shift();
        if (nextPid) {
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
                currentQuantum = np.cpuTimeUsedInCurrentQueue; // resuming where it left off in this queue level
            }
        }
    }

    // ─── Step 7: Execute running process ────────────────────────────────────────
    if (runningProcess) {
        const idx = processes.findIndex((p) => p.id === runningProcess);
        if (idx !== -1) {
            const p = processes[idx];
            executedProcessId = p.id;
            executedProcessName = p.name;
            executedProcessColor = p.color;

            const newCpu = p.remainingCpuTime - 1;
            const newCpuUsed = p.cpuTimeUsedInCurrentQueue + 1;
            currentQuantum = newCpuUsed;

            // Trigger mid-burst I/O to simulate real-world I/O behavior during CPU task
            const shouldTriggerIo = newCpu === Math.floor(p.cpuBurstTime / 2) && p.ioBurstTime > 0 && p.remainingIoTime === p.ioBurstTime;

            if (shouldTriggerIo) {
                processes[idx] = { ...p, remainingCpuTime: newCpu, state: 'waiting' as const, cpuTimeUsedInCurrentQueue: newCpuUsed };
                ioQueue.push(p.id);
                runningProcess = null;
                // Preempted visually
                if (ganttChart.length > 0) {
                    ganttChart[ganttChart.length - 1].isPreempted = true;
                }
            } else if (newCpu <= 0) {
                // Task Finished
                if (p.ioBurstTime > 0 && p.remainingIoTime > 0) {
                    processes[idx] = { ...p, remainingCpuTime: 0, state: 'waiting' as const, cpuTimeUsedInCurrentQueue: newCpuUsed };
                    ioQueue.push(p.id);
                } else {
                    processes[idx] = {
                        ...p,
                        remainingCpuTime: 0,
                        state: 'terminated' as const,
                        completionTime: currentTime + 1,
                        cpuTimeUsedInCurrentQueue: newCpuUsed,
                    };
                    completedProcesses.push(p.id);
                }
                runningProcess = null;
            } else {
                // Still running CPU Burst
                // ─── Step 7b: Rule 3 - Demotion ─────────────────────────────────────
                if (activeQueueId !== null) {
                    const queueConfig = configs[activeQueueId];
                    if (newCpuUsed >= queueConfig.timeQuantum) {
                        // Fully consumed slice. Demote!
                        const newQueueLevel = Math.min(activeQueueId + 1, 2) as 0 | 1 | 2;

                        processes[idx] = {
                            ...p,
                            remainingCpuTime: newCpu,
                            state: 'ready' as const,
                            queueLevel: newQueueLevel,
                            cpuTimeUsedInCurrentQueue: 0 // Reset usage for new queue entirely
                        };

                        // Push to BACK of the new queue
                        queues[newQueueLevel].push(runningProcess);
                        runningProcess = null;

                        if (ganttChart.length > 0) {
                            ganttChart[ganttChart.length - 1].isPreempted = true; // visually break the block
                        }
                    } else {
                        // Just update time used
                        processes[idx] = { ...p, remainingCpuTime: newCpu, cpuTimeUsedInCurrentQueue: newCpuUsed };
                    }
                }
            }
        }
    }

    // ─── Step 8: Increment waiting time for ready processes ─────────────────────
    processes = processes.map((p) => {
        const isInReadyQueue = queues.some((q) => q.includes(p.id));
        if (p.state === 'ready' && isInReadyQueue) {
            return { ...p, waitingTime: p.waitingTime + 1 };
        }
        return p;
    });

    // ─── Step 9: Record Gantt chart entry ───────────────────────────────────────
    ganttChart = recordGanttEntry(ganttChart, executedProcessId, executedProcessName, executedProcessColor, currentTime, activeQueueId as 0 | 1 | 2 | null);

    // ─── Step 10: Check completion ──────────────────────────────────────────────
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
        boostTimeRemaining,
    };
}

/** Append or extend the last Gantt entry */
function recordGanttEntry(
    ganttChart: MLQGanttEntry[],
    processId: string | null,
    processName: string,
    color: string,
    currentTime: number,
    queueId: 0 | 1 | 2 | null
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

/** Build initial MLFQ simulation state */
export function createInitialMlfqState(processes: Process[], boostLimit: number): MLFQSimulationState {
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
            cpuTimeUsedInCurrentQueue: 0,
            queueLevel: 0,
        })),
        queues: [[], [], []],
        ioQueue: [],
        runningProcess: null,
        activeQueueId: null,
        completedProcesses: [],
        currentTime: 0,
        ganttChart: [],
        isComplete: false,
        currentQuantum: 0,
        boostTimeRemaining: boostLimit,
    };
}
