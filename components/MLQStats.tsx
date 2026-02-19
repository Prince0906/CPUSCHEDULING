'use client';

import { useSchedulerStore } from '@/lib/store';
import { calculateStatistics } from '@/lib/utils';
import { STARVATION_THRESHOLD } from '@/lib/schedulers/mlq';
import { AlertCircle, Cpu, RefreshCw } from 'lucide-react';

export default function MLQStats() {
    const { mlqSimState, mlqQueues, processes, ganttChart, currentTime } = useSchedulerStore();

    if (!mlqSimState) return null;

    const stats = calculateStatistics(processes, currentTime, ganttChart);
    const contextSwitches = mlqSimState.contextSwitchCount;
    const starvationMap = mlqSimState.starvationMap;

    // Processes with active starvation flag
    const starvedPids = Object.entries(starvationMap)
        .filter(([, ticks]) => ticks >= STARVATION_THRESHOLD)
        .map(([pid]) => processes.find((p) => p.id === pid)?.name ?? pid);

    // Per-queue CPU% from Gantt
    const queueCpuPercent: Record<number, number> = {};
    const gantt = mlqSimState.ganttChart;
    const total = currentTime || 1;
    mlqQueues.forEach((q) => {
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

            {/* Row 2: MLQ-specific metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Context switches */}
                <div className="card p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-2">
                        <RefreshCw className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                        <p className="text-xs text-gray-400">Context Switches</p>
                    </div>
                    <p className="text-4xl font-bold text-violet-600 leading-none">{contextSwitches}</p>
                </div>

                {/* Starvation indicator */}
                <div className="card p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-2">
                        <AlertCircle className={`w-3.5 h-3.5 flex-shrink-0 ${starvedPids.length > 0 ? 'text-red-500' : 'text-gray-300'}`} />
                        <p className="text-xs text-gray-400">Starving</p>
                    </div>
                    {starvedPids.length > 0 ? (
                        <p className="text-lg font-semibold text-red-500 leading-tight">{starvedPids.join(', ')}</p>
                    ) : (
                        <p className="text-4xl font-bold text-gray-900 leading-none">0</p>
                    )}
                </div>

                {/* Per-queue CPU% */}
                <div className="card p-4 col-span-2">
                    <div className="flex items-center gap-1.5 mb-3">
                        <Cpu className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium">CPU % per Queue</span>
                    </div>
                    <div className="space-y-2">
                        {mlqQueues.map((q) => (
                            <div key={q.id} className="flex items-center gap-2">
                                <span className={`text-[10px] w-20 flex-shrink-0 font-medium ${q.labelColor}`}>
                                    Q{q.id + 1} {q.label}
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
