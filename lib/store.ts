'use client';

import { create } from 'zustand';
import {
  Process,
  AlgorithmType,
  PlaybackState,
  SpeedOption,
  SchedulerState,
  SimulationResult,
  ProcessInput,
  QueueConfig,
  MLQSimulationState,
  DEFAULT_MLQ_QUEUES,
} from './types';
import { createProcess, getExampleProcesses, getMlqExampleProcesses, calculateStatistics, getProcessStats, cloneProcessesForSimulation } from './utils';
import { executeTick, runFullSimulation } from './schedulers';
import { mlqTick, createInitialMlqState } from './schedulers/mlq';
import { AnalysisResult } from './analysis/types';
import { analyzeSimulation, prepareSimulationData } from './analysis/openai';

let intervalId: ReturnType<typeof setInterval> | null = null;
let mlqIntervalId: ReturnType<typeof setInterval> | null = null;

export const useSchedulerStore = create<SchedulerState>((set, get) => ({
  // Algorithm selection
  algorithm: 'fcfs',
  timeQuantum: 2,
  agingTime: 5,

  // Process management
  processes: [],
  readyQueue: [],
  ioQueue: [],
  runningProcess: null,
  completedProcesses: [],

  // Simulation state
  currentTime: 0,
  playbackState: 'stopped',
  speed: 1,
  isSimulationComplete: false,
  currentQuantum: 0,

  // Gantt chart data
  ganttChart: [],

  // Comparison mode
  isCompareMode: false,
  compareAlgorithms: ['fcfs', 'sjf'],
  compareResults: [],

  // Analysis state
  analysisResult: null,
  isAnalyzing: false,
  analysisError: null,

  // (recommended flow removed — compare mode is now used instead)

  // ── MLQ mode state ────────────────────────────────────────────────────────
  isMlqMode: false,
  mlqQueues: DEFAULT_MLQ_QUEUES as QueueConfig[],
  mlqSimState: null as MLQSimulationState | null,
  mlqPlaybackState: 'stopped' as PlaybackState,
  mlqSpeed: 1 as SpeedOption,

  // Set algorithm
  setAlgorithm: (algorithm) => {
    const state = get();
    if (state.playbackState === 'playing') {
      get().pause();
    }
    get().reset();
    set({ algorithm });
  },

  // Set time quantum for Round Robin
  setTimeQuantum: (quantum) => {
    set({ timeQuantum: Math.max(1, quantum) });
  },

  // Set aging time for Priority Aging
  setAgingTime: (time: number) => {
    set({ agingTime: Math.max(1, time) });
  },

  // Add a new process
  addProcess: (input) => {
    const state = get();
    const newProcess = createProcess(input as ProcessInput, state.processes.length);
    set({
      processes: [...state.processes, newProcess],
      // Clear analysis when processes change
      analysisResult: null,
      analysisError: null,
    });
  },

  // Remove a process
  removeProcess: (id) => {
    const state = get();
    set({
      processes: state.processes.filter((p) => p.id !== id),
      // Clear analysis when processes change
      analysisResult: null,
      analysisError: null,
    });
  },

  // Clear all processes
  clearProcesses: () => {
    const state = get();
    if (state.playbackState === 'playing') {
      get().pause();
    }
    if (state.mlqPlaybackState === 'playing') {
      get().mlqPause();
    }
    set({
      processes: [],
      readyQueue: [],
      ioQueue: [],
      runningProcess: null,
      completedProcesses: [],
      currentTime: 0,
      playbackState: 'stopped',
      isSimulationComplete: false,
      ganttChart: [],
      currentQuantum: 0,
      compareResults: [],
      mlqSimState: null,
      mlqPlaybackState: 'stopped',
      // Clear analysis
      analysisResult: null,
      analysisError: null,
    });
  },

  // Load example processes
  loadExample: () => {
    const state = get();
    if (state.playbackState === 'playing') {
      get().pause();
    }
    if (state.mlqPlaybackState === 'playing') {
      get().mlqPause();
    }

    const exampleData = state.isMlqMode ? getMlqExampleProcesses() : getExampleProcesses();
    const newProcesses = exampleData.map((data, index) => createProcess(data, index));

    set({
      processes: newProcesses,
      readyQueue: [],
      ioQueue: [],
      runningProcess: null,
      completedProcesses: [],
      currentTime: 0,
      playbackState: 'stopped',
      isSimulationComplete: false,
      ganttChart: [],
      currentQuantum: 0,
      compareResults: [],
      mlqSimState: null,
      mlqPlaybackState: 'stopped',
      // Clear analysis when loading example
      analysisResult: null,
      analysisError: null,
    });
  },


  // Play simulation
  play: () => {
    const state = get();
    if (state.isSimulationComplete || state.processes.length === 0) return;

    set({ playbackState: 'playing' });

    const baseInterval = 1000;
    const interval = baseInterval / state.speed;

    intervalId = setInterval(() => {
      get().tick();
    }, interval);
  },

  // Pause simulation
  pause: () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    set({ playbackState: 'paused' });
  },

  // Step through one tick
  step: () => {
    const state = get();
    if (state.isSimulationComplete) return;
    if (state.playbackState === 'playing') {
      get().pause();
    }
    get().tick();
  },

  // Reset simulation
  reset: () => {
    const state = get();
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    // Reset all processes to initial state
    const resetProcesses = state.processes.map((p) => ({
      ...p,
      remainingCpuTime: p.cpuBurstTime,
      remainingIoTime: p.ioBurstTime,
      state: 'new' as const,
      startTime: null,
      completionTime: null,
      waitingTime: 0,
      responseTime: null,
    }));

    set({
      processes: resetProcesses,
      readyQueue: [],
      ioQueue: [],
      runningProcess: null,
      completedProcesses: [],
      currentTime: 0,
      playbackState: 'stopped',
      isSimulationComplete: false,
      ganttChart: [],
      currentQuantum: 0,
      // Clear analysis on reset
      analysisResult: null,
      analysisError: null,
    });
    // Also reset MLQ state if in MLQ mode
    if (state.isMlqMode) {
      get().mlqReset();
    }
  },


  // Set playback speed
  setSpeed: (speed) => {
    const state = get();
    set({ speed });

    if (state.playbackState === 'playing') {
      if (intervalId) {
        clearInterval(intervalId);
      }

      const baseInterval = 1000;
      const interval = baseInterval / speed;

      intervalId = setInterval(() => {
        get().tick();
      }, interval);
    }
  },

  // Toggle comparison mode
  toggleCompareMode: () => {
    const state = get();
    if (state.playbackState === 'playing') {
      get().pause();
    }
    get().reset();
    set({
      isCompareMode: !state.isCompareMode,
      compareResults: [],
    });
  },

  // Set algorithms to compare
  setCompareAlgorithms: (algorithms) => {
    set({ compareAlgorithms: algorithms });
  },

  // Run comparison for all selected algorithms
  runComparison: () => {
    const state = get();
    if (state.processes.length === 0) return;

    const results: SimulationResult[] = [];

    for (const algorithm of state.compareAlgorithms) {
      const clonedProcesses = cloneProcessesForSimulation(state.processes);
      const finalState = runFullSimulation(clonedProcesses, algorithm, state.timeQuantum, state.agingTime);

      const stats = calculateStatistics(
        finalState.processes,
        finalState.currentTime,
        finalState.ganttChart
      );

      results.push({
        algorithm,
        ganttChart: finalState.ganttChart,
        statistics: stats,
        processStats: getProcessStats(finalState.processes),
        totalTime: finalState.currentTime,
      });
    }

    set({ compareResults: results });
  },

  // Run AI analysis on completed simulation
  runAnalysis: async () => {
    const state = get();

    // Guard: Don't run if already analyzing (prevents concurrent calls)
    if (state.isAnalyzing) {
      return;
    }

    // Guard: Simulation must be complete with processes
    // Don't set error here - this can happen if user resets during auto-analysis delay
    if (!state.isSimulationComplete || state.processes.length === 0) {
      return;
    }

    // Don't check for API key upfront - let analyzeSimulation try env key first
    set({ isAnalyzing: true, analysisError: null, analysisResult: null });

    try {
      const stats = calculateStatistics(state.processes, state.currentTime, state.ganttChart);

      const simulationData = prepareSimulationData(
        state.algorithm,
        state.processes.map(p => ({
          name: p.name,
          arrivalTime: p.arrivalTime,
          cpuBurstTime: p.cpuBurstTime,
          ioBurstTime: p.ioBurstTime,
          priority: p.priority,
          queueLevel: p.queueLevel,
          completionTime: p.completionTime,
          waitingTime: p.waitingTime,
          responseTime: p.responseTime,
        })),
        state.ganttChart,
        stats,
        state.algorithm === 'rr' ? state.timeQuantum : undefined
      );

      const result = await analyzeSimulation(simulationData);
      set({ analysisResult: result, isAnalyzing: false });
    } catch (error) {
      set({
        analysisError: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
        isAnalyzing: false,
      });
    }
  },

  // Clear analysis results
  clearAnalysis: () => {
    set({ analysisResult: null, analysisError: null });
  },

  // Compare current algorithm against AI-suggested alternatives in Compare Mode
  compareWithAlternatives: (alternatives: AlgorithmType[]) => {
    const state = get();
    const currentAlgo = state.algorithm;
    const deduped = [currentAlgo, ...Array.from(new Set(alternatives.filter(a => a !== currentAlgo)))] as AlgorithmType[];
    set({
      isCompareMode: true,
      compareAlgorithms: deduped,
    });
    // Run immediately so user lands on results, not an empty page
    get().runComparison();
  },

  // ── MLQ Mode Actions ──────────────────────────────────────────────────────



  // Enter/exit MLQ mode
  toggleMlqMode: () => {
    const state = get();
    // Stop any running single-algo sim
    if (state.playbackState === 'playing') get().pause();
    // Stop any running MLQ sim
    if (state.mlqPlaybackState === 'playing') get().mlqPause();

    const entering = !state.isMlqMode;
    set({
      isMlqMode: entering,
      algorithm: entering ? 'mlq' : 'fcfs',
      // Reset single-algo simulation state
      readyQueue: [],
      ioQueue: [],
      runningProcess: null,
      completedProcesses: [],
      currentTime: 0,
      playbackState: 'stopped',
      isSimulationComplete: false,
      ganttChart: [],
      currentQuantum: 0,
      compareResults: [],
      // Reset MLQ simulation
      mlqSimState: null,
      mlqPlaybackState: 'stopped',
      // Keep processes but reset their state
      processes: state.processes.map((p) => ({
        ...p,
        remainingCpuTime: p.cpuBurstTime,
        remainingIoTime: p.ioBurstTime,
        state: 'new' as const,
        startTime: null,
        completionTime: null,
        waitingTime: 0,
        responseTime: null,
      })),
      analysisResult: null,
      analysisError: null,
    });
  },

  // Update a specific queue's configuration
  updateQueueConfig: (queueId: 0 | 1 | 2 | 3, patch: Partial<QueueConfig>) => {
    const state = get();
    const newQueues = state.mlqQueues.map((q) =>
      q.id === queueId ? { ...q, ...patch } : q
    ) as QueueConfig[];
    set({ mlqQueues: newQueues });
  },

  // MLQ play
  mlqPlay: () => {
    const state = get();
    if (state.processes.length === 0) return;

    // Build initial state if not started yet
    let simState = state.mlqSimState;
    if (!simState) {
      simState = createInitialMlqState(state.processes);
    }
    if (simState.isComplete) return;

    set({ mlqPlaybackState: 'playing', mlqSimState: simState });

    const baseInterval = 1000;
    const interval = baseInterval / state.mlqSpeed;
    mlqIntervalId = setInterval(() => {
      get().mlqTick();
    }, interval);
  },

  // MLQ pause
  mlqPause: () => {
    if (mlqIntervalId) {
      clearInterval(mlqIntervalId);
      mlqIntervalId = null;
    }
    set({ mlqPlaybackState: 'paused' });
  },

  // MLQ step (single tick)
  mlqStep: () => {
    const state = get();
    if (state.mlqPlaybackState === 'playing') get().mlqPause();
    let simState = state.mlqSimState;
    if (!simState) {
      simState = createInitialMlqState(state.processes);
      set({ mlqSimState: simState });
    }
    if (simState.isComplete) return;
    get().mlqTick();
  },

  // MLQ reset
  mlqReset: () => {
    if (mlqIntervalId) {
      clearInterval(mlqIntervalId);
      mlqIntervalId = null;
    }
    const state = get();
    set({
      // Clear MLQ simulation state
      mlqSimState: null,
      mlqPlaybackState: 'stopped',
      // Clear all top-level fields that mlqTick syncs, so UI resets immediately
      runningProcess: null,
      currentTime: 0,
      ganttChart: [],
      completedProcesses: [],
      isSimulationComplete: false,
      // Restore each process to its initial 'new' state (same as toggleMlqMode does)
      processes: state.processes.map((p) => ({
        ...p,
        remainingCpuTime: p.cpuBurstTime,
        remainingIoTime: p.ioBurstTime,
        state: 'new' as const,
        startTime: null,
        completionTime: null,
        waitingTime: 0,
        responseTime: null,
      })),
    });
  },


  // MLQ set speed
  mlqSetSpeed: (speed: SpeedOption) => {
    const state = get();
    set({ mlqSpeed: speed });
    if (state.mlqPlaybackState === 'playing') {
      if (mlqIntervalId) clearInterval(mlqIntervalId);
      const interval = 1000 / speed;
      mlqIntervalId = setInterval(() => {
        get().mlqTick();
      }, interval);
    }
  },

  // Internal MLQ tick
  mlqTick: () => {
    const state = get();
    const simState = state.mlqSimState;
    if (!simState || simState.isComplete) return;

    const newState = mlqTick(simState, state.mlqQueues);

    if (newState.isComplete) {
      if (mlqIntervalId) {
        clearInterval(mlqIntervalId);
        mlqIntervalId = null;
      }
      set({
        mlqSimState: newState,
        mlqPlaybackState: 'stopped',
        isSimulationComplete: true,
        currentTime: newState.currentTime,
        processes: newState.processes,
        ganttChart: newState.ganttChart,
        runningProcess: newState.runningProcess,
        completedProcesses: newState.completedProcesses,
      });
      return;
    }

    set({
      mlqSimState: newState,
      // Sync top-level state for components that read from root (CPUCore, header clock, etc.)
      currentTime: newState.currentTime,
      processes: newState.processes,
      ganttChart: newState.ganttChart,
      runningProcess: newState.runningProcess,
      completedProcesses: newState.completedProcesses,
    });
  },

  // Main simulation tick
  tick: () => {
    const state = get();

    const simulationState = {
      processes: state.processes,
      readyQueue: state.readyQueue,
      ioQueue: state.ioQueue,
      runningProcess: state.runningProcess,
      completedProcesses: state.completedProcesses,
      currentTime: state.currentTime,
      ganttChart: state.ganttChart,
      isComplete: state.isSimulationComplete,
      currentQuantum: state.currentQuantum,
    };

    const newState = executeTick(simulationState, state.algorithm, state.timeQuantum, state.agingTime);

    if (newState.isComplete) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      set({
        processes: newState.processes,
        readyQueue: newState.readyQueue,
        ioQueue: newState.ioQueue,
        runningProcess: newState.runningProcess,
        completedProcesses: newState.completedProcesses,
        currentTime: newState.currentTime,
        ganttChart: newState.ganttChart,
        isSimulationComplete: true,
        playbackState: 'stopped',
        currentQuantum: newState.currentQuantum,
      });

      // Automatically run AI analysis after simulation completes
      // Use setTimeout to ensure state is fully updated before analysis starts
      setTimeout(() => {
        get().runAnalysis();
      }, 100);

      return;
    }

    set({
      processes: newState.processes,
      readyQueue: newState.readyQueue,
      ioQueue: newState.ioQueue,
      runningProcess: newState.runningProcess,
      completedProcesses: newState.completedProcesses,
      currentTime: newState.currentTime,
      ganttChart: newState.ganttChart,
      currentQuantum: newState.currentQuantum,
    });
  },
}));
