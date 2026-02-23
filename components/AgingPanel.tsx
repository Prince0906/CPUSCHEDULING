'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { getEffectivePriority } from '@/lib/schedulers/priority';
import { TrendingUp, Clock, Shield } from 'lucide-react';

export default function AgingPanel() {
    const { processes, readyQueue, runningProcess, algorithm, agingTime, currentTime } = useSchedulerStore();
    const isPriorityAging = algorithm === 'priority-aging';

    if (!isPriorityAging) return null;

    // Gather all non-terminated / non-new processes for display
    const activeProcesses = processes.filter(
        (p) => p.state !== 'new' && p.state !== 'terminated'
    );

    if (activeProcesses.length === 0 && currentTime === 0) {
        return (
            <div className="card">
                <div className="section-header">
                    <h2 className="section-title flex items-center gap-2">
                        Aging Monitor
                    </h2>
                </div>
                <div className="p-6 text-center text-gray-400 text-sm">
                    Start the simulation to see aging in action
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            {/* Header */}
            <div className="section-header flex items-center justify-between">
                <h2 className="section-title flex items-center gap-2">
                    Aging Monitor
                </h2>
                <span className="text-xs text-gray-400 font-medium">
                    Aging Interval: <span className="text-rose-600 font-semibold">{agingTime}ms</span>
                </span>
            </div>

            {/* Process rows */}
            <div className="p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                    {processes
                        .filter((p) => p.state !== 'new')
                        .map((process) => {
                            const effectivePri = getEffectivePriority(process, agingTime);
                            const priorityChanged = effectivePri !== process.priority;
                            const isRunning = process.id === runningProcess;
                            const isWaiting = readyQueue.includes(process.id);
                            const isTerminated = process.state === 'terminated';
                            // How many aging steps have occurred
                            const agingSteps = agingTime > 0 ? Math.floor(process.waitingTime / agingTime) : 0;
                            // Progress toward next aging step
                            const progressToNext = agingTime > 0 ? ((process.waitingTime % agingTime) / agingTime) * 100 : 0;

                            return (
                                <motion.div
                                    key={process.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className={`rounded-xl border p-3 transition-colors ${isRunning
                                        ? 'border-emerald-200 bg-emerald-50/50'
                                        : isTerminated
                                            ? 'border-gray-200 bg-gray-50/50 opacity-60'
                                            : isWaiting
                                                ? 'border-rose-200 bg-rose-50/30'
                                                : 'border-gray-200 bg-white'
                                        }`}
                                >
                                    {/* Row 1: Process name + status badge + priority info */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: process.color }}
                                        />
                                        <span className="font-semibold text-sm text-gray-900">{process.name}</span>

                                        {/* Status badge */}
                                        <span
                                            className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isRunning
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : isTerminated
                                                    ? 'bg-gray-200 text-gray-500'
                                                    : isWaiting
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}
                                        >
                                            {isRunning ? 'Running' : isTerminated ? 'Done' : isWaiting ? 'Ready' : process.state}
                                        </span>

                                        {/* Priority display — right-aligned */}
                                        <div className="ml-auto flex items-center gap-1.5">
                                            {priorityChanged ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="text-xs text-gray-400 line-through">P{process.priority}</span>
                                                    <span className="text-xs text-gray-300">→</span>
                                                    <motion.span
                                                        key={`panel-${process.id}-${effectivePri}`}
                                                        initial={{ scale: 1.4, color: '#F43F5E' }}
                                                        animate={{ scale: 1, color: '#059669' }}
                                                        transition={{ duration: 0.5 }}
                                                        className="text-xs font-bold"
                                                    >
                                                        P{effectivePri}
                                                    </motion.span>
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-gray-600">P{process.priority}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 2: Stats grid */}
                                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                                        {/* Waiting time */}
                                        <div className="flex items-center gap-1 text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>Wait: <span className="font-semibold text-gray-700">{process.waitingTime}ms</span></span>
                                        </div>
                                        {/* Aging steps */}
                                        <div className="flex items-center gap-1 text-gray-500">
                                            <span>Aged: <span className="font-semibold text-rose-600">{agingSteps}×</span></span>
                                        </div>
                                        {/* Remaining CPU */}
                                        <div className="text-right text-gray-500">
                                            Remaining: <span className="font-semibold text-gray-700">{process.remainingCpuTime}ms</span>
                                        </div>
                                    </div>

                                    {/* Row 3: Aging progress bar — only show for waiting processes */}
                                    {isWaiting && !isTerminated && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                                                <span>Next aging in</span>
                                                <span className="tabular-nums">{agingTime - (process.waitingTime % agingTime)}ms</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500"
                                                    animate={{ width: `${progressToNext}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Priority change timeline visualization */}
                                    {agingSteps > 0 && (
                                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                                            {Array.from({ length: Math.min(agingSteps + 1, process.priority) }, (_, i) => {
                                                const priAtStep = Math.max(1, process.priority - i);
                                                const isCurrent = i === agingSteps;
                                                const isLast = i === Math.min(agingSteps, process.priority - 1);
                                                return (
                                                    <div key={i} className="flex items-center gap-1">
                                                        <motion.span
                                                            initial={isCurrent ? { scale: 1.3 } : {}}
                                                            animate={{ scale: 1 }}
                                                            className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${isLast
                                                                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                                                                : 'bg-gray-100 text-gray-400'
                                                                }`}
                                                        >
                                                            {priAtStep}
                                                        </motion.span>
                                                        {!isLast && (
                                                            <span className="text-gray-300 text-[10px]">→</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                </AnimatePresence>
            </div>
        </div>
    );
}
