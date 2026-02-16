'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { MLQ_QUANTA } from '@/lib/schedulers/mlq';
import { MLFQ_QUANTA } from '@/lib/schedulers/mlfq';

export default function CPUCore() {
  const { processes, runningProcess, algorithm, timeQuantum: globalQuantum, currentQuantum } = useSchedulerStore();

  const activeProcess = runningProcess
    ? processes.find(p => p.id === runningProcess)
    : null;

  const progress = activeProcess && activeProcess.cpuBurstTime > 0
    ? ((activeProcess.cpuBurstTime - activeProcess.remainingCpuTime) / activeProcess.cpuBurstTime) * 100
    : 0;

  const isRoundRobin = algorithm === 'rr';
  const isMultiLevel = algorithm === 'mlq' || algorithm === 'mlfq';

  // Determine relevant time quantum for display
  let activeQuantum = globalQuantum;
  let showQuantum = isRoundRobin;

  if (activeProcess && isMultiLevel) {
    const level = activeProcess.queueLevel ?? 1;
    if (algorithm === 'mlq') {
      activeQuantum = MLQ_QUANTA[level] ?? globalQuantum;
      showQuantum = activeQuantum !== Infinity; // Don't show for FCFS queue
    } else if (algorithm === 'mlfq') {
      activeQuantum = MLFQ_QUANTA[level] ?? 8;
      showQuantum = true;
    }
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title">CPU</h2>
        {activeProcess && (
          <div className="flex items-center gap-2">
            {isMultiLevel && (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Q{activeProcess.queueLevel ?? 1}
              </span>
            )}
            <span className="text-xs text-emerald-600 font-medium">Active</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative w-40 h-40">
          {/* Background ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="6"
            />
            {activeProcess && (
              <motion.circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke={activeProcess.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 72}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 72 * (1 - progress / 100) }}
                transition={{ duration: 0.4 }}
              />
            )}
          </svg>

          {/* Center content */}
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
                  <div
                    className="text-3xl font-bold"
                    style={{ color: activeProcess.color }}
                  >
                    {activeProcess.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {activeProcess.remainingCpuTime}ms left
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-300"
                >
                  <div className="text-2xl font-medium">Idle</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Quantum indicator */}
      {showQuantum && activeProcess && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">Quantum (Q{activeProcess.queueLevel ?? 1})</span>
            <span className={`font-medium ${currentQuantum >= activeQuantum ? 'text-amber-600' : 'text-gray-700'}`}>
              {currentQuantum}/{activeQuantum}ms
              {currentQuantum >= activeQuantum && (
                <span className="ml-1 text-amber-600">
                  ({algorithm === 'mlfq' ? 'demote' : 'preempt'})
                </span>
              )}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${currentQuantum >= activeQuantum ? 'bg-amber-500' : 'bg-amber-400'}`}
              animate={{ width: `${Math.min((currentQuantum / activeQuantum) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
