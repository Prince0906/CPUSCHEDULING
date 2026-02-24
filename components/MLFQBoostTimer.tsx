'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';

export default function MLFQBoostTimer() {
    const { mlfqSimState, boostTimerLimit } = useSchedulerStore();

    if (!mlfqSimState) return null;

    const remaining = mlfqSimState.boostTimeRemaining;
    const ratio = remaining / boostTimerLimit; // 1 = full, 0 = boost
    const pct = ratio * 100;

    // Did a boost just fire?
    const justBoosted = remaining === boostTimerLimit && mlfqSimState.currentTime > 0;

    // Urgency tiers
    const isCritical = ratio < 0.15;
    const isWarning = ratio < 0.4;

    // Bar color
    const barColor = isCritical
        ? '#EF4444'   // red-500
        : isWarning
            ? '#F59E0B' // amber-500
            : '#14B8A6'; // teal-500

    // Background tint for the track
    const trackBg = isCritical
        ? 'bg-red-50'
        : isWarning
            ? 'bg-amber-50'
            : 'bg-gray-100';

    // Label color
    const labelColor = isCritical
        ? 'text-red-600'
        : isWarning
            ? 'text-amber-600'
            : 'text-gray-500';

    return (
        <div className="relative">
            {/* Boost flash overlay */}
            <AnimatePresence>
                {justBoosted && (
                    <motion.div
                        key="boost-flash"
                        initial={{ opacity: 0.9 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 rounded-xl bg-yellow-400/20 z-10 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div className="card px-4 py-3">
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Priority Boost
                    </span>
                    <span className={`font-mono text-sm font-semibold tabular-nums ${labelColor}`}>
                        {remaining}<span className="text-gray-300 font-normal">/{boostTimerLimit}</span>
                    </span>
                </div>

                {/* Progress bar */}
                <div className={`h-2 rounded-full overflow-hidden ${trackBg} transition-colors duration-300`}>
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                        animate={{
                            width: `${pct}%`,
                            opacity: isCritical ? [1, 0.5, 1] : 1,
                        }}
                        transition={{
                            width: { duration: 0.3, ease: 'easeOut' },
                            opacity: isCritical
                                ? { duration: 0.4, repeat: Infinity, ease: 'easeInOut' }
                                : { duration: 0.3 },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
