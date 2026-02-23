import { AlgorithmType, Process, SimulationState, GanttEntry } from '../types';
import { fcfsScheduler } from './fcfs';
import { sjfScheduler } from './sjf';
import { srtfScheduler } from './srtf';
import { priorityScheduler, priorityPreemptiveScheduler } from './priority';
import { roundRobinScheduler } from './roundRobin';

// Scheduler interface that all algorithms implement
export interface Scheduler {
  id: AlgorithmType;
  name: string;
  isPreemptive: boolean;

  // Select the next process to run from ready queue
  selectNextProcess: (readyQueue: string[], processes: Process[]) => string | null;

  // Check if current process should be preempted
  shouldPreempt: (
    currentProcess: Process | null,
    readyQueue: string[],
    processes: Process[],
    currentQuantum: number,
    timeQuantum: number
  ) => boolean;
}

// Scheduler registry
const schedulers: Record<AlgorithmType, Scheduler> = {
  fcfs: fcfsScheduler,
  sjf: sjfScheduler,
  srtf: srtfScheduler,
  priority: priorityScheduler,
  'priority-preemptive': priorityPreemptiveScheduler,
  rr: roundRobinScheduler,
  // MLQ does NOT use the standard Scheduler interface — it runs via mlqTick() in lib/schedulers/mlq.ts
  // This stub satisfies the Record<AlgorithmType, Scheduler> exhaustiveness requirement.
  mlq: {
    id: 'mlq',
    name: 'Multi-Level Queue',
    isPreemptive: true,
    selectNextProcess: () => { throw new Error('MLQ must use mlqTick(), not executeTick().'); },
    shouldPreempt: () => { throw new Error('MLQ must use mlqTick(), not executeTick().'); },
  },
  mlfq: {
    id: 'mlfq',
    name: 'Multi-Level Feedback Queue',
    isPreemptive: true,
    selectNextProcess: () => { throw new Error('MLFQ must use mlfqTick(), not executeTick().'); },
    shouldPreempt: () => { throw new Error('MLFQ must use mlfqTick(), not executeTick().'); },
  },
};

// Get scheduler by algorithm type
export function getScheduler(algorithm: AlgorithmType): Scheduler {
  return schedulers[algorithm];
}

// Execute one tick of simulation with the given algorithm
export function executeTick(
  state: SimulationState,
  algorithm: AlgorithmType,
  timeQuantum: number = 2
): SimulationState {
  if (algorithm === 'mlq') {
    throw new Error('MLQ must use mlqTick() from lib/schedulers/mlq.ts, not executeTick().');
  }
  if (algorithm === 'mlfq') {
    throw new Error('MLFQ must use mlfqTick() from lib/schedulers/mlfq.ts, not executeTick().');
  }
  const scheduler = getScheduler(algorithm);
  const currentTime = state.currentTime;

  let processes = [...state.processes];
  let readyQueue = [...state.readyQueue];
  let ioQueue = [...state.ioQueue];
  let runningProcess = state.runningProcess;
  let completedProcesses = [...state.completedProcesses];
  let ganttChart = [...state.ganttChart];
  let currentQuantum = state.currentQuantum;

  // Track which process executed this tick for accurate Gantt chart
  let executedProcessId: string | null = null;
  let executedProcessName: string = '';
  let executedProcessColor: string = '';

  // 1. Check for newly arrived processes and add to ready queue
  processes = processes.map((p) => {
    if (p.state === 'new' && p.arrivalTime <= currentTime) {
      readyQueue.push(p.id);
      return { ...p, state: 'ready' as const };
    }
    return p;
  });

  // 2. Process I/O queue - decrement I/O time for waiting processes
  const completedIo: string[] = [];
  processes = processes.map((p) => {
    if (p.state === 'waiting' && ioQueue.includes(p.id)) {
      const newRemainingIo = p.remainingIoTime - 1;
      if (newRemainingIo <= 0) {
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
      return { ...p, remainingIoTime: newRemainingIo };
    }
    return p;
  });

  // Move completed I/O processes to ready queue
  completedIo.forEach((id) => {
    ioQueue = ioQueue.filter((qId) => qId !== id);
    const process = processes.find((p) => p.id === id);
    if (process && process.state === 'ready') {
      readyQueue.push(id);
    } else if (process && process.state === 'terminated') {
      completedProcesses.push(id);
    }
  });

  // 3. Check for preemption (for preemptive algorithms)
  let wasPreempted = false;
  if (runningProcess && scheduler.isPreemptive) {
    const currentProcess = processes.find(p => p.id === runningProcess);
    if (currentProcess && scheduler.shouldPreempt(currentProcess, readyQueue, processes, currentQuantum, timeQuantum)) {
      // Preempt current process - move back to ready queue
      const runningIdx = processes.findIndex(p => p.id === runningProcess);
      if (runningIdx !== -1) {
        processes[runningIdx] = { ...processes[runningIdx], state: 'ready' as const };
        readyQueue.push(runningProcess);
        wasPreempted = true;

        // Mark the last gantt entry as preempted
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
  }

  // 4. If CPU is idle (or was just preempted) and ready queue has processes, dispatch next process
  if (!runningProcess && readyQueue.length > 0) {
    const nextProcessId = scheduler.selectNextProcess(readyQueue, processes);

    if (nextProcessId) {
      readyQueue = readyQueue.filter(id => id !== nextProcessId);
      const nextProcessIdx = processes.findIndex((p) => p.id === nextProcessId);

      if (nextProcessIdx !== -1) {
        const nextProcess = processes[nextProcessIdx];
        processes[nextProcessIdx] = {
          ...nextProcess,
          state: 'running' as const,
          startTime: nextProcess.startTime ?? currentTime,
          responseTime: nextProcess.responseTime ?? (currentTime - nextProcess.arrivalTime),
        };
        runningProcess = nextProcessId;
        currentQuantum = 0;
      }
    }
  }

  // 5. Handle running process - execute one unit of CPU time
  if (runningProcess) {
    const runningIdx = processes.findIndex((p) => p.id === runningProcess);
    if (runningIdx !== -1) {
      const process = processes[runningIdx];

      // Record this process as executing this tick (before any state changes)
      executedProcessId = process.id;
      executedProcessName = process.name;
      executedProcessColor = process.color;

      const newRemainingCpu = process.remainingCpuTime - 1;
      currentQuantum++;

      if (newRemainingCpu <= 0) {
        // CPU burst complete
        if (process.remainingIoTime > 0) {
          // Move to I/O queue
          processes[runningIdx] = {
            ...process,
            remainingCpuTime: 0,
            state: 'waiting' as const
          };
          ioQueue.push(process.id);
        } else {
          // Process complete
          processes[runningIdx] = {
            ...process,
            remainingCpuTime: 0,
            state: 'terminated' as const,
            completionTime: currentTime + 1,
          };
          completedProcesses.push(process.id);
        }
        runningProcess = null;
        currentQuantum = 0;
      } else {
        // Continue running
        processes[runningIdx] = {
          ...process,
          remainingCpuTime: newRemainingCpu
        };
      }
    }
  }

  // 6. Increment waiting time for processes in ready queue
  processes = processes.map((p) => {
    if (p.state === 'ready' && readyQueue.includes(p.id)) {
      return { ...p, waitingTime: p.waitingTime + 1 };
    }
    return p;
  });

  // 7. Record Gantt chart entry based on what actually executed this tick
  if (executedProcessId) {
    const lastEntry = ganttChart[ganttChart.length - 1];
    if (lastEntry && lastEntry.processId === executedProcessId && !lastEntry.isPreempted) {
      ganttChart[ganttChart.length - 1] = {
        ...lastEntry,
        endTime: currentTime + 1,
      };
    } else {
      ganttChart.push({
        processId: executedProcessId,
        processName: executedProcessName,
        startTime: currentTime,
        endTime: currentTime + 1,
        color: executedProcessColor,
      });
    }
  } else {
    // CPU was idle this tick
    const lastEntry = ganttChart[ganttChart.length - 1];
    if (lastEntry && lastEntry.processId === null) {
      ganttChart[ganttChart.length - 1] = {
        ...lastEntry,
        endTime: currentTime + 1,
      };
    } else {
      ganttChart.push({
        processId: null,
        processName: 'Idle',
        startTime: currentTime,
        endTime: currentTime + 1,
        color: '#94A3B8',
      });
    }
  }

  // 8. Check if simulation is complete
  const allTerminated = processes.every((p) => p.state === 'terminated');
  const hasArrivedAll = processes.every((p) => p.arrivalTime <= currentTime);
  const isComplete = allTerminated && hasArrivedAll && processes.length > 0;

  return {
    processes,
    readyQueue,
    ioQueue,
    runningProcess,
    completedProcesses,
    currentTime: currentTime + 1,
    ganttChart,
    isComplete,
    currentQuantum,
  };
}

// Run complete simulation for comparison mode
export function runFullSimulation(
  initialProcesses: Process[],
  algorithm: AlgorithmType,
  timeQuantum: number = 2
): SimulationState {
  // Reset processes to initial state
  const resetProcesses = initialProcesses.map(p => ({
    ...p,
    remainingCpuTime: p.cpuBurstTime,
    remainingIoTime: p.ioBurstTime,
    state: 'new' as const,
    startTime: null,
    completionTime: null,
    waitingTime: 0,
    responseTime: null,
  }));

  let state: SimulationState = {
    processes: resetProcesses,
    readyQueue: [],
    ioQueue: [],
    runningProcess: null,
    completedProcesses: [],
    currentTime: 0,
    ganttChart: [],
    isComplete: false,
    currentQuantum: 0,
  };

  // Run simulation until complete (with safety limit)
  const maxIterations = 10000;
  let iterations = 0;

  while (!state.isComplete && iterations < maxIterations) {
    state = executeTick(state, algorithm, timeQuantum);
    iterations++;
  }

  return state;
}
