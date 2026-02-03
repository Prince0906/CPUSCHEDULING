'use client';

import { motion } from 'framer-motion';
import { useSchedulerStore } from '@/lib/store';

export default function ProcessTable() {
    const { processes, completedProcesses } = useSchedulerStore();

    // Only show processes that have been started (have a startTime)
    const processesToShow = processes.filter(p => p.startTime !== null);
    const hasData = processesToShow.length > 0;

    // Calculate turnaround time for each process
    const getProcessData = (process: typeof processes[0]) => {
        const turnaroundTime = process.completionTime !== null
            ? process.completionTime - process.arrivalTime
            : null;

        return {
            name: process.name,
            arrivalTime: process.arrivalTime,
            burstTime: process.cpuBurstTime,
            completionTime: process.completionTime,
            turnaroundTime,
            waitingTime: process.waitingTime,
            color: process.color,
            isCompleted: process.state === 'terminated',
        };
    };

    const processData = processesToShow.map(getProcessData);

    return (
        <div className="card">
            <div className="section-header">
                <h2 className="section-title">Process Details</h2>
            </div>

            <div className="p-6">
                {!hasData ? (
                    <div className="h-32 flex items-center justify-center text-gray-300 text-sm">
                        Start simulation to see process details
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Process
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Arrival Time
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Burst Time
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Completion Time
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Turnaround Time
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Waiting Time
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {processData.map((process, index) => (
                                    <motion.tr
                                        key={process.name}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: process.color }}
                                                />
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {process.name}
                                                </span>
                                                {process.isCompleted && (
                                                    <span className="text-xs text-green-600">✓</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm text-gray-700 tabular-nums">
                                            {process.arrivalTime}
                                            <span className="text-xs text-gray-400 ml-0.5">ms</span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm text-gray-700 tabular-nums">
                                            {process.burstTime}
                                            <span className="text-xs text-gray-400 ml-0.5">ms</span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm tabular-nums">
                                            {process.completionTime !== null ? (
                                                <>
                                                    <span className="text-gray-900">{process.completionTime}</span>
                                                    <span className="text-xs text-gray-400 ml-0.5">ms</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm tabular-nums">
                                            {process.turnaroundTime !== null ? (
                                                <>
                                                    <span className="text-gray-900 font-medium">{process.turnaroundTime}</span>
                                                    <span className="text-xs text-gray-400 ml-0.5">ms</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right text-sm tabular-nums">
                                            {process.isCompleted ? (
                                                <>
                                                    <span className="text-gray-900 font-medium">{process.waitingTime}</span>
                                                    <span className="text-xs text-gray-400 ml-0.5">ms</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
