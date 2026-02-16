'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';

export default function ReadyQueue() {
  const { processes, readyQueue, algorithm } = useSchedulerStore();

  const readyProcesses = readyQueue
    .map(id => processes.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const isMultiLevel = algorithm === 'mlq' || algorithm === 'mlfq';

  // Group by queue level
  const queue1 = readyProcesses.filter(p => (p.queueLevel ?? 1) === 1);
  const queue2 = readyProcesses.filter(p => (p.queueLevel ?? 1) === 2);
  const queue3 = readyProcesses.filter(p => (p.queueLevel ?? 1) === 3);

  return (
    <div className="card h-full flex flex-col">
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title">Ready Queue</h2>
        <span className="text-sm text-gray-400">{readyProcesses.length}</span>
      </div>

      <div className="flex-1 min-h-[120px] max-h-[300px] overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {readyProcesses.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-300 text-sm">
              Empty
            </div>
          ) : isMultiLevel ? (
            <>
              {/* Queue 1 - High Priority */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  <span>Queue 1 (High)</span>
                  <span className="text-gray-400">{queue1.length}</span>
                </div>
                <div className="space-y-2 min-h-[30px] p-2 bg-gray-50/50 rounded-lg border border-gray-100/50">
                  {queue1.length === 0 && <span className="text-xs text-gray-400 italic px-2">Empty</span>}
                  {queue1.map((process) => (
                    <QueueItem key={process.id} process={process} />
                  ))}
                </div>
              </div>

              {/* Queue 2 - Medium Priority */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  <span>Queue 2 (Med)</span>
                  <span className="text-gray-400">{queue2.length}</span>
                </div>
                <div className="space-y-2 min-h-[30px] p-2 bg-gray-50/50 rounded-lg border border-gray-100/50">
                  {queue2.length === 0 && <span className="text-xs text-gray-400 italic px-2">Empty</span>}
                  {queue2.map((process) => (
                    <QueueItem key={process.id} process={process} />
                  ))}
                </div>
              </div>

              {/* Queue 3 - Low Priority */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  <span>Queue 3 (Low)</span>
                  <span className="text-gray-400">{queue3.length}</span>
                </div>
                <div className="space-y-2 min-h-[30px] p-2 bg-gray-50/50 rounded-lg border border-gray-100/50">
                  {queue3.length === 0 && <span className="text-xs text-gray-400 italic px-2">Empty</span>}
                  {queue3.map((process) => (
                    <QueueItem key={process.id} process={process} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {readyProcesses.map((process) => (
                <QueueItem key={process.id} process={process} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function QueueItem({ process }: { process: any }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-100 shadow-sm rounded-lg"
    >
      <div
        className="w-2 h-2 rounded-full ring-2 ring-gray-100"
        style={{ backgroundColor: process.color }}
      />
      <span className="font-medium text-gray-900 text-sm">{process.name}</span>
      <span className="text-xs text-gray-400 ml-auto tabular-nums">{process.remainingCpuTime}ms</span>
    </motion.div>
  );
}
