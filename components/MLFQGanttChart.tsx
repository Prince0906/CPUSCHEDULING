'use client';

import { useSchedulerStore } from '@/lib/store';
import { MLQGanttEntry } from '@/lib/types';

export default function MLFQGanttChart() {
    const { mlfqSimState, mlfqQueues } = useSchedulerStore();

    const gantt = (mlfqSimState?.ganttChart ?? []) as MLQGanttEntry[];
    if (gantt.length === 0) return null;

    const totalTime = gantt[gantt.length - 1].endTime;
    const scale = totalTime > 0 ? 100 / totalTime : 0; // percent per ms

    // Group entries by queue for multi-row view
    const rows: { label: string; accentHex: string; entries: MLQGanttEntry[] }[] = [
        ...mlfqQueues.map((q) => ({
            label: `Q${q.id} ${q.label}`,
            accentHex: q.accentHex,
            entries: gantt.filter((e) => e.queueId === q.id && e.processId !== null),
        })),
        {
            label: 'Idle',
            accentHex: '#94A3B8',
            entries: gantt.filter((e) => e.processId === null),
        },
    ].filter((r) => r.entries.length > 0);

    // Time markers every ~10% of total
    const markerStep = Math.max(1, Math.ceil(totalTime / 10));
    const markers: number[] = [];
    for (let t = 0; t <= totalTime; t += markerStep) markers.push(t);

    return (
        <div className="card">
            <div className="section-header">
                <h2 className="section-title">MLFQ Gantt Chart</h2>
                <span className="text-xs text-gray-400">{totalTime}ms total</span>
            </div>

            <div className="p-4 overflow-x-auto">
                <div className="min-w-[540px]">
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-gray-500 w-24 flex-shrink-0 text-right font-medium">
                                {row.label}
                            </span>
                            <div className="relative h-7 flex-1 bg-gray-100 rounded overflow-hidden">
                                {row.entries.map((e, i) => (
                                    <div
                                        key={i}
                                        title={`${e.processName} (${e.startTime}–${e.endTime}ms)`}
                                        className="absolute top-0 h-full flex items-center justify-center text-[9px] font-semibold text-white overflow-hidden"
                                        style={{
                                            left: `${e.startTime * scale}%`,
                                            width: `${(e.endTime - e.startTime) * scale}%`,
                                            backgroundColor: e.color,
                                            opacity: e.isPreempted ? 0.7 : 1,
                                            borderRight: e.isPreempted ? '2px solid rgba(255,255,255,0.6)' : undefined,
                                        }}
                                    >
                                        {(e.endTime - e.startTime) * scale > 4 && e.processName}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Time axis */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-24 flex-shrink-0" />
                        <div className="relative flex-1 h-4">
                            {markers.map((t) => (
                                <span
                                    key={t}
                                    className="absolute text-[9px] text-gray-400 -translate-x-1/2"
                                    style={{ left: `${t * scale}%` }}
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
