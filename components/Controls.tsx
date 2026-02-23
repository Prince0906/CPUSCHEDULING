'use client';

import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';
import { SpeedOption } from '@/lib/types';

const speeds: SpeedOption[] = [0.5, 1, 2, 4];

export default function Controls() {
  const {
    playbackState,
    speed,
    isSimulationComplete,
    processes,
    algorithm,
    timeQuantum,
    setTimeQuantum,
    agingTime,
    setAgingTime,
    play,
    pause,
    step,
    reset,
    setSpeed
  } = useSchedulerStore();

  const hasProcesses = processes.length > 0;
  const isPlaying = playbackState === 'playing';
  const canPlay = hasProcesses && !isSimulationComplete;
  const isRoundRobin = algorithm === 'rr';
  const isPriorityAging = algorithm === 'priority-aging';

  return (
    <div className="card">
      <div className="p-4 flex items-center justify-between gap-6">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isPlaying ? pause : play}
            disabled={!canPlay}
            className={`btn w-12 h-12 rounded-xl ${isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : canPlay
                ? 'btn-primary'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </motion.button>

          <button
            onClick={step}
            disabled={!canPlay || isPlaying}
            className="btn btn-secondary w-12 h-12 rounded-xl"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={reset}
            disabled={!hasProcesses}
            className="btn btn-secondary w-12 h-12 rounded-xl"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Speed</span>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${speed === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Time quantum for RR */}
        {isRoundRobin && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Quantum</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="10"
                value={timeQuantum}
                onChange={(e) => setTimeQuantum(parseInt(e.target.value))}
                disabled={playbackState !== 'stopped'}
                className={`w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500 ${playbackState !== 'stopped' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              />
              <span className="text-sm font-medium text-gray-700 w-8">{timeQuantum}ms</span>
            </div>
          </div>
        )}

        {/* Aging time for Priority Aging */}
        {isPriorityAging && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Aging&nbsp;Interval</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="20"
                value={agingTime}
                onChange={(e) => setAgingTime(parseInt(e.target.value))}
                disabled={playbackState !== 'stopped'}
                className={`w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500 ${playbackState !== 'stopped' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              />
              <input
                type="number"
                min="1"
                max="99"
                value={agingTime}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v >= 1) setAgingTime(v);
                }}
                disabled={playbackState !== 'stopped'}
                className={`w-14 px-2 py-1 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 ${playbackState !== 'stopped' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              />
              <span className="text-xs text-gray-400">ms</span>
            </div>
          </div>
        )}

        {/* Status */}
        {isSimulationComplete && (
          <span className="text-sm font-medium text-emerald-600">Complete</span>
        )}
      </div>
    </div>
  );
}

