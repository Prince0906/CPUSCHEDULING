'use client';

import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';
import MLFQQueueLane from './MLFQQueueLane';
import CPUCore from './CPUCore';
import MLFQIOWaiting from './MLFQIOWaiting';

export default function MLFQQueueStack() {
    const { processes, mlfqSimState, mlfqQueues, runningProcess } = useSchedulerStore();

    const queues = mlfqSimState?.queues ?? [[], [], []];
    const activeQueueId = mlfqSimState?.activeQueueId ?? null;

    return (
        <div className="flex gap-4 w-full">
            {/* Left column: priority arrow + 3 queue lanes */}
            <div className="flex gap-3 flex-1">
                {/* Priority arrow */}
                <div className="flex flex-col items-center justify-center w-7 flex-shrink-0 gap-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                        Priority Demotion
                    </span>
                    <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    >
                        <ArrowDown className="w-4 h-4 text-gray-300" />
                    </motion.div>
                </div>

                {/* Queue lanes */}
                <div className="flex flex-col gap-4 flex-1">
                    {mlfqQueues.map((config) => {
                        // A lane is "active" if its queue is the one with the CPU
                        const isActive =
                            activeQueueId === config.id ||
                            !!(runningProcess &&
                                processes.find((p) => p.id === runningProcess)?.queueLevel === config.id);

                        // A lane is "blocked" if a higher-priority queue (lower id) is active
                        const isBlocked =
                            !isActive &&
                            activeQueueId !== null &&
                            activeQueueId < config.id;

                        return (
                            <MLFQQueueLane
                                key={config.id}
                                config={config}
                                queuePids={queues[config.id]}
                                processes={processes}
                                isActive={isActive}
                                isBlocked={isBlocked}
                                runningProcessId={runningProcess}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Right column: CPU + specialized MLFQ I/O */}
            <div className="flex flex-col gap-4 w-72 flex-shrink-0">
                <div className="flex-1 min-h-[220px]">
                    <CPUCore />
                </div>
                <div className="shrink-0 h-[190px]">
                    <MLFQIOWaiting />
                </div>
            </div>
        </div>
    );
}
