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
} from './types';
import { createProcess, getExampleProcesses, calculateStatistics, getProcessStats, cloneProcessesForSimulation } from './utils';
import { executeTick, runFullSimulation } from './schedulers';

let intervalId: ReturnType<typeof setInterval> | null = null;

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
    set({ processes: [...state.processes, newProcess] });
  },

  // Remove a process
  removeProcess: (id) => {
    const state = get();
    set({ processes: state.processes.filter((p) => p.id !== id) });
  },

  // Clear all processes
  clearProcesses: () => {
    const state = get();
    if (state.playbackState === 'playing') {
      get().pause();
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
    });
  },

  // Load example processes
  loadExample: () => {
    const state = get();
    if (state.playbackState === 'playing') {
      get().pause();
    }
    
    const exampleData = getExampleProcesses();
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
    });
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
