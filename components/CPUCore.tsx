'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';

export default function CPUCore() {
  const { processes, runningProcess, algorithm, timeQuantum, currentQuantum, isMlqMode, mlqQueues, mlqSimState } = useSchedulerStore();

  const activeProcess = runningProcess
    ? processes.find(p => p.id === runningProcess)
    : null;

  // In MLQ mode, find the active queue config for the running process
  const activeQueueConfig = isMlqMode && activeProcess
    ? mlqQueues.find(q => q.id === activeProcess.queueLevel) ?? null
    : null;

  const progress = activeProcess && activeProcess.cpuBurstTime > 0
    ? ((activeProcess.cpuBurstTime - activeProcess.remainingCpuTime) / activeProcess.cpuBurstTime) * 100
    : 0;

  const isRoundRobin = algorithm === 'rr';

  // Ring dimensions
  const RING_SIZE = 140; // px
  const CX = 70;
  const R = 60;
  const STROKE = 7;
  const CIRCUMFERENCE = 2 * Math.PI * R;

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="section-header flex items-center justify-between flex-shrink-0">
        <h2 className="section-title">CPU</h2>
        {activeProcess && (
          <span className="text-xs text-emerald-600 font-medium">Active</span>
        )}
      </div>

      {/* Body — vertical stack: ring → badge → quantum bar */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 py-2 px-2">

        {/* Ring */}
        <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            {/* Track */}
            <circle
              cx={CX}
              cy={CX}
              r={R}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            {activeProcess && (
              <motion.circle
                cx={CX}
                cy={CX}
                r={R}
                fill="none"
                stroke={activeProcess.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress / 100) }}
                transition={{ duration: 0.4 }}
              />
            )}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeProcess ? (
                <motion.div
                  key={activeProcess.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  {/* Process name — scales down for long names via text-4xl but truncates */}
                  <div
                    className="text-4xl font-bold leading-none tracking-tight"
                    style={{ color: activeProcess.color }}
                  >
                    {activeProcess.name}
                  </div>
                  <div className="text-sm text-gray-400 mt-1.5 font-medium">
                    {activeProcess.remainingCpuTime}ms left
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center flex flex-col items-center gap-1.5"
                >
                  <Cpu className="w-9 h-9 text-gray-300" strokeWidth={1.5} />
                  <div className="text-[10px] font-bold tracking-[0.2em] text-gray-300 uppercase">Idle</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Queue badge (MLQ only) — sits cleanly below the ring */}
        <AnimatePresence>
          {activeQueueConfig && activeProcess && (
            <motion.div
              key={activeQueueConfig.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex justify-center w-full"
            >
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${activeQueueConfig.accentHex}18`,
                  color: activeQueueConfig.accentHex,
                  border: `1px solid ${activeQueueConfig.accentHex}30`,
                }}
              >
                Q{activeQueueConfig.id + 1} · {activeQueueConfig.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quantum bar — standard RR mode */}
        {isRoundRobin && !isMlqMode && activeProcess && (
          <div className="w-full px-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500">Time Quantum</span>
              <span className={`font-medium tabular-nums ${currentQuantum >= timeQuantum ? 'text-amber-600' : 'text-gray-700'}`}>
                {currentQuantum}/{timeQuantum}ms
                {currentQuantum >= timeQuantum && (
                  <span className="ml-1 text-amber-600">(preempt)</span>
                )}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${currentQuantum >= timeQuantum ? 'bg-amber-500' : 'bg-amber-400'}`}
                animate={{ width: `${Math.min((currentQuantum / timeQuantum) * 100, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Quantum bar — MLQ RR queue */}
        {isMlqMode && activeQueueConfig?.algorithm === 'rr' && activeProcess && (
          <div className="w-full px-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500">Q{activeQueueConfig.id + 1} Quantum</span>
              <span className="font-medium text-gray-700 tabular-nums">
                {mlqSimState?.currentQuantum ?? 0}/{activeQueueConfig.timeQuantum}ms
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-violet-400"
                animate={{ width: `${Math.min(((mlqSimState?.currentQuantum ?? 0) / activeQueueConfig.timeQuantum) * 100, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
