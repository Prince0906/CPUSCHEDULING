'use client';

import { Cpu } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';
import { ALGORITHMS, AlgorithmType } from '@/lib/types';

const algorithms: AlgorithmType[] = ['fcfs', 'sjf', 'srtf', 'priority', 'priority-preemptive', 'rr'];

export default function Header() {
  const {
    currentTime,
    algorithm,
    setAlgorithm,
    isCompareMode,
    toggleCompareMode,
    playbackState,
    isMlqMode,
    toggleMlqMode,
    mlqPlaybackState,
    isMlfqMode,
    toggleMlfqMode,
    mlfqPlaybackState,
  } = useSchedulerStore();

  const isRunning = playbackState !== 'stopped' || mlqPlaybackState !== 'stopped' || mlfqPlaybackState !== 'stopped';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              CPU Scheduler
            </span>
          </div>

          {/* Algorithm Tabs - Clean underline style */}
          <nav className="hidden md:flex items-center gap-1">
            {algorithms.map((algo) => {
              const info = ALGORITHMS[algo];
              const isSelected = algorithm === algo && !isCompareMode && !isMlqMode && !isMlfqMode;

              return (
                <button
                  key={algo}
                  onClick={() => !isRunning && !isCompareMode && !isMlqMode && !isMlfqMode && setAlgorithm(algo)}
                  disabled={isRunning || isCompareMode || isMlqMode || isMlfqMode}
                  className={`px-3 py-2 text-sm font-medium transition-colors relative ${isSelected
                    ? 'text-sky-600'
                    : 'text-gray-500 hover:text-gray-900'
                    } ${isRunning || isCompareMode || isMlqMode || isMlfqMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {info.shortName}
                  {isSelected && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-sky-500 rounded-full" />
                  )}
                </button>
              );
            })}

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* MLQ tab — violet accent, toggles isMlqMode */}
            <button
              onClick={() => !isRunning && toggleMlqMode()}
              disabled={isRunning || isCompareMode}
              className={`px-3 py-2 text-sm font-medium transition-colors relative ${isMlqMode
                ? 'text-violet-600'
                : 'text-gray-500 hover:text-gray-900'
                } ${isRunning || isCompareMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              MLQ
              {isMlqMode && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-violet-500 rounded-full" />
              )}
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* MLFQ tab — teal accent, toggles isMlfqMode */}
            <button
              onClick={() => !isRunning && toggleMlfqMode()}
              disabled={isRunning || isCompareMode}
              className={`px-3 py-2 text-sm font-medium transition-colors relative ${isMlfqMode
                ? 'text-teal-600'
                : 'text-gray-500 hover:text-gray-900'
                } ${isRunning || isCompareMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              MLFQ
              {isMlfqMode && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-teal-500 rounded-full" />
              )}
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
              onClick={() => !isRunning && !isMlqMode && !isMlfqMode && toggleCompareMode()}
              disabled={isRunning || isMlqMode || isMlfqMode}
              className={`px-3 py-2 text-sm font-medium transition-colors ${isCompareMode
                ? 'text-sky-600'
                : 'text-gray-500 hover:text-gray-900'
                } ${isRunning || isMlqMode || isMlfqMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Compare
            </button>
          </nav>

          {/* Clock - Simple */}
          {!isCompareMode && (
            <div className="flex items-center gap-4">
              {playbackState === 'playing' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle" />
              )}
              <div className="font-mono text-lg font-medium text-gray-900 tabular-nums">
                {currentTime}<span className="text-gray-400 text-sm ml-0.5">ms</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
