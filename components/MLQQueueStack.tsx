'use client';

import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useSchedulerStore } from '@/lib/store';
import MLQQueueLane from './MLQQueueLane';
import CPUCore from './CPUCore';
import IOQueue from './IOQueue';

export default function MLQQueueStack() {
    const { processes, mlqSimState, mlqQueues, runningProcess } = useSchedulerStore();

    const queues = mlqSimState?.queues ?? [[], [], [], []];
    const ioQueue = mlqSimState?.ioQueue ?? [];
    const starvationMap = mlqSimState?.starvationMap ?? {};
    const activeQueueId = mlqSimState?.activeQueueId ?? null;

    return (
        <div className="flex gap-4 w-full">
            {/* Left column: priority arrow + 4 queue lanes */}
            <div className="flex gap-3 flex-1">
                {/* Priority arrow */}
                <div className="flex flex-col items-center justify-center w-7 flex-shrink-0 gap-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                        Priority
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
                    {mlqQueues.map((config) => {
                        // A lane is "active" if its queue is the one with the CPU
                        const isActive =
                            activeQueueId === config.id ||
                            // also treat as active if the running process belongs here
                            !!(runningProcess &&
                                processes.find((p) => p.id === runningProcess)?.queueLevel === config.id);

                        // A lane is "blocked" if a higher-priority queue (lower id) is active
                        const isBlocked =
                            !isActive &&
                            activeQueueId !== null &&
                            activeQueueId < config.id;

                        return (
                            <MLQQueueLane
                                key={config.id}
                                config={config}
                                queuePids={queues[config.id]}
                                processes={processes}
                                isActive={isActive}
                                isBlocked={isBlocked}
                                starvationMap={starvationMap}
                                runningProcessId={runningProcess}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Right column: CPU + I/O */}
            <div className="flex flex-col gap-3 w-72 flex-shrink-0">
                <div className="flex-1 min-h-[340px]">
                    <CPUCore />
                </div>
                <div className="flex-1 min-h-[110px]">
                    <IOQueue />
                </div>
            </div>
        </div>
    );
}
