'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';

export default function CPUCore() {
  const { processes, runningProcess, algorithm, timeQuantum, currentQuantum } = useSchedulerStore();
  
  const activeProcess = runningProcess 
    ? processes.find(p => p.id === runningProcess) 
    : null;

  const progress = activeProcess 
    ? ((activeProcess.cpuBurstTime - activeProcess.remainingCpuTime) / activeProcess.cpuBurstTime) * 100
    : 0;

  const isRoundRobin = algorithm === 'rr';

  return (
    <div className="card h-full flex flex-col">
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title">CPU</h2>
        {activeProcess && (
          <span className="text-xs text-emerald-600 font-medium">Active</span>
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

      {/* Quantum indicator for Round Robin */}
      {isRoundRobin && activeProcess && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Time Quantum</span>
            <span className="font-medium text-gray-700">{currentQuantum}/{timeQuantum}ms</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-400 rounded-full"
              animate={{ width: `${(currentQuantum / timeQuantum) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
