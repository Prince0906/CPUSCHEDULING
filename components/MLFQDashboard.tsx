'use client';

import { useSchedulerStore } from '@/lib/store';
import MLFQQueueStack from './MLFQQueueStack';
import MLFQGanttChart from './MLFQGanttChart';
import MLFQStats from './MLFQStats';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function MLFQDashboard() {
    const { mlfqSimState, boostTimerLimit } = useSchedulerStore();

    return (
        <div className="space-y-4 relative">
            {mlfqSimState && (
                <AnimatePresence>
                    {mlfqSimState.boostTimeRemaining === boostTimerLimit && mlfqSimState.currentTime > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-0 inset-x-0 z-50 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-yellow-500 text-white px-4 py-1.5 rounded-full shadow-lg font-bold flex items-center gap-2 text-sm shadow-yellow-500/50">
                                <Zap className="w-4 h-4" />
                                Priority Boost! All returned to Q0
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Main visualization: 3 queue lanes + CPU/IO columns */}
            <MLFQQueueStack />

            {/* Gantt — only once simulation has started */}
            {mlfqSimState && mlfqSimState.ganttChart.length > 0 && (
                <MLFQGanttChart />
            )}

            {/* Stats — only once simulation has started */}
            {mlfqSimState && (
                <MLFQStats />
            )}
        </div>
    );
}
