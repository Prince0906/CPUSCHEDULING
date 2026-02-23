'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MLFQQueueConfig, Process } from '@/lib/types';

interface MLFQQueueLaneProps {
    config: MLFQQueueConfig;
    queuePids: string[];
    processes: Process[];
    isActive: boolean;
    isBlocked: boolean;
    runningProcessId: string | null;
}

export default function MLFQQueueLane({
    config,
    queuePids,
    processes,
    isActive,
    isBlocked,
    runningProcessId,
}: MLFQQueueLaneProps) {
    const queueProcesses = queuePids
        .map((id) => processes.find((p) => p.id === id))
        .filter((p): p is Process => p !== undefined);

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
                    {config.label}
                </span>
                <span className="text-sm text-gray-400 ml-1">
                    (Limit: {config.timeQuantum}ms)
                </span>
                <span className="ml-auto text-sm font-medium text-gray-500">{totalCount} Waiting</span>
                {isActive && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${config.accentHex}20`, color: config.accentHex }}
                    >
                        Active Queue
                    </motion.span>
                )}
            </div>

            {/* Process pills */}
            <div className="px-4 py-3 min-h-[56px] flex flex-wrap gap-2 items-center relative">
                <AnimatePresence mode="popLayout">
                    {queueProcesses.length === 0 && !runningProcess ? (
                        <span className="text-xs text-gray-300 w-full text-center py-1 absolute inset-0 flex items-center justify-center">Empty</span>
                    ) : (
                        <>
                            {/* Running process pill */}
                            {runningProcess && (
                                <motion.div
                                    key={`running-${runningProcess.id}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium z-10"
                                    style={{
                                        backgroundColor: `${runningProcess.color}15`,
                                        outline: `2px solid ${runningProcess.color}`,
                                        borderLeft: `4px solid ${runningProcess.color}`,
                                        color: runningProcess.color,
                                    }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: runningProcess.color }} />
                                    {runningProcess.name}
                                    <div className="flex flex-col items-end leading-tight ml-2">
                                        <span className="text-[10px] opacity-70">CPU Left: {runningProcess.remainingCpuTime}ms</span>
                                        <span className="text-[10px] font-bold">Used: {runningProcess.cpuTimeUsedInCurrentQueue}/{config.timeQuantum}</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Waiting processes */}
                            {queueProcesses.map((p) => (
                                <motion.div
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 6 }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm z-10"
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                    <span className="font-semibold text-gray-800">{p.name}</span>
                                    <div className="flex flex-col items-end leading-tight ml-2">
                                        <span className="text-[10px] text-gray-500">Left: {p.remainingCpuTime}ms</span>
                                        <span className="text-[10px] text-gray-600 font-medium">Used: {p.cpuTimeUsedInCurrentQueue}ms</span>
                                    </div>
                                </motion.div>
                            ))}
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Blocker overlay */}
            <AnimatePresence>
                {isBlocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-20"
                    >
                        <span className="text-sm text-gray-500 font-medium px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                            Waiting for higher priority queue
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
