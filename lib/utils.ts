import { Process, Statistics, ProcessStats, PROCESS_COLORS, GanttEntry, ProcessInput, ProcessType } from './types';

// Map ProcessType to default queue level
const PROCESS_TYPE_TO_QUEUE: Record<ProcessType, 0 | 1 | 2 | 3> = {
  system: 0,
  interactive: 1,
  batch: 2,
  background: 3,
};

export { PROCESS_TYPE_TO_QUEUE };

// Generate unique ID for processes
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Get next available process color
export function getProcessColor(index: number): string {
  return PROCESS_COLORS[index % PROCESS_COLORS.length];
}

// Format time for display (in ms)
export function formatTime(time: number): string {
  return `${time}ms`;
}

// Calculate statistics from completed processes
export function calculateStatistics(
  processes: Process[],
  currentTime: number,
  ganttChart: GanttEntry[]
): Statistics {
  const completedProcesses = processes.filter(p => p.state === 'terminated');

  if (completedProcesses.length === 0) {
    return {
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      totalTime: currentTime,
      idleTime: 0,
    };
  }

  const totalWaitingTime = completedProcesses.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalTurnaroundTime = completedProcesses.reduce((sum, p) => {
    if (p.completionTime !== null) {
      return sum + (p.completionTime - p.arrivalTime);
    }
    return sum;
  }, 0);
  const totalResponseTime = completedProcesses.reduce((sum, p) => {
    if (p.responseTime !== null) {
      return sum + p.responseTime;
    }
    return sum;
  }, 0);

  const idleEntries = ganttChart.filter(entry => entry.processId === null);
  const idleTime = idleEntries.reduce((sum, entry) => sum + (entry.endTime - entry.startTime), 0);
  const busyTime = currentTime - idleTime;
  const cpuUtilization = currentTime > 0 ? (busyTime / currentTime) * 100 : 0;

  return {
    avgWaitingTime: totalWaitingTime / completedProcesses.length,
    avgTurnaroundTime: totalTurnaroundTime / completedProcesses.length,
    avgResponseTime: totalResponseTime / completedProcesses.length,
    cpuUtilization,
    totalTime: currentTime,
    idleTime,
  };
}

// Get individual process statistics
export function getProcessStats(processes: Process[]): ProcessStats[] {
  return processes
    .filter(p => p.state === 'terminated')
    .map(p => ({
      id: p.id,
      name: p.name,
      arrivalTime: p.arrivalTime,
      completionTime: p.completionTime ?? 0,
      turnaroundTime: p.completionTime !== null ? p.completionTime - p.arrivalTime : 0,
      waitingTime: p.waitingTime,
      responseTime: p.responseTime ?? 0,
    }));
}

// Create a new process with default values
export function createProcess(
  input: ProcessInput,
  colorIndex: number
): Process {
  return {
    id: generateId(),
    name: input.name,
    arrivalTime: input.arrivalTime,
    cpuBurstTime: input.cpuBurstTime,
    ioBurstTime: input.ioBurstTime,
    remainingCpuTime: input.cpuBurstTime,
    remainingIoTime: input.ioBurstTime,
    state: 'new',
    startTime: null,
    completionTime: null,
    waitingTime: 0,
    responseTime: null,
    color: getProcessColor(colorIndex),
    priority: input.priority,
    queueLevel: input.queueLevel ?? 2, // default: Batch (Q3)
    cpuTimeUsedInCurrentQueue: 0,
  };
}

// Example processes for demo
export function getExampleProcesses(): ProcessInput[] {
  return [
    { name: 'P1', arrivalTime: 0, cpuBurstTime: 6, ioBurstTime: 2, priority: 3 },
    { name: 'P2', arrivalTime: 1, cpuBurstTime: 4, ioBurstTime: 0, priority: 1 },
    { name: 'P3', arrivalTime: 2, cpuBurstTime: 8, ioBurstTime: 3, priority: 4 },
    { name: 'P4', arrivalTime: 3, cpuBurstTime: 3, ioBurstTime: 0, priority: 2 },
    { name: 'P5', arrivalTime: 5, cpuBurstTime: 5, ioBurstTime: 0, priority: 5 },
  ];
}

// MLQ demo: 5 processes spread across all 4 queue levels
export function getMlqExampleProcesses(): ProcessInput[] {
  return [
    { name: 'P1', arrivalTime: 0, cpuBurstTime: 3, ioBurstTime: 0, priority: 1, queueLevel: 0 }, // System
    { name: 'P2', arrivalTime: 1, cpuBurstTime: 5, ioBurstTime: 2, priority: 2, queueLevel: 1 }, // Interactive
    { name: 'P3', arrivalTime: 2, cpuBurstTime: 8, ioBurstTime: 0, priority: 3, queueLevel: 2 }, // Batch
    { name: 'P4', arrivalTime: 4, cpuBurstTime: 4, ioBurstTime: 0, priority: 4, queueLevel: 1 }, // Interactive
    { name: 'P5', arrivalTime: 5, cpuBurstTime: 6, ioBurstTime: 0, priority: 5, queueLevel: 3 }, // Background
  ];
}

// MLFQ demo: 5 processes demonstrating demotion and I/O
export function getMlfqExampleProcesses(): ProcessInput[] {
  return [
    { name: 'P1', arrivalTime: 0, cpuBurstTime: 12, ioBurstTime: 0, priority: 1, queueLevel: 0 }, // CPU bound, will demote to Q2
    { name: 'P2', arrivalTime: 2, cpuBurstTime: 3, ioBurstTime: 5, priority: 2, queueLevel: 0 },  // I/O bound, stays in Q0
    { name: 'P3', arrivalTime: 4, cpuBurstTime: 10, ioBurstTime: 0, priority: 3, queueLevel: 0 }, // CPU bound, will demote
    { name: 'P4', arrivalTime: 15, cpuBurstTime: 4, ioBurstTime: 0, priority: 4, queueLevel: 0 }, // Short job arriving later
    { name: 'P5', arrivalTime: 20, cpuBurstTime: 25, ioBurstTime: 0, priority: 5, queueLevel: 0 }, // Long job, needs boost
  ];
}

// Clone processes for comparison mode (reset to initial state)
export function cloneProcessesForSimulation(processes: Process[]): Process[] {
  return processes.map(p => ({
    ...p,
    remainingCpuTime: p.cpuBurstTime,
    remainingIoTime: p.ioBurstTime,
    state: 'new' as const,
    startTime: null,
    completionTime: null,
    waitingTime: 0,
    responseTime: null,
    cpuTimeUsedInCurrentQueue: 0,
  }));
}
