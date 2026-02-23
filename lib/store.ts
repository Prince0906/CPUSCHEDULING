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
  MLFQSimulationState,
  MLFQQueueConfig,
  DEFAULT_MLFQ_QUEUES,
} from './types';
import { createProcess, getExampleProcesses, getMlqExampleProcesses, getMlfqExampleProcesses, calculateStatistics, getProcessStats, cloneProcessesForSimulation } from './utils';
import { executeTick, runFullSimulation } from './schedulers';
import { mlqTick, createInitialMlqState } from './schedulers/mlq';
import { mlfqTick, createInitialMlfqState } from './schedulers/mlfq';
import { AnalysisResult } from './analysis/types';
import { analyzeSimulation, prepareSimulationData } from './analysis/openai';

let intervalId: ReturnType<typeof setInterval> | null = null;
let mlqIntervalId: ReturnType<typeof setInterval> | null = null;
let mlfqIntervalId: ReturnType<typeof setInterval> | null = null;

export const useSchedulerStore = create<SchedulerState>((set, get) => ({
  // Algorithm selection
  algorithm: 'fcfs',
  timeQuantum: 2,

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

  // Recommended algorithm comparison
  recommendedResult: null,
  isRunningRecommended: false,

  // ── MLQ mode state ────────────────────────────────────────────────────────
  isMlqMode: false,
  mlqQueues: DEFAULT_MLQ_QUEUES as QueueConfig[],
  mlqSimState: null as MLQSimulationState | null,
  mlqPlaybackState: 'stopped' as PlaybackState,
  mlqSpeed: 1 as SpeedOption,

  // ── MLFQ mode state ───────────────────────────────────────────────────────
  isMlfqMode: false,
  mlfqQueues: DEFAULT_MLFQ_QUEUES as MLFQQueueConfig[],
  mlfqSimState: null as MLFQSimulationState | null,
  mlfqPlaybackState: 'stopped' as PlaybackState,
  mlfqSpeed: 1 as SpeedOption,
  boostTimerLimit: 20,

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

  // Add a new process
  addProcess: (input) => {
    const state = get();
    const newProcess = createProcess(input as ProcessInput, state.processes.length);
    set({
      processes: [...state.processes, newProcess],
      // Clear analysis when processes change
      analysisResult: null,
      analysisError: null,
      recommendedResult: null,
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
      recommendedResult: null,
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
    if (state.mlfqPlaybackState === 'playing') {
      get().mlfqPause();
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
      mlfqSimState: null,
      mlfqPlaybackState: 'stopped',
      // Clear analysis
      analysisResult: null,
      analysisError: null,
      recommendedResult: null,
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
    if (state.mlfqPlaybackState === 'playing') {
      get().mlfqPause();
    }

    let exampleData = getExampleProcesses();
    if (state.isMlqMode) {
      exampleData = getMlqExampleProcesses();
    } else if (state.isMlfqMode) {
      exampleData = getMlfqExampleProcesses();
    }
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
      mlfqSimState: null,
      mlfqPlaybackState: 'stopped',
      // Clear analysis when loading example
      analysisResult: null,
      analysisError: null,
      recommendedResult: null,
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
      cpuTimeUsedInCurrentQueue: 0,
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
      // Clear analysis on reset (keep mlqSimState reset separate)
      analysisResult: null,
      analysisError: null,
      recommendedResult: null,
    });
    // Also reset MLQ state if in MLQ mode
    if (state.isMlqMode) {
      get().mlqReset();
    }
    // Also reset MLFQ state if in MLFQ mode
    if (state.isMlfqMode) {
      get().mlfqReset();
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
      const finalState = runFullSimulation(clonedProcesses, algorithm, state.timeQuantum);

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

      // Auto-run recommended algorithm for comparison if available
      if (result.bestAlternative && result.bestAlternative.algorithm !== state.algorithm) {
        // Small delay to let UI update first
        setTimeout(() => {
          get().runRecommendedAlgorithm();
        }, 50);
      }
    } catch (error) {
      set({
        analysisError: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
        isAnalyzing: false,
      });
    }
  },

  // Clear analysis results
  clearAnalysis: () => {
    set({ analysisResult: null, analysisError: null, recommendedResult: null });
  },

  // Run recommended algorithm simulation for comparison
  runRecommendedAlgorithm: () => {
    const state = get();

    // Need analysis result with a best alternative
    if (!state.analysisResult?.bestAlternative) {
      return;
    }

    const recommendedAlgo = state.analysisResult.bestAlternative.algorithm;

    // Don't run if same as current algorithm
    if (recommendedAlgo === state.algorithm) {
      return;
    }

    set({ isRunningRecommended: true });

    // Clone processes and run full simulation with recommended algorithm
    const clonedProcesses = cloneProcessesForSimulation(state.processes);
    const finalState = runFullSimulation(clonedProcesses, recommendedAlgo, state.timeQuantum);

    const stats = calculateStatistics(
      finalState.processes,
      finalState.currentTime,
      finalState.ganttChart
    );

    const result: SimulationResult = {
      algorithm: recommendedAlgo,
      ganttChart: finalState.ganttChart,
      statistics: stats,
      processStats: getProcessStats(finalState.processes),
      totalTime: finalState.currentTime,
    };

    set({ recommendedResult: result, isRunningRecommended: false });
  },

  // Switch to the recommended algorithm and reset simulation
  switchToRecommendedAlgorithm: () => {
    const state = get();

    if (!state.analysisResult?.bestAlternative) {
      return;
    }

    const recommendedAlgo = state.analysisResult.bestAlternative.algorithm;

    // Clear analysis and recommended results
    set({
      analysisResult: null,
      analysisError: null,
      recommendedResult: null,
    });

    // Set the new algorithm and reset
    get().setAlgorithm(recommendedAlgo);
  },

  // ── MLQ Mode Actions ──────────────────────────────────────────────────────

  // Enter/exit MLQ mode
  toggleMlqMode: () => {
    const state = get();
    // Stop any running single-algo sim
    if (state.playbackState === 'playing') get().pause();
    // Stop any running MLQ sim
    if (state.mlqPlaybackState === 'playing') get().mlqPause();
    if (state.mlfqPlaybackState === 'playing') get().mlfqPause();

    const entering = !state.isMlqMode;
    const newMlfqMode = entering ? false : state.isMlfqMode;
    set({
      isMlqMode: entering,
      isMlfqMode: newMlfqMode,
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
      // Reset MLQ & MLFQ simulation
      mlqSimState: null,
      mlqPlaybackState: 'stopped',
      mlfqSimState: null,
      mlfqPlaybackState: 'stopped',
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
        cpuTimeUsedInCurrentQueue: 0,
      })),
      analysisResult: null,
      analysisError: null,
      recommendedResult: null,
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
        cpuTimeUsedInCurrentQueue: 0,
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

  // ── MLFQ Mode Actions ─────────────────────────────────────────────────────

  toggleMlfqMode: () => {
    const state = get();
    if (state.playbackState === 'playing') get().pause();
    if (state.mlqPlaybackState === 'playing') get().mlqPause();
    if (state.mlfqPlaybackState === 'playing') get().mlfqPause();

    const entering = !state.isMlfqMode;
    const newMlqMode = entering ? false : state.isMlqMode;

    set({
      isMlfqMode: entering,
      isMlqMode: newMlqMode,
      algorithm: entering ? 'mlfq' : 'fcfs',
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
      // Reset MLQ & MLFQ simulation
      mlqSimState: null,
      mlqPlaybackState: 'stopped',
      mlfqSimState: null,
      mlfqPlaybackState: 'stopped',
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
        cpuTimeUsedInCurrentQueue: 0,
      })),
      analysisResult: null,
      analysisError: null,
      recommendedResult: null,
    });
  },

  updateMlfqQueueConfig: (queueId: 0 | 1 | 2, patch: Partial<MLFQQueueConfig>) => {
    const state = get();
    const newQueues = state.mlfqQueues.map((q) =>
      q.id === queueId ? { ...q, ...patch } : q
    ) as MLFQQueueConfig[];
    set({ mlfqQueues: newQueues });
  },

  setBoostTimerLimit: (limit: number) => {
    set({ boostTimerLimit: Math.max(1, limit) });
  },

  mlfqPlay: () => {
    const state = get();
    if (state.processes.length === 0) return;

    let simState = state.mlfqSimState;
    if (!simState) {
      simState = createInitialMlfqState(state.processes, state.boostTimerLimit);
    }
    if (simState.isComplete) return;

    set({ mlfqPlaybackState: 'playing', mlfqSimState: simState });

    const baseInterval = 1000;
    const interval = baseInterval / state.mlfqSpeed;
    mlfqIntervalId = setInterval(() => {
      get().mlfqTick();
    }, interval);
  },

  mlfqPause: () => {
    if (mlfqIntervalId) {
      clearInterval(mlfqIntervalId);
      mlfqIntervalId = null;
    }
    set({ mlfqPlaybackState: 'paused' });
  },

  mlfqStep: () => {
    const state = get();
    if (state.mlfqPlaybackState === 'playing') get().mlfqPause();
    let simState = state.mlfqSimState;
    if (!simState) {
      simState = createInitialMlfqState(state.processes, state.boostTimerLimit);
      set({ mlfqSimState: simState });
    }
    if (simState.isComplete) return;
    get().mlfqTick();
  },

  mlfqReset: () => {
    if (mlfqIntervalId) {
      clearInterval(mlfqIntervalId);
      mlfqIntervalId = null;
    }
    const state = get();
    set({
      mlfqSimState: null,
      mlfqPlaybackState: 'stopped',
      runningProcess: null,
      currentTime: 0,
      ganttChart: [],
      completedProcesses: [],
      isSimulationComplete: false,
      processes: state.processes.map((p) => ({
        ...p,
        remainingCpuTime: p.cpuBurstTime,
        remainingIoTime: p.ioBurstTime,
        state: 'new' as const,
        startTime: null,
        completionTime: null,
        waitingTime: 0,
        responseTime: null,
        cpuTimeUsedInCurrentQueue: 0,
      })),
    });
  },

  mlfqSetSpeed: (speed: SpeedOption) => {
    const state = get();
    set({ mlfqSpeed: speed });
    if (state.mlfqPlaybackState === 'playing') {
      if (mlfqIntervalId) clearInterval(mlfqIntervalId);
      const interval = 1000 / speed;
      mlfqIntervalId = setInterval(() => {
        get().mlfqTick();
      }, interval);
    }
  },

  mlfqTick: () => {
    const state = get();
    const simState = state.mlfqSimState;
    if (!simState || simState.isComplete) return;

    const newState = mlfqTick(simState, state.mlfqQueues, state.boostTimerLimit);

    if (newState.isComplete) {
      if (mlfqIntervalId) {
        clearInterval(mlfqIntervalId);
        mlfqIntervalId = null;
      }
      set({
        mlfqSimState: newState,
        mlfqPlaybackState: 'stopped',
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
      mlfqSimState: newState,
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

    const newState = executeTick(simulationState, state.algorithm, state.timeQuantum);

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
