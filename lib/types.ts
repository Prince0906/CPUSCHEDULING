// Process states in the CPU scheduling lifecycle
export type ProcessState = 'new' | 'ready' | 'running' | 'waiting' | 'terminated';

// Algorithm types supported
export type AlgorithmType = 
  | 'fcfs' 
  | 'sjf' 
  | 'srtf' 
  | 'priority' 
  | 'priority-preemptive' 
  | 'rr';

// Algorithm metadata for UI
export interface AlgorithmInfo {
  id: AlgorithmType;
  name: string;
  shortName: string;
  description: string;
  isPreemptive: boolean;
  selectionCriteria: string;
  pros: string[];
  cons: string[];
  timeComplexity: string;
}

// All algorithm information
export const ALGORITHMS: Record<AlgorithmType, AlgorithmInfo> = {
  fcfs: {
    id: 'fcfs',
    name: 'First Come First Serve',
    shortName: 'FCFS',
    description: 'Processes are executed in the order they arrive. Simple and fair but can lead to convoy effect.',
    isPreemptive: false,
    selectionCriteria: 'First process in queue (arrival order)',
    pros: ['Simple to implement', 'Fair - no starvation', 'Low overhead'],
    cons: ['Convoy effect', 'High average waiting time', 'Not optimal'],
    timeComplexity: 'O(n)',
  },
  sjf: {
    id: 'sjf',
    name: 'Shortest Job First',
    shortName: 'SJF',
    description: 'Selects the process with the smallest CPU burst time. Optimal for minimizing average waiting time.',
    isPreemptive: false,
    selectionCriteria: 'Process with shortest burst time',
    pros: ['Minimum average waiting time', 'Optimal for batch systems'],
    cons: ['Starvation possible', 'Requires burst time prediction', 'Not practical for interactive'],
    timeComplexity: 'O(n)',
  },
  srtf: {
    id: 'srtf',
    name: 'Shortest Remaining Time First',
    shortName: 'SRTF',
    description: 'Preemptive version of SJF. Always runs the process with the shortest remaining time.',
    isPreemptive: true,
    selectionCriteria: 'Process with shortest remaining time',
    pros: ['Better response time than SJF', 'Optimal average waiting time'],
    cons: ['High context switch overhead', 'Starvation of longer processes', 'Requires remaining time tracking'],
    timeComplexity: 'O(n)',
  },
  priority: {
    id: 'priority',
    name: 'Priority Scheduling',
    shortName: 'Priority',
    description: 'Processes are scheduled based on priority. Lower number = higher priority.',
    isPreemptive: false,
    selectionCriteria: 'Process with highest priority (lowest number)',
    pros: ['Important processes run first', 'Flexible priority assignment'],
    cons: ['Starvation of low priority', 'Priority inversion possible', 'Requires priority assignment'],
    timeComplexity: 'O(n)',
  },
  'priority-preemptive': {
    id: 'priority-preemptive',
    name: 'Priority (Preemptive)',
    shortName: 'Priority-P',
    description: 'Preemptive priority scheduling. Higher priority process can interrupt running process.',
    isPreemptive: true,
    selectionCriteria: 'Highest priority process (preempts if higher arrives)',
    pros: ['Immediate response to high priority', 'Better for real-time systems'],
    cons: ['More context switches', 'Starvation risk', 'Priority inversion'],
    timeComplexity: 'O(n)',
  },
  rr: {
    id: 'rr',
    name: 'Round Robin',
    shortName: 'RR',
    description: 'Each process gets a fixed time quantum. Fair time sharing among all processes.',
    isPreemptive: true,
    selectionCriteria: 'FCFS with time quantum limit',
    pros: ['Fair time sharing', 'Good response time', 'No starvation'],
    cons: ['Higher context switch overhead', 'Performance depends on quantum', 'Higher average waiting time'],
    timeComplexity: 'O(n)',
  },
};

// Individual process representation
export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  cpuBurstTime: number;
  ioBurstTime: number;
  remainingCpuTime: number;
  remainingIoTime: number;
  state: ProcessState;
  startTime: number | null;
  completionTime: number | null;
  waitingTime: number;
  responseTime: number | null;
  color: string;
  priority: number; // For priority scheduling (1 = highest priority)
}

// Entry for Gantt chart visualization
export interface GanttEntry {
  processId: string | null;
  processName: string;
  startTime: number;
  endTime: number;
  color: string;
  isPreempted?: boolean; // Mark if this segment ended due to preemption
}

// Simulation playback state
export type PlaybackState = 'stopped' | 'playing' | 'paused';

// Speed multiplier options
export type SpeedOption = 0.5 | 1 | 2 | 4;

// Statistics calculated from completed processes
export interface Statistics {
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  totalTime: number;
  idleTime: number;
}

// Process statistics for individual process breakdown
export interface ProcessStats {
  id: string;
  name: string;
  arrivalTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
}

// Simulation result for comparison mode
export interface SimulationResult {
  algorithm: AlgorithmType;
  ganttChart: GanttEntry[];
  statistics: Statistics;
  processStats: ProcessStats[];
  totalTime: number;
}

// Simulation state for a single run
export interface SimulationState {
  processes: Process[];
  readyQueue: string[];
  ioQueue: string[];
  runningProcess: string | null;
  completedProcesses: string[];
  currentTime: number;
  ganttChart: GanttEntry[];
  isComplete: boolean;
  currentQuantum: number; // For Round Robin - tracks time in current quantum
}

// Main scheduler store state
export interface SchedulerState {
  // Algorithm selection
  algorithm: AlgorithmType;
  timeQuantum: number; // For Round Robin
  
  // Process management
  processes: Process[];
  readyQueue: string[];
  ioQueue: string[];
  runningProcess: string | null;
  completedProcesses: string[];
  
  // Simulation state
  currentTime: number;
  playbackState: PlaybackState;
  speed: SpeedOption;
  isSimulationComplete: boolean;
  currentQuantum: number; // For RR - time spent in current quantum
  
  // Gantt chart data
  ganttChart: GanttEntry[];
  
  // Comparison mode
  isCompareMode: boolean;
  compareAlgorithms: AlgorithmType[];
  compareResults: SimulationResult[];
  
  // Actions
  setAlgorithm: (algorithm: AlgorithmType) => void;
  setTimeQuantum: (quantum: number) => void;
  addProcess: (process: Omit<Process, 'id' | 'remainingCpuTime' | 'remainingIoTime' | 'state' | 'startTime' | 'completionTime' | 'waitingTime' | 'responseTime' | 'color'>) => void;
  removeProcess: (id: string) => void;
  clearProcesses: () => void;
  loadExample: () => void;
  
  // Simulation controls
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  setSpeed: (speed: SpeedOption) => void;
  
  // Comparison mode
  toggleCompareMode: () => void;
  setCompareAlgorithms: (algorithms: AlgorithmType[]) => void;
  runComparison: () => void;
  
  // Internal simulation methods
  tick: () => void;
}

// Process input type (for form)
export interface ProcessInput {
  name: string;
  arrivalTime: number;
  cpuBurstTime: number;
  ioBurstTime: number;
  priority: number;
}

// Process colors for visualization
export const PROCESS_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#EAB308', // Yellow
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

// State colors for visualization
export const STATE_COLORS: Record<ProcessState, string> = {
  new: '#94A3B8',
  ready: '#3B82F6',
  running: '#0D9488',
  waiting: '#F59E0B',
  terminated: '#22C55E',
};

// Algorithm colors for comparison charts
export const ALGORITHM_COLORS: Record<AlgorithmType, string> = {
  fcfs: '#3B82F6',
  sjf: '#8B5CF6',
  srtf: '#EC4899',
  priority: '#F97316',
  'priority-preemptive': '#EF4444',
  rr: '#10B981',
};
