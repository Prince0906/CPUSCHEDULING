'use client';

import { useSchedulerStore } from '@/lib/store';
import Header from '@/components/Header';
import ProcessForm from '@/components/ProcessForm';
import CPUCore from '@/components/CPUCore';
import ReadyQueue from '@/components/ReadyQueue';
import IOQueue from '@/components/IOQueue';
import CompletedProcesses from '@/components/CompletedProcesses';
import GanttChart from '@/components/GanttChart';
import Controls from '@/components/Controls';
import ProcessTable from '@/components/ProcessTable';
import Statistics from '@/components/Statistics';
import AlgorithmInfo from '@/components/AlgorithmInfo';
import CompareMode from '@/components/CompareMode';
import FlawAnalysis from '@/components/FlawAnalysis';
import MLQConfig from '@/components/MLQConfig';
import MLQDashboard from '@/components/MLQDashboard';
import AgingPanel from '@/components/AgingPanel';
import MLFQDashboard from '@/components/MLFQDashboard';
import MLFQConfig from '@/components/MLFQConfig';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { SpeedOption } from '@/lib/types';

const SPEEDS: SpeedOption[] = [0.5, 1, 2, 4];

export default function Home() {
  const {
    isCompareMode,
    isMlqMode,
    algorithm,
    mlqPlaybackState,
    mlqPlay,
    mlqPause,
    mlqStep,
    mlqReset,
    mlqSpeed,
    mlqSetSpeed,
    isMlfqMode,
    mlfqPlaybackState,
    mlfqPlay,
    mlfqPause,
    mlfqStep,
    mlfqReset,
    mlfqSpeed,
    mlfqSetSpeed,
    processes,
    isSimulationComplete,
  } = useSchedulerStore();

  const mlqIsPlaying = mlqPlaybackState === 'playing';
  const mlfqIsPlaying = mlfqPlaybackState === 'playing';
  const canPlay = processes.length > 0 && !isSimulationComplete;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left sidebar */}
          <aside className="w-[340px] flex-shrink-0 space-y-6">
            <ProcessForm />
            {isMlqMode ? (
              <MLQConfig />
            ) : isMlfqMode ? (
              <MLFQConfig />
            ) : (
              !isCompareMode && (
                <AlgorithmInfo />
              )
            )}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {isCompareMode ? (
              <CompareMode />
            ) : isMlqMode ? (
              <>
                {/* MLQ Playback Controls */}
                <div className="card flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={mlqIsPlaying ? mlqPause : mlqPlay}
                    disabled={!canPlay && !mlqIsPlaying}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${mlqIsPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : canPlay
                        ? 'bg-violet-500 hover:bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {mlqIsPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={mlqStep}
                    disabled={mlqIsPlaying || !canPlay}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button
                    onClick={mlqReset}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  {/* Speed selector — right side */}
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Speed</span>
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => mlqSetSpeed(s)}
                          className={`px-3.5 py-1.5 text-sm font-semibold rounded-md transition-colors ${mlqSpeed === s
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MLQ visualization */}
                <MLQDashboard />

                {/* Process table below */}
                <ProcessTable />

                {/* AI Flaw Analysis */}
                <FlawAnalysis />
              </>
            ) : isMlfqMode ? (
              <>
                {/* MLFQ Playback Controls */}
                <div className="card flex items-center gap-3 px-5 py-3">
                  <button
                    onClick={mlfqIsPlaying ? mlfqPause : mlfqPlay}
                    disabled={!canPlay && !mlfqIsPlaying}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${mlfqIsPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : canPlay
                        ? 'bg-teal-500 hover:bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {mlfqIsPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={mlfqStep}
                    disabled={mlfqIsPlaying || !canPlay}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button
                    onClick={mlfqReset}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  {/* Speed selector — right side */}
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">Speed</span>
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => mlfqSetSpeed(s)}
                          className={`px-3.5 py-1.5 text-sm font-semibold rounded-md transition-colors ${mlfqSpeed === s
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MLFQ visualization */}
                <MLFQDashboard />

                {/* Process table below */}
                <ProcessTable />

                {/* AI Flaw Analysis */}
                <FlawAnalysis />
              </>
            ) : (
              <>
                {/* Visualization row */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <CPUCore />
                  </div>
                  <div className="col-span-1">
                    <ReadyQueue />
                  </div>
                  <div className="col-span-1">
                    <IOQueue />
                  </div>
                </div>

                {/* Completed processes */}
                <CompletedProcesses />

                {/* Aging Monitor — only shown for priority-aging */}
                {algorithm === 'priority-aging' && <AgingPanel />}

                {/* Controls */}
                <Controls />

                {/* Gantt Chart */}
                <GanttChart />

                {/* Process Details Table */}
                <ProcessTable />

                {/* Statistics */}
                <Statistics />

                {/* AI Flaw Analysis */}
                <FlawAnalysis />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
