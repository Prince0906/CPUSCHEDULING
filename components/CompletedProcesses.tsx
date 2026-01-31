'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';

export default function CompletedProcesses() {
  const { processes, completedProcesses } = useSchedulerStore();
  
  const completed = completedProcesses
    .map(id => processes.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <div className="card">
      <div className="section-header flex items-center justify-between">
        <h2 className="section-title">Completed</h2>
        <span className="text-sm text-gray-400">{completed.length}</span>
      </div>

      <div className="p-4 min-h-[80px] max-h-[160px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {completed.length === 0 ? (
            <div className="h-[60px] flex items-center justify-center text-gray-300 text-sm">
              None yet
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {completed.map((process) => (
                <motion.div
                  key={process.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg"
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: process.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{process.name}</span>
                  <Check className="w-3 h-3 text-emerald-500" />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
