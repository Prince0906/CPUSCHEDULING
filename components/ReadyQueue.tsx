'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';

export default function ReadyQueue() {
  const { processes, readyQueue } = useSchedulerStore();
  
  const readyProcesses = readyQueue
    .map(id => processes.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <div className="card h-full flex flex-col">
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title">Ready Queue</h2>
        <span className="text-sm text-gray-400">{readyProcesses.length}</span>
      </div>

      <div className="flex-1 min-h-[120px] max-h-[200px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {readyProcesses.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-300 text-sm">
              Empty
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {readyProcesses.map((process, index) => (
                <motion.div
                  key={process.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: process.color }}
                  />
                  <span className="font-medium text-gray-900 text-sm">{process.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{process.remainingCpuTime}ms</span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
