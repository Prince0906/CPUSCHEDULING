'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { QueueConfig, Process } from '@/lib/types';
import { STARVATION_THRESHOLD } from '@/lib/schedulers/mlq';

interface MLQQueueLaneProps {
    config: QueueConfig;
    queuePids: string[];
    processes: Process[];
    isActive: boolean;
    isBlocked: boolean; // higher-priority queue is active
    starvationMap: Record<string, number>;
    runningProcessId: string | null;
}

export default function MLQQueueLane({
    config,
    queuePids,
    processes,
    isActive,
    isBlocked,
    starvationMap,
    runningProcessId,
}: MLQQueueLaneProps) {
    const queueProcesses = queuePids
        .map((id) => processes.find((p) => p.id === id))
        .filter((p): p is Process => p !== undefined);

    // Running process shown only if it belongs to this queue
    const runningProcess = runningProcessId
        ? processes.find((p) => p.id === runningProcessId && p.queueLevel === config.id)
        : null;

    const totalCount = queueProcesses.length + (runningProcess ? 1 : 0);

    return (
        <div
            className={`relative bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isActive
                ? `border-2 shadow-lg`
                : 'border-gray-100 shadow-sm opacity-90'
                }`}
            style={isActive ? { borderColor: config.accentHex, boxShadow: `0 0 16px ${config.accentHex}30` } : {}}
        >
            {/* Header */}
            <div
                className="flex items-center gap-2 px-4 py-3 border-b border-gray-100"
                style={{ backgroundColor: isActive ? `${config.accentHex}10` : 'transparent' }}
            >
                <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.accentHex }}
                />
                <span className={`text-sm font-bold uppercase tracking-wide ${config.labelColor}`}>
                    Q{config.id + 1} &middot; {config.label}
                </span>
                <span className="text-sm text-gray-400 ml-1">({config.algorithm.toUpperCase()}
                    {config.algorithm === 'rr' ? ` ${config.timeQuantum}ms` : ''})
                </span>
                <span className="ml-auto text-sm font-medium text-gray-500">{totalCount}</span>
                {isActive && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${config.accentHex}20`, color: config.accentHex }}
                    >
                        Active
                    </motion.span>
                )}
            </div>

            {/* Process pills */}
            <div className="px-4 py-3 min-h-[56px] flex flex-wrap gap-2 items-center">
                {/* Running process pill (if it belongs to this queue) */}
                {runningProcess && (
                    <motion.div
                        key={`running-${runningProcess.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{
                            backgroundColor: `${runningProcess.color}15`,
                            outline: `2px solid ${runningProcess.color}`,
                            borderLeft: `4px solid ${runningProcess.color}`,
                            color: runningProcess.color,
                        }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: runningProcess.color }} />
                        {runningProcess.name}
                        <span className="text-xs opacity-70 ml-1">{runningProcess.remainingCpuTime}ms</span>
                    </motion.div>
                )}

                <AnimatePresence mode="popLayout">
                    {queueProcesses.length === 0 && !runningProcess ? (
                        <span className="text-xs text-gray-300 w-full text-center py-1">Empty</span>
                    ) : (
                        queueProcesses.map((p) => {
                            const starving = (starvationMap[p.id] ?? 0) >= STARVATION_THRESHOLD;
                            return (
                                <motion.div
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 6 }}
                                    className={`flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm ${starving ? 'border-l-4 border-red-400' : ''
                                        }`}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span className="font-semibold text-gray-800">{p.name}</span>
                                    <span className="text-sm text-gray-400">{p.remainingCpuTime}ms</span>
                                    {starving && (
                                        <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-px rounded-full bg-red-50 border border-red-200 text-[10px] font-semibold text-red-500">
                                            <AlertCircle className="w-2.5 h-2.5" />
                                            Starving
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Blocker overlay — when a higher-priority queue is running */}
            <AnimatePresence>
                {isBlocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center rounded-xl"
                    >
                        <span className="text-sm text-gray-500 font-medium px-3 py-1.5 bg-gray-100 rounded-full">
                            Waiting for higher priority queue
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
