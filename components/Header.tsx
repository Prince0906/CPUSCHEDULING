'use client';

import { Cpu } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';
import { ALGORITHMS, AlgorithmType } from '@/lib/types';

const algorithms: AlgorithmType[] = ['fcfs', 'sjf', 'srtf', 'priority', 'priority-preemptive', 'priority-aging', 'rr'];

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

  // Clicking a regular algorithm: auto-exit Compare, MLQ, or MLFQ if active, then switch.
  const handleAlgorithmClick = (algo: AlgorithmType) => {
    if (isRunning) return;
    if (isCompareMode) {
      toggleCompareMode();
      setTimeout(() => setAlgorithm(algo), 0);
    } else if (isMlqMode) {
      toggleMlqMode();
      setTimeout(() => setAlgorithm(algo), 0);
    } else if (isMlfqMode) {
      toggleMlfqMode();
      setTimeout(() => setAlgorithm(algo), 0);
    } else {
      setAlgorithm(algo);
    }
  };

  // Clicking Compare: auto-exit MLQ or MLFQ if active, then enter Compare Mode.
  const handleCompareClick = () => {
    if (isRunning) return;
    if (isMlqMode) {
      toggleMlqMode();
      setTimeout(() => toggleCompareMode(), 0);
    } else if (isMlfqMode) {
      toggleMlfqMode();
      setTimeout(() => toggleCompareMode(), 0);
    } else {
      toggleCompareMode();
    }
  };

  const handleMlqClick = () => {
    if (isRunning) return;
    if (isCompareMode) {
      toggleCompareMode();
      setTimeout(() => toggleMlqMode(), 0);
    } else if (isMlfqMode) {
      toggleMlfqMode();
      setTimeout(() => toggleMlqMode(), 0);
    } else {
      toggleMlqMode();
    }
  };

  const handleMlfqClick = () => {
    if (isRunning) return;
    if (isCompareMode) {
      toggleCompareMode();
      setTimeout(() => toggleMlfqMode(), 0);
    } else if (isMlqMode) {
      toggleMlqMode();
      setTimeout(() => toggleMlfqMode(), 0);
    } else {
      toggleMlfqMode();
    }
  };


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

          {/* Algorithm Tabs — center nav */}
          <nav className="hidden md:flex items-center gap-1">
            {algorithms.map((algo) => {
              const info = ALGORITHMS[algo];
              const isSelected = algorithm === algo && !isCompareMode && !isMlqMode && !isMlfqMode;

              return (
                <button
                  key={algo}
                  onClick={() => handleAlgorithmClick(algo)}
                  disabled={isRunning}
                  className={`px-3 py-2 text-sm font-medium transition-colors relative ${isSelected ? 'text-sky-600' : 'text-gray-500 hover:text-gray-900'
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {info.shortName}
                  {isSelected && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-sky-500 rounded-full" />
                  )}
                </button>
              );
            })}

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* MLQ tab */}
            <button
              onClick={() => !isRunning && toggleMlqMode()}
              disabled={isRunning}
              className={`px-3 py-2 text-sm font-medium transition-colors relative ${isMlqMode ? 'text-violet-600' : 'text-gray-500 hover:text-gray-900'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              MLQ
              {isMlqMode && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-violet-500 rounded-full" />
              )}
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* MLFQ tab — teal accent, toggles isMlfqMode */}
            <button
              onClick={handleMlfqClick}
              disabled={isRunning}
              className={`px-3 py-2 text-sm font-medium transition-colors relative ${isMlfqMode
                ? 'text-teal-600'
                : 'text-gray-500 hover:text-gray-900'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              MLFQ
              {isMlfqMode && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-teal-500 rounded-full" />
              )}
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
              onClick={handleCompareClick}
              disabled={isRunning}
              className={`px-3 py-2 text-sm font-medium transition-colors ${isCompareMode ? 'text-sky-600' : 'text-gray-500 hover:text-gray-900'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Compare
            </button>
          </nav>

          {/* Clock — always on the right, hidden in Compare Mode */}
          {!isCompareMode ? (
            <div className="flex items-center gap-4">
              {(playbackState === 'playing' || mlqPlaybackState === 'playing' || mlfqPlaybackState === 'playing') && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle" />
              )}
              <div className="font-mono text-lg font-medium text-gray-900 tabular-nums">
                {currentTime}<span className="text-gray-400 text-sm ml-0.5">ms</span>
              </div>
            </div>
          ) : (
            // Keep the right side width-consistent so nav stays centered
            <div className="w-[72px]" />
          )}
        </div>
      </div>
    </header>
  );
}
