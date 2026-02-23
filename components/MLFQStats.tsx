'use client';

import { useSchedulerStore } from '@/lib/store';
import { calculateStatistics } from '@/lib/utils';
import { Cpu } from 'lucide-react';

export default function MLFQStats() {
    const { mlfqSimState, mlfqQueues, processes } = useSchedulerStore();

    if (!mlfqSimState) return null;

    const stats = calculateStatistics(processes, mlfqSimState.currentTime, mlfqSimState.ganttChart);

    // Per-queue CPU% from Gantt
    const queueCpuPercent: Record<number, number> = {};
    const gantt = mlfqSimState.ganttChart;
    const total = mlfqSimState.currentTime || 1;
    mlfqQueues.forEach((q) => {
        const busy = gantt
            .filter((e) => e.queueId === q.id && e.processId !== null)
            .reduce((s, e) => s + (e.endTime - e.startTime), 0);
        queueCpuPercent[q.id] = Math.round((busy / total) * 100);
    });

    const statCards = [
        { label: 'Avg Waiting', value: `${stats.avgWaitingTime.toFixed(1)}ms` },
        { label: 'Avg Turnaround', value: `${stats.avgTurnaroundTime.toFixed(1)}ms` },
        { label: 'Avg Response', value: `${stats.avgResponseTime.toFixed(1)}ms` },
        { label: 'CPU Util', value: `${stats.cpuUtilization.toFixed(1)}%` },
    ];

    return (
        <div className="space-y-3">
            {/* Row 1: standard metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {statCards.map((s) => (
                    <div key={s.label} className="card p-4">
                        <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Row 2: MLFQ-specific metrics */}
            <div className="grid grid-cols-1">
                {/* Per-queue CPU% */}
                <div className="card p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                        <Cpu className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium">CPU % per Queue</span>
                    </div>
                    <div className="space-y-2">
                        {mlfqQueues.map((q) => (
                            <div key={q.id} className="flex items-center gap-2">
                                <span className={`text-[10px] w-20 flex-shrink-0 font-medium ${q.labelColor}`}>
                                    Q{q.id} {q.label}
                                </span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${queueCpuPercent[q.id] ?? 0}%`, backgroundColor: q.accentHex }}
                                    />
                                </div>
                                <span className="text-[10px] text-gray-500 w-8 text-right">
                                    {queueCpuPercent[q.id] ?? 0}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
