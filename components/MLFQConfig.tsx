'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';

export default function MLFQConfig() {
    const { mlfqQueues, updateMlfqQueueConfig, isMlfqMode, boostTimerLimit, setBoostTimerLimit } = useSchedulerStore();
    const [expandedId, setExpandedId] = useState<number | 'boost' | null>(null);

    if (!isMlfqMode) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-3">
                <Settings2 className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Queue Config</span>
            </div>

            {/* Priority Boost Timer Config */}
            <div className="rounded-lg border border-gray-100 overflow-hidden">
                <button
                    onClick={() => setExpandedId(expandedId === 'boost' ? null : 'boost')}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                >
                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-yellow-500" />
                    <span className="text-xs font-medium text-yellow-700 flex-1">
                        Priority Boost (Rule 6)
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase">{boostTimerLimit}ms</span>
                    {expandedId === 'boost' ? (
                        <ChevronUp className="w-3 h-3 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    )}
                </button>
                <AnimatePresence initial={false}>
                    {expandedId === 'boost' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-3 pt-2 space-y-3 bg-gray-50 border-t border-gray-100">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">
                                        Boost Timer (S): {boostTimerLimit}ms
                                    </label>
                                    <input
                                        type="range"
                                        min={10}
                                        max={50}
                                        step={5}
                                        value={boostTimerLimit}
                                        onChange={(e) => setBoostTimerLimit(Number(e.target.value))}
                                        className="w-full cursor-pointer"
                                        style={{ accentColor: '#EAB308' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Individual Queues Config */}
            {mlfqQueues.map((config) => {
                const isOpen = expandedId === config.id;
                return (
                    <div
                        key={config.id}
                        className="rounded-lg border border-gray-100 overflow-hidden"
                    >
                        <button
                            onClick={() => setExpandedId(isOpen ? null : config.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: config.accentHex }}
                            />
                            <span className={`text-xs font-medium ${config.labelColor} flex-1`}>
                                Q{config.id} · {config.label}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase">Q={config.timeQuantum}</span>
                            {isOpen ? (
                                <ChevronUp className="w-3 h-3 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            )}
                        </button>

                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-3 pb-3 pt-2 space-y-3 bg-gray-50 border-t border-gray-100">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">
                                                Time Quantum: {config.timeQuantum}ms
                                            </label>
                                            <input
                                                type="range"
                                                min={1}
                                                max={32}
                                                value={config.timeQuantum}
                                                onChange={(e) =>
                                                    updateMlfqQueueConfig(config.id, { timeQuantum: Number(e.target.value) })
                                                }
                                                className="w-full cursor-pointer"
                                                style={{ accentColor: config.accentHex }}
                                            />
                                        </div>
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
