'use client';

import { useSchedulerStore } from '@/lib/store';
import MLQQueueStack from './MLQQueueStack';
import MLQGanttChart from './MLQGanttChart';
import MLQStats from './MLQStats';

export default function MLQDashboard() {
    const { mlqSimState } = useSchedulerStore();

    return (
        <div className="space-y-4">
            {/* Main visualization: 4 queue lanes + CPU/IO columns */}
            <MLQQueueStack />

            {/* Gantt — only once simulation has started */}
            {mlqSimState && mlqSimState.ganttChart.length > 0 && (
                <MLQGanttChart />
            )}

            {/* Stats — only once simulation has started */}
            {mlqSimState && (
                <MLQStats />
            )}
        </div>
    );
}
