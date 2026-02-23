'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { Database } from 'lucide-react';

export default function MLFQIOWaiting() {
    const { mlfqSimState, processes } = useSchedulerStore();

    const ioQueue = mlfqSimState?.ioQueue ?? [];
    const waitingProcesses = ioQueue
        .map(id => processes.find(p => p.id === id))
        .filter(p => p !== undefined);

    return (
        <div className="card h-[160px] flex flex-col border-[2px] border-amber-200 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50/30 overflow-hidden">
            <div className="section-header border-b border-amber-200/50 bg-white/50 pb-3 h-14 flex items-center justify-between shrink-0 px-4">
                <h2 className="section-title flex items-center gap-2 text-amber-800 m-0">
                    <Database className="w-5 h-5 text-amber-600" />
                    I/O Wait Queue
                </h2>
                <span className="text-xs text-amber-600/70 font-medium bg-amber-100 px-2 py-1 rounded-full">{waitingProcesses.length} Waiting</span>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-2 overflow-y-auto min-h-0 relative">
                <AnimatePresence mode="popLayout">
                    {waitingProcesses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center text-sm text-amber-600/50 font-medium"
                        >
                            Idle
                        </motion.div>
                    ) : (
                        waitingProcesses.map((p) => (
                            <motion.div
                                key={p?.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                className="bg-white border border-amber-200 rounded-lg p-3 shadow-sm flex items-center justify-between group shrink-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: p?.color }} />
                                    <span className="font-semibold text-gray-800">{p?.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    {p?.remainingIoTime}ms remaining
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
