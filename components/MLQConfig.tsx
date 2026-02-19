'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';
import { AlgorithmType } from '@/lib/types';

const SUB_ALGOS: { value: Exclude<AlgorithmType, 'mlq'>; label: string }[] = [
    { value: 'fcfs', label: 'FCFS' },
    { value: 'sjf', label: 'SJF' },
    { value: 'rr', label: 'RR' },
    { value: 'priority', label: 'Priority' },
    { value: 'priority-preemptive', label: 'Priority-P' },
    { value: 'srtf', label: 'SRTF' },
];

export default function MLQConfig() {
    const { mlqQueues, updateQueueConfig, isMlqMode } = useSchedulerStore();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    if (!isMlqMode) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-3">
                <Settings2 className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Queue Config</span>
            </div>

            {mlqQueues.map((config) => {
                const isOpen = expandedId === config.id;
                return (
                    <div
                        key={config.id}
                        className="rounded-lg border border-gray-100 overflow-hidden"
                    >
                        {/* Accordion header */}
                        <button
                            onClick={() => setExpandedId(isOpen ? null : config.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: config.accentHex }}
                            />
                            <span className={`text-xs font-medium ${config.labelColor} flex-1`}>
                                Q{config.id + 1} · {config.label}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase">{config.algorithm}</span>
                            {isOpen ? (
                                <ChevronUp className="w-3 h-3 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            )}
                        </button>

                        {/* Accordion body */}
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-3 pb-3 pt-2 space-y-3 bg-gray-50 border-t border-gray-100">
                                        {/* Algorithm selector */}
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">
                                                Algorithm
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={config.algorithm}
                                                    onChange={(e) =>
                                                        updateQueueConfig(config.id, {
                                                            algorithm: e.target.value as Exclude<AlgorithmType, 'mlq'>,
                                                        })
                                                    }
                                                    className="w-full text-xs bg-white border border-gray-200 rounded-md px-2 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-violet-400 appearance-none cursor-pointer text-gray-900"
                                                >
                                                    {SUB_ALGOS.map((a) => (
                                                        <option key={a.value} value={a.value}>
                                                            {a.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time quantum (only for RR) */}
                                        {config.algorithm === 'rr' && (
                                            <div>
                                                <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">
                                                    Quantum: {config.timeQuantum}ms
                                                </label>
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={8}
                                                    value={config.timeQuantum}
                                                    onChange={(e) =>
                                                        updateQueueConfig(config.id, { timeQuantum: Number(e.target.value) })
                                                    }
                                                    className="w-full accent-violet-500 cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
