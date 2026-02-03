import { AlgorithmType } from '../types';

// Types of flaws that can be detected in scheduling algorithms
export type FlawType = 
  | 'convoy'           // Long process blocks shorter ones (FCFS)
  | 'starvation'       // Process waits indefinitely (SJF/Priority)
  | 'context_switches' // Too many preemptions (RR)
  | 'high_waiting'     // Process waits too long
  | 'priority_issue'   // Priority inversion or unfairness
  | 'quantum_inefficiency'; // RR quantum too small/large

// Severity levels for detected flaws
export type FlawSeverity = 'low' | 'medium' | 'high';

// A single detected flaw
export interface FlawDetection {
  type: FlawType;
  severity: FlawSeverity;
  affectedProcesses: string[]; // Process names (P1, P2, etc.)
  description: string;
  explanation: string; // Detailed explanation of why this is a problem
  recommendation: string;
  betterAlgorithms: AlgorithmType[]; // Algorithms that would handle this better
}

// Complete analysis result from LLM
export interface AnalysisResult {
  algorithm: AlgorithmType;
  algorithmName: string;
  flaws: FlawDetection[];
  overallAssessment: string;
  strengths: string[]; // What the algorithm did well
  recommendations: string[];
  bestAlternative?: {
    algorithm: AlgorithmType;
    reason: string;
  };
}

// Analysis state in the store
export interface AnalysisState {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  hasApiKey: boolean;
}

// Data sent to LLM for analysis
export interface SimulationDataForAnalysis {
  algorithm: AlgorithmType;
  algorithmName: string;
  timeQuantum?: number; // Only for RR
  processes: {
    name: string;
    arrivalTime: number;
    cpuBurstTime: number;
    ioBurstTime: number;
    priority: number;
    completionTime: number | null;
    waitingTime: number;
    turnaroundTime: number;
    responseTime: number | null;
  }[];
  ganttSummary: {
    processName: string;
    startTime: number;
    endTime: number;
    wasPreempted: boolean;
  }[];
  statistics: {
    avgWaitingTime: number;
    avgTurnaroundTime: number;
    avgResponseTime: number;
    cpuUtilization: number;
    totalTime: number;
    contextSwitches: number;
  };
}

// Flaw type metadata for UI display
export const FLAW_TYPE_INFO: Record<FlawType, { label: string; icon: string; color: string }> = {
  convoy: {
    label: 'Convoy Effect',
    icon: '🚛',
    color: 'red',
  },
  starvation: {
    label: 'Starvation',
    icon: '⏳',
    color: 'orange',
  },
  context_switches: {
    label: 'Excessive Context Switches',
    icon: '🔄',
    color: 'yellow',
  },
  high_waiting: {
    label: 'High Waiting Time',
    icon: '⏰',
    color: 'amber',
  },
  priority_issue: {
    label: 'Priority Issue',
    icon: '⚖️',
    color: 'purple',
  },
  quantum_inefficiency: {
    label: 'Quantum Inefficiency',
    icon: '📊',
    color: 'blue',
  },
};

// Severity metadata for UI display
export const SEVERITY_INFO: Record<FlawSeverity, { label: string; bgColor: string; textColor: string }> = {
  low: {
    label: 'Low',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
  },
  medium: {
    label: 'Medium',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  high: {
    label: 'High',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
};
